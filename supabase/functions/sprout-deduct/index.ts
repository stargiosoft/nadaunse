/**
 * 새싹 차감 처리 Edge Function
 *
 * @endpoint POST /sprout-deduct
 * @input {
 *   content_id: string,
 *   amount: number
 * }
 * @output { success: boolean, new_balance?: number, error?: string, current_balance?: number }
 *
 * @description
 * - process_sprout_deduct RPC 호출
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
    console.log('🌱 [새싹차감] 요청 수신');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 user_id 추출 (Supabase 게이트웨이가 이미 JWT 서명 검증 완료)
    let userId: string;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('sub claim missing');
      console.log('🌱 [새싹차감] 사용자 확인:', userId);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // user 객체 호환용
    const user = { id: userId };

    // 요청 본문 파싱
    const { content_id, amount } = await req.json();

    console.log('📦 [새싹차감] 입력 데이터:', {
      user_id: user.id,
      content_id,
      amount,
    });

    // 필수 필드 검증
    if (!content_id) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 필드가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Role 클라이언트 (RPC 호출용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ⭐ 서버측 콘텐츠 가격 검증 (클라이언트 amount 무시)
    const SPROUT_PRICE = 30;
    const { data: content, error: contentError } = await supabaseAdmin
      .from('master_contents')
      .select('id, content_type, status')
      .eq('id', content_id)
      .single();

    if (contentError || !content) {
      console.error('❌ [새싹차감] 콘텐츠 조회 실패:', contentError);
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 콘텐츠입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (content.content_type !== 'paid' || content.status !== 'deployed') {
      console.error('❌ [새싹차감] 유료 콘텐츠가 아니거나 미배포:', content);
      return new Response(
        JSON.stringify({ success: false, error: '차감 대상이 아닌 콘텐츠입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serverAmount = SPROUT_PRICE;
    console.log('🔍 [새싹차감] 서버 가격 검증 완료:', { content_id, serverAmount });

    // process_sprout_deduct RPC 호출 (서버 검증된 금액 사용)
    const { data, error } = await supabaseAdmin.rpc('process_sprout_deduct', {
      p_user_id: user.id,
      p_content_id: content_id,
      p_amount: serverAmount,
    });

    if (error) {
      console.error('❌ [새싹차감] RPC 호출 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: '차감 처리에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.success) {
      console.log('⚠️ [새싹차감] 잔액 부족:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error,
          current_balance: data.current_balance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [새싹차감] 성공:', {
      deducted_amount: data.deducted_amount,
      new_balance: data.balance_after,
    });

    return new Response(
      JSON.stringify({
        success: true,
        new_balance: data.balance_after,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [새싹차감] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: '차감 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
