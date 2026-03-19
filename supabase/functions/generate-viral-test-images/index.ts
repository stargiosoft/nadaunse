// Supabase Edge Function: 바이럴 테스트 이미지 생성
// --no-verify-jwt 배포 필수
// 썸네일 1장 + 결과 이미지 10장 생성 (공유 이미지 = 결과 이미지 동일 사용)
// PNG 직접 업로드 (ImageMagick WASM 제거 — Edge Function 메모리 한도 초과 방지)
// 이미지 생성 모델: Gemini 3.1 Flash Image Preview (레퍼런스 이미지 기반 생성 지원)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!

// 한글 일간 → 로마자 매핑 (Supabase Storage 키에 한글 사용 불가)
const DAY_MASTER_ROMAN: Record<string, string> = {
  '갑': 'gap', '을': 'eul', '병': 'byeong', '정': 'jeong', '무': 'mu',
  '기': 'gi', '경': 'gyeong', '신': 'sin', '임': 'im', '계': 'gye',
}

// 십성 → 로마자 매핑 (궁합 테스트용)
const SIPSUNG_ROMAN: Record<string, string> = {
  '비견': 'bigyeon', '겁재': 'geopjae', '식신': 'siksin', '상관': 'sanggwan',
  '편재': 'pyeonjae', '정재': 'jeongjae', '편관': 'pyeongwan', '정관': 'jeonggwan',
  '편인': 'pyeonin', '정인': 'jeongin',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const { testId, dayMasters, relationTypes, thumbnailOnly, referenceImageUrl, thumbnailReferenceImageUrl } = await req.json()

    console.log(`📥 요청 수신: testId=${testId}, referenceImageUrl=${referenceImageUrl ? '있음(' + referenceImageUrl.slice(0, 80) + '...)' : '없음'}, thumbnailRef=${thumbnailReferenceImageUrl ? '있음' : '없음'}`)

    if (!testId) {
      return new Response(
        JSON.stringify({ success: false, error: 'testId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // URL → Gemini inline_data 변환 헬퍼 (메모리 효율적 base64 인코딩)
    async function fetchAsInlineData(url: string): Promise<{ inline_data: { mime_type: string; data: string } } | null> {
      try {
        console.log(`🔗 레퍼런스 fetch 시작: ${url.slice(0, 100)}...`)
        const res = await fetch(url)
        if (!res.ok) {
          console.error(`❌ 레퍼런스 fetch HTTP 오류: ${res.status} ${res.statusText}`)
          return null
        }
        const buffer = await res.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const mimeType = res.headers.get('content-type') || 'image/webp'
        // O(n) base64 인코딩 (std 라이브러리 사용, O(n²) 문자열 연결 제거)
        const b64 = base64Encode(bytes)
        console.log(`✅ 레퍼런스 fetch 성공: ${bytes.length} bytes, mime=${mimeType}, base64=${b64.length} chars`)
        return { inline_data: { mime_type: mimeType, data: b64 } }
      } catch (err) {
        console.error('❌ 레퍼런스 fetch 실패:', err)
        return null
      }
    }

    // 1. 테스트 정보 + 결과 + 레퍼런스 이미지 병렬 로드
    const [testResult, resultsResult, refImagePart, thumbnailRefPart] = await Promise.all([
      supabase.from('viral_tests').select('*').eq('id', testId).single(),
      supabase.from('viral_test_results').select('*').eq('test_id', testId).order('day_master'),
      referenceImageUrl ? fetchAsInlineData(referenceImageUrl) : Promise.resolve(null),
      thumbnailReferenceImageUrl ? fetchAsInlineData(thumbnailReferenceImageUrl) : Promise.resolve(null),
    ])

    if (testResult.error || !testResult.data) {
      throw new Error('테스트를 찾을 수 없습니다.')
    }

    const test = testResult.data
    const results = resultsResult.data || []

    console.log(`🎨 이미지 생성 시작: "${test.title}" (결과 ${results.length}개)`)
    if (refImagePart) console.log('📎 레퍼런스 이미지 로드 완료')
    if (thumbnailRefPart) console.log('📎 썸네일 레퍼런스 이미지 로드 완료')

    // 2. 이미지 생성 헬퍼 (PNG 직접 업로드)
    async function generateAndUploadImage(
      prompt: string,
      storagePath: string,
      overrideRefPart?: { inline_data: { mime_type: string; data: string } } | null
    ): Promise<string | null> {
      try {
        // 프롬프트 parts 구성: 텍스트 + (옵션) 레퍼런스 이미지
        const parts: Array<Record<string, unknown>> = [{ text: prompt }]
        const activeRef = overrideRefPart !== undefined ? overrideRefPart : refImagePart
        if (activeRef) {
          // 레퍼런스 이미지를 텍스트보다 먼저 배치 (스타일 인식 우선)
          parts.unshift(activeRef)
          // 레퍼런스 활용 지시 (일러스트/캐릭터는 적극 참고, 실사 인물만 제한)
          parts.push({ text: `REFERENCE IMAGE INSTRUCTIONS:
Generate images that closely match the reference image's style, character design, color palette, line weight, and overall mood.
- If the reference is an illustration, cartoon, or character drawing: closely replicate the art style, character proportions, line style, and coloring. Use the same type of character (e.g. if reference shows a cute duck character, generate similar cute duck characters).
- If the reference is a real photograph of a celebrity or public figure: match the photographic style and mood, but create entirely new fictional characters. Do NOT reproduce any real person's face or likeness.
- Keep the visual style consistent across all generated images.` })
        }

        const hasRefInParts = parts.some((p: Record<string, unknown>) => 'inline_data' in p)
        console.log(`🎯 Gemini 요청 (${storagePath}): parts=${parts.length}개, 레퍼런스포함=${hasRefInParts}`)

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
            }),
          }
        )

        if (!response.ok) {
          const errText = await response.text()
          console.error(`❌ Gemini 이미지 API 오류 (${storagePath}):`, response.status, errText)
          return null
        }

        const data = await response.json()
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: { mimeType?: string } }) => p.inlineData?.mimeType?.startsWith('image')
        )

        if (!imagePart) {
          console.error(`❌ 이미지 없음 (${storagePath})`)
          return null
        }

        // Base64 → Uint8Array (PNG 직접 업로드)
        const imageBytes = Uint8Array.from(
          atob(imagePart.inlineData.data),
          c => c.charCodeAt(0)
        )

        const mimeType = imagePart.inlineData.mimeType || 'image/png'
        console.log(`✅ 이미지 수신: ${imageBytes.length} bytes (${mimeType})`)

        // Storage 업로드
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(storagePath, imageBytes, { contentType: mimeType, upsert: true })

        if (uploadError) {
          console.error(`❌ 업로드 실패 (${storagePath}):`, uploadError)
          return null
        }

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(storagePath)

        // 캐시 버스터 추가 (재생성 시 브라우저가 구 이미지 캐시 사용 방지)
        return `${publicUrl}?v=${Date.now()}`
      } catch (err) {
        console.error(`❌ 이미지 생성 오류 (${storagePath}):`, err)
        return null
      }
    }

    // 3. 썸네일 생성 (DB에 저장된 프롬프트 우선 사용)
    const hasRef = !!refImagePart
    // 썸네일 전용 레퍼런스 유무 (결과 레퍼런스와 독립)
    const hasThumbnailRef = !!thumbnailRefPart

    // 레퍼런스 없을 때 기본 스타일: B급 병맛 캐릭터 (잘파세대 바이럴 스타일)
    const DEFAULT_STYLE = `Style: Korean internet meme / B-grade humor illustration style. Simple white blob-like or stick-figure characters with thick black outlines, minimal detail, exaggerated funny expressions. Pastel or solid color backgrounds (pink, light blue, white). Intentionally crude and goofy drawing style like Korean community test memes (에브리타임/인스타 테스트). Cute but absurd, comedic mood. Think: simple round white characters with dot eyes, like Korean emoticon mascots.`

    const thumbnailPrompt = hasThumbnailRef
      ? `${test.thumbnail_prompt || `Create an eye-catching thumbnail for a viral quiz titled "${test.title}".`}\nNo text in the image. Aspect ratio: square (1:1).`
      : (test.thumbnail_prompt
          ? `${test.thumbnail_prompt}\n${DEFAULT_STYLE}\nNo text in the image. Aspect ratio: square (1:1).`
          : `Create a thumbnail for a viral quiz/test titled "${test.title}".\n${DEFAULT_STYLE}\nNo text in the image. Full-bleed, no borders or margins. Aspect ratio: square (1:1).`)

    // 4. 썸네일 + 결과 이미지 병렬 생성 (레퍼런스 있으면 2장, 없으면 4장씩 배치)
    const styleGuide = test.image_style_guide || ''
    const BATCH_SIZE = (refImagePart || thumbnailRefPart) ? 2 : 4

    // 모든 생성 작업을 태스크 배열로 준비
    interface ImageTask {
      type: 'thumbnail' | 'result'
      prompt: string
      storagePath: string
      resultId?: string
    }

    const tasks: ImageTask[] = []

    // 썸네일: thumbnailOnly 또는 전체 생성 시
    if (thumbnailOnly || (!dayMasters || dayMasters.length === 0)) {
      tasks.push({ type: 'thumbnail', prompt: thumbnailPrompt, storagePath: `viral-tests/${testId}/thumbnail.png` })
    }

    // 궁합 테스트 여부 판별
    const isCompatibility = test.template_type === 'compatibility'

    // thumbnailOnly면 결과 이미지 스킵
    let targetResults: typeof results
    if (thumbnailOnly) {
      targetResults = []
    } else if (isCompatibility && relationTypes && relationTypes.length > 0) {
      // 궁합: relation_type으로 필터
      targetResults = results.filter((r: { relation_type: string }) => relationTypes.includes(r.relation_type))
    } else if (!isCompatibility && dayMasters && dayMasters.length > 0) {
      // 일반: day_master로 필터
      targetResults = results.filter((r: { day_master: string }) => dayMasters.includes(r.day_master))
    } else {
      targetResults = results
    }

    for (const result of targetResults) {
      const rawPrompt = result.image_prompt || ''

      let basePrompt: string
      if (hasRef) {
        // 레퍼런스 있을 때: 콘텐츠 프롬프트 + 스타일 일관성 강화
        const contentOnly = rawPrompt
          || `A person representing: "${result.result_title}". Score: ${result.score}/100.`
        basePrompt = `${contentOnly}\n\nCRITICAL STYLE RULES:\n- You MUST generate this image in the EXACT SAME art style, medium, and visual quality as the reference image.\n- If the reference is an illustration/drawing: use the same drawing technique, line weight, color palette, and character proportions.\n- If the reference is a photograph: create a similar photographic composition with realistic lighting, but with a completely new fictional person.\n- Do NOT mix styles (e.g., no cartoon overlays on photos, no photo-realistic faces in illustrations).\n- Maintain visual consistency as if all images are from the same series.\nAspect ratio: 3:4 (portrait). No text in the image.`
      } else {
        basePrompt = rawPrompt
          ? `${rawPrompt}\n\nStyle consistency: ${styleGuide}\nAspect ratio: 3:4 (portrait). No text in the image.`
          : `Create a result image for: "${result.result_title}". Score: ${result.score}/100. The image should visually represent this personality type.\nAspect ratio: 3:4 (portrait). No text in the image.`
      }

      const resultPrompt = hasRef
        ? basePrompt
        : `${basePrompt}\n${DEFAULT_STYLE}\nFull-bleed, no borders.`

      // 궁합: relation_type 로마자 키, 일반: day_master 로마자 키
      const romanKey = isCompatibility
        ? (SIPSUNG_ROMAN[result.relation_type] || result.relation_type)
        : (DAY_MASTER_ROMAN[result.day_master] || result.day_master)

      tasks.push({
        type: 'result',
        prompt: resultPrompt,
        storagePath: `viral-tests/${testId}/result-${romanKey}.png`,
        resultId: result.id,
      })
    }

    // 배치 병렬 실행 (BATCH_SIZE장씩)
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE)
      console.log(`🎨 배치 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tasks.length / BATCH_SIZE)} (${batch.length}장)`)

      const batchResults = await Promise.all(
        batch.map(async (task) => {
          // 썸네일은 썸네일 전용 레퍼런스만 사용 (없으면 레퍼런스 없이 생성)
          const overrideRef = task.type === 'thumbnail' ? (thumbnailRefPart ?? null) : undefined
          const url = await generateAndUploadImage(task.prompt, task.storagePath, overrideRef)
          return { ...task, url }
        })
      )

      // DB 업데이트 (배치 완료 후)
      for (const result of batchResults) {
        if (!result.url) continue

        if (result.type === 'thumbnail') {
          await supabase.from('viral_tests')
            .update({ thumbnail_url: result.url })
            .eq('id', testId)
        } else if (result.resultId) {
          await supabase.from('viral_test_results')
            .update({ result_image_url: result.url, share_image_url: result.url })
            .eq('id', result.resultId)
        }
      }
    }

    // 5. 상태 업데이트: generating → review (이미 review이면 유지)
    const { data: currentTest } = await supabase
      .from('viral_tests')
      .select('status')
      .eq('id', testId)
      .single()

    if (currentTest?.status === 'generating') {
      await supabase.from('viral_tests')
        .update({ status: 'review', updated_at: new Date().toISOString() })
        .eq('id', testId)
    }

    console.log(`✅ 이미지 생성 완료: ${testId}`)

    return new Response(
      JSON.stringify({ success: true, testId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
