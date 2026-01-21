// Supabase Edge Function: 마스터 콘텐츠 생성 API
// RLS 대신 Edge Function에서 권한 검증 및 데이터 생성

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

interface ContentData {
  content_type: 'paid' | 'free';
  category_main: string;
  category_sub: string;
  title: string;
  questioner_info?: string | null;
  description?: string | null;
  user_concern?: string | null;
  price_original: number;
  price_discount: number;
  discount_rate: number;
  status?: string;
  view_count?: number;
  weekly_clicks?: number;
}

interface QuestionData {
  question_order: number;
  question_text: string;
  question_type: 'saju' | 'tarot';
}

interface RequestBody {
  action: 'create';
  content_data: ContentData;
  questions: QuestionData[];
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
    const { action, content_data, questions } = body;

    console.log('📦 요청 액션:', action);
    console.log('📦 콘텐츠 데이터:', content_data);
    console.log('📦 질문 데이터:', questions);

    // 5️⃣ 액션에 따라 처리
    if (action === 'create') {
      // 입력 검증
      if (!content_data) {
        return new Response(
          JSON.stringify({ error: 'content_data가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!questions || questions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'questions가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 기본값 설정
      const insertData = {
        ...content_data,
        status: content_data.status || 'loading',
        view_count: content_data.view_count || 0,
        weekly_clicks: content_data.weekly_clicks || 0,
      };

      console.log('📝 마스터 콘텐츠 데이터:', insertData);

      // 6️⃣ master_contents 테이블에 삽입 (service_role로 RLS 우회)
      const { data: contentData, error: contentError } = await supabaseAdmin
        .from('master_contents')
        .insert([insertData])
        .select()
        .single();

      if (contentError) {
        console.error('❌ 콘텐츠 저장 실패:', contentError);
        return new Response(
          JSON.stringify({ 
            error: '콘텐츠 저장 실패', 
            details: contentError.message,
            code: contentError.code 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ 콘텐츠 저장 완료:', contentData);

      // 7️⃣ master_content_questions 테이블에 질문들 삽입
      const questionInserts = questions.map((q) => ({
        content_id: contentData.id,
        question_order: q.question_order,
        question_text: q.question_text,
        question_type: q.question_type,
      }));

      console.log('📝 질문 데이터:', questionInserts);

      const { error: questionsError } = await supabaseAdmin
        .from('master_content_questions')
        .insert(questionInserts);

      if (questionsError) {
        console.error('❌ 질문 저장 실패:', questionsError);
        
        // 질문 저장 실패 시 콘텐츠도 삭제 (롤백)
        await supabaseAdmin
          .from('master_contents')
          .delete()
          .eq('id', contentData.id);

        return new Response(
          JSON.stringify({ 
            error: '질문 저장 실패', 
            details: questionsError.message,
            code: questionsError.code 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ 질문 저장 완료');

      // 8️⃣ 성공 응답
      return new Response(
        JSON.stringify({
          success: true,
          content: contentData,
          message: '마스터 콘텐츠가 성공적으로 생성되었습니다.',
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
