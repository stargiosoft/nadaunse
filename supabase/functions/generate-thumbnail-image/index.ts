// Supabase Edge Function: 범용 썸네일 이미지 생성 (Gemini Image Generation)
// 레퍼런스 이미지 + 명령어 → 썸네일 이미지 (base64 PNG)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 사용 모델 — preview는 다운/스펙 변동 잦아 stable 사용
const MODEL_ID = 'gemini-2.5-flash-image'

// Gemini HTTP 에러 → 한국어 사용자 메시지
function describeGeminiHttpError(status: number, body: string): string {
  let detail = ''
  try { detail = JSON.parse(body)?.error?.message || '' } catch {}

  if (status === 400) {
    if (/safety|blocked|prohibited|harmful/i.test(detail)) {
      return '안전 필터에 의해 차단되었습니다. 레퍼런스 이미지나 프롬프트에 민감한 내용(인물·노출·폭력·저작권)이 포함되지 않았는지 확인해주세요.'
    }
    if (/image|payload|too large|size/i.test(detail)) {
      return '레퍼런스 이미지가 너무 크거나 손상되었습니다. 더 작은 이미지로 다시 시도해주세요.'
    }
    return '잘못된 요청입니다. 프롬프트나 레퍼런스 이미지를 확인해 다시 시도해주세요.'
  }
  if (status === 401 || status === 403) return 'API 인증에 실패했습니다. 관리자에게 문의해주세요.'
  if (status === 404) return '이미지 생성 모델을 찾을 수 없습니다. 관리자에게 문의해주세요.'
  if (status === 429) return '요청이 너무 많습니다. 30초 정도 기다린 뒤 다시 시도해주세요.'
  if (status >= 500) return 'Gemini 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.'
  return `이미지 생성에 실패했습니다 (HTTP ${status}). 잠시 후 다시 시도해주세요.`
}

