// Supabase Edge Function: OpenAI TTS 음성 생성
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { text, voice, speed } = await req.json()

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: '텍스트를 입력해주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.trim(),
        voice: voice || 'nova',
        response_format: 'mp3',
        speed: speed || 1.0,
      }),
    })

    if (!ttsRes.ok) {
      const errText = await ttsRes.text()
      console.error('[generate-tts] OpenAI TTS error:', errText)
      return new Response(JSON.stringify({ error: `TTS API 오류: ${ttsRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const audioBuffer = await ttsRes.arrayBuffer()
    const audioBase64 = base64Encode(new Uint8Array(audioBuffer))

    return new Response(JSON.stringify({
      audio: `data:audio/mp3;base64,${audioBase64}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-tts] Error:', err)
    return new Response(JSON.stringify({ error: `TTS 생성 실패: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
