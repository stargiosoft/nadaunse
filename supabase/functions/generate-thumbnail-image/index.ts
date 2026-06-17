// Supabase Edge Function: 범용 썸네일 이미지 생성 (Gemini Image Generation)
// 레퍼런스 이미지 + 명령어 → 썸네일 이미지 (base64 PNG)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 사용 모델 — preview는 다운/스펙 변동 잦아 stable 사용
const MODEL_ID = 'gemini-2.5-flash-image'

// ── Replicate Real-ESRGAN 2× AI 업스케일 ──
// REPLICATE_API_TOKEN이 설정된 경우에만 동작. 없으면 원본 반환.
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 32768
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)))
  }
  return btoa(binary)
}

async function upscaleWithReplicate(base64: string, mimeType: string): Promise<string> {
  const token = Deno.env.get('REPLICATE_API_TOKEN')
  if (!token) return base64

  const dataUri = `data:${mimeType};base64,${base64}`

  // Replicate synchronous mode (Prefer: wait, up to 60s)
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      model: 'nightmareai/real-esrgan',
      input: { image: dataUri, scale: 2, face_enhance: false },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Replicate ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()

  // 60s 내 완료된 경우 output이 URL, 아직 처리 중이면 polling
  let outputUrl: string | null = data?.output ?? null

  if (!outputUrl && data?.id) {
    // polling (최대 50s, 2s 간격)
    const pollUrl = `https://api.replicate.com/v1/predictions/${data.id}`
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const poll = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      const pollData = await poll.json()
      if (pollData.status === 'succeeded') { outputUrl = pollData.output; break }
      if (pollData.status === 'failed' || pollData.status === 'canceled') {
        throw new Error(`Replicate prediction ${pollData.status}: ${pollData.error || ''}`)
      }
    }
  }

  if (!outputUrl) throw new Error('Replicate: no output URL returned')

  const imgRes = await fetch(outputUrl)
  if (!imgRes.ok) throw new Error(`Replicate output download failed: ${imgRes.status}`)
  const buffer = await imgRes.arrayBuffer()
  return uint8ToBase64(new Uint8Array(buffer))
}

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
// 레퍼런스 이미지를 image-conditioning으로 그대로 넘기면 모델이 인물/복장/장면은 물론 색감·구도까지 복사하므로,
// 여기서는 "예술적 기법"(매체·선묘·렌더링·질감·디테일·빛의 질)만 텍스트로 추출한다.
// 색 팔레트와 구도는 의도적으로 추출하지 않는다 — 그 둘은 명령어/주제가 정해야 하기 때문.
async function extractStyleDescription(refs: string[], apiKey: string): Promise<string> {
  const visionParts: Array<Record<string, unknown>> = []
  for (const data of refs) {
    visionParts.push({ inlineData: { mimeType: 'image/png', data } })
  }
  visionParts.push({
    text: `Describe the ARTISTIC TECHNIQUE of the attached image${refs.length > 1 ? 's' : ''} in 150-200 words, so another artist could reproduce the same "hand" on a COMPLETELY DIFFERENT subject, in a DIFFERENT color scheme, and a DIFFERENT composition. Cover ONLY:
- Medium (photograph / 2D illustration / anime/manga / webtoon / 3D render / watercolor / oil painting / pencil sketch / digital painting / gongbi / ink-wash / etc.)
- Line work (line weight, line color, presence/absence of outlines, sketchy vs clean, gold/metallic linework, etc.)
- Shading & rendering technique (flat colors / cel-shading / soft shading / painterly / photorealistic lighting / luminous bloom / glazed layers)
- Color TREATMENT — describe HOW color is handled (e.g. desaturated washes / high-key luminosity / soft gradients / metallic accents on linework / muted with a few saturated pops), but DO NOT prescribe WHICH hues dominate or name a specific palette — the actual colors will be chosen to fit a different subject and mood.
- Texture and grain (film grain, paper texture, brush texture, smooth digital, etc.)
- Proportions and stylization level (realistic anatomy / stylized / anime / chibi / etc.)
- Detail density and level of finish (how detailed eyes, skin, hair, fabric are rendered; how polished/finished the work is)
- Quality of light (soft vs harsh, diffuse vs directional, glow/bloom characteristics) — but NOT the specific light direction or color, which depend on the scene.

IMPORTANT — if the medium is stylized rather than photographic (e.g. low-poly / flat-vector / geometric-faceted / cel-shaded / paper-cut / pixel-art / painterly / cartoon): explicitly state that EVERY form in this style — organic shapes, faces, skin, water, sky, clouds, foliage, fabric, AND celestial bodies like the sun/moon/stars — is constructed from the SAME stylized primitives (e.g. flat triangular polygonal facets with hard edges and no gradients on the subject itself), and is NEVER rendered with photographic detail, smooth photo-real textures, or a different medium. Spell out the exact geometric/illustrative construction so a replicator would draw a moon as faceted polygons, not as a photograph.

BE SPECIFIC AND TECHNICAL — use precise art vocabulary, not vague adjectives. Name the actual technique if you can identify it (e.g. "Chinese gongbi 工笔 fine-line painting", "metallic gold contour lines / 描金", "translucent silk rendered with thin layered glazes", "high-key luminosity with a near-white luminous background and gentle bloom", "ink-wash 水墨 atmospheric background with bleed", "ukiyo-e woodblock", "ligne claire", "impasto oil", "cel-shaded anime with hard light bands", "soft-airbrushed CG", "gritty painterly concept art", "alla prima gouache", etc.). State the level of opacity (transparent/airy vs opaque/heavy), the amount of hard shadow (minimal/none vs strong rim and cast shadows), the surface finish (matte paper vs glossy digital), and the overall "weight" (delicate/ethereal/weightless vs solid/dense/dramatic).

ALSO STATE WHAT THE STYLE IS NOT — list 3-5 explicit negative markers so a replicator does not drift toward a generic default look. For example, if the reference is a delicate luminous gongbi/watercolor-with-gold-line illustration, write that it is "explicitly NOT modern Korean webtoon/manhwa CG, NOT thick opaque digital painting, NOT cel-shaded anime, NOT a dark saturated dark-fantasy palette, NOT glossy airbrushed game-art rendering". Choose negatives that are the closest "default" styles a model might wrongly fall back to.

DO NOT describe or prescribe: specific people, faces, identities, clothing, accessories, poses, scenes, environments, props, content, the specific color palette / dominant hues, OR the composition / framing / camera angle. Technique only — write as if explaining the artist's craft to someone who will invent their own subject, pick their own colors, and design their own composition.

Output: a single descriptive paragraph (technique + the "is NOT" negatives). No bullet points, no headings, no preamble like "This image shows" — just the technique description.`,
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

// "구도 참고" 모드용 1단계 호출.
// 구도 이미지를 inlineData로 그대로 첨부하면 시각 신호가 텍스트 지시를 압도해 화풍·색감·인물까지 새어들어옴.
// 따라서 구도 이미지를 한 번 텍스트(프레이밍·앵글·배치·깊이 구조)로 변환한 뒤, 생성 호출에는 이미지를 첨부하지 않고
// 텍스트 가이드만 사용한다. 이렇게 하면 모델은 구도 레퍼런스의 스타일을 "볼 수 없음".
async function extractCompositionDescription(refs: string[], apiKey: string): Promise<string> {
  const visionParts: Array<Record<string, unknown>> = []
  for (const data of refs) {
    visionParts.push({ inlineData: { mimeType: 'image/png', data } })
  }
  visionParts.push({
    text: `Describe ONLY the COMPOSITION / FRAMING / SPATIAL LAYOUT of the attached image${refs.length > 1 ? 's' : ''} in 120-180 words, so another artist could reconstruct the same FRAMING on a COMPLETELY DIFFERENT subject, in a COMPLETELY DIFFERENT style, with COMPLETELY DIFFERENT colors. Treat the image${refs.length > 1 ? 's' : ''} as a blocking/storyboard diagram — describe WHERE things sit in the frame, NOT what they are or how they are drawn.

Cover ONLY:
- Camera angle and viewpoint (eye-level / low angle looking up / high angle looking down / overhead / bird's-eye / worm's-eye / Dutch tilt / over-the-shoulder / profile / three-quarter / dead-on / etc.)
- Lens / perspective feel (wide-angle distortion / normal / telephoto compression / fish-eye / orthographic flat).
- Framing and crop (extreme close-up / close-up / medium close-up / medium / medium-wide / wide / full body / extreme wide / aerial). Where the subject is cut by the frame edges (e.g. "head to mid-chest", "full body with headroom", "cropped at waist").
- Subject placement in the frame using rule-of-thirds / golden-ratio / center / left-third / right-third language. Where is the focal point? How is negative space distributed (large empty area on left? top? around the subject?)?
- Number of subjects and their spatial relationship to each other (e.g. "single subject centered with empty surround", "two subjects facing each other in the center third", "main subject in the left third with secondary subject smaller in the right background").
- Pose silhouette as a SHAPE, not a description of what the person is doing — the geometric outline of how bodies occupy the frame (e.g. "an S-curve from top-left to bottom-right", "a triangular composition with the head at the apex", "a horizontal silhouette across the lower third").
- Depth structure: clear foreground / midground / background layers if present. Leading lines (diagonal? converging? horizontal?). Vanishing point location if perspective is dramatic.
- Headroom / footroom / lead-room ratios.
- Horizon line position if visible (high horizon / low horizon / centered).

ABSOLUTELY DO NOT describe:
- Style, medium, line work, rendering technique, shading, texture, brush feel — none of this.
- Colors, color palette, hues, color mood, lighting style, white-balance — none of this.
- The identity, face, body type, ethnicity, age, hair, makeup, clothing, accessories, or expression of any person.
- The specific objects, props, animals, vehicles, environment elements, or location ("a kitchen with a stove" = NO; "a single horizontal surface in the lower third with the main subject sitting on it" = YES).
- Mood, atmosphere, story, emotion, narrative.
- Any text, logos, watermarks visible in the image.

Use geometric / cinematographic vocabulary only. Pretend you are writing a shot-list entry for a storyboard artist who will draw the scene from scratch in any style, with any subject, in any colors — they only need to know WHERE things go and FROM WHAT ANGLE the camera looks.${refs.length > 1 ? `

If the ${refs.length} attached images show different compositions, briefly describe each (1-2 sentences) and then state a unifying framing principle that someone could blend (e.g. "all three are low-angle full-body shots with the subject in the left third").` : ''}

Output: a single descriptive paragraph using geometric/cinematographic vocabulary. No bullet points, no headings, no preamble like "This image shows" — just the composition description.`,
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
    throw new Error(`구도 추출 실패 (HTTP ${res?.status ?? 'no-response'}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = (data?.candidates?.[0]?.content?.parts || [])
    .filter((p: any) => typeof p?.text === 'string')
    .map((p: any) => p.text)
    .join(' ')
    .trim()

  if (!text) throw new Error('구도 추출 결과가 비어 있습니다. 잠시 후 다시 시도해주세요.')
  return text
}

// 사용자 명령에 들어있는 "N개/N명/N마리…" 같은 개수 지시를 찾아, 모델이 개수를 정확히 지키도록 강조 블록을 만든다.
// 이미지 생성 모델은 본질적으로 개수를 "세지" 못하고 그럴듯한 분포로 그려서(특히 6~7개 이상), 명시적 카운팅 지시가 정확도를 크게 높인다.
const COUNT_UNITS = '개|명|마리|송이|그루|장|병|잔|채|권|쌍|줄|컵|상자|켤레|판'
const KO_NUMERALS: Record<string, number> = {
  '하나': 1, '한': 1, '둘': 2, '두': 2, '셋': 3, '세': 3, '넷': 4, '네': 4,
  '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10,
}

function buildCountEmphasis(prompt: string): string {
  if (!prompt || !prompt.trim()) return ''
  const found: Array<{ noun: string; count: number }> = []
  const seen = new Set<string>()
  const add = (noun: string, count: number) => {
    if (!Number.isFinite(count) || count < 1 || count > 200) return
    const n = (noun || '').trim()
    const key = `${n}:${count}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ noun: n, count })
  }

  // 1) "표주박 10개" / "10개의 표주박" / "10 개" — 아라비아 숫자 + 단위
  const digitRe = new RegExp(`([가-힣A-Za-z]{1,12})?\\s*(\\d{1,4})\\s*(?:${COUNT_UNITS})(?:의\\s*([가-힣A-Za-z]{1,12}))?`, 'g')
  let m: RegExpExecArray | null
  while ((m = digitRe.exec(prompt)) !== null) {
    add(m[3] || m[1] || '', parseInt(m[2], 10))
  }

  // 2) "표주박 다섯 개" — 한국어 수사 + 단위
  const koRe = new RegExp(`([가-힣A-Za-z]{1,12})?\\s*(${Object.keys(KO_NUMERALS).join('|')})\\s*(?:${COUNT_UNITS})`, 'g')
  while ((m = koRe.exec(prompt)) !== null) {
    const count = KO_NUMERALS[m[2]]
    if (count) add(m[1] || '', count)
  }

  if (found.length === 0) return ''

  const lines = found.map(({ noun, count }) => {
    const label = noun ? `"${noun}"` : 'the specified item'
    return `• ${label} → EXACTLY ${count}. Draw ${count} separate, individually distinguishable instance${count > 1 ? 's' : ''}, each fully visible and not merged together. Count as you place them: 1, 2, … ${count}. Do NOT draw ${Math.max(0, count - 1)} or ${count + 1}.`
  })

  return `[OBJECT COUNT — MANDATORY, HIGHEST PRIORITY OVER STYLE/COMPOSITION/AESTHETICS]
The user instruction specifies exact object counts. You MUST render these EXACT quantities — image generators routinely miscount, so deliberately count each object as you place it in the scene:
${lines.join('\n')}
If a count is large, still place exactly that many, clearly separated (render them smaller if needed) — never round to a "nicer looking" amount and never let objects overlap into an ambiguous blob. Getting the exact count right matters MORE than a balanced or pretty composition.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { prompt, reference_image, reference_images, reference_mode, composition_reference_images, aspect_ratio, auto_fill_background, seed, variation_directive, variation_index, variation_total, image_variation, edit_region, edit_region_count, edit_full, framing_directive, provider } = await req.json()

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

    // ── GPT 이미지 생성 경로 ──
    if (provider === 'gpt') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const sizeMap: Record<string, string> = {
        '9:16': '1024x1536', '3:4': '1024x1536', '2:3': '1024x1536',
        '1:1': '1024x1024', '16:9': '1536x1024', 'saju-consult': '1536x1024',
      }
      const size = sizeMap[aspect_ratio || ''] || '1024x1024'

      let gptBase64: string | null = null

      if (refs.length > 0) {
        // 레퍼런스 이미지가 있으면 edits endpoint 사용
        const formData = new FormData()
        for (const ref of refs) {
          const bytes = Uint8Array.from(atob(ref), (c: string) => c.charCodeAt(0))
          formData.append('image[]', new Blob([bytes], { type: 'image/png' }), 'reference.png')
        }
        formData.append('prompt', prompt || '')
        formData.append('model', 'gpt-image-1')
        formData.append('size', size)
        formData.append('n', '1')

        const editRes = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          body: formData,
        })
        if (!editRes.ok) {
          const errText = await editRes.text()
          let msg = ''
          try { msg = JSON.parse(errText)?.error?.message || '' } catch {}
          return new Response(JSON.stringify({ error: msg || `GPT 이미지 생성 실패 (HTTP ${editRes.status})` }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const d = await editRes.json()
        gptBase64 = d?.data?.[0]?.b64_json ?? null
      } else {
        // 레퍼런스 없으면 generations endpoint 사용
        const genRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-image-1', prompt: prompt || '', n: 1, size }),
        })
        if (!genRes.ok) {
          const errText = await genRes.text()
          let msg = ''
          try { msg = JSON.parse(errText)?.error?.message || '' } catch {}
          return new Response(JSON.stringify({ error: msg || `GPT 이미지 생성 실패 (HTTP ${genRes.status})` }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const d = await genRes.json()
        gptBase64 = d?.data?.[0]?.b64_json ?? null
      }

      if (!gptBase64) {
        return new Response(JSON.stringify({ error: 'GPT 이미지 생성 실패 (빈 응답)' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ image: gptBase64, mimeType: 'image/png' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const styleTextOnly = reference_mode === 'style_text_only'

    // 구도 참고 이미지: 화풍/내용은 무시하고 오로지 프레이밍·앵글·배치만 차용.
    // 영역 수정(edit_region)이나 여백 채우기(auto_fill_background) 모드에서는 의미 없으므로 무시.
    const compRefs: string[] = Array.isArray(composition_reference_images)
      ? composition_reference_images.filter((s: unknown) => typeof s === 'string' && s.length > 0)
      : []
    const compRefsActive = compRefs.length > 0 && !edit_region && !auto_fill_background

    // 1단계에서 추출한 구도 텍스트 가이드. 생성 호출엔 이미지 첨부 없이 이 텍스트만 사용한다.
    // (이미지 첨부 시 시각 신호가 텍스트 지시를 압도해 화풍·색감·인물까지 새어들기 때문.)
    let compositionGuide = ''
    if (compRefsActive) {
      try {
        compositionGuide = await extractCompositionDescription(compRefs, apiKey)
      } catch (e) {
        console.warn('[generate-thumbnail-image] composition extraction failed, skipping:', e)
        compositionGuide = ''
      }
    }

    const appendCompositionParts = () => {
      if (!compRefsActive || !compositionGuide) return
      parts.push({
        text: `[COMPOSITION GUIDE — text-only, derived from the user's reference image${compRefs.length > 1 ? 's' : ''}]
NO composition reference image is attached to this generation call. The following is a TEXT-ONLY description of the framing/layout the user wants. Apply these spatial/cinematographic instructions to the [USER INSTRUCTION]'s subject and style, but do not infer style, color, identity, or content from the description — those come from the [USER INSTRUCTION] and (if present) the STYLE / CHARACTER references only.

COMPOSITION DESCRIPTION:
${compositionGuide}

[HOW TO APPLY THE COMPOSITION GUIDE]
• Match the camera angle, framing, crop, subject placement, depth structure, and negative space distribution described above.
• When the [USER INSTRUCTION] and this composition guide both specify a pose/angle, the [USER INSTRUCTION] takes priority. The composition guide fills in framing details the instruction does not specify.
• Do NOT introduce extra subjects, props, objects, environment details, or color choices that this guide mentions only as part of describing spatial layout — the only thing taken from this guide is WHERE things sit and FROM WHAT ANGLE the camera looks.
• Render in the style and colors dictated by the [USER INSTRUCTION] and any STYLE references. The composition guide has ZERO influence on style or color.`,
      })
    }

    if (refs.length > 0 && !auto_fill_background && !edit_region && !edit_full && reference_mode !== 'style_and_character' && reference_mode !== 'faithful') {
      // ── "스타일만 참고" 계열 — 레퍼런스에서 "예술적 기법"만 텍스트로 추출하고, 색감·구도는 명령어/주제가 정한다 ──
      // style_only:      추출 텍스트 + 레퍼런스 이미지 inlineData 함께 전달 (강한 anti-copy). 기법 정확하지만 소재가 새어들 수 있음.
      // style_text_only: 추출 텍스트만 사용하고 생성 호출엔 레퍼런스 이미지를 첨부하지 않음 → 소재/색 누출 거의 0, 기법 디테일은 약간 덜 정밀.
      const styleDescription = await extractStyleDescription(refs, apiKey)

      // style_only일 때만 레퍼런스 이미지를 inline 첨부 (high-fidelity 앵커)
      if (!styleTextOnly) {
        for (const data of refs) {
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data,
            },
          })
        }
      }

      const variation2StepBlock = (typeof variation_directive === 'string' && variation_directive.trim().length > 0)
        ? `[VARIATION GUIDANCE — IMAGE ${(typeof variation_index === 'number' ? variation_index + 1 : 1)} OF ${typeof variation_total === 'number' ? variation_total : '?'}]
CORE PRINCIPLE: All sibling images are "different shots OF THE SAME SCENE", not different scenes. Same setting, same situation, same characters, same narrative beat, same overall design concept across every sibling. Image #1 establishes the conceptual baseline; every later image must stay on that baseline.

Locked across siblings: medium, line work, texture, rendering technique, detail density, level of finish, quality of light (these come from the reference's artistic technique); AND color palette, lighting mood, overall design concept, scene interpretation, characters, situation, composition concept (these come from image #1 and the user instruction — NOT from the reference). Image #1 is the source of truth for color and layout; the reference is the source of truth only for technique.

ABSOLUTELY FORBIDDEN past image #1: inventing a new scene, new situation, new design concept, new art direction, or a new color scheme. Image #N must read as "same concept as image #1, viewed from a slightly different angle/moment", not as a separate idea.

Apply ONLY the subtle differentiation specified below, strictly within the locked concept:

${variation_directive.trim()}

`
        : ''

      if (styleTextOnly) {
        // 레퍼런스 이미지 없이, 추출된 화풍 텍스트 가이드만으로 생성 → 레퍼런스 소재가 출력에 새어들 일이 없음.
        parts.push({
          text: `[YOUR TASK]
Generate ONE new image. NO reference image is attached. You are recreating ONLY the ARTISTIC TECHNIQUE described in [TECHNIQUE GUIDE] below, applied to brand-new subject matter, a brand-new color scheme, and a brand-new composition that are ALL defined by [USER INSTRUCTION]. The technique guide describes the artist's "hand" ONLY — it contains no content, no color palette, and no composition for you to copy.

[USER INSTRUCTION — DEFINES ALL CONTENT, COLOR/MOOD, AND COMPOSITION (WHO, WHAT, WHERE, COLORS, FRAMING, MOOD)]
${prompt}

[TECHNIQUE GUIDE — replicate this artist's craft/technique exactly]
${styleDescription}

${variation2StepBlock}[TECHNIQUE FIDELITY — WHAT TO TAKE FROM THE GUIDE]
Match the medium, line work, rendering/shading technique, the way color is HANDLED (washes/glazes/cel/bloom/metallic accents — the treatment, not the hues), texture and grain, proportions/stylization level, detail density, level of finish, and the quality of light (soft/diffuse/glowing vs harsh) as faithfully as possible. Do not invent a different medium; do not drift toward photorealism unless the guide explicitly says photographic.

[DO NOT FALL BACK TO YOUR DEFAULT HOUSE STYLE — CRITICAL]
Your built-in default tends toward a glossy, opaque, cel/soft-shaded modern anime / Korean-webtoon / game-CG illustration look with saturated colors and strong rim light. UNLESS the technique guide above describes exactly that, you must NOT render in it. Obey the guide's negative markers ("explicitly NOT ...") strictly. If the guide describes a delicate / transparent / airy / luminous / painterly / watercolor / gongbi / ink-wash / gold-line technique, the output must be that delicate transparent luminous look — thin glazes, minimal hard shadows, high-key near-white luminosity, fine gold/metallic contour lines if mentioned, matte painterly surface — NOT a thick opaque high-contrast CG render. Err on the side of MORE faithful to the guide's described technique, even if it feels less "polished" than your default.

[WHAT MUST FOLLOW THE SUBJECT, NOT THE GUIDE]
• Color palette / dominant hues / overall color mood — choose colors that fit THIS subject and the mood in [USER INSTRUCTION]. Do NOT default to the reference's colors. (e.g. a fiery dusk subject → warm reds/golds even if the reference was cool and pale.)
• Composition, framing, camera angle, subject placement — design these to best serve THIS subject and what [USER INSTRUCTION] asks for. Do NOT copy a layout.
• Light direction and light color — set by the scene you are drawing.

[WHOLE-IMAGE MEDIUM CONSISTENCY]
The ENTIRE image must be in this one consistent medium/technique — every subject, object, background element, pattern, ornament, and any celestial body — never mix in a photo-real or differently-styled element. If the technique is flat / low-poly / geometric-faceted / vector / illustrated, even normally-photographic subjects (a moon, a face, water, metal) must be built from that same technique's primitives.

[OUTPUT FORMAT RULES]
• Output exactly ONE single image — one continuous composition, not a collage, grid, multi-panel, split-screen, montage, or before/after layout.
• Do NOT include any text, letters, numbers, titles, labels, watermarks, captions, or typography in the image.
• If the user instruction asks for multiple outfit/pose/scene variations in a single output, pick ONE and render it as a single full image rather than a collage.`,
        })
      } else {
      parts.push({
        text: `[YOUR TASK]
Generate ONE new image. The attached reference image${refs.length > 1 ? 's are' : ' is'} provided ONLY as an ARTISTIC TECHNIQUE sample — to anchor your understanding of the artwork's medium, line work, texture, shading, rendering technique, and the way color is handled. The CONTENT of the output (who/what/where/scene/poses), its COLOR PALETTE/MOOD, and its COMPOSITION are defined exclusively by the [USER INSTRUCTION] below.

[CRITICAL — REFERENCE IMAGE USAGE]
The reference is a TECHNIQUE SAMPLE, not a CONTENT, COLOR, or LAYOUT template. From the reference, take ONLY:
• Medium (photo / 2D illustration / anime/manga / webtoon / 3D / watercolor / painting / gongbi / ink-wash / etc.)
• Line work (line weight, line color, sketchy vs clean, presence/absence of outlines, gold/metallic linework)
• Shading & rendering (flat / cel / soft / painterly / photorealistic / luminous bloom / glazed layers)
• Color TREATMENT only — HOW color is applied (washes / glazes / high-key luminosity / desaturated with saturated pops / metallic accents on linework) — NOT which hues dominate.
• Texture & grain (film grain, paper, brush strokes, smooth digital)
• Proportions & stylization level (realistic / stylized / anime / chibi)
• Detail density and level of finish (how detailed eyes, skin, hair, fabric are; how polished the work is)
• Quality of light (soft/diffuse/glowing vs harsh) — NOT its direction or color.

ABSOLUTELY DO NOT take from the reference:
• Any specific person, face, or identity — even if a recognizable face is visible in the reference, the output's people must be DIFFERENT, INVENTED people.
• Any clothing, outfit, or accessory the reference person wears.
• Any pose, body language, or facial expression from the reference person.
• Any scene, environment, location, background, or props from the reference.
• Any composition, framing, camera angle, or subject placement from the reference.
• The reference's color palette / dominant hues / color mood — the output's colors are chosen to fit the user's subject and mood, NOT to match the reference. If the reference is cool and pale but the user's subject is a fiery sunset, the output must be warm and fiery.

The output must look as if a single artist used the reference's CRAFT to create a brand new image — new subject, new colors, new composition — that the artist invented themselves, never having seen the reference's content. A viewer comparing reference and output should recognize the same artistic hand and the same medium/technique, but should NOT recognize any person/scene/item from the reference, and the two images may look quite different in color and layout.

[USER INSTRUCTION — DEFINES ALL CONTENT, COLOR/MOOD, AND COMPOSITION (WHO, WHAT, WHERE, COLORS, FRAMING, MOOD)]
${prompt}

[TECHNIQUE TEXT GUIDE — supplements the reference image, do not contradict it on matters of technique]
${styleDescription}

${variation2StepBlock}[TECHNIQUE FIDELITY REQUIREMENTS]
Apply the reference's artistic technique with high fidelity — same medium, same line work, same rendering technique, same way of handling color (treatment, not hues), same texture, same proportions/stylization, same detail density and finish, same quality of light. If the text guide above conflicts with what is visible in the attached reference on a matter of technique, the attached reference WINS — the text is only a supplement. But for the choice of which colors, which composition, and which light direction to use, the [USER INSTRUCTION] and subject win — never the reference.

[DO NOT FALL BACK TO YOUR DEFAULT HOUSE STYLE — CRITICAL]
Your built-in default tends toward a glossy, opaque, cel/soft-shaded modern anime / Korean-webtoon / game-CG illustration look with saturated colors and strong rim light. UNLESS the attached reference is exactly that, you must NOT render in it. Look hard at the attached reference's actual surface: if it is delicate / transparent / airy / luminous / painterly / watercolor / gongbi / ink-wash with fine gold/metallic linework, the output must be that — thin layered glazes, minimal hard shadows, high-key near-white luminosity, matte painterly surface, fine metallic contour lines — NOT a thick opaque high-contrast CG render. Obey the technique guide's negative markers ("explicitly NOT ...") strictly. Err on the side of being MORE faithful to the reference's actual technique, even if the result feels less "polished" than your default output.

[WHOLE-IMAGE STYLE CONSISTENCY — CRITICAL]
The ENTIRE output must be rendered in the reference's ONE medium and technique — every subject, object, background element, pattern, ornament, and any celestial body (sun, moon, stars, clouds). NEVER mix media: do not drop a photorealistic or differently-styled element into an otherwise stylized image. If the reference is flat / low-poly / geometric-faceted / vector / illustrated, then even subjects that are normally depicted photographically (a moon, a face, water, foliage, metal) MUST be redrawn in that same flat / low-poly / geometric-faceted / vector / illustrated technique — built from the same primitives (e.g. flat polygonal facets, hard edges, no photo-real gradients or textures on the subject). A common failure to avoid: rendering the background and decorations in the stylized look but inserting a photo-real moon/sun/face in the center — that is WRONG. One coherent medium across 100% of the image.

[OUTPUT FORMAT RULES]
• Output exactly ONE single image — one continuous scene, not a collage, grid, multi-panel, split-screen, or before/after layout.
• Do NOT include any text, letters, numbers, titles, labels, watermarks, captions, or typography in the image.
• If the user instruction itself asks for multiple outfit/pose/scene variations in a single output, pick ONE and render it as a single full image rather than a collage.`,
      })
      }
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

      // 와이드 포맷 등 특수 구도 제약 — variation_directive보다 먼저, 모든 다른 지시보다 앞에 위치해 최우선 적용.
      const framingBlock = (typeof framing_directive === 'string' && framing_directive.trim().length > 0)
        ? `[FRAMING OVERRIDE — ABSOLUTE PRIORITY, OVERRIDES REFERENCE AND ALL OTHER INSTRUCTIONS]\n${framing_directive.trim()}\n\n`
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
      } else if (edit_full) {
        // 전체 이미지 인플레이스 편집 — 제미나이 채팅 수정처럼, 명령한 부분만 바꾸고 나머지는 입력과 동일하게 유지.
        // 영역 박스 없이 이미지 전체를 다시 그리되, 변경 지시가 없는 모든 요소는 픽셀 충실하게 재현하도록 강제한다.
        parts.push({
          text: `EDIT the attached image, applying ONLY the change described in the instruction below. This is the EXACT image to modify — treat it like editing the existing artwork in place, NOT generating a new picture.

[INSTRUCTION — the ONLY thing to change]
${prompt}

[KEEP EVERYTHING ELSE IDENTICAL — CRITICAL]
• Reproduce every part of the image the instruction does NOT mention exactly as in the input: same composition, same framing, same subjects, same faces and identities, same poses, same background, same props, same colors, same art style, same medium, same line work, same lighting, same texture, same level of detail. Be pixel-faithful everywhere the instruction does not touch.
• Do NOT regenerate, reinterpret, restyle, recolor, recompose, re-pose, or "improve" the image. Do NOT shift, resize, add, or remove any element the instruction did not ask about. Do NOT change the art style or color palette.
• PRESERVE the input's exact contrast, saturation, and clarity. Do NOT wash out, desaturate, mute, fade, lower contrast, or soften the image. Do NOT add any haze, fog, mist, soft blur, glow, bloom, or hazy film. Do NOT lift the blacks or blow out highlights. Colors stay as vivid, blacks as deep, and edges as crisp as in the input.
• Apply the requested change so it blends seamlessly into the existing artwork — matching the surrounding style, line work, color palette, lighting direction, and texture — as if it had always been part of the original.
• Do NOT change the image dimensions or aspect ratio.

[OUTPUT FORMAT]
• ONE single image, same dimensions/aspect as the input. No text, letters, numbers, watermarks, captions, or typography.`,
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
      } else if (reference_mode === 'faithful') {
        // 충실(레퍼런스 그대로) 모드 — 제미나이 사이트처럼 이미지를 직접 첨부하고 명령어를 거의 그대로 적용한다.
        // 화풍·색감을 모두 유지하는 것이 목표이므로 색 팔레트 제외/구도 무시 같은 anti-copy 장치를 쓰지 않는다.
        // 사용자 명령어를 최상단에 두고, 보존/형식 규칙은 짧게만 부착해 명령 충실도를 살린다.
        parts.push({
          text: `${framingBlock}${indexedRefGuidance}${variationBlock}[YOUR TASK]
Recreate/edit based on the attached reference image${refs.length > 1 ? 's' : ''}, following the [USER INSTRUCTION] below. PRESERVE the reference's art style AND colors faithfully — only change what the instruction explicitly asks for.

[USER INSTRUCTION — TOP PRIORITY, FOLLOW IT LITERALLY]
${prompt}

[WHAT TO KEEP FROM THE REFERENCE — KEEP IT EXACTLY]
• Art style: same medium, line work, rendering/shading technique, texture, brush feel, proportions, stylization level, detail density, and level of finish.
• Color: same color palette, dominant hues, tonal range, color mood, and lighting feel as the reference. Do NOT shift, resaturate, or recolor.
• MATCH THE REFERENCE'S CONTRAST, SATURATION, AND CLARITY EXACTLY. Do NOT wash out, desaturate, mute, fade, or lower the contrast of the image. Do NOT add any haze, fog, mist, soft blur, glow, bloom, or hazy atmospheric film over the image. Do NOT lift the blacks or blow out the highlights. Blacks stay as deep, colors stay as vivid, and edges stay as crisp and sharp as in the reference. The output's color vividness and contrast must look IDENTICAL to the reference, not softer or paler.
• Do NOT "upgrade" or restyle: do not drift toward a glossier, more opaque, more photorealistic, or more saturated look than the reference. Whatever the reference's actual surface is (delicate / painterly / watercolor / gongbi / flat / anime / photo / etc.), keep that exact look.

[WHAT TO CHANGE]
Apply ONLY the changes the [USER INSTRUCTION] asks for (e.g. subject, pose, scene, added/removed elements, composition). Everything the instruction does NOT mention stays as in the reference, including style and color. Do not invent extra changes.

[WHOLE-IMAGE CONSISTENCY]
Render the entire image in the reference's single consistent medium — every subject, object, background, ornament, and any celestial body. Never mix in a differently-styled or photo-real element.${formatRules}`,
        })
      } else {
        // style_and_character — 레퍼런스에서는 face/identity + 시각 스타일만 가져오고, 나머지는 모두 명령어를 따라 렌더한다.
        // (style_only는 위쪽 outer if에서 2-step 파이프라인으로 라우팅되므로 이 분기에는 도달하지 않음)
        parts.push({
          text: `${framingBlock}${indexedRefGuidance}${variationBlock}[YOUR TASK]
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

    // 구도 참고 이미지는 모든 메인 지시문 뒤에 별도 블록으로 부착. 스타일 레퍼런스와 인덱스가 섞이지 않도록 끝에 배치.
    appendCompositionParts()

    // 개수 지시 강조 — 모든 지시문 맨 뒤(가장 높은 salience)에 부착해 모델이 정확한 개수를 그리도록 강제.
    const countEmphasis = buildCountEmphasis(typeof prompt === 'string' ? prompt : '')
    if (countEmphasis) {
      parts.push({ text: countEmphasis })
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
    const rawVariationLevel = typeof image_variation === 'number' && Number.isFinite(image_variation)
      ? Math.max(0, Math.min(100, image_variation))
      : 33
    // 충실 모드/전체 편집은 화풍·색감·미변경 영역 유지가 목표 → 슬라이더가 높아도 temperature를 낮게 묶어 결정론적 출력 유도.
    const variationLevel = (reference_mode === 'faithful' || edit_full)
      ? Math.min(rawVariationLevel, 25)
      : rawVariationLevel
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

    // AI 업스케일 (REPLICATE_API_TOKEN 설정 시 Real-ESRGAN 2×)
    if (Deno.env.get('REPLICATE_API_TOKEN')) {
      try {
        console.log('[generate-thumbnail-image] upscaling with Replicate...')
        imageBase64 = await upscaleWithReplicate(imageBase64, mimeType)
        mimeType = 'image/png'
        console.log('[generate-thumbnail-image] upscale complete')
      } catch (e) {
        console.warn('[generate-thumbnail-image] Replicate upscale failed, using original:', (e as Error).message)
      }
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
