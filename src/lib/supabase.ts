import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { isTestMode, getTestUser, getTestSession } from './testAuth';
import { logger } from './logger';
import { fetchWithRetry } from './fetchWithRetry';

// VITE_SUPABASE_URL이 있으면 사용 (로컬 Docker 등), 없으면 projectId 기반 URL 생성
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

export { supabaseUrl, supabaseKey };

// ⭐ 싱글톤 패턴: window 객체에 저장하여 HMR에도 살아남도록 함
declare global {
  interface Window {
    _supabaseClient?: ReturnType<typeof createClient>;
  }
}

let clientInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  // 1순위: 모듈 스코프 변수 확인
  if (clientInstance) {
    return clientInstance;
  }

  // 2순위: window 객체 확인 (HMR 대응)
  if (typeof window !== 'undefined' && window._supabaseClient) {
    clientInstance = window._supabaseClient;
    return clientInstance;
  }

  // 3순위: 새로 생성
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: `sb-${projectId}-auth-token`,
    },
    global: {
      headers: {
        'x-client-info': 'fortune-app',
      },
      fetch: (url, options = {}) => {
        // Exponential Backoff 재시도 로직 사용
        return fetchWithRetry(url, options, {
          maxRetries: 3,
          initialDelayMs: 1000,
          timeoutMs: 60000,
          retryableStatuses: [500, 502, 503, 504],
        });
      },
    },
    realtime: {
      timeout: 30000,
    },
  });

  // 양쪽에 모두 저장
  clientInstance = client;
  if (typeof window !== 'undefined') {
    window._supabaseClient = client;
  }

  return client;
}

// ⭐ Lazy getter를 사용하여 필요할 때만 생성
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// 🔍 DB 연결 테스트
export async function testConnection() {
  try {
    logger.debug('Supabase 연결 테스트 시작...');

    const { data, error } = await supabase
      .from('master_contents')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      logger.error('DB 연결 실패:', error.message);
      return false;
    }

    logger.info('DB 연결 성공');
    return true;
  } catch (error) {
    logger.error('DB 연결 테스트 실패:', error);
    return false;
  }
}

export interface SajuRecord {
  id?: string;
  productId?: string;
  name: string;
  gender: 'female' | 'male';
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  phoneNumber?: string;
}

export interface OrderRecord {
  user_id?: string;
  content_id?: string;
  saju_record_id?: string;
  paid_amount?: number;
  pay_method?: string;
  imp_uid?: string;
  merchant_uid?: string;
  pstatus?: string;
  pg_provider?: string;
  // 레거시 필드 제거 (kakao_id, google_id, goods_id, goods_code)
  // gname은 DB Trigger로 자동 채워짐
}

export async function saveSajuRecord(data: SajuRecord) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ad0d9519/saju_records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save saju record');
    }

    // Return object with id to match component expectation
    return {
      id: result.recordId,
      ...result
    };
  } catch (error) {
    logger.error('saveSajuRecord 실패:', error);
    throw error;
  }
}

export async function saveOrder(data: OrderRecord) {
  try {
    logger.debug('주문 저장 시작');

    // Supabase 세션 확인 및 user_id 자동 설정
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      throw new Error('인증되지 않은 사용자입니다. 로그인이 필요합니다.');
    }

    // ⭐️ 보안: 항상 세션의 user_id 사용 (localStorage 값 무시)
    const orderData = {
      ...data,
      user_id: session.user.id  // 세션 user_id로 강제 덮어쓰기
    };
    
    const { data: savedOrder, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      logger.error('주문 저장 실패:', error.message);
      throw error;
    }

    logger.info('주문 저장 성공');
    return savedOrder;
  } catch (error) {
    logger.error('saveOrder 실패:', error);
    throw error;
  }
}

/**
 * 🧪 테스트 모드 통합 인증 헬퍼
 * 테스트 모드에서는 Mock 데이터 반환, 아니면 실제 Supabase 호출
 */
export async function getAuthUser() {
  // 테스트 모드 체크
  if (isTestMode()) {
    const testUser = getTestUser();
    if (testUser) {
      logger.debug('[TestSprite] Mock 유저 반환');
      return { data: { user: testUser }, error: null };
    }
  }

  // 실제 Supabase 호출
  return supabase.auth.getUser();
}

export async function getAuthSession() {
  // 테스트 모드 체크
  if (isTestMode()) {
    const testSession = getTestSession();
    if (testSession) {
      logger.debug('[TestSprite] Mock 세션 반환');
      return { data: { session: testSession }, error: null };
    }
  }

  // 실제 Supabase 호출
  return supabase.auth.getSession();
}