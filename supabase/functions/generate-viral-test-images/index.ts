// Supabase Edge Function: 바이럴 테스트 이미지 생성
// --no-verify-jwt 배포 필수
// 썸네일 1장 + 결과 이미지 10장 + 공유 카드 10장 생성
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from 'npm:@imagemagick/magick-wasm@0.0.30'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// ImageMagick WASM 초기화 (서버 시작 시 1회)
const wasmBytes = await Deno.readFile(
  new URL(
    'magick.wasm',
    import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30'),
  ),
)
await initializeImageMagick(wasmBytes)
console.log('✅ ImageMagick WASM 초기화 완료')

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

    // 2. 이미지 생성 헬퍼
    async function generateAndUploadImage(
      prompt: string,
      storagePath: string
    ): Promise<string | null> {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        )

        if (!response.ok) {
          console.error(`❌ Gemini 이미지 API 오류 (${storagePath}):`, response.status)
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

        // Base64 → Uint8Array
        const pngBytes = Uint8Array.from(
          atob(imagePart.inlineData.data),
          c => c.charCodeAt(0)
        )

        // PNG → WebP 변환
        let finalBytes: Uint8Array
        let contentType = 'image/webp'

        try {
          finalBytes = ImageMagick.read(pngBytes, (img): Uint8Array => {
            img.quality = 85
            return img.write(MagickFormat.WebP, (data) => new Uint8Array(data))
          })
          console.log(`✅ WebP 변환: ${pngBytes.length} → ${finalBytes.length} bytes`)
        } catch {
          finalBytes = pngBytes
          contentType = 'image/png'
        }

        // Storage 업로드
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(storagePath, finalBytes, { contentType, upsert: true })

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

    // 3. 썸네일 생성
    const thumbnailPrompt = `Create a vibrant, eye-catching thumbnail for a viral quiz/test titled "${test.title}".
Style: Flat 2D illustration, bold colors, fun and playful mood.
The image should be instantly readable as a quiz thumbnail at small sizes.
No text in the image. Full-bleed, no borders or margins.
Aspect ratio: square (1:1).`

    const thumbnailUrl = await generateAndUploadImage(
      thumbnailPrompt,
      `viral-tests/${testId}/thumbnail.webp`
    )

    if (thumbnailUrl) {
      await supabase.from('viral_tests')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', testId)
    }

    // 4. 결과 이미지 10장 (순차 생성 — API rate limit 고려)
    for (const result of results) {
      const resultPrompt = `Create a result card illustration for a quiz result: "${result.result_title}".
Score: ${result.score}/100. Element: ${result.element}.
Style: Flat 2D illustration, vibrant colors, expressive character.
The image should visually represent the personality type described.
No text in the image. Full-bleed, no borders.
Aspect ratio: 3:4 (portrait).`

      const resultImageUrl = await generateAndUploadImage(
        resultPrompt,
        `viral-tests/${testId}/result-${result.day_master}.webp`
      )

      const sharePrompt = `Create a shareable social media card illustration for: "${result.result_title}" - ${test.title}.
Style: Bold, colorful, Instagram Story format (9:16).
The image should make people want to share it.
No text in the image. Full-bleed.`

      const shareImageUrl = await generateAndUploadImage(
        sharePrompt,
        `viral-tests/${testId}/share-${result.day_master}.webp`
      )

      // DB 업데이트
      if (resultImageUrl || shareImageUrl) {
        const updateData: Record<string, string> = {}
        if (resultImageUrl) updateData.result_image_url = resultImageUrl
        if (shareImageUrl) updateData.share_image_url = shareImageUrl

        await supabase.from('viral_test_results')
          .update(updateData)
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
