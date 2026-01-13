import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // ⭐ source_order_id 추가
    const { user_id, source_order_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ source_order_id 필수 체크
    if (!source_order_id) {
      return new Response(
        JSON.stringify({ error: 'source_order_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. coupons 테이블에서 '재방문 쿠폰' 조회
    const { data: couponData, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'revisit')
      .single();

    if (couponError || !couponData) {
      console.error('쿠폰 조회 실패:', couponError);
      return new Response(
        JSON.stringify({ error: '재구매 쿠폰을 찾을 수 없습니다' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 2. 중복 발급 체크: 같은 주문으로 이미 발급받았는지 확인
    const { data: existingCoupon, error: checkError } = await supabaseClient
      .from('user_coupons')
      .select('id')
      .eq('user_id', user_id)
      .eq('coupon_id', couponData.id)
      .eq('source_order_id', source_order_id)
      .maybeSingle();

    if (checkError) {
      console.error('쿠폰 중복 체크 실패:', checkError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급 확인에 실패했습니다' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 3. 이미 발급된 경우
    if (existingCoupon) {
      console.log(`이미 발급된 쿠폰: user_id=${user_id}, source_order_id=${source_order_id}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '이 주문에 대한 쿠폰이 이미 발급되었습니다',
          alreadyIssued: true 
        }),
        { 
          status: 409, // 409 Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 4. 새로 발급 (source_order_id 포함)
    const { data: userCoupon, error: insertError } = await supabaseClient
      .from('user_coupons')
      .insert({
        user_id: user_id,
        coupon_id: couponData.id,
        source_order_id: source_order_id, // ⭐ 추가!
        is_used: false,
        expired_at: null, // 유효기간 없음
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('쿠폰 발급 실패:', insertError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급에 실패했습니다' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ 재구매 쿠폰 발급 완료:', userCoupon);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coupon: userCoupon,
        message: '쿠폰이 발급되었습니다'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
