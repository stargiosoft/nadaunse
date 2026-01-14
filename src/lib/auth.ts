import { supabase } from './supabase';
import { logger } from './logger';
import { setUser as setSentryUser } from './sentry';

/**
 * 카카오 로그인 (Kakao SDK → Supabase Auth)
 */
export const signInWithKakao = async () => {
  return new Promise<any>((resolve, reject) => {
    if (!window.Kakao?.Auth) {
      reject(new Error('카카오 SDK가 로드되지 않았습니다.'));
      return;
    }

    // 이미 로그인되어 있으면 로그아웃 후 재시작
    if (window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        signInWithKakao().then(resolve).catch(reject);
      });
      return;
    }

    window.Kakao.Auth.login({
      throughTalk: false, // 카카오톡 앱 대신 웹 팝업 사용
      success: async (authObj: any) => {
        try {
          // 카카오 사용자 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async (kakaoUser: any) => {
              logger.debug('카카오 로그인 성공 - kakaoId:', kakaoUser.id);

              // Supabase 계정 이메일 생성
              const email = kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@temp.fortune.app`;
              // 카카오 ID를 기반으로 고유한 비밀번호 생성 (환경변수 사용)
              const kakaoAuthSecret = import.meta.env.VITE_KAKAO_AUTH_SECRET || 'nadaunse_secret_2025';
              const password = `kakao_${kakaoUser.id}_${kakaoAuthSecret}`;

              // 1. 먼저 로그인 시도
              let { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              // 2. 계정이 없으면 생성
              if (error?.message?.includes('Invalid login credentials')) {
                logger.info('신규 사용자 - 계정 생성 중...');
                const signUpResult = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      provider: 'kakao',
                      provider_id: kakaoUser.id.toString(),
                      name: kakaoUser.properties?.nickname || '사용자',
                      nickname: kakaoUser.properties?.nickname || '사용자',
                      avatar_url: kakaoUser.properties?.profile_image || '',
                      profile_image: kakaoUser.properties?.profile_image || '',
                      terms_agreed: true,
                      privacy_agreed: true
                    },
                    emailRedirectTo: undefined // 이메일 인증 비활성화
                  }
                });

                if (signUpResult.error) {
                  logger.error('회원가입 에러:', signUpResult.error.message);
                  reject(signUpResult.error);
                  return;
                }

                logger.info('신규 계정 생성 완료');

                // 회원가입 후 세션이 없으면 자동 로그인 시도
                if (!signUpResult.data.session) {
                  logger.warn('세션이 없음. 자동 로그인 시도...');
                  const loginResult = await supabase.auth.signInWithPassword({
                    email,
                    password
                  });

                  data = loginResult.data;
                  error = loginResult.error;

                  if (!error) {
                    logger.info('자동 로그인 성공');
                  }
                } else {
                  data = signUpResult.data;
                  error = signUpResult.error;
                }
              } else if (!error) {
                logger.info('기존 계정 로그인 성공');
              }

              if (error) {
                logger.error('Supabase Auth 에러:', error.message);
                reject(error);
              } else {
                // Sentry 사용자 컨텍스트 설정
                if (data?.user) {
                  setSentryUser(data.user.id, data.user.email);
                }
                resolve(data);
              }
            },
            fail: (err: unknown) => {
              logger.error('카카오 사용자 정보 요청 실패:', err);
              reject(err);
            }
          });
        } catch (err) {
          logger.error('카카오 로그인 처리 중 에러:', err);
          reject(err);
        }
      },
      fail: (err: unknown) => {
        logger.error('카카오 로그인 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 구글 로그인 (Supabase OAuth)
 */
export const signInWithGoogle = async () => {
  const redirectUrl = `${window.location.origin}/auth/callback`;
  logger.debug('구글 OAuth redirectTo:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    logger.error('구글 로그인 에러:', error.message);
    throw error;
  }

  logger.info('구글 OAuth 시작');
  return data;
};

/**
 * 사용자 관련 모든 캐시 삭제
 * 로그아웃, 세션 종료, 계정 전환 시 호출
 */
export const clearUserCaches = () => {
  // 고정 키 캐시 삭제
  const fixedCacheKeys = [
    'user',
    'cached_saju_info',
    'saju_records_cache',
    'free_contents_cache_v1',
    'homepage_contents_cache',
    'homepage_categories_cache_v2',
  ];

  fixedCacheKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // 패턴 기반 캐시 삭제 (free_content_detail_*_cache)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('free_content_detail_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  logger.debug('사용자 캐시 삭제 완료', {
    fixedKeys: fixedCacheKeys.length,
    patternKeys: keysToRemove.length
  });
};

/**
 * 로그아웃
 */
export const signOut = async () => {
  // Supabase 로그아웃
  await supabase.auth.signOut();

  // 카카오 로그아웃
  if (window.Kakao?.Auth?.getAccessToken()) {
    window.Kakao.Auth.logout(() => {
      logger.debug('카카오 로그아웃 완료');
    });
  }

  // Sentry 사용자 컨텍스트 해제
  setSentryUser(null);

  // 모든 사용자 캐시 삭제
  clearUserCaches();

  logger.info('로그아웃 완료');
};

/**
 * 현재 로그인한 사용자 가져오기
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    logger.error('사용자 정보 가져오기 실패:', error.message);
    return null;
  }

  return user;
};

/**
 * 로그인 상태 확인
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * 세션 갱신
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    logger.error('세션 갱신 실패:', error.message);
    return null;
  }

  return data.session;
};