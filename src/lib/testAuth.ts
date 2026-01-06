/**
 * @file testAuth.ts
 * @description TestSprite 및 E2E 테스트를 위한 인증 우회 모듈
 *
 * @usage
 * URL에 ?__testsprite=true 파라미터 추가 시 테스트 모드 활성화
 * 예: http://localhost:3000?__testsprite=true
 *
 * @security
 * - DEV 환경: 항상 테스트 모드 허용
 * - Staging 환경: VITE_ENABLE_TEST_MODE=true 일 때만 허용
 * - Production 환경: 절대 허용하지 않음 (VITE_SUPABASE_PROJECT_ID로 판단)
 *
 * @note 순환 참조 방지를 위해 supabase.ts를 import하지 않음
 */

// 테스트 유저 정보 (Staging DB의 실제 테스트 유저)
const TEST_USER = {
  id: 'b9b09c6c-233e-4e89-bde3-10f7c90adba0',
  email: 'test@nadaunse.com',
  phone: '',
  app_metadata: {
    provider: 'kakao',
    providers: ['kakao']
  },
  user_metadata: {
    name: '테스트유저',
    full_name: '테스트유저',
    avatar_url: '',
    provider_id: 'test-provider-id'
  },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Production Project ID (이 값이면 절대 테스트 모드 허용 안함)
const PRODUCTION_PROJECT_ID = 'kcthtpmxffppfbkjjkub';

/**
 * 테스트 모드 허용 여부 확인
 * - DEV 환경: 항상 허용
 * - Staging 환경: VITE_ENABLE_TEST_MODE=true 일 때만 허용
 * - Production 환경: 절대 불허 (Project ID로 이중 체크)
 */
const isTestModeAllowed = (): boolean => {
  // 1. DEV 환경이면 항상 허용
  if (import.meta.env.DEV) {
    return true;
  }

  // 2. Production Project ID면 절대 불허 (최우선 안전장치)
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId === PRODUCTION_PROJECT_ID) {
    return false;
  }

  // 3. Staging에서 VITE_ENABLE_TEST_MODE=true 일 때만 허용
  return import.meta.env.VITE_ENABLE_TEST_MODE === 'true';
};

// 테스트 모드 활성화 여부 확인
export const isTestMode = (): boolean => {
  // 환경에서 테스트 모드가 허용되지 않으면 false
  if (!isTestModeAllowed()) {
    return false;
  }

  // URL 파라미터 체크
  const params = new URLSearchParams(window.location.search);
  return params.get('__testsprite') === 'true';
};

// 테스트 세션 키
const TEST_SESSION_KEY = '__testsprite_session';

/**
 * 테스트 모드 초기화
 * App.tsx에서 앱 시작 시 호출
 */
export const initTestMode = async (): Promise<boolean> => {
  if (!isTestMode()) {
    return false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 [TestSprite] 테스트 모드 활성화');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 테스트 세션이 이미 있는지 확인
    const storedTestSession = localStorage.getItem(TEST_SESSION_KEY);
    if (storedTestSession) {
      console.log('✅ [TestSprite] 저장된 테스트 세션 복원');
      return true;
    }

    // 테스트 세션 생성 및 저장
    const mockSession = {
      user: TEST_USER,
      access_token: `test-access-token-${Date.now()}`,
      refresh_token: `test-refresh-token-${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1시간 후 만료
      expires_in: 3600,
      token_type: 'bearer'
    };

    localStorage.setItem(TEST_SESSION_KEY, JSON.stringify(mockSession));

    // ⚠️ Supabase auth 토큰은 설정하지 않음
    // Mock 토큰은 유효한 JWT가 아니라서 Supabase API에서 401 오류 발생
    // 대신 컴포넌트에서 getAuthUser/getAuthSession 헬퍼를 사용하여 Mock 데이터 반환
    // Supabase API 요청은 anon key로 진행됨 (RLS에 따라 공개 데이터 접근)

    console.log('✅ [TestSprite] 테스트 세션 생성 완료');
    console.log('👤 [TestSprite] 테스트 유저:', TEST_USER.user_metadata.name);
    console.log('🆔 [TestSprite] User ID:', TEST_USER.id);

    return true;
  } catch (error) {
    console.error('❌ [TestSprite] 테스트 모드 초기화 실패:', error);
    return false;
  }
};

/**
 * 테스트 모드에서 사용자 정보 가져오기
 * supabase.auth.getUser() 대체용
 */
export const getTestUser = () => {
  if (!isTestMode()) {
    return null;
  }

  const storedSession = localStorage.getItem(TEST_SESSION_KEY);
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      return session.user;
    } catch {
      return TEST_USER;
    }
  }

  return TEST_USER;
};

/**
 * 테스트 세션 가져오기
 */
export const getTestSession = () => {
  if (!isTestMode()) {
    return null;
  }

  const storedSession = localStorage.getItem(TEST_SESSION_KEY);
  if (storedSession) {
    try {
      return JSON.parse(storedSession);
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * 테스트 모드 종료 및 세션 정리
 */
export const clearTestMode = () => {
  localStorage.removeItem(TEST_SESSION_KEY);
  console.log('🧹 [TestSprite] 테스트 세션 정리 완료');
};

/**
 * 테스트 모드에서 Mock 데이터 반환하는 헬퍼
 * 컴포넌트에서 supabase.auth.getUser() 전에 호출
 */
export const getTestAuthData = () => {
  if (!isTestMode()) {
    return null;
  }

  const user = getTestUser();
  const session = getTestSession();

  return {
    user: user ? { data: { user }, error: null } : null,
    session: session ? { data: { session }, error: null } : null
  };
};

// 테스트 모드 상태를 window 객체에 노출 (디버깅용)
// DEV 또는 테스트 모드가 허용된 환경에서만 노출
if (typeof window !== 'undefined') {
  // 초기화 시점에는 isTestModeAllowed()로 체크
  const shouldExposeTestTools = import.meta.env.DEV ||
    (import.meta.env.VITE_ENABLE_TEST_MODE === 'true' &&
     import.meta.env.VITE_SUPABASE_PROJECT_ID !== 'kcthtpmxffppfbkjjkub');

  if (shouldExposeTestTools) {
    (window as any).__testsprite = {
      isTestMode,
      initTestMode,
      getTestUser,
      getTestSession,
      clearTestMode,
      TEST_USER
    };
  }
}
