// Supabase Edge Function: 바이럴 테스트 이미지 생성
// --no-verify-jwt 배포 필수
// 썸네일 1장 + 결과 이미지 10장 생성 (공유 이미지 = 결과 이미지 동일 사용)
// PNG 직접 업로드 (ImageMagick WASM 제거 — Edge Function 메모리 한도 초과 방지)
// 이미지 생성 모델: Gemini 3.1 Flash Image Preview (레퍼런스 이미지 기반 생성 지원)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!

// 한글 일간 → 로마자 매핑 (Supabase Storage 키에 한글 사용 불가)
const DAY_MASTER_ROMAN: Record<string, string> = {
  '갑': 'gap', '을': 'eul', '병': 'byeong', '정': 'jeong', '무': 'mu',
  '기': 'gi', '경': 'gyeong', '신': 'sin', '임': 'im', '계': 'gye',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const { testId, referenceImage, dayMasters } = await req.json()

    if (!testId) {
      return new Response(
        JSON.stringify({ success: false, error: 'testId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 테스트 정보 + 결과 조회
    const [testResult, resultsResult] = await Promise.all([
      supabase.from('viral_tests').select('*').eq('id', testId).single(),
      supabase.from('viral_test_results').select('*').eq('test_id', testId).order('day_master'),
    ])

    if (testResult.error || !testResult.data) {
      throw new Error('테스트를 찾을 수 없습니다.')
    }

    const test = testResult.data
    const results = resultsResult.data || []

    console.log(`🎨 이미지 생성 시작: "${test.title}" (결과 ${results.length}개)`)

    // 레퍼런스 이미지 파싱 (data:image/png;base64,... → { mimeType, data })
    let refImagePart: { inline_data: { mime_type: string; data: string } } | null = null
    if (referenceImage && typeof referenceImage === 'string') {
      const match = referenceImage.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (match) {
        refImagePart = { inline_data: { mime_type: match[1], data: match[2] } }
        console.log(`📎 레퍼런스 이미지 감지: ${match[1]}`)
      }
    }

    // 2. 이미지 생성 헬퍼 (PNG 직접 업로드)
    async function generateAndUploadImage(
      prompt: string,
      storagePath: string
    ): Promise<string | null> {
      try {
        // 프롬프트 parts 구성: 텍스트 + (옵션) 레퍼런스 이미지
        const parts: Array<Record<string, unknown>> = [{ text: prompt }]
        if (refImagePart) {
          // 레퍼런스 이미지를 텍스트보다 먼저 배치 (스타일 인식 우선)
          parts.unshift(refImagePart)
          // 레퍼런스 활용 지시 (일러스트/캐릭터는 적극 참고, 실사 인물만 제한)
          parts.push({ text: `REFERENCE IMAGE INSTRUCTIONS:
Generate images that closely match the reference image's style, character design, color palette, line weight, and overall mood.
- If the reference is an illustration, cartoon, or character drawing: closely replicate the art style, character proportions, line style, and coloring. Use the same type of character (e.g. if reference shows a cute duck character, generate similar cute duck characters).
- If the reference is a real photograph of a celebrity or public figure: match the photographic style and mood, but create entirely new fictional characters. Do NOT reproduce any real person's face or likeness.
- Keep the visual style consistent across all generated images.` })
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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

        return publicUrl
      } catch (err) {
        console.error(`❌ 이미지 생성 오류 (${storagePath}):`, err)
        return null
      }
    }

    // 3. 썸네일 생성 (DB에 저장된 프롬프트 우선 사용)
    const hasRef = !!refImagePart

    // 레퍼런스 없을 때 기본 스타일: B급 병맛 캐릭터 (잘파세대 바이럴 스타일)
    const DEFAULT_STYLE = `Style: Korean internet meme / B-grade humor illustration style. Simple white blob-like or stick-figure characters with thick black outlines, minimal detail, exaggerated funny expressions. Pastel or solid color backgrounds (pink, light blue, white). Intentionally crude and goofy drawing style like Korean community test memes (에브리타임/인스타 테스트). Cute but absurd, comedic mood. Think: simple round white characters with dot eyes, like Korean emoticon mascots.`

    // 레퍼런스 있을 때 프롬프트에서 스타일 키워드 제거 (일러스트/애니 지시가 실사 레퍼런스를 덮어쓰는 문제 방지)
    function stripStyleKeywords(prompt: string): string {
      const stylePatterns = [
        /\b(anime|manga|cartoon|2d|flat|illustration|illustrated|digital art|digital painting|comic|webtoon|cel[- ]shad(ed|ing))\b/gi,
        /\b(watercolor|oil painting|sketch|line art|lineart|hand[- ]drawn|pixel art)\b/gi,
        /\b(vibrant|bold|pastel|neon)\s+(color|colour|palette|tone)s?\b/gi,
        /style:\s*[^.;,\n]+/gi,
        /\bin the style of\s+[^.;,\n]+/gi,
        /\b(flat|bold|thick)\s+(outlines?|lines?|strokes?)\b/gi,
      ]
      let cleaned = prompt
      for (const pattern of stylePatterns) {
        cleaned = cleaned.replace(pattern, '')
      }
      return cleaned.replace(/\s{2,}/g, ' ').trim()
    }

    const thumbnailPrompt = hasRef
      ? `${test.thumbnail_prompt ? stripStyleKeywords(test.thumbnail_prompt) : `Create an eye-catching thumbnail for a viral quiz titled "${test.title}".`}\nNo text in the image. Aspect ratio: square (1:1).`
      : (test.thumbnail_prompt
          ? `${test.thumbnail_prompt}\n${DEFAULT_STYLE}\nNo text in the image. Aspect ratio: square (1:1).`
          : `Create a thumbnail for a viral quiz/test titled "${test.title}".\n${DEFAULT_STYLE}\nNo text in the image. Full-bleed, no borders or margins. Aspect ratio: square (1:1).`)

    // 4. 썸네일 + 결과 이미지 병렬 생성 (3장씩 배치)
    const styleGuide = test.image_style_guide || ''
    const BATCH_SIZE = 3

    // 모든 생성 작업을 태스크 배열로 준비
    interface ImageTask {
      type: 'thumbnail' | 'result'
      prompt: string
      storagePath: string
      resultId?: string
    }

    const tasks: ImageTask[] = []

    // 썸네일은 개별 이미지 재생성이 아닐 때만
    if (!dayMasters || dayMasters.length === 0) {
      tasks.push({ type: 'thumbnail', prompt: thumbnailPrompt, storagePath: `viral-tests/${testId}/thumbnail.png` })
    }

    // dayMasters 지정 시 해당 결과만 필터링
    const targetResults = (dayMasters && dayMasters.length > 0)
      ? results.filter((r: { day_master: string }) => dayMasters.includes(r.day_master))
      : results

    for (const result of targetResults) {
      const rawPrompt = result.image_prompt || ''

      let basePrompt: string
      if (hasRef) {
        // 레퍼런스 있을 때: 스타일 키워드 제거 → 주제/포즈/상황만 남김
        const contentOnly = rawPrompt
          ? stripStyleKeywords(rawPrompt)
          : `A person representing: "${result.result_title}". Score: ${result.score}/100.`
        basePrompt = `${contentOnly}\nAspect ratio: 3:4 (portrait). No text in the image.`
      } else {
        basePrompt = rawPrompt
          ? `${rawPrompt}\n\nStyle consistency: ${styleGuide}\nAspect ratio: 3:4 (portrait). No text in the image.`
          : `Create a result image for: "${result.result_title}". Score: ${result.score}/100. The image should visually represent this personality type.\nAspect ratio: 3:4 (portrait). No text in the image.`
      }

      const resultPrompt = hasRef
        ? basePrompt
        : `${basePrompt}\n${DEFAULT_STYLE}\nFull-bleed, no borders.`

      const romanKey = DAY_MASTER_ROMAN[result.day_master] || result.day_master
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
          const url = await generateAndUploadImage(task.prompt, task.storagePath)
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
