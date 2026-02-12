import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

const INDEXNOW_API_URL = 'https://api.indexnow.org/indexnow';
const SITE_HOST = 'nadaunse.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // IndexNow API 키 (환경변수)
    const apiKey = Deno.env.get('INDEXNOW_API_KEY');
    if (!apiKey) {
      console.error('INDEXNOW_API_KEY 환경변수가 설정되지 않았습니다.');
      return new Response(JSON.stringify({ error: 'IndexNow API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 요청 바디에서 URL 목록 추출
    const body = await req.json();
    const { urls } = body as { urls?: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'urls 배열이 필요합니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // URL 목록 정규화 (상대 경로 → 절대 URL)
    const absoluteUrls = urls.map((url) =>
      url.startsWith('http') ? url : `https://${SITE_HOST}${url.startsWith('/') ? '' : '/'}${url}`
    );

    // IndexNow API 호출
    const indexNowPayload = {
      host: SITE_HOST,
      key: apiKey,
      keyLocation: `https://${SITE_HOST}/${apiKey}.txt`,
      urlList: absoluteUrls,
    };

    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indexNowPayload),
    });

    const statusCode = response.status;

    // IndexNow 응답 코드 해석
    // 200: OK, 202: Accepted, 400: Bad request, 403: Forbidden, 422: Unprocessable, 429: Too many requests
    if (statusCode === 200 || statusCode === 202) {
      console.log(`IndexNow 전송 성공: ${absoluteUrls.length}개 URL (status: ${statusCode})`);
      return new Response(JSON.stringify({
        success: true,
        submitted: absoluteUrls.length,
        urls: absoluteUrls,
        status: statusCode,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const errorText = await response.text();
    console.error(`IndexNow API 오류: status=${statusCode}, body=${errorText}`);
    return new Response(JSON.stringify({
      success: false,
      error: `IndexNow API returned ${statusCode}`,
      submitted: 0,
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('index-now 에러:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
