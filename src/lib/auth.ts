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
              // 카카오 ID를 기반으로 고유한 비밀번호 생성 (환경변수 필수)
              const kakaoAuthSecret = import.meta.env.VITE_KAKAO_AUTH_SECRET;
              if (!kakaoAuthSecret) {
                logger.error('VITE_KAKAO_AUTH_SECRET 환경변수가 설정되지 않았습니다.');
                reject(new Error('서버 설정 오류: 인증 시크릿이 누락되었습니다.'));
                return;
              }
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
      skipBrowserRedirect: true, // ⭐ 자동 리다이렉트 비활성화 → replace로 직접 처리
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

  // ⭐ window.location.replace() 사용: 로그인 페이지를 히스토리에 남기지 않음
  // assign/href 대신 replace → iOS 스와이프 뒤로가기 시 로그인 페이지로 돌아가는 문제 방지
  if (data?.url) {
    logger.info('구글 OAuth 시작 (replace 모드)');
    window.location.replace(data.url);
  }

  return data;
};

/**
 * 사용자 관련 모든 캐시 삭제
 * 로그아웃, 세션 종료, 계정 전환 시 호출
 */
export const clearUserCaches = () => {
  // ⭐ pending_trait_tags가 있으면 사주 정보 보존 (나다움 태그 저장 플로우 진행 중)
  const hasPendingTags = !!localStorage.getItem('pending_trait_tags');

  // 고정 키 캐시 삭제
  let fixedCacheKeys = [
    'user',
    'primary_saju',              // 대표 사주 정보 (ProfilePage에서 사용)
    'cached_saju_info',
    'saju_records_cache',
    'free_contents_cache_v1',
    'homepage_contents_cache',
    'homepage_categories_cache_v2',
    // ⭐ 주간 보고서 관련 캐시 (계정 전환 시 반드시 삭제!)
    'my_report_cache_v3',
    'my_report_needs_refresh',
    'trait_tags_cache',
    'trait_tags_needs_refresh',
    'saju_cache_checked',
  ];

  // ⭐ cached_saju_info가 있으면 항상 보존 (로그인 후 사주 저장 필요)
  const hasCachedSaju = !!localStorage.getItem('cached_saju_info');
  if (hasPendingTags || hasCachedSaju) {
    fixedCacheKeys = fixedCacheKeys.filter(key => key !== 'cached_saju_info');
    logger.debug(`cached_saju_info 보존 (pending_trait_tags: ${hasPendingTags}, cached_saju: ${hasCachedSaju})`);
  }

  fixedCacheKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // 패턴 기반 캐시 삭제
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('free_content_detail_') ||
      key.startsWith('weekly_report_detail_') ||  // ⭐ 주간 보고서 상세 캐시
      key.startsWith('paid_result_')  // ⭐ 유료 콘텐츠 결과 캐시 (계정 전환 시 필수!)
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  logger.debug('사용자 캐시 삭제 완료', {
    fixedKeys: fixedCacheKeys.length,
    patternKeys: keysToRemove.length,
    preservedSaju: hasPendingTags
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

/**
 * 오늘 방문 기록 (KST 기준)
 * - 로그인된 사용자의 visit_dates 배열에 오늘 날짜 추가
 * - visit_count 증가 + last_login_at 갱신 (통계 대시보드 정확도 보장)
 * - 이미 기록된 날짜는 중복 추가하지 않음
 * - 하루에 한 번만 기록 (localStorage로 체크)
 */
export const recordTodayVisit = async () => {
  try {
    // 현재 로그인 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // KST 기준 오늘 날짜 (YYYY-MM-DD)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
    const todayKST = `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;

    // 오늘 이미 기록했는지 확인 (localStorage)
    const lastVisitKey = `last_visit_recorded_${user.id}`;
    const lastRecorded = localStorage.getItem(lastVisitKey);
    if (lastRecorded === todayKST) {
      return; // 오늘 이미 기록됨
    }

    // 현재 사용자 데이터 가져오기
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('visit_dates, visit_count')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      logger.debug('방문 기록 조회 실패:', fetchError.message);
      return;
    }

    // 이미 오늘 날짜가 있으면 last_login_at만 갱신하고 스킵
    const currentDates: string[] = userData?.visit_dates || [];
    if (currentDates.includes(todayKST)) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
      localStorage.setItem(lastVisitKey, todayKST);
      return;
    }

    // 오늘 날짜 추가 + visit_count 증가 + last_login_at 갱신
    const newVisitCount = (userData?.visit_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        visit_dates: [...currentDates, todayKST],
        visit_count: newVisitCount,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.debug('방문 기록 저장 실패:', updateError.message);
      return;
    }

    // 성공 시 localStorage에 기록
    localStorage.setItem(lastVisitKey, todayKST);
    logger.debug('방문 기록 완료:', todayKST, `(방문 ${newVisitCount}회)`);
  } catch (err) {
    logger.debug('방문 기록 중 오류:', err);
  }
};