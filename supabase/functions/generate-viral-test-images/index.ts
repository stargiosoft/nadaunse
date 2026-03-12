// Supabase Edge Function: 바이럴 테스트 이미지 생성
// --no-verify-jwt 배포 필수
// 썸네일 1장 + 결과 이미지 10장 생성 (공유 이미지 = 결과 이미지 동일 사용)
// PNG 직접 업로드 (ImageMagick WASM 제거 — Edge Function 메모리 한도 초과 방지)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const { testId } = await req.json()

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

    // 2. 이미지 생성 헬퍼 (PNG 직접 업로드)
    async function generateAndUploadImage(
      prompt: string,
      storagePath: string
    ): Promise<string | null> {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseModalities: ['image', 'text'] },
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
    const thumbnailPrompt = test.thumbnail_prompt || `Create a vibrant, eye-catching thumbnail for a viral quiz/test titled "${test.title}".
Style: Flat 2D illustration, bold colors, fun and playful mood.
The image should be instantly readable as a quiz thumbnail at small sizes.
No text in the image. Full-bleed, no borders or margins.
Aspect ratio: square (1:1).`

    const thumbnailUrl = await generateAndUploadImage(
      thumbnailPrompt,
      `viral-tests/${testId}/thumbnail.png`
    )

    if (thumbnailUrl) {
      await supabase.from('viral_tests')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', testId)
    }

    // 4. 결과 이미지 10장 (순차 생성 — API rate limit 고려)
    const styleGuide = test.image_style_guide || ''

    for (const result of results) {
      // DB에 저장된 이미지 가이드 에이전트의 프롬프트 우선 사용
      const resultPrompt = result.image_prompt
        ? `${result.image_prompt}\n\nStyle consistency: ${styleGuide}\nAspect ratio: 3:4 (portrait). No text in the image.`
        : `Create a result card illustration for a quiz result: "${result.result_title}".
Score: ${result.score}/100. Element: ${result.element}.
Style: Flat 2D illustration, vibrant colors, expressive character.
The image should visually represent the personality type described.
No text in the image. Full-bleed, no borders.
Aspect ratio: 3:4 (portrait).`

      const resultImageUrl = await generateAndUploadImage(
        resultPrompt,
        `viral-tests/${testId}/result-${result.day_master}.png`
      )

      // DB 업데이트 (결과 이미지 = 공유 이미지로 동일 사용)
      if (resultImageUrl) {
        await supabase.from('viral_test_results')
          .update({
            result_image_url: resultImageUrl,
            share_image_url: resultImageUrl,
          })
          .eq('id', result.id)
      }

      // Rate limit 대기 (500ms)
      await new Promise(r => setTimeout(r, 500))
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
