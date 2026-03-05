/**
 * 미션 완료 새싹 리워드 지급 Edge Function
 *
 * @endpoint POST /grant-mission-sprout
 * @input { user_id: string }
 * @output { success: boolean, new_balance?: number, reward_amount?: number, already_granted?: boolean }
 *
 * @description
 * - 태그 5개 달성 시 새싹 30개 즉시 지급
 * - process_mission_reward RPC 호출 (SECURITY DEFINER)
 * - JWT 검증 필요 (--no-verify-jwt 불필요)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('🌱 [미션리워드] 요청 수신');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 user_id 추출 (Supabase 게이트웨이가 이미 JWT 서명 검증 완료)
    let jwtUserId: string;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      jwtUserId = payload.sub;
      if (!jwtUserId) throw new Error('sub claim missing');
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 요청 본문 파싱
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT의 user_id와 요청 user_id 일치 확인
    if (jwtUserId !== user_id) {
      console.error('❌ [미션리워드] user_id 불일치:', { jwt: jwtUserId, request: user_id });
      return new Response(
        JSON.stringify({ success: false, error: '권한이 없습니다' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🌱 [미션리워드] 사용자:', user_id);

    // Service Role 클라이언트 (RPC 호출용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // process_mission_reward RPC 호출
    const { data, error } = await supabaseAdmin.rpc('process_mission_reward', {
      p_user_id: user_id,
    });

    if (error) {
      console.error('❌ [미션리워드] RPC 호출 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: '리워드 처리에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RPC 응답 처리
    if (!data.success) {
      if (data.already_granted) {
        console.log('ℹ️ [미션리워드] 이미 지급됨:', user_id);
        return new Response(
          JSON.stringify({ success: false, already_granted: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('❌ [미션리워드] 처리 실패:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [미션리워드] 성공:', {
      user_id,
      new_balance: data.new_balance,
      reward_amount: data.reward_amount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        new_balance: data.new_balance,
        reward_amount: data.reward_amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [미션리워드] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: '리워드 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
