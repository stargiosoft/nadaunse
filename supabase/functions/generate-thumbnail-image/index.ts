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

// "스타일만 참고" 모드용 1단계 호출.
// 레퍼런스 이미지를 image-conditioning으로 그대로 넘기면 모델이 인물/복장/장면까지 복사하므로,
// 시각 스타일만 텍스트로 추출한 뒤 2단계에서는 이미지 없이 텍스트만으로 생성한다.
async function extractStyleDescription(refs: string[], apiKey: string): Promise<string> {
  const visionParts: Array<Record<string, unknown>> = []
  for (const data of refs) {
    visionParts.push({ inlineData: { mimeType: 'image/png', data } })
  }
  visionParts.push({
    text: `Describe the VISUAL STYLE of the attached image${refs.length > 1 ? 's' : ''} in 150-200 words. Cover ONLY:
- Medium (photograph / 2D illustration / anime/manga / webtoon / 3D render / watercolor / oil painting / pencil sketch / digital painting / etc.)
- Line work (line weight, line color, presence/absence of outlines, sketchy vs clean)
- Shading & rendering technique (flat colors / cel-shading / soft shading / painterly / photorealistic lighting)
- Color palette, saturation, contrast, color grading, white balance
- Texture and grain (film grain, paper texture, brush texture, smooth digital, etc.)
- Proportions and stylization level (realistic anatomy / stylized / anime / chibi / etc.)
- Detail density (how detailed eyes, skin, hair, fabric are rendered)
- Lighting mood and atmospheric quality (warm/cool, soft/harsh, dramatic/flat)

IMPORTANT — if the medium is stylized rather than photographic (e.g. low-poly / flat-vector / geometric-faceted / cel-shaded / paper-cut / pixel-art / painterly / cartoon): explicitly state that EVERY form in this style — organic shapes, faces, skin, water, sky, clouds, foliage, fabric, AND celestial bodies like the sun/moon/stars — is constructed from the SAME stylized primitives (e.g. flat triangular polygonal facets with hard edges and no gradients on the subject itself), and is NEVER rendered with photographic detail, smooth photo-real textures, or a different medium. Spell out the exact geometric/illustrative construction so a replicator would draw a moon as faceted polygons, not as a photograph.

DO NOT describe specific people, faces, identities, clothing, accessories, poses, scenes, environments, props, or any content. Style only — write as if explaining the artist's technique to someone trying to replicate it on a completely different subject they will invent themselves.

Output: a single descriptive paragraph. No bullet points, no headings, no preamble like "This image shows" — just the style description.`,
  })

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  let res: Response | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: visionParts }] }),
    })
    if (res.status !== 429 && res.status < 500) break
    await new Promise(r => setTimeout(r, (attempt + 1) * 5000))
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text() : 'no response'
    throw new Error(`스타일 추출 실패 (HTTP ${res?.status ?? 'no-response'}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = (data?.candidates?.[0]?.content?.parts || [])
    .filter((p: any) => typeof p?.text === 'string')
    .map((p: any) => p.text)
    .join(' ')
    .trim()

  if (!text) throw new Error('스타일 추출 결과가 비어 있습니다. 잠시 후 다시 시도해주세요.')
  return text
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { prompt, reference_image, reference_images, reference_mode, aspect_ratio, auto_fill_background, seed, variation_directive, variation_index, variation_total, image_variation, edit_region, edit_region_count } = await req.json()

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

    if (refs.length > 0 && !auto_fill_background && !edit_region && reference_mode !== 'style_and_character') {
      // ── "스타일만 참고" Hybrid 파이프라인 ──
      // 1단계: 레퍼런스에서 시각 스타일을 텍스트로 추출 (인지적 가이드).
      // 2단계: 추출된 텍스트 + 레퍼런스 이미지 inlineData를 함께 전달하되,
      //        강한 anti-copy 프롬프트로 "스타일만 보고 컨텐츠는 무시"하도록 유도.
      // 텍스트만 사용하던 이전 방식은 그림체 디테일(붓터치·라인 두께·컬러그레이딩 톤)이 손실됐음.
      const styleDescription = await extractStyleDescription(refs, apiKey)

      // 레퍼런스 이미지를 inline으로 첨부 — 시각 스타일의 high-fidelity 앵커
      for (const data of refs) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data,
          },
        })
      }

      const variation2StepBlock = (typeof variation_directive === 'string' && variation_directive.trim().length > 0)
        ? `[VARIATION GUIDANCE — IMAGE ${(typeof variation_index === 'number' ? variation_index + 1 : 1)} OF ${typeof variation_total === 'number' ? variation_total : '?'}]
CORE PRINCIPLE: All sibling images are "different shots OF THE SAME SCENE", not different scenes. Same setting, same situation, same characters, same narrative beat, same overall design concept across every sibling. Image #1 establishes the conceptual baseline; every later image must stay on that baseline.

Locked across siblings (from the reference image): visual style, medium, line work, texture, color palette, lighting mood, overall design concept, scene interpretation, characters, situation. The reference is the absolute source of truth.

ABSOLUTELY FORBIDDEN past image #1: inventing a new scene, new situation, new design concept, new art direction. Image #N must read as "same concept as image #1, viewed from a slightly different angle/moment", not as a separate idea.

Apply ONLY the subtle differentiation specified below, strictly within the locked concept:

${variation_directive.trim()}

`
        : ''

      parts.push({
        text: `[YOUR TASK]
Generate ONE new image. The attached reference image${refs.length > 1 ? 's are' : ' is'} provided ONLY as a visual style sample — to anchor your understanding of the artwork's medium, line work, texture, palette, shading, and rendering technique. The CONTENT of the output (who/what/where/scene/poses) is defined exclusively by the [USER INSTRUCTION] below.

[CRITICAL — REFERENCE IMAGE USAGE]
The reference is a STYLE SAMPLE, not a CONTENT TEMPLATE. From the reference, take ONLY:
• Medium (photo / 2D illustration / anime/manga / webtoon / 3D / watercolor / painting / etc.)
• Line work (line weight, line color, sketchy vs clean, presence/absence of outlines)
• Shading & rendering (flat / cel / soft / painterly / photorealistic)
• Color palette, saturation, contrast, color grading, white balance
• Texture & grain (film grain, paper, brush strokes, smooth digital)
• Proportions & stylization level (realistic / stylized / anime / chibi)
• Detail density (how detailed eyes, skin, hair, fabric are rendered)
• Lighting mood and atmospheric quality

ABSOLUTELY DO NOT take from the reference:
• Any specific person, face, or identity — even if a recognizable face is visible in the reference, the output's people must be DIFFERENT, INVENTED people.
• Any clothing, outfit, or accessory the reference person wears.
• Any pose, body language, or facial expression from the reference person.
• Any scene, environment, location, background, or props from the reference.
• Any composition, framing, or camera angle from the reference.

The output must look as if a single artist used the reference's style/technique to create a brand new image of subject and scene that the artist invented themselves, never having seen the reference's content. A viewer comparing reference and output should recognize the same artistic hand and same visual style, but should NOT recognize any person/scene/item from the reference appearing in the output.

[USER INSTRUCTION — DEFINES ALL CONTENT (WHO, WHAT, WHERE, MOOD)]
${prompt}

[VISUAL STYLE TEXT GUIDE — supplements the reference image, do not contradict it]
${styleDescription}

${variation2StepBlock}[STYLE FIDELITY REQUIREMENTS]
Apply the reference's visual style with high fidelity — same medium, same line work, same palette, same rendering technique, same texture, same lighting mood, same proportions/stylization, same detail density. If the text guide above conflicts with what is visible in the attached reference, the attached reference WINS — the text is only a supplement.

[WHOLE-IMAGE STYLE CONSISTENCY — CRITICAL]
The ENTIRE output must be rendered in the reference's ONE medium and technique — every subject, object, background element, pattern, ornament, and any celestial body (sun, moon, stars, clouds). NEVER mix media: do not drop a photorealistic or differently-styled element into an otherwise stylized image. If the reference is flat / low-poly / geometric-faceted / vector / illustrated, then even subjects that are normally depicted photographically (a moon, a face, water, foliage, metal) MUST be redrawn in that same flat / low-poly / geometric-faceted / vector / illustrated technique — built from the same primitives (e.g. flat polygonal facets, hard edges, no photo-real gradients or textures on the subject). A common failure to avoid: rendering the background and decorations in the stylized look but inserting a photo-real moon/sun/face in the center — that is WRONG. One coherent medium across 100% of the image.

[OUTPUT FORMAT RULES]
• Output exactly ONE single image — one continuous scene, not a collage, grid, multi-panel, split-screen, or before/after layout.
• Do NOT include any text, letters, numbers, titles, labels, watermarks, captions, or typography in the image.
• If the user instruction itself asks for multiple outfit/pose/scene variations in a single output, pick ONE and render it as a single full image rather than a collage.`,
      })
    } else if (refs.length > 0) {
      // 레퍼런스 이미지 모두 첨부 (auto_fill_background 또는 캐릭터+스타일 모드)
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
• When multiple reference images are attached AND the user instruction does NOT reference any image by number, blend cues across all references into one cohesive output. When the user instruction does reference specific images by number, follow the [INDEXED REFERENCE MAPPING] strictly.
• If the user instruction itself asks for multiple outfit/pose/scene variations in a single output (e.g. "show 3 different outfits"), pick ONE variation and render it as a single full image rather than a collage.`

      const refCountText = refs.length > 1 ? `${refs.length} attached images` : 'the attached image'

      // 다중 레퍼런스일 때만 인덱스 매핑 가이드 부착 — 사용자가 "1번째 이미지", "image 2" 등으로 특정 요소를 가리킬 수 있게 함
      const ordinalLines = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth']
      const koOrdinalLines = ['첫번째', '두번째', '세번째', '네번째', '다섯번째', '여섯번째', '일곱번째', '여덟번째']
      const indexedRefGuidance = refs.length > 1
        ? `[INDEXED REFERENCE MAPPING — ABSOLUTE TOP PRIORITY, READ AND APPLY BEFORE ANY OTHER RULE BELOW]

The ${refs.length} reference images are NUMBERED in attachment order:
${refs.map((_, i) => `• "image ${i + 1}" / "${i + 1}번째 이미지" / "${koOrdinalLines[i] || `${i + 1}번째`} 이미지" / "${ordinalLines[i] || `${i + 1}-th`} image" = the ${ordinalLines[i] || `${i + 1}-th`} attached image (the ${ordinalLines[i] || `${i + 1}-th`} inlineData block in this request)`).join('\n')}

WHEN THE USER INSTRUCTION ATTRIBUTES AN ELEMENT TO A SPECIFIC IMAGE NUMBER, that mapping is BINDING and OVERRIDES every other rule in this prompt — including [STYLE LOCK], [CHARACTER LOCK], "do not reuse characters", "preserve all references", "blend cues", and the [OUTPUT FORMAT RULES]. The user's explicit number→element mapping is the ABSOLUTE source of truth for that element.

How to apply:
• Identify each "image N의 X" / "X from image N" attribution in the user instruction.
• Source X (face / person / identity / pose / clothing / background / lighting / mood / composition / etc.) ONLY from image N. Reproduce X faithfully and recognizably from image N — for faces and identities, the output's face must be VISIBLY THE SAME PERSON as in image N, with same face shape, eyes, nose, lips, hair, skin tone, age, and identity. Do NOT swap faces or blend identities from other images into that element.
• For elements NOT attributed to a specific image number, default behavior applies (blending across all references for style; per the mode's normal rules for everything else).
• If the user references a non-existent image number, ignore that fragment and apply defaults for that element.

CONCRETE EXAMPLE that matches a common user pattern:
USER SAYS: "1번째 이미지에 있는 남녀가 2번째 이미지처럼 저런 의상을 입고 배에 앉아 있는 모습. 1번째 이미지의 남녀 얼굴을 바꾸면 안돼"
CORRECT BEHAVIOR:
- The man and woman in the OUTPUT must have the EXACT same faces and identities as the man and woman in IMAGE 1 (same face shape, same eyes, same hairstyle, same skin tone, same identity).
- Their clothing in the OUTPUT must match the clothing seen in IMAGE 2.
- The setting/pose in the OUTPUT must match IMAGE 2 (sitting on a boat).
- The faces from IMAGE 2's people must NOT appear in the output. The output's man = image 1's man, output's woman = image 1's woman.

INCORRECT BEHAVIOR (do NOT do this): outputting the people from image 2, or blending faces from image 1 and image 2, or substituting different people.

`
        : ''

      // 멀티 생성 시 호출별로 약한 변주만 부여. STYLE LOCK / CHARACTER LOCK이 우선이며,
      // 변주는 사용자 슬라이더(앵글 다양성·이미지 다양성)가 정한 강도 안에서만 적용된다.
      const hasVariation = typeof variation_directive === 'string' && variation_directive.trim().length > 0
      const variationBlock = hasVariation
        ? `[VARIATION GUIDANCE — IMAGE ${(typeof variation_index === 'number' ? variation_index + 1 : 1)} OF ${typeof variation_total === 'number' ? variation_total : '?'}]

CORE PRINCIPLE: All sibling images in this set are "different shots/moments OF THE SAME SCENE", not different scenes. They must look like consecutive frames of the same film — same setting, same situation, same characters, same narrative beat — viewed from slightly different angles/moments. Image #1 establishes the conceptual baseline; every later image must stay on that baseline and only vary in the dimensions explicitly named below.

Locked across all siblings (taken from the reference image, identical in every sibling):
• Visual style, medium, line work, rendering technique.
• Texture, brush feel, grain, post-processing.
• Color palette, tonal range, overall mood.
• Character/subject identity, outfit, props, accessories.
• Scene, setting, location, situation, narrative moment.
• Overall design concept, art direction, scene interpretation.

ABSOLUTELY FORBIDDEN: Inventing a new scene, a new situation, a new design concept, a new art direction, or new design ideas in any sibling image past the first. Image #2 must NOT be "a different idea from image #1" — it must be "the same idea seen from a slightly different angle/moment".

This guidance does NOT override [STYLE LOCK] or [CHARACTER LOCK] — those win in any conflict. The variation directive below ONLY suggests light variation in camera/angle/pose/moment dimensions; do not fabricate variation in scene, situation, concept, or design.

DIRECTIVE FOR THIS SPECIFIC IMAGE:
${variation_directive.trim()}

`
        : ''

      if (edit_region) {
        // 영역 지정 수정 (Inpaint) — 첨부 이미지에 반투명 빨간 박스가 그려져 있고, 그 안쪽만 지시대로 바꾼다.
        // 박스 바깥 픽셀 보존은 클라이언트에서 원본 재합성으로 보장하므로, 여기서는 "박스 안쪽을 자연스럽게 바꾸고 빨간 마커는 출력에 남기지 말 것"만 강제.
        parts.push({
          text: `EDIT the attached image. ${(typeof edit_region_count === 'number' && edit_region_count > 1) ? `${edit_region_count} thin BRIGHT RED/MAGENTA RECTANGLE OUTLINES have` : 'A thin BRIGHT RED/MAGENTA RECTANGLE OUTLINE has'} been drawn ON TOP of the artwork to mark the EDIT REGION(S). ${(typeof edit_region_count === 'number' && edit_region_count > 1) ? 'These outlines are' : 'This outline is'} an annotation only — NOT part of the picture.

RULES:
1. Change ONLY the content located INSIDE the red rectangle outline(s), following the instruction below. Apply the instruction to EACH marked region. Everything OUTSIDE all red outlines must stay pixel-identical — same composition, same colors, same shapes, same style — do not touch, shift, recolor, or restyle anything outside the marked region(s).
2. The output must contain NO red line, NO magenta line, NO rectangle, and NO red/pink tint, glow, smear, halo, or residue ANYWHERE — not at any boundary, not in any center, nowhere. Reconstruct each marked region as if the outline had never been drawn: continue the surrounding pattern, colors, and shapes naturally into it.
3. Each edited region must blend seamlessly with its surroundings — match the surrounding art style, medium, line work, color palette, lighting direction, and texture so there is no visible seam at any boundary.
4. Do not change the image dimensions or aspect ratio.

INSTRUCTION FOR THE MARKED REGION(S):
${prompt}

[OUTPUT FORMAT]
• ONE single clean image, same dimensions/aspect as the input. No text, letters, numbers, watermarks, captions, or typography. Absolutely no red/pink/magenta markings or residue anywhere.`,
        })
      } else if (auto_fill_background) {
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
      } else {
        // style_and_character — 레퍼런스에서는 face/identity + 시각 스타일만 가져오고, 나머지는 모두 명령어를 따라 렌더한다.
        // (style_only는 위쪽 outer if에서 2-step 파이프라인으로 라우팅되므로 이 분기에는 도달하지 않음)
        parts.push({
          text: `${indexedRefGuidance}${variationBlock}[YOUR TASK]
Generate ONE new image showing the SAME PERSON whose face is in the reference, depicted in a NEW situation defined by the user instruction below.

[FROM THE REFERENCE — TAKE ONLY: face/identity + visual style]
- Face/identity: same face shape, eye shape & color, nose, lips, brow, jawline, hair color, natural hairstyle (unless instruction specifies different), skin tone, age, ethnicity, overall identity. The output must be IMMEDIATELY RECOGNIZABLE as the same person.${refs.length > 1 ? ' When multiple references are attached AND the user instruction does NOT reference images by number, treat all references as showing the same character (or blend identities consistently). When the user instruction DOES reference images by number, [INDEXED REFERENCE MAPPING] at the top is BINDING — use the face from the named image exactly.' : ''}
- Visual style: same medium (photo / 2D illustration / anime/manga / webtoon / 3D / watercolor / painting / etc.), same line work, same shading technique, same color palette, same texture, same proportions/stylization, same detail density. NEVER convert between mediums or "upgrade" to a more polished/photorealistic look.

[FROM THE USER INSTRUCTION — TAKE: everything else]
- Outfit, clothing, accessories, jewelry, footwear: render whatever the instruction describes.
- Pose, body language, gesture, facial expression: render per instruction (and [VARIATION DIRECTIVE] if present).
- Scene, environment, background, location, props, set dressing: render per instruction.
- Composition, framing, camera angle, distance: render per instruction (and [VARIATION DIRECTIVE]).
- Number of subjects, supporting characters: per instruction.

[USER INSTRUCTION — DEFINES OUTFIT, SCENE, POSE, EVERYTHING EXCEPT FACE/STYLE]
${prompt}

[CRITICAL]
The reference's outfit, scene, pose, and setting are NOT in the output. Even though the reference shows the person wearing X at location A, the output must show the SAME PERSON wearing Y at location B per the instruction. Reference contributes face + visual style only — NOTHING ELSE.

If the instruction's STYLE hint conflicts with the reference's medium (e.g. asks "realistic" when reference is anime): IGNORE the style hint, keep the reference's style. The instruction's content (clothing/scene/etc.) is still fully applied.${formatRules}`,
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

    // 호출별 seed를 반영. seed가 없으면 매 호출마다 다른 난수를 자동 부여해 결정론적 출력을 깨뜨림.
    const effectiveSeed = typeof seed === 'number' && Number.isFinite(seed)
      ? Math.floor(seed)
      : Math.floor(Math.random() * 2_147_483_647)

    // 클라이언트의 "이미지 다양성" 슬라이더(0~100)를 Gemini temperature(0.5~1.2)로 비선형 매핑.
    // 슬라이더가 없으면 0.75(적당히 일관성)로 기본 설정.
    const variationLevel = typeof image_variation === 'number' && Number.isFinite(image_variation)
      ? Math.max(0, Math.min(100, image_variation))
      : 33
    const effectiveTemperature = (() => {
      const v = variationLevel
      if (v <= 20) return 0.5 + (v / 20) * 0.15
      if (v <= 50) return 0.65 + ((v - 20) / 30) * 0.15
      if (v <= 80) return 0.80 + ((v - 50) / 30) * 0.20
      return 1.0 + ((v - 80) / 20) * 0.20
    })()

    const requestBody = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspect_ratio || '16:9',
        },
        temperature: effectiveTemperature,
        seed: effectiveSeed,
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
