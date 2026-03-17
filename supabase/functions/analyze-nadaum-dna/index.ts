import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';
import {
  computeRadarScores,
  RADAR_AXES,
  AXIS_FLOWER_MAP,
  getTagPolarity,
  type RadarAxis,
} from '../server/traitTagData.ts';

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
      .select('tag_name, tag_type, created_at')
      .eq('user_id', user.id)
      .eq('is_confirmed', true)
      .order('created_at', { ascending: false });

    if (!tags || tags.length < 5) {
      return new Response(JSON.stringify({ error: 'NOT_ENOUGH_TAGS', count: tags?.length ?? 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 1. 레이더 점수 (룰베이스) ──
    const radar = computeRadarScores(tags);

    // ── 2. 꽃 선택 (최고 축 → 꽃) ──
    let topAxis: RadarAxis = '실행력';
    let topScore = 0;
    for (const axis of RADAR_AXES) {
      if (radar[axis] > topScore) {
        topScore = radar[axis];
        topAxis = axis;
      }
    }
    const flower = AXIS_FLOWER_MAP[topAxis];

    // 꽃 톤: 긍정/부정 비율 기반
    const positiveCount = tags.filter(t => t.tag_type === 'positive').length;
    const positiveRatio = positiveCount / tags.length;
    const flowerTone = positiveRatio > 0.7 ? '화사한'
      : positiveRatio > 0.5 ? '따뜻한'
      : positiveRatio > 0.3 ? '깊은'
      : '복합적인';

    // ── 3. 뿌리/줄기/꽃잎 (빈도 + 최근순) ──
    // 빈도 집계
    const freqMap = new Map<string, number>();
    for (const t of tags) {
      if (t.tag_name === '__SKIPPED__') continue;
      freqMap.set(t.tag_name, (freqMap.get(t.tag_name) || 0) + 1);
    }

    const byFreq = [...freqMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // 뿌리: 빈도 top 2
    const roots = byFreq.slice(0, 2);

    // 줄기: 빈도 3~5위
    const stems = byFreq.slice(2, 5);

    // 꽃잎: 최근 태그 중 뿌리/줄기에 없는 것 2~3개
    const usedSet = new Set([...roots, ...stems]);
    const recentSeen = new Set<string>();
    const petals: string[] = [];
    for (const t of tags) {
      if (t.tag_name === '__SKIPPED__') continue;
      if (!usedSet.has(t.tag_name) && !recentSeen.has(t.tag_name)) {
        recentSeen.add(t.tag_name);
        petals.push(t.tag_name);
        if (petals.length >= 3) break;
      }
    }

    const flowerData = {
      flower,
      flower_tone: flowerTone,
      roots,
      stems,
      petals,
    };

    console.log(`[analyze-nadaum-dna] user=${user.id} tags=${tags.length} method=rule-based radar=`, radar, 'flower=', flower);

    return new Response(JSON.stringify({ radar, flower_data: flowerData, method: 'rule-based' }), {
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
