/**
 * GA API 통계 조회 Edge Function
 * Google Analytics Data API를 통해 활성 사용자 수 조회
 *
 * 환경변수:
 * - GA_SERVICE_ACCOUNT_JSON: 서비스 계정 JSON 키 (Supabase Secrets에 저장)
 * - GA_PROPERTY_ID: GA4 속성 ID (예: 520025356)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../server/cors.ts';

// JWT 생성을 위한 base64url 인코딩
function base64urlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 텍스트를 base64url로 인코딩
function textToBase64url(text: string): string {
  return base64urlEncode(new TextEncoder().encode(text));
}

// PEM 형식 개인키에서 바이너리 추출
function pemToBinary(pem: string): Uint8Array {
  const lines = pem.split('\n');
  const base64 = lines
    .filter(line => !line.startsWith('-----'))
    .join('');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// JWT 서명 생성
async function signJwt(
  header: object,
  payload: object,
  privateKeyPem: string
): Promise<string> {
  const headerB64 = textToBase64url(JSON.stringify(header));
  const payloadB64 = textToBase64url(JSON.stringify(payload));
  const signInput = `${headerB64}.${payloadB64}`;

  // PEM에서 개인키 추출 및 임포트
  const keyData = pemToBinary(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 서명
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  return `${signInput}.${signatureB64}`;
}

// Google OAuth 토큰 발급
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const credentials = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1시간 유효
  };

  const jwt = await signJwt(header, payload, credentials.private_key);

  // 토큰 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`토큰 발급 실패: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// GA Data API 호출 - 실시간 활성 사용자
async function getRealtimeActiveUsers(
  accessToken: string,
  propertyId: string
): Promise<number> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // 응답에서 활성 사용자 수 추출
  if (data.rows && data.rows.length > 0) {
    return parseInt(data.rows[0].metricValues[0].value, 10);
  }

  return 0;
}

// GA Data API 호출 - 기간별 활성 사용자
async function getActiveUsers(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ activeUsers: number; newUsers: number; averageEngagementTime: number }> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'userEngagementDuration' },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.rows && data.rows.length > 0) {
    const activeUsers = parseInt(data.rows[0].metricValues[0].value, 10);
    const newUsers = parseInt(data.rows[0].metricValues[1].value, 10);
    const totalEngagementSeconds = parseFloat(data.rows[0].metricValues[2].value);
    // 활성 사용자당 평균 참여 시간 (초)
    const averageEngagementTime = activeUsers > 0 ? Math.round(totalEngagementSeconds / activeUsers) : 0;
    return { activeUsers, newUsers, averageEngagementTime };
  }

  return { activeUsers: 0, newUsers: 0, averageEngagementTime: 0 };
}

// GA Data API 호출 - 특정 페이지 조회수 (무료 운세 결과)
async function getFreeResultPageViews(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ pageViews: number; pageViewsPerUser: number }> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'screenPageViewsPerUser' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pageTitle',
            stringFilter: {
              matchType: 'CONTAINS',
              value: '무료 운세 결과',
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA 페이지 조회수 API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.rows && data.rows.length > 0) {
    // 여러 행이 있을 수 있으므로 합산
    let totalPageViews = 0;
    let totalPageViewsPerUser = 0;
    let rowCount = 0;

    for (const row of data.rows) {
      totalPageViews += parseInt(row.metricValues[0].value, 10);
      totalPageViewsPerUser += parseFloat(row.metricValues[1].value);
      rowCount++;
    }

    // 1인당 조회수는 평균
    const pageViewsPerUser = rowCount > 0 ? Math.round(totalPageViewsPerUser / rowCount * 100) / 100 : 0;
    return { pageViews: totalPageViews, pageViewsPerUser };
  }

  return { pageViews: 0, pageViewsPerUser: 0 };
}

// GA Data API 호출 - 구매 퍼널 페이지뷰 (유료 상세 + 결제 페이지)
async function getPurchaseFunnelPageViews(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ paidDetailViews: number; paymentViews: number }> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'pageTitle',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: '유료 콘텐츠 상세 | 나다운세',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'pageTitle',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: '결제 | 나다운세',
                  },
                },
              },
            ],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA 구매 퍼널 API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  let paidDetailViews = 0;
  let paymentViews = 0;

  if (data.rows && data.rows.length > 0) {
    for (const row of data.rows) {
      const title = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      if (title === '유료 콘텐츠 상세 | 나다운세') {
        paidDetailViews = views;
      } else if (title === '결제 | 나다운세') {
        paymentViews = views;
      }
    }
  }

  return { paidDetailViews, paymentViews };
}

// GA Data API 호출 - 일별 데이터
interface DailyGAData {
  date: string;  // YYYYMMDD 형식
  activeUsers: number;
  newUsers: number;
  averageEngagementTime: number;
}

async function getDailyActiveUsers(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<DailyGAData[]> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'userEngagementDuration' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const dailyData: DailyGAData[] = [];

  if (data.rows && data.rows.length > 0) {
    for (const row of data.rows) {
      const date = row.dimensionValues[0].value;
      const activeUsers = parseInt(row.metricValues[0].value, 10);
      const newUsers = parseInt(row.metricValues[1].value, 10);
      const totalEngagementSeconds = parseFloat(row.metricValues[2].value);
      const averageEngagementTime = activeUsers > 0 ? Math.round(totalEngagementSeconds / activeUsers) : 0;

      dailyData.push({
        date,
        activeUsers,
        newUsers,
        averageEngagementTime,
      });
    }
  }

  return dailyData;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // 환경변수에서 자격 증명 가져오기
    const serviceAccountJson = Deno.env.get('GA_SERVICE_ACCOUNT_JSON');
    const propertyId = Deno.env.get('GA_PROPERTY_ID') || '520025356';

    if (!serviceAccountJson) {
      console.error('GA_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않음');
      return errorResponse(req, 'GA 연동이 설정되지 않았습니다.', 500);
    }

    // 요청 파라미터 파싱
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'realtime'; // realtime | period | daily
    const startDate = url.searchParams.get('startDate') || '7daysAgo';
    const endDate = url.searchParams.get('endDate') || 'today';

    // OAuth 토큰 발급
    const accessToken = await getAccessToken(serviceAccountJson);

    let result;
    if (type === 'realtime') {
      const realtimeUsers = await getRealtimeActiveUsers(accessToken, propertyId);
      result = {
        success: true,
        type: 'realtime',
        realtimeActiveUsers: realtimeUsers,
      };
    } else if (type === 'daily') {
      // 일별 데이터 조회
      const dailyData = await getDailyActiveUsers(accessToken, propertyId, startDate, endDate);
      result = {
        success: true,
        type: 'daily',
        startDate,
        endDate,
        data: dailyData,
      };
    } else if (type === 'purchase_funnel') {
      // 구매 퍼널 페이지뷰 조회
      const funnelData = await getPurchaseFunnelPageViews(accessToken, propertyId, startDate, endDate);
      result = {
        success: true,
        type: 'purchase_funnel',
        startDate,
        endDate,
        ...funnelData,
      };
    } else {
      // 기간별 데이터와 페이지 조회수를 병렬로 조회
      const [periodData, pageData] = await Promise.all([
        getActiveUsers(accessToken, propertyId, startDate, endDate),
        getFreeResultPageViews(accessToken, propertyId, startDate, endDate),
      ]);
      result = {
        success: true,
        type: 'period',
        startDate,
        endDate,
        ...periodData,
        freeResultPageViews: pageData.pageViews,
        freeResultPageViewsPerUser: pageData.pageViewsPerUser,
      };
    }

    return jsonResponse(req, result);
  } catch (error) {
    console.error('GA 통계 조회 오류:', error);
    return errorResponse(
      req,
      error instanceof Error ? error.message : 'GA 통계 조회에 실패했습니다.',
      500
    );
  }
});
