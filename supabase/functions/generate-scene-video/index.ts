// Supabase Edge Function: fal.ai Image-to-Video (씬별 AI 영상 생성)
// submit → request_id 반환, poll → 상태/결과 반환
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const MODEL_IDS: Record<string, string> = {
  kling: 'fal-ai/kling-video/v2/master/image-to-video',
  minimax: 'fal-ai/minimax-video/image-to-video',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const corsHeaders = getCorsHeaders(req)
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

  try {
    const body = await req.json()
    const { action, model } = body

    const falKey = Deno.env.get('FAL_KEY')
    if (!falKey) {
      return new Response(JSON.stringify({ error: 'FAL_KEY not configured' }), {
        status: 500, headers: jsonHeaders,
      })
    }

    const modelId = MODEL_IDS[model || 'kling'] || MODEL_IDS.kling

    // ── Submit: 이미지 → fal.ai 큐에 제출 → request_id 반환 ──
    if (action === 'submit') {
      const { image_data_url, prompt } = body

      if (!image_data_url) {
        return new Response(JSON.stringify({ error: 'image_data_url 필수' }), {
          status: 400, headers: jsonHeaders,
        })
      }

      const falBody: Record<string, unknown> = {
        image_url: image_data_url,
        prompt: prompt || 'Subtle cinematic motion with gentle zoom and smooth camera drift',
        duration: '5',
        aspect_ratio: '9:16',
      }

      console.log(`[generate-scene-video] Submitting to ${modelId}`)

      const res = await fetch(`https://queue.fal.run/${modelId}`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(falBody),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error(`[generate-scene-video] Submit error: ${res.status}`, errText.slice(0, 300))
        return new Response(JSON.stringify({ error: `fal.ai 제출 실패: ${res.status}` }), {
          status: 502, headers: jsonHeaders,
        })
      }

      const data = await res.json()
      console.log(`[generate-scene-video] Submitted: request_id=${data.request_id}`)

      return new Response(JSON.stringify({
        request_id: data.request_id,
      }), { headers: jsonHeaders })
    }

    // ── Poll: 상태 확인, COMPLETED 시 video_url 반환 ──
    if (action === 'poll') {
      const { request_id } = body

      if (!request_id) {
        return new Response(JSON.stringify({ error: 'request_id 필수' }), {
          status: 400, headers: jsonHeaders,
        })
      }

      // 상태 체크
      const statusRes = await fetch(
        `https://queue.fal.run/${modelId}/requests/${request_id}/status`,
        { headers: { Authorization: `Key ${falKey}` } },
      )

      if (!statusRes.ok) {
        const errText = await statusRes.text()
        console.error(`[generate-scene-video] Status check error: ${statusRes.status}`, errText.slice(0, 200))
        return new Response(JSON.stringify({ error: `상태 확인 실패: ${statusRes.status}` }), {
          status: 502, headers: jsonHeaders,
        })
      }

      const statusData = await statusRes.json()

      if (statusData.status === 'COMPLETED') {
        // 결과 가져오기
        const resultRes = await fetch(
          `https://queue.fal.run/${modelId}/requests/${request_id}`,
          { headers: { Authorization: `Key ${falKey}` } },
        )

        if (!resultRes.ok) {
          return new Response(JSON.stringify({ error: '결과 조회 실패' }), {
            status: 502, headers: jsonHeaders,
          })
        }

        const resultData = await resultRes.json()
        const videoUrl = resultData?.video?.url

        console.log(`[generate-scene-video] Completed: ${request_id}, video_url=${videoUrl ? 'yes' : 'no'}`)

        return new Response(JSON.stringify({
          status: 'COMPLETED',
          video_url: videoUrl,
        }), { headers: jsonHeaders })
      }

      if (statusData.status === 'FAILED') {
        console.error(`[generate-scene-video] Failed: ${request_id}`)
        return new Response(JSON.stringify({
          status: 'FAILED',
          error: statusData.error || '영상 생성 실패',
        }), { headers: jsonHeaders })
      }

      // IN_QUEUE or IN_PROGRESS
      return new Response(JSON.stringify({
        status: statusData.status,
        queue_position: statusData.queue_position,
      }), { headers: jsonHeaders })
    }

    return new Response(JSON.stringify({ error: 'action은 "submit" 또는 "poll"이어야 합니다' }), {
      status: 400, headers: jsonHeaders,
    })

  } catch (err) {
    console.error('[generate-scene-video] Error:', err)
    return new Response(JSON.stringify({ error: `영상 생성 오류: ${(err as Error).message}` }), {
      status: 500, headers: jsonHeaders,
    })
  }
})
