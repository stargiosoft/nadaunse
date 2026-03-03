/**
 * 레퍼럴 처리 Edge Function
 *
 * @endpoint POST /process-referral
 * @input {
 *   referral_code: string,
 *   ip_fingerprint?: string
 * }
 * @output { success: boolean, reward_granted?: boolean, error?: string }
 *
 * @description
 * - User B 회원가입 완료 시 AuthCallback에서 호출
 * - referral_code → referrer_id 조회 → process_share_reward RPC 호출
 * - JWT 검증 필요 (User B의 토큰)
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
    console.log('🔗 [레퍼럴] 요청 수신');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 user_id 추출 (피추천인 = User B)
    let referredId: string;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      referredId = payload.sub;
      if (!referredId) throw new Error('sub claim missing');
      console.log('🔗 [레퍼럴] 피추천인(User B):', referredId);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 요청 본문 파싱
    const { referral_code, ip_fingerprint } = await req.json();

    console.log('📦 [레퍼럴] 입력 데이터:', {
      referred_id: referredId,
      referral_code,
      has_fingerprint: !!ip_fingerprint,
    });

    // 필수 필드 검증
    if (!referral_code || typeof referral_code !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: '레퍼럴 코드가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Role 클라이언트
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // referral_code → referrer_id 조회
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', referral_code.trim())
      .maybeSingle();

    if (referrerError) {
      console.error('❌ [레퍼럴] 추천인 조회 실패:', referrerError);
      return new Response(
        JSON.stringify({ success: false, error: '처리 중 오류가 발생했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!referrer) {
      console.log('⚠️ [레퍼럴] 유효하지 않은 레퍼럴 코드:', referral_code);
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_REFERRAL_CODE' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔗 [레퍼럴] 추천인(User A):', referrer.id);

    // process_share_reward RPC 호출
    const { data, error } = await supabaseAdmin.rpc('process_share_reward', {
      p_referrer_id: referrer.id,
      p_referred_id: referredId,
      p_ip_fingerprint: ip_fingerprint || null,
    });

    if (error) {
      console.error('❌ [레퍼럴] RPC 호출 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: '리워드 처리에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.success) {
      console.log('⚠️ [레퍼럴] 처리 거부:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [레퍼럴] 처리 완료:', {
      reward_granted: data.reward_granted,
      current_round: data.current_round,
      current_count: data.current_count,
      required_count: data.required_count,
    });

    return new Response(
      JSON.stringify({
        success: true,
        reward_granted: data.reward_granted,
        current_round: data.current_round,
        current_count: data.current_count,
        required_count: data.required_count,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [레퍼럴] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: '레퍼럴 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
