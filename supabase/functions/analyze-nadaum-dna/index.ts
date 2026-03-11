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

    // ── Fetch confirmed tags (with created_at for recency) ──
    const { data: tags } = await supabase
      .from('user_trait_tags')
      .select('tag_name, tag_type, created_at')
      .eq('user_id', user.id)
      .eq('is_confirmed', true)
      .order('created_at', { ascending: false });

    if (!tags || tags.length < 5) {
      return new Response(JSON.stringify({ error: 'NOT_ENOUGH_TAGS', count: tags?.length ?? 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build tag data for AI ──
    // 빈도 집계
    const freqMap = new Map<string, { count: number; type: string }>();
    for (const t of tags) {
      const existing = freqMap.get(t.tag_name);
      if (existing) {
        existing.count++;
      } else {
        freqMap.set(t.tag_name, { count: 1, type: t.tag_type });
      }
    }
    const freqList = [...freqMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, info]) => `${name}(${info.type === 'positive' ? '+' : '-'}, ${info.count}회)`)
      .join(', ');

    // 최근 태그 (중복 제거, 최신 5개)
    const recentSeen = new Set<string>();
    const recentTags: string[] = [];
    for (const t of tags) {
      if (!recentSeen.has(t.tag_name)) {
        recentSeen.add(t.tag_name);
        recentTags.push(t.tag_name);
        if (recentTags.length >= 5) break;
      }
    }

    // 긍정/부정 비율
    const positiveCount = tags.filter(t => t.tag_type === 'positive').length;
    const negativeCount = tags.filter(t => t.tag_type === 'negative').length;

    // ── Call GPT-4.1-mini ──
    const prompt = `사용자의 성향 태그를 분석하여 아래 두 가지를 모두 수행하세요.

## 1. 6축 성격 점수 (0~100)
[6가지 축]
- 실행력: 추진력, 행동력, 도전, 적극성, 열정, 에너지, 과감함
- 사고력: 분석력, 논리, 전략, 통찰, 지혜, 판단력, 신중함, 체계적
- 감성: 감수성, 섬세함, 공감, 따뜻함, 예민함, 감정적, 직관적
- 관계: 사교성, 배려, 소통, 협력, 친화력, 책임감, 포용력
- 의지력: 끈기, 인내, 꾸준함, 집중, 고집, 신념, 결단, 성실함
- 안정감: 차분, 균형, 안정, 침착, 자신감, 여유, 느긋함

## 2. 나다움 꽃 분석
6가지 꽃 중 이 사람에게 가장 어울리는 꽃 1개를 골라주세요:
- 해바라기: 실행력과 열정이 강한, 빛을 향해 나아가는 사람
- 라벤더: 사고력과 통찰이 깊은, 조용히 향기를 품은 사람
- 장미: 감성이 풍부한, 감정의 깊이로 세상을 물들이는 사람
- 벚꽃: 관계를 중시하는, 주변을 환하게 밝히는 사람
- 매화: 의지력이 강한, 추위 속에서도 피어나는 사람
- 연꽃: 안정감 있는, 고요한 물 위에 피어오르는 사람

그리고 태그를 3개 층으로 분류해주세요:
- 뿌리(roots): 빈도가 높고 이 사람의 변하지 않는 본질을 대표하는 태그 2개
- 줄기(stems): 본질을 지탱하는 중간 빈도의 성향 태그 3개
- 꽃잎(petals): 최근 새로 나타난 변화하는 모습의 태그 2~3개

[사용자 태그 (빈도순)]
${freqList}

[최근 태그 (최신순)]
${recentTags.join(', ')}

[태그 통계]
총 ${tags.length}개 (긍정 ${positiveCount}, 부정 ${negativeCount})

[규칙]
- 긍정(+)/부정(-) 태그 모두 해당 축의 특성으로 반영
- 하나의 태그가 여러 축에 걸칠 수 있음
- 태그가 적은 축도 최소 10점 부여
- 꽃은 6축 점수만이 아니라 태그의 전체적 뉘앙스를 종합 판단
- 뿌리/줄기/꽃잎은 반드시 실제 존재하는 태그명만 사용
- JSON만 응답, 아래 형식 정확히 준수:

{"radar":{"실행력":N,"사고력":N,"감성":N,"관계":N,"의지력":N,"안정감":N},"flower":"꽃이름","flower_tone":"화사한|따뜻한|깊은|복합적인","roots":["태그1","태그2"],"stems":["태그1","태그2","태그3"],"petals":["태그1","태그2"]}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: '성격 분석 전문가. JSON만 응답.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
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
    const parsed = JSON.parse(content);
    const radarRaw = parsed.radar || parsed;
    const axes = ['실행력', '사고력', '감성', '관계', '의지력', '안정감'];
    const radar: Record<string, number> = {};

    for (const axis of axes) {
      const val = Number(radarRaw[axis]);
      radar[axis] = isNaN(val) ? 15 : Math.min(100, Math.max(0, Math.round(val)));
    }

    // 꽃 데이터 검증
    const validFlowers = ['해바라기', '라벤더', '장미', '벚꽃', '매화', '연꽃'];
    const flower = validFlowers.includes(parsed.flower) ? parsed.flower : null;
    const validTones = ['화사한', '따뜻한', '깊은', '복합적인'];
    const flowerTone = validTones.includes(parsed.flower_tone) ? parsed.flower_tone : null;

    // 태그 유효성 검증 (실제 존재하는 태그만)
    const allTagNames = new Set(tags.map(t => t.tag_name));
    const validateTags = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((t): t is string => typeof t === 'string' && allTagNames.has(t));
    };

    const flowerData = flower ? {
      flower,
      flower_tone: flowerTone,
      roots: validateTags(parsed.roots),
      stems: validateTags(parsed.stems),
      petals: validateTags(parsed.petals),
    } : null;

    console.log(`[analyze-nadaum-dna] user=${user.id} tags=${tags.length} radar=`, radar, 'flower=', flowerData);

    return new Response(JSON.stringify({ radar, flower_data: flowerData }), {
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
