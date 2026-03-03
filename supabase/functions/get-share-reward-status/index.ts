/**
 * 공유 리워드 상태 조회 Edge Function
 *
 * @endpoint POST /get-share-reward-status
 * @input (없음, JWT에서 user_id 추출)
 * @output {
 *   success: boolean,
 *   referralCode: string,
 *   currentRound: number,
 *   requiredCount: number,
 *   currentCount: number,
 *   totalRewardsEarned: number,
 *   totalFriendsReferred: number
 * }
 *
 * @description
 * - 공유 모달 열 때, 리워드 안내 페이지 진입 시 호출
 * - JWT 검증 필요
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('📊 [리워드상태] 요청 수신');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 user_id 추출
    let userId: string;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('sub claim missing');
      console.log('📊 [리워드상태] 사용자:', userId);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Role 클라이언트
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. 사용자의 referral_code 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ [리워드상태] 사용자 조회 실패:', userError);
      return new Response(
        JSON.stringify({ success: false, error: '사용자를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 현재 진행 중인 회차 조회
    const { data: activeRound, error: roundError } = await supabaseAdmin
      .from('share_rewards')
      .select('round, required_count, current_count')
      .eq('user_id', userId)
      .is('achieved_at', null)
      .order('round')
      .limit(1)
      .maybeSingle();

    if (roundError) {
      console.error('❌ [리워드상태] 회차 조회 실패:', roundError);
      return new Response(
        JSON.stringify({ success: false, error: '리워드 상태 조회에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 총 달성 리워드 계산
    const { data: completedRounds, error: completedError } = await supabaseAdmin
      .from('share_rewards')
      .select('sprout_amount')
      .eq('user_id', userId)
      .not('achieved_at', 'is', null);

    if (completedError) {
      console.error('❌ [리워드상태] 달성 조회 실패:', completedError);
    }

    const totalRewardsEarned = (completedRounds || []).reduce(
      (sum: number, r: { sprout_amount: number }) => sum + r.sprout_amount, 0
    );

    // 4. 총 추천 친구 수
    const { count: totalFriendsReferred, error: countError } = await supabaseAdmin
      .from('referral_signups')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId);

    if (countError) {
      console.error('❌ [리워드상태] 친구 수 조회 실패:', countError);
    }

    // 진행 중인 회차가 없으면 1회차 기본값
    const currentRound = activeRound?.round ?? 1;
    const requiredCount = activeRound?.required_count ?? 1;
    const currentCount = activeRound?.current_count ?? 0;

    console.log('✅ [리워드상태] 조회 완료:', {
      referralCode: userData.referral_code,
      currentRound,
      requiredCount,
      currentCount,
      totalRewardsEarned,
      totalFriendsReferred: totalFriendsReferred ?? 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        referralCode: userData.referral_code,
        currentRound,
        requiredCount,
        currentCount,
        totalRewardsEarned,
        totalFriendsReferred: totalFriendsReferred ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [리워드상태] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: '리워드 상태 조회 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
