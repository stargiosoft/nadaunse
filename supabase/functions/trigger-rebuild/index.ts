import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // 환경변수에서 Deploy Hook URL 읽기
    const deployHookUrl = Deno.env.get('VERCEL_DEPLOY_HOOK_URL');
    if (!deployHookUrl) {
      console.error('❌ VERCEL_DEPLOY_HOOK_URL 환경변수가 설정되지 않았습니다.');
      return new Response(JSON.stringify({ error: 'Deploy hook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vercel Deploy Hook 호출 (POST, 빈 body)
    const response = await fetch(deployHookUrl, { method: 'POST' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vercel Deploy Hook 호출 실패:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Deploy hook call failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Vercel 재빌드 트리거 완료');
    return new Response(JSON.stringify({
      success: true,
      message: 'Rebuild triggered',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🚨 trigger-rebuild 에러:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