// Gemini가 200을 줬지만 이미지가 없는 경우 → finishReason / 텍스트로 사유 추정
function describeGeminiNoImage(data: unknown): string {
  const d = data as Record<string, any>
  const candidate = d?.candidates?.[0]
  const finishReason: string | undefined = candidate?.finishReason

  if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT' || finishReason === 'IMAGE_SAFETY') {
    return '안전 필터에 의해 차단되었습니다. 인물·노출·폭력·저작권 관련 요소를 제거해 다시 시도해주세요.'
  }
  if (finishReason === 'RECITATION') {
    return '저작권 보호 콘텐츠와 유사하다고 판단되어 차단되었습니다. 프롬프트나 레퍼런스를 변경해주세요.'
  }
  if (finishReason === 'BLOCKLIST' || finishReason === 'SPII') {
    return '금지된 콘텐츠가 감지되어 차단되었습니다. 프롬프트를 변경해주세요.'
  }
  if (finishReason === 'MAX_TOKENS') {
    return '응답이 잘렸습니다. 프롬프트를 더 간결하게 작성해 다시 시도해주세요.'
  }

  // 모델이 이미지 대신 텍스트로 거절 사유를 줄 때가 가장 흔함
  const textParts: string = (candidate?.content?.parts || [])
    .filter((p: any) => typeof p?.text === 'string')
    .map((p: any) => p.text)
    .join(' ')
    .trim()
  if (textParts) {
    const snippet = textParts.length > 140 ? `${textParts.slice(0, 140)}…` : textParts
    return `모델이 이미지 대신 텍스트를 반환했습니다: "${snippet}" — 프롬프트를 조정해 다시 시도해주세요.`
  }

  // promptFeedback에 차단 사유가 들어있는 경우
  const blockReason = d?.promptFeedback?.blockReason
  if (blockReason) {
    return `프롬프트가 차단되었습니다 (${blockReason}). 민감한 내용을 제거해 다시 시도해주세요.`
  }

  return '이미지 생성에 실패했습니다 (빈 응답). 잠시 후 다시 시도해주세요.'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { prompt, reference_image, reference_images, reference_mode, aspect_ratio, auto_fill_background } = await req.json()

    // auto_fill_background 모드는 user prompt 없이도 동작 (backend prompt가 task를 완전히 정의)
    if (!prompt?.trim() && !auto_fill_background) {
      return new Response(JSON.stringify({ error: 'prompt 필수' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const parts: Array<Record<string, unknown>> = []

    // 레퍼런스 이미지 배열 정규화 (단일 reference_image 하위호환 + reference_images 신규)
    const refs: string[] = Array.isArray(reference_images)
      ? reference_images.filter((s: unknown) => typeof s === 'string' && s.length > 0)
      : reference_image
        ? [reference_image]
        : []

    if (refs.length > 0) {
      // 레퍼런스 이미지 모두 첨부
      for (const data of refs) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data,
          },
        })
      }

      // reference_mode에 따라 프롬프트 분기
      // 사용자 명령어를 최상단에 두고, 출력 형식 룰은 뒤에 보조 가이드로만 부착
      const formatRules = `\n\n[OUTPUT FORMAT RULES]
• Output exactly ONE single image — one continuous scene, not a collage, grid, triptych, diptych, split-screen, side-by-side, multi-panel, montage, photo strip, or before/after layout.
• Do NOT include any text, letters, words, numbers, titles, labels, watermarks, captions, or typography in the image.
• When multiple reference images are attached, blend cues across ALL of them into one cohesive output — do not pick just one reference and ignore the rest.
• If the user instruction itself asks for multiple outfit/pose/scene variations in a single output (e.g. "show 3 different outfits"), pick ONE variation and render it as a single full image rather than a collage.`

      const refCountText = refs.length > 1 ? `${refs.length} attached images` : 'the attached image'

      if (auto_fill_background) {
        // 흰 여백 자동 채우기 (Outpaint) — 레퍼런스 이미지를 그대로 유지하고 흰 여백만 확장
        const targetAspect = aspect_ratio || '16:9'
        const userExtras = prompt && prompt.trim()
          ? `\n\nADDITIONAL USER NOTE (apply only to the newly filled areas, never modify the central artwork): ${prompt.trim()}`
          : ''
        parts.push({
          text: `EDIT the attached image. The image has BLANK WHITE PADDING (pure #FFFFFF pixels) at the top, bottom, left, or right, surrounding a smaller central artwork. REPLACE all white pixels with extended scene content. Output a complete ${targetAspect} image with NO white pixels remaining.

REQUIREMENTS:
1. The CENTRAL ARTWORK (the non-white area in the input) must be reproduced PIXEL-IDENTICAL in the output — same position, same scale, same subjects, same faces, same poses, same clothing, same lighting, same colors, same medium (photo / illustration / painting / etc.).
2. The WHITE PADDING areas must be REPLACED with naturally extended scene content — more of the same room, sky, water, floor, wall, table, or background that surrounds the central artwork in real space. Imagine the camera or canvas was simply WIDER/TALLER and you are reconstructing what would have been there.
3. The output must FULLY OCCUPY the ${targetAspect} canvas, edge to edge. ZERO white pixels in the output. ZERO letterboxing. ZERO pillarboxing. ZERO matting. ZERO frames or borders.
4. The boundary between the central artwork and the newly filled area must be INVISIBLE — perfectly continuous lighting, color, focus, perspective, grain/texture, and medium. A viewer must not be able to tell where the original ended.
5. Do NOT add any new people, characters, subjects, objects of focus, text, or watermarks in the filled area. Only environmental continuation.
6. Do NOT shrink the central artwork. Do NOT reinterpret or restyle it. Do NOT change the medium (a photo stays a photo; an illustration stays an illustration in the exact same drawing style).${userExtras}

[OUTPUT FORMAT]
• ONE single ${targetAspect} image, fully filled, no text/typography/watermarks anywhere.`,
        })
      } else if (reference_mode === 'style_and_character') {
        parts.push({
          text: `[STYLE LOCK — READ FIRST, THIS OVERRIDES EVERYTHING ELSE]
${refCountText.charAt(0).toUpperCase() + refCountText.slice(1)} define the EXACT visual style of the output. Before reading any other instruction, study and lock onto the reference's:
• Medium — is it a photograph, a 2D illustration, an anime/manga drawing, a webtoon, a 3D render, a watercolor, an oil painting, a pencil sketch, etc.? Identify it precisely and reproduce that exact medium.
• Line work — line weight, line color, presence/absence of outlines, sketchy vs clean lines.
• Shading & rendering — flat colors / cel-shading / soft shading / painterly / photorealistic lighting / etc. Match the rendering technique pixel-for-pixel.
• Color palette, saturation, contrast, color grading, white balance.
• Texture and grain — film grain, paper texture, brush texture, smooth digital, etc.
• Proportions and stylization level — realistic anatomy vs stylized vs anime proportions vs chibi, etc.
• Detail density — how detailed eyes, skin, hair, fabric are rendered.

THIS STYLE IS NON-NEGOTIABLE. The output must be visually indistinguishable in style from the reference — as if drawn/photographed by the same artist in the same session with the same tools.
• If the reference is a photograph → output must be a photograph (NOT illustration, NOT 3D, NOT stylized).
• If the reference is an illustration / anime / webtoon → output must be in that exact same drawing style (NOT photorealistic, NOT a different anime style, NOT "improved" or "more detailed").
• If the reference is a painting → output must be in that exact painting style.
NEVER convert between mediums. NEVER "upgrade" to a more polished or photorealistic look. NEVER drift to a generic AI illustration style.

[CHARACTER LOCK]
Faithfully preserve the same person/character across the references — face shape, facial features, eye shape & color, nose, lips, hairstyle, hair color, identity. The output must clearly be the SAME character as in the references, drawn/rendered in the SAME style.

[HOW TO APPLY THE USER INSTRUCTION]
USER INSTRUCTION: ${prompt}

The user instruction defines WHAT to depict (clothing, pose, background, setting, environment, action). It does NOT define HOW to depict it — the HOW is fully determined by the [STYLE LOCK] above. Apply the instruction by drawing the new content in the reference's exact style, as if the same artist drew this new scene of the same character.

If the user instruction conflicts with the reference's style (e.g. asks for "realistic" when reference is anime, or "anime" when reference is photo), IGNORE the style hint in the instruction and obey the reference's style. Only the WHAT (subject/scene/action) from the instruction applies.${formatRules}`,
        })
      } else {
        // style_only (기본값)
        parts.push({
          text: `[STYLE LOCK — READ FIRST, THIS OVERRIDES EVERYTHING ELSE]
${refCountText.charAt(0).toUpperCase() + refCountText.slice(1)} define the EXACT visual style of the output. Before reading any other instruction, study and lock onto the reference's:
• Medium — is it a photograph, a 2D illustration, an anime/manga drawing, a webtoon, a 3D render, a watercolor, an oil painting, a pencil sketch, etc.? Identify it precisely and reproduce that exact medium.
• Line work — line weight, line color, presence/absence of outlines, sketchy vs clean lines.
• Shading & rendering — flat colors / cel-shading / soft shading / painterly / photorealistic lighting / etc. Match the rendering technique pixel-for-pixel.
• Color palette, saturation, contrast, color grading, white balance.
• Texture and grain — film grain, paper texture, brush texture, smooth digital, etc.
• Proportions and stylization level — realistic anatomy vs stylized vs anime proportions vs chibi, etc.
• Detail density — how detailed eyes, skin, hair, fabric are rendered.

THIS STYLE IS NON-NEGOTIABLE. The output must be visually indistinguishable in style from the reference — as if drawn/photographed by the same artist in the same session with the same tools.
• If the reference is a photograph → output must be a photograph (NOT illustration, NOT 3D, NOT stylized).
• If the reference is an illustration / anime / webtoon → output must be in that exact same drawing style (NOT photorealistic, NOT a different anime style, NOT "improved" or "more detailed").
• If the reference is a painting → output must be in that exact painting style.
NEVER convert between mediums. NEVER "upgrade" to a more polished or photorealistic look. NEVER drift to a generic AI illustration style.
${refs.length > 1 ? 'When multiple references are attached, blend their stylistic cues into one consistent style — do not let one reference dominate while ignoring others.' : ''}

[HOW TO APPLY THE USER INSTRUCTION]
USER INSTRUCTION: ${prompt}

The user instruction defines WHAT to depict (subject, scene, composition, mood content). It does NOT define HOW to depict it — the HOW is fully determined by the [STYLE LOCK] above. Create new subjects/characters per the instruction, but draw/render them in the reference's exact style, as if the same artist created this new image with the same tools.

Do NOT reuse the specific characters/people from the references — only their STYLE. But the new characters/subjects must be rendered in that exact same style.

If the user instruction conflicts with the reference's style (e.g. asks for "realistic" when reference is anime, or "anime" when reference is photo), IGNORE the style hint in the instruction and obey the reference's style. Only the WHAT (subject/scene/action) from the instruction applies.${formatRules}`,
        })
      }
    } else {
      const formatRules = `\n\n[OUTPUT FORMAT RULES]
• Output exactly ONE single image — one continuous scene, not a collage, grid, triptych, diptych, split-screen, side-by-side, multi-panel, montage, photo strip, or before/after layout.
• Do NOT include any text, letters, words, numbers, titles, labels, watermarks, captions, or typography in the image.
• When multiple reference images are attached, blend cues across ALL of them into one cohesive output — do not pick just one reference and ignore the rest.
• If the user instruction itself asks for multiple outfit/pose/scene variations in a single output (e.g. "show 3 different outfits"), pick ONE variation and render it as a single full image rather than a collage.`
      parts.push({
        text: `USER INSTRUCTION: ${prompt}\n\nGenerate a professional thumbnail image that follows the user instruction above.${formatRules}`,
      })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    }

    const requestBody = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspect_ratio || '16:9',
        },
      },
    })

    let geminiRes: Response | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      geminiRes = await fetch(url, { method: 'POST', headers, body: requestBody })
      if (geminiRes.status !== 429) break
      const wait = (attempt + 1) * 10
      console.log(`[generate-thumbnail-image] 429 retry ${attempt + 1}/3, waiting ${wait}s...`)
      await new Promise(r => setTimeout(r, wait * 1000))
    }

    if (!geminiRes || !geminiRes.ok) {
      const errText = geminiRes ? await geminiRes.text() : 'No response'
      const status = geminiRes?.status ?? 0
      console.error('[generate-thumbnail-image] Gemini HTTP error:', status, errText.slice(0, 500))
      return new Response(JSON.stringify({ error: describeGeminiHttpError(status, errText) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await geminiRes.json()
    const responseParts = data?.candidates?.[0]?.content?.parts

    let imageBase64: string | null = null
    let mimeType = 'image/png'

    if (Array.isArray(responseParts)) {
      for (const part of responseParts) {
        if (part?.inlineData?.data) {
          imageBase64 = part.inlineData.data
          mimeType = part.inlineData.mimeType || 'image/png'
          break
        }
      }
    }

    if (!imageBase64) {
      console.error('[generate-thumbnail-image] No image returned. finishReason:', data?.candidates?.[0]?.finishReason, 'blockReason:', data?.promptFeedback?.blockReason, 'body:', JSON.stringify(data).slice(0, 800))
      return new Response(JSON.stringify({ error: describeGeminiNoImage(data) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ image: imageBase64, mimeType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-thumbnail-image] Error:', err)
    return new Response(JSON.stringify({ error: `이미지 생성 실패: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
