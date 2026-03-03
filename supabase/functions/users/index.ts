// Supabase Edge Function: 사용자 조회/생성 API
// RLS 대신 Edge Function에서 권한 검증

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

interface UserData {
  email?: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  nickname?: string;
  profile_image?: string;
}

interface RequestBody {
  action: 'get_or_create' | 'get' | 'create';
  user_data?: UserData;
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // 1️⃣ Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization 헤더가 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 2️⃣ Supabase Client 생성 (service_role 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3️⃣ JWT 검증 (토큰으로 사용자 확인)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ JWT 검증 실패:', authError);
      return new Response(
        JSON.stringify({ error: '유효하지 않은 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ JWT 검증 성공 - User ID:', user.id);
    console.log('📧 이메일:', user.email);

    // 4️⃣ 요청 본문 파싱
    const body: RequestBody = await req.json();
    const { action, user_data } = body;

    console.log('📦 요청 액션:', action);
    console.log('📦 사용자 데이터:', user_data);

    // 5️⃣ 액션에 따라 처리
    if (action === 'get' || action === 'get_or_create') {
      // 사용자 조회
      const { data: existingUser, error: queryError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (queryError) {
        console.error('❌ 사용자 조회 실패:', queryError);
        return new Response(
          JSON.stringify({ error: '사용자 조회 실패', details: queryError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 사용자가 이미 존재하면 반환
      if (existingUser) {
        console.log('✅ 기존 사용자 발견:', existingUser);
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: existingUser.id,
              email: existingUser.email,
              nickname: existingUser.nickname,
              provider: existingUser.provider,
              provider_id: existingUser.provider_id,
              profile_image: existingUser.profile_image,
              is_new: false,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 사용자가 없고 action이 'get'이면 404 반환
      if (action === 'get') {
        return new Response(
          JSON.stringify({ error: '사용자를 찾을 수 없습니다.', is_new: true }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // action이 'get_or_create'면 신규 생성
      console.log('⚠️ 사용자 없음 → 신규 생성 시작');
    }

    // 6️⃣ 신규 사용자 생성 (action === 'create' 또는 'get_or_create'에서 사용자 없을 때)
    if (action === 'create' || action === 'get_or_create') {
      if (!user_data) {
        return new Response(
          JSON.stringify({ error: 'user_data가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // nickname 우선순위: user_data.nickname > user_data.name > email 앞부분
      const nickname = user_data.nickname || 
                      user_data.name || 
                      user.email?.split('@')[0] || 
                      '사용자';

      // profile_image 우선순위: user_data.profile_image > user_data.avatar_url
      const profile_image = user_data.profile_image || user_data.avatar_url || '';

      // 레퍼럴 코드 생성 (NDS-{랜덤6자})
      const randomBytes = new Uint8Array(6);
      crypto.getRandomValues(randomBytes);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const referralCode = 'NDS-' + Array.from(randomBytes).map(b => chars[b % chars.length]).join('');

      const newUserData = {
        id: user.id,
        email: user.email || user_data.email,
        nickname: nickname,
        provider: user_data.provider || user.app_metadata?.provider || 'google',
        provider_id: user.id, // auth.users.id를 provider_id로 사용
        profile_image: profile_image,
        referral_code: referralCode,
        // sprout_balance: 컬럼 DEFAULT 사용 (ALTER TABLE users ALTER COLUMN sprout_balance SET DEFAULT X;)
        created_at: new Date().toISOString(),
      };

      console.log('📝 신규 사용자 데이터:', newUserData);

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ 사용자 생성 실패:', insertError);
        return new Response(
          JSON.stringify({ error: '사용자 생성 실패', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ 신규 사용자 생성 완료:', newUser);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            nickname: newUser.nickname,
            provider: newUser.provider,
            provider_id: newUser.provider_id,
            profile_image: newUser.profile_image,
            is_new: true,
          },
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 지원하지 않는 액션
    return new Response(
      JSON.stringify({ error: '지원하지 않는 액션입니다.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🚨 Edge Function 에러:', error);
    return new Response(
      JSON.stringify({ error: '서버 에러가 발생했습니다.', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
