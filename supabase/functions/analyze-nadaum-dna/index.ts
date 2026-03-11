import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    // ── Auth ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch confirmed tags ──
    const { data: tags } = await supabase
      .from('user_trait_tags')
      .select('tag_name, tag_type')
      .eq('user_id', user.id)
      .eq('is_confirmed', true);

    if (!tags || tags.length < 5) {
      return new Response(JSON.stringify({ error: 'NOT_ENOUGH_TAGS', count: tags?.length ?? 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build tag text ──
    const tagText = tags.map(t =>
      `${t.tag_name}(${t.tag_type === 'positive' ? '+' : '-'})`
    ).join(', ');

    // ── Call GPT-4.1-nano ──
    const prompt = `사용자의 성향 태그를 분석하여 6가지 성격 축의 점수(0~100)를 매겨주세요.

[성향 태그]
${tagText}

[6가지 축]
- 실행력: 추진력, 행동력, 도전, 적극성, 열정, 에너지, 과감함
- 사고력: 분석력, 논리, 전략, 통찰, 지혜, 판단력, 신중함, 체계적
- 감성: 감수성, 섬세함, 공감, 따뜻함, 예민함, 감정적, 직관적
- 관계: 사교성, 배려, 소통, 협력, 친화력, 책임감, 포용력
- 의지력: 끈기, 인내, 꾸준함, 집중, 고집, 신념, 결단, 성실함
- 안정감: 차분, 균형, 안정, 침착, 자신감, 여유, 느긋함

[규칙]
- 긍정(+)/부정(-) 태그 모두 해당 축의 특성으로 반영 (예: 예민한(-)→감성, 고집있는(-)→의지력)
- 하나의 태그가 여러 축에 걸칠 수 있음
- 태그가 적은 축도 최소 10점 부여
- JSON만 응답: {"실행력":N,"사고력":N,"감성":N,"관계":N,"의지력":N,"안정감":N}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: '성격 분석 전문가. JSON만 응답.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errText);
      throw new Error(`OpenAI error: ${openaiRes.status}`);
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content?.trim() || '';

    // ── Parse & validate ──
    const scores = JSON.parse(content);
    const axes = ['실행력', '사고력', '감성', '관계', '의지력', '안정감'];
    const radar: Record<string, number> = {};

    for (const axis of axes) {
      const val = Number(scores[axis]);
      radar[axis] = isNaN(val) ? 15 : Math.min(100, Math.max(0, Math.round(val)));
    }

    console.log(`[analyze-nadaum-dna] user=${user.id} tags=${tags.length} radar=`, radar);

    return new Response(JSON.stringify({ radar }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
