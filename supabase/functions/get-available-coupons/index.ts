/**
 * 사용 가능한 쿠폰 조회 Edge Function
 * 
 * @endpoint GET /get-available-coupons?user_id=xxx
 * @input user_id (query parameter)
 * @output { success: boolean, coupons: UserCoupon[] }
 * 
 * @returns
 * - is_used = false인 쿠폰만 반환
 * - discount_amount 내림차순 정렬 (최대 할인 먼저)
 * - "적용 안 함" 옵션은 프론트엔드에서 처리
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Query parameter에서 user_id 추출
    const url = new URL(req.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎟️ [쿠폰조회] 시작:', user_id);

    // user_coupons + coupons JOIN 조회
    const { data: userCoupons, error } = await supabaseClient
      .from('user_coupons')
      .select(`
        id,
        user_id,
        coupon_id,
        is_used,
        used_at,
        used_order_id,
        issued_at,
        expired_at,
        coupons:coupon_id (
          id,
          name,
          coupon_type,
          discount_amount,
          description
        )
      `)
      .eq('user_id', user_id)
      .eq('is_used', false)
      .order('issued_at', { ascending: false }); // 최근 발급된 것부터

    if (error) {
      console.error('❌ [쿠폰조회] 조회 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰 조회 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // coupons 정보 펼치기 (JOIN 결과 flat)
    const coupons = (userCoupons || []).map((uc: any) => ({
      id: uc.id,
      user_id: uc.user_id,
      coupon_id: uc.coupon_id,
      is_used: uc.is_used,
      used_at: uc.used_at,
      used_order_id: uc.used_order_id,
      issued_at: uc.issued_at,
      expired_at: uc.expired_at,
      name: uc.coupons?.name || '',
      coupon_type: uc.coupons?.coupon_type || 'amount',
      discount_amount: uc.coupons?.discount_amount || 0,
      description: uc.coupons?.description || '',
    }));

    // discount_amount 내림차순 정렬 (최대 할인 먼저)
    coupons.sort((a, b) => b.discount_amount - a.discount_amount);

    console.log('✅ [쿠폰조회] 성공:', coupons.length + '개');

    return new Response(
      JSON.stringify({ success: true, coupons }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [쿠폰조회] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});