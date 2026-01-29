import { useState, useEffect } from 'react';
import SEO from './SEO';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom'; // ⭐ useNavigate 추가
import svgPathsArrows from "../imports/svg-iwpvhe731i";
import svgPathsProfile from "../imports/svg-33ktykwr5e";
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import Footer from './Footer';
import { getZodiacImageUrl, getConstellation } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';
import { ProfileSkeletonWithSaju } from './skeletons/ProfileSkeleton';
import { ProfileImage } from './ProfileImage';
import { DEV } from '../lib/env';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToMasterContent?: () => void;
  onNavigateToTermsOfService?: () => void;
  onNavigateToPrivacyPolicy?: () => void;
  onNavigateToPurchaseHistory?: () => void;
  onNavigateToSajuInput?: () => void;
  onNavigateToSajuManagement?: () => void;
}

// 사주 정보 타입
interface SajuRecord {
  id: string;
  full_name: string;  // 이름
  notes: string;  // 관계 (본인, 자녀 등)
  birth_date: string;  // ISO 형식 (1991-12-25T09:00:00+09:00)
  birth_time: string;  // 시간 (午(오시))
  calendar_type?: string;  // 양력('solar')/음력('lunar')
  zodiac?: string;  // 띠 (DB에서 가져온 값)
  gender: 'male' | 'female';
  is_primary?: boolean;  // 대표 사주 여부
}

// Arrow Right Icon
function ArrowRightIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
      <g id="arrow-right">
        <path d={svgPathsArrows.p232a3c80} stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </g>
    </svg>
  );
}

// Arrow Left Icon
function ArrowLeftIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <g id="arrow-left">
        <path d={svgPathsArrows.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </g>
    </svg>
  );
}

// Profile Icon (기본)
function ProfileIcon() {
  return (
    <div className="relative shrink-0 size-[62px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62 62">
        <g id="Group">
          <path d={svgPathsProfile.p961370} fill="var(--fill-0, #E4F7F7)" id="Vector" />
        </g>
      </svg>
      <div className="absolute inset-[20.11%_23.69%_18.25%_23.68%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 39">
          <g id="Profile Icon">
            <path d={svgPathsProfile.pa9095f0} fill="var(--fill-0, #557170)" id="Vector" />
            <path d={svgPathsProfile.p1139d800} fill="var(--fill-0, #3FB5B3)" id="Vector_2" />
            <path d={svgPathsProfile.p4bd4980} fill="var(--fill-0, #8BE1DF)" id="Vector_3" />
            <path d={svgPathsProfile.p36a0700} fill="var(--fill-0, #3FB5B3)" id="Vector_4" />
            <path d={svgPathsProfile.p786fd00} fill="var(--fill-0, #3FB5B3)" id="Vector_5" />
            <path d={svgPathsProfile.p1a321300} fill="var(--fill-0, #C8FFFD)" id="Vector_6" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// 텍스트 구분선
function TextDivider() {
  return (
    <div className="h-[6px] relative shrink-0 w-0">
      <div className="absolute inset-[-8.33%_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
          <path d="M0.5 0.5V6.5" stroke="rgba(212, 212, 212, 1)" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ⭐ 메뉴 아이콘들 (Figma 디자인 - 이미지 사용)
function TagIcon() {
  return <img src="/icon-tag.svg" alt="" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function ReceiptIcon() {
  return <img src="/icon-receipt.svg" alt="" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function FolderIcon() {
  return <img src="/icon-folder.svg" alt="" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function LogoutIcon() {
  return <img src="/icon-logout.svg" alt="" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function MessageCircleIcon() {
  return <img src="/icon-message.svg" alt="" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

// 메뉴용 Arrow Right 아이콘 (24px, 회색)
function MenuArrowRightIcon() {
  return <img src="/icon-arrow-right.svg" alt="" className="block size-full" />;
}

// 생년월일시 포맷팅 (예: "양력 1991.12.25")
function formatBirthDate(birthDate: string, calendarType?: string): string {
  // ISO 형식에서 날짜 부분만 추출: "1991-12-25T09:00:00+09:00" -> "1991-12-25"
  const dateOnly = birthDate.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  
  // calendar_type 필드가 없으면 기본값으로 양력 사용
  const calendarPrefix = calendarType === 'lunar' ? '음력' : '양력';
  
  return `${calendarPrefix} ${year}.${month}.${day}`;
}

// 띠 계산 (입춘 기준 - zodiacCalculator 사용)
function getChineseZodiac(birthDate: string, birthTime?: string): string {
  return getChineseZodiacByLichun(birthDate, birthTime);
}

export default function ProfilePage({
  onBack,
  onLogout,
  onNavigateToMasterContent,
  onNavigateToTermsOfService,
  onNavigateToPrivacyPolicy,
  onNavigateToPurchaseHistory,
  onNavigateToSajuInput,
  onNavigateToSajuManagement
}: ProfilePageProps) {
  // 🚀 동기적 캐시 확인 (useState 초기화 시점) - 스켈레톤 플래시 방지
  const getInitialState = () => {
    try {
      const cachedUserJson = localStorage.getItem('user');
      const cachedSajuJson = localStorage.getItem('primary_saju');
      const cachedTagsJson = localStorage.getItem('trait_tags_cache');

      if (cachedUserJson) {
        const cachedUser = JSON.parse(cachedUserJson);
        const cachedSaju = cachedSajuJson ? JSON.parse(cachedSajuJson) : null;

        // ⭐ 태그 캐시 로드 (만료 시간 체크: 5분, refresh 플래그 체크)
        let cachedTags: { id: string; tag_name: string }[] = [];
        let cachedTotalCount = 0;
        let hasValidTagCache = false;

        // 🚀 refresh 플래그가 있으면 캐시 무효화
        const needsTagRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';

        if (cachedTagsJson && !needsTagRefresh) {
          const tagCache = JSON.parse(cachedTagsJson);
          const EXPIRY_MS = 5 * 60 * 1000; // 5분
          if (Date.now() - tagCache.timestamp < EXPIRY_MS) {
            cachedTags = tagCache.tags || [];
            cachedTotalCount = tagCache.totalCount || 0;
            hasValidTagCache = true;
          }
        }

        // ⭐ 유효성 검사: user 정보와 primary_saju 정보가 모두 있어야 완전한 캐시로 간주
        const hasValidCache = !!(cachedUser && cachedSaju);

        console.log('🚀 [ProfilePage] 초기화 시 캐시 확인');
        console.log('  - User 정보:', cachedUser ? '있음' : '없음');
        console.log('  - Primary Saju:', cachedSaju ? '있음' : '없음');
        console.log('  - Trait Tags:', hasValidTagCache ? `${cachedTags.length}개 (총 ${cachedTotalCount}개)` : '없음');
        console.log('  - 유효한 캐시:', hasValidCache ? 'YES' : 'NO');

        // ⭐ 완전한 캐시가 있으면 → 즉시 렌더링 (로딩 스킵)
        // ⭐ user만 있고 사주가 없으면 → API 호출 필요 (isLoadingSaju: true)
        return {
          user: cachedUser,
          isMaster: cachedUser.role === 'master',
          primarySaju: cachedSaju,
          isLoadingSaju: !hasValidCache, // 유효한 캐시가 없으면 로딩 표시
          hasCache: hasValidCache, // user + primary_saju가 모두 있어야 true
          traitTags: cachedTags,
          totalTagCount: cachedTotalCount,
          isLoadingTags: !hasValidTagCache // 태그 캐시가 없으면 로딩 표시
        };
      }
    } catch (e) {
      console.error('❌ [ProfilePage] 초기 캐시 파싱 실패:', e);
    }
    return {
      user: null,
      isMaster: false,
      primarySaju: null,
      isLoadingSaju: true, // 캐시가 없으면 로딩 표시
      hasCache: false,
      traitTags: [],
      totalTagCount: 0,
      isLoadingTags: true
    };
  };

  const initialState = getInitialState();

  // 🚀 캐시가 있으면 애니메이션 스킵을 위한 조건부 variants
  const skipAnimation = initialState.hasCache;
  const itemVariants = skipAnimation
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } // 애니메이션 없음
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  const [user, setUser] = useState<any>(initialState.user);
  const [isMaster, setIsMaster] = useState(initialState.isMaster);
  const [isCheckingSaju, setIsCheckingSaju] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [primarySaju, setPrimarySaju] = useState<SajuRecord | null>(initialState.primarySaju);
  // 🚀 캐시가 있으면 isLoadingSaju: false로 시작 (스켈레톤 없이 즉시 렌더링)
  const [isLoadingSaju, setIsLoadingSaju] = useState(initialState.isLoadingSaju);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  // 🚀 태그도 캐시에서 초기화 (로딩 플래시 방지)
  const [traitTags, setTraitTags] = useState<{ id: string; tag_name: string }[]>(initialState.traitTags);
  const [totalTagCount, setTotalTagCount] = useState(initialState.totalTagCount);
  const [isLoadingTags, setIsLoadingTags] = useState(initialState.isLoadingTags);

  const navigate = useNavigate(); // ⭐ useNavigate 사용

  // ⭐ 태그 표시 개수 계산 (1줄에 맞게 2개 또는 3개)
  // 태그 총 글자 수가 20자 초과하면 2개만 표시
  const visibleTagCount = (() => {
    if (traitTags.length <= 2) return traitTags.length;
    const totalChars = traitTags.slice(0, 3).reduce((sum, tag) => sum + tag.tag_name.length, 0);
    return totalChars > 20 ? 2 : 3;
  })();

  // 🔍 DEBUG: 컴포넌트 렌더 시점 로깅
  console.log('🔍 [ProfilePage] 컴포넌트 렌더 - initialState.hasCache:', initialState.hasCache);

  // ⭐ iOS Safari bfcache 복원 감지
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('🔍 [ProfilePage] pageshow 이벤트 - persisted:', event.persisted);
      // persisted=true면 bfcache에서 복원된 것 (useEffect가 다시 실행되지 않음)
      // persisted=false면 새로운 페이지 로드
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    console.log('🔍 [ProfilePage] loadUser useEffect 실행 시작');

    const loadUser = async () => {
      // ⭐️ 개발용 우회 로직: 개발 환경에서만 localStorage 개발 유저 사용
      if (DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          try {
            const localUser = JSON.parse(localUserJson);
            if (localUser.provider === 'dev') {
              console.log('⚡ [ProfilePage] 개발용 유저 감지 → Supabase 체크 우회');
              setUser(localUser);
              // setIsMaster(localUser.role === 'master'); // 개발 유저는 마스터 권한 없음으로 설정 가능

              // 더미 사주 데이터 로드 (화면 표시용)
              setPrimarySaju({
                id: 'dev_saju_1',
                full_name: localUser.nickname || '개발자',
                notes: '본인',
                birth_date: '1990-01-01T12:00:00',
                birth_time: '오시',
                calendar_type: 'solar',
                gender: 'male',
                zodiac: '말띠',
                is_primary: true
              });
              setIsLoadingSaju(false);
              return;
            }
          } catch (e) {
            console.error('JSON parse error', e);
          }
        }
      }

      // ⭐ 캐시 버스터 플래그: 사주 수정 시 설정됨
      const needsRefresh = localStorage.getItem('profile_needs_refresh') === 'true';

      // ⭐ 최초 로그인 플래그: 로그인 직후 한 번만 강제 API 호출
      const forceReload = sessionStorage.getItem('force_profile_reload') === 'true';

      console.log('🔍 [ProfilePage] 캐시 & 플래그 체크');
      console.log('  - hasCache:', initialState.hasCache);
      console.log('  - needsRefresh:', needsRefresh);
      console.log('  - forceReload:', forceReload);

      // 🚀 초기화 시점에 이미 유효한 캐시가 로드되었고, refresh가 필요 없고, 강제 리로드도 아니면 API 호출 스킵
      // → iOS 스와이프 뒤로가기 시 불필요한 리로드 완전 방지
      if (initialState.hasCache && !needsRefresh && !forceReload) {
        console.log('✅ [ProfilePage] 유효한 캐시 존재 + refresh 불필요 + 강제 리로드 아님');
        console.log('   → API 호출 완전 스킵 (캐시만 사용)');
        return;
      }

      // ⭐ API 호출이 필요한 경우 로깅
      if (!initialState.hasCache) {
        console.log('⚠️ [ProfilePage] 유효한 캐시 없음 → API 호출 필요');
      }
      if (needsRefresh) {
        console.log('⚠️ [ProfilePage] 캐시 refresh 필요 → API 호출 필요');
      }
      if (forceReload) {
        console.log('⚠️ [ProfilePage] 강제 리로드 플래그 → API 호출 필요');
      }

      // ⭐ 최초 로그인 시 무조건 API 호출
      if (forceReload) {
        console.log('🎉 [ProfilePage] 강제 리로드 감지 → API 호출');
      }

      // ⭐ refresh 플래그가 설정된 경우 → 플래그 제거 후 백그라운드 refresh 진행
      if (needsRefresh) {
        localStorage.removeItem('profile_needs_refresh');
        console.log('🔄 [ProfilePage] profile_needs_refresh 플래그 감지 → 백그라운드 refresh 진행');
      }

      // 백그라운드에서 최신 데이터 로드
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // 🚀 API 병렬화: users 조회 + saju_records 조회 동시 실행
        const [userResult, sajuResult] = await Promise.all([
          supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single(),
          supabase
            .from('saju_records')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: true })
        ]);

        const { data: userData, error: userError } = userResult;
        const { data: sajuList, error: sajuError } = sajuResult;

        // users 처리
        if (userData && !userError) {
          setUser(userData);
          setIsMaster(userData.role === 'master');
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // saju_records 처리
        if (sajuError) {
          console.error('❌ 사주 정보 로드 실패:', sajuError);
          setPrimarySaju(null);
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_records_cache');
        } else if (sajuList && sajuList.length > 0) {
          const primary = sajuList.find((s: any) => s.is_primary) || sajuList[0];
          setPrimarySaju(primary);
          // ⭐ 사주 정보 캐시에 저장 (primary + 전체 리스트)
          localStorage.setItem('primary_saju', JSON.stringify(primary));
          localStorage.setItem('saju_records_cache', JSON.stringify(sajuList));
          console.log('✅ 대표 사주 로드 완료:', primary);
        } else {
          setPrimarySaju(null);
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_records_cache');
          console.log('📭 등록된 사주 없음');
        }

        setIsLoadingSaju(false);

        // ⭐ 강제 리로드 플래그 제거 (한 번만 API 호출)
        if (forceReload) {
          sessionStorage.removeItem('force_profile_reload');
          console.log('✅ [ProfilePage] 강제 리로드 API 호출 완료 → 플래그 제거');
        }
      } else {
        // ⭐ 세션 만료 → 바로 로그인 페이지로 이동 (다이얼로그 없이)
        console.log('🔐 [ProfilePage] 세션 만료 → 로그인 페이지로 이동');
        localStorage.removeItem('user'); // 만료된 user 정보 삭제
        localStorage.removeItem('primary_saju'); // 만료된 saju 정보 삭제
        navigate('/login/new', { replace: true });
        return;
      }
    };

    loadUser();
  }, []);

  // ⭐ 나다움 태그 로드 (최신 3개) - 캐싱 전략 적용
  useEffect(() => {
    const loadTraitTags = async () => {
      try {
        // 🚀 캐시가 있고 refresh 불필요하면 API 호출 스킵
        const needsRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';
        if (!initialState.isLoadingTags && !needsRefresh) {
          console.log('✅ [TraitTags] 유효한 캐시 존재 → API 호출 스킵');
          return;
        }

        if (needsRefresh) {
          localStorage.removeItem('trait_tags_needs_refresh');
          console.log('🔄 [TraitTags] refresh 플래그 감지 → API 호출');
        }

        setIsLoadingTags(true);

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setTraitTags([]);
          setTotalTagCount(0);
          localStorage.removeItem('trait_tags_cache');
          return;
        }

        // 태그 3개 + 전체 개수 병렬 조회 (확정된 태그만)
        const [tagsResult, countResult] = await Promise.all([
          supabase
            .from('user_trait_tags')
            .select('id, tag_name, created_at')
            .eq('user_id', authUser.id)
            .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
        ]);

        if (tagsResult.error) {
          console.error('❌ 나다움 태그 로드 실패:', tagsResult.error);
          setTraitTags([]);
          setTotalTagCount(0);
          localStorage.removeItem('trait_tags_cache');
          return;
        }

        const tags = tagsResult.data || [];
        const totalCount = countResult.count || 0;

        setTraitTags(tags);
        setTotalTagCount(totalCount);

        // 🚀 캐시에 저장 (만료 시간 포함)
        localStorage.setItem('trait_tags_cache', JSON.stringify({
          tags,
          totalCount,
          timestamp: Date.now()
        }));
        console.log('✅ 나다움 태그 로드 완료:', tags, '전체:', totalCount);
      } catch (error) {
        console.error('❌ 나다움 태그 로드 중 오류:', error);
        setTraitTags([]);
        setTotalTagCount(0);
        localStorage.removeItem('trait_tags_cache');
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadTraitTags();
  }, []);

  // 🔧 태그 리프레시: 페이지 가시성 변경 또는 포커스 시 refresh 플래그 체크
  useEffect(() => {
    const checkAndRefreshTags = async () => {
      const needsRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';
      console.log('🔍 [ProfilePage] checkAndRefreshTags 호출 - needsRefresh:', needsRefresh);
      if (!needsRefresh) return;

      console.log('🔄 [ProfilePage] 태그 refresh 플래그 감지 → 새로고침');
      localStorage.removeItem('trait_tags_needs_refresh');

      try {
        setIsLoadingTags(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setTraitTags([]);
          setTotalTagCount(0);
          return;
        }

        const [tagsResult, countResult] = await Promise.all([
          supabase
            .from('user_trait_tags')
            .select('id, tag_name, created_at')
            .eq('user_id', authUser.id)
            .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
        ]);

        if (!tagsResult.error) {
          const tags = tagsResult.data || [];
          const totalCount = countResult.count || 0;
          setTraitTags(tags);
          setTotalTagCount(totalCount);
          localStorage.setItem('trait_tags_cache', JSON.stringify({
            tags,
            totalCount,
            timestamp: Date.now()
          }));
        }
      } finally {
        setIsLoadingTags(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshTags();
      }
    };

    const handleFocus = () => {
      checkAndRefreshTags();
    };

    // 커스텀 이벤트: NadaumTagsList에서 태그 변경 후 닫힐 때
    // 🚀 캐시에서 직접 읽어서 즉시 업데이트 (API 호출 없음)
    const handleTagsModified = () => {
      console.log('📣 [ProfilePage] tagsModified 이벤트 수신!');
      try {
        const cachedJson = localStorage.getItem('trait_tags_cache');
        if (cachedJson) {
          const cache = JSON.parse(cachedJson);
          console.log('🚀 [ProfilePage] 캐시에서 즉시 업데이트:', cache.tags?.length, '개, 총:', cache.totalCount);
          setTraitTags(cache.tags || []);
          setTotalTagCount(cache.totalCount || 0);
        }
      } catch (e) {
        console.error('❌ [ProfilePage] 캐시 읽기 실패:', e);
        // 실패 시 API 호출로 폴백
        checkAndRefreshTags();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('tagsModified', handleTagsModified);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('tagsModified', handleTagsModified);
    };
  }, []);

  /**
   * 대표 사주 정보 로드
   * 1. is_primary = true인 사주 우선
   * 2. 없으면 첫 번째 사주
   */
  const loadPrimarySaju = async (userId: string) => {
    try {
      setIsLoadingSaju(true);
      
      const { data: sajuList, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ 사주 정보 로드 실패:', error);
        setPrimarySaju(null);
        return;
      }
      
      if (sajuList && sajuList.length > 0) {
        const primary = sajuList.find((s: any) => s.is_primary) || sajuList[0];
        setPrimarySaju(primary);
        console.log('✅ 대표 사주 로드 완료:', primary);
      } else {
        setPrimarySaju(null);
        console.log('📭 등록된 사주 없음');
      }
    } catch (error) {
      console.error('❌ 사주 정보 로드 중 오류:', error);
      setPrimarySaju(null);
    } finally {
      setIsLoadingSaju(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut();
      console.log('✅ 로그아웃 완료');
      setShowLogoutDialog(false);
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
      setShowLogoutDialog(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const handleSajuMenuClick = async () => {
    if (isCheckingSaju) return;
    
    setIsCheckingSaju(true);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        alert('로그인이 필요합니다');
        return;
      }

      const { data: sajuList, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', authUser.id);

      if (error) {
        alert('사주 정보를 불러오는데 실패했습니다');
        return;
      }

      if (!sajuList || sajuList.length === 0) {
        if (onNavigateToSajuInput) {
          onNavigateToSajuInput();
        }
      } else {
        if (onNavigateToSajuManagement) {
          onNavigateToSajuManagement();
        }
      }
    } catch (error) {
      alert('네트워크 연결을 확인해주세요');
    } finally {
      setIsCheckingSaju(false);
    }
  };

  return (
    <>
      <SEO title="프로필" noIndex={true} />
      <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* Top Navigation */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex items-center justify-between px-[12px] h-full w-full">
            <div onClick={onBack} className="flex items-center justify-center p-[4px] rounded-[12px] size-[44px] cursor-pointer group text-gray-700 transition-colors active:bg-gray-100">
              <div className="size-[24px] transition-transform group-active:scale-90">
                <ArrowLeftIcon />
              </div>
            </div>
            <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[25.5px] text-[18px] text-black tracking-[-0.36px]">마이페이지</p>
            <div className="opacity-0 p-[4px] size-[44px]" />
          </div>
        </div>

        {/* ⭐ Tab Bar - DEV only */}
        {DEV && (
          <div
            className="bg-white shrink-0 w-full"
            style={{ borderBottom: '1px solid #f8f8f8', padding: '8px 16px' }}
          >
            <div className="flex items-center w-full">
              {/* 프로필 탭 (선택됨) */}
              <div
                className="flex-1 flex items-center justify-center rounded-[12px] cursor-pointer"
                style={{
                  backgroundColor: '#f8f8f8',
                  padding: '12px 16px'
                }}
              >
                <p
                  style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#151515'
                  }}
                >
                  프로필
                </p>
              </div>
              {/* 나의 분석 보고서 탭 (선택 안됨) */}
              <div
                className="flex-1 flex items-center justify-center rounded-[12px] cursor-pointer"
                style={{ padding: '12px 16px' }}
                onClick={() => navigate('/test/my-report-list')}
              >
                <p
                  style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 500,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#999999'
                  }}
                >
                  나의 분석 보고서
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 iOS 바운스 방지, overflow-x-hidden으로 좌우 스와이프 방지 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {/* Min-height wrapper - 스크롤 영역 전체를 채우면서 Footer가 항상 맨 아래에 위치 */}
          <div className="min-h-full flex flex-col">
          {/* Spacer */}
          <div className="h-[16px] shrink-0 w-full" />

          {/* Main Content */}
          <div className="flex flex-col px-[20px] pb-0 font-['Pretendard_Variable',sans-serif]">
          
          {/* Profile Section - 조건부 렌링 */}
          {isLoadingSaju ? (
            // 로딩 중 - 스켈레톤 표시
            <ProfileSkeletonWithSaju />
          ) : (
            <motion.div
              className="flex flex-col flex-1"
              // 🚀 캐시가 있으면 애니메이션 스킵 (initial={false}로 즉시 visible 상태)
              initial={initialState.hasCache ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
              }}
            >
              {!showEmptyState && primarySaju ? (
                // 사주 정보 있음
                <>
                  <motion.div 
                    variants={itemVariants}
                    className="content-stretch flex gap-[12px] items-center w-full pb-[12px]"
                  >
                    {/* Profile Image with Shimmer Skeleton (YouTube Style) */}
                    <div className="profile-group relative rounded-[12px] shrink-0 size-[72px] overflow-hidden bg-[#e5e5e5]">
                      <style>{`
                        @keyframes shimmer-diagonal {
                          0% { transform: translateX(-150%) skewX(-20deg); }
                          100% { transform: translateX(150%) skewX(-20deg); }
                        }
                        /* 이미지가 로드되면(.profile-group 내의 img[data-loaded="true"]) 스켈레톤 숨김 */
                        .profile-group:has(img[data-loaded="true"]) .profile-skeleton {
                          opacity: 0;
                        }
                      `}</style>
                      
                      {/* Skeleton Overlay (Default Visible) */}
                      <div className="profile-skeleton absolute inset-0 z-10 size-full pointer-events-none transition-opacity duration-500 bg-[#e5e5e5]">
                        <div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          style={{ animation: 'shimmer-diagonal 1.5s infinite linear' }}
                        />
                      </div>

                      <img
                        alt={primarySaju.zodiac || getChineseZodiac(primarySaju.birth_date, primarySaju.birth_time)}
                        src={getZodiacImageUrl(primarySaju.zodiac || getChineseZodiac(primarySaju.birth_date, primarySaju.birth_time))}
                        className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full z-0"
                        loading="lazy"
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
                      />
                      <div aria-hidden="true" className="absolute border border-[#f8f8f8] border-solid inset-0 rounded-[12px] z-20 pointer-events-none" />
                    </div>

                    <div className="basis-0 content-stretch flex flex-col gap-[3px] grow items-start min-h-px min-w-px text-nowrap">
                      <p className="font-['Pretendard_Variable:Regular',sans-serif] h-[16px] leading-[16px] overflow-ellipsis overflow-hidden text-[#848484] text-[12px] tracking-[-0.24px] w-full">
                        {primarySaju.zodiac || getChineseZodiac(primarySaju.birth_date, primarySaju.birth_time)}
                      </p>
                      <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[25px] min-w-full overflow-ellipsis overflow-hidden text-[16px] text-black tracking-[-0.32px] w-[min-content]">
                        {primarySaju.full_name} ({primarySaju.notes})
                      </p>
                    </div>
                  </motion.div>

                  {/* 생년월일시 / 띠 / 별자리 / 성별 */}
                  <motion.div 
                    variants={itemVariants}
                    className="bg-[#f9f9f9] relative rounded-[12px] w-full mb-[24px]"
                  >
                    <div className="flex flex-col items-center justify-center size-full">
                      <div className="content-stretch flex flex-col items-center justify-center p-[12px] w-full">
                        <div className="flex items-center justify-center gap-[6px] rounded-[12px]">
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[19px] overflow-ellipsis overflow-hidden text-[#525252] text-[13px] text-nowrap tracking-[-0.26px]">
                            {formatBirthDate(primarySaju.birth_date, primarySaju.calendar_type)}
                          </p>
                          <TextDivider />
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[19px] overflow-ellipsis overflow-hidden text-[#525252] text-[13px] text-nowrap tracking-[-0.26px]">
                            {primarySaju.zodiac || getChineseZodiac(primarySaju.birth_date, primarySaju.birth_time)}
                          </p>
                          <TextDivider />
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[19px] overflow-ellipsis overflow-hidden text-[#525252] text-[13px] text-nowrap tracking-[-0.26px]">
                            {(() => {
                              const dateOnly = primarySaju.birth_date.split('T')[0];
                              const [_, month, day] = dateOnly.split('-');
                              return getConstellation(parseInt(month), parseInt(day));
                            })()}
                          </p>
                          <TextDivider />
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[19px] overflow-ellipsis overflow-hidden text-[#525252] text-[13px] text-nowrap tracking-[-0.26px]">
                            {primarySaju.gender === 'male' ? '남성' : '여성'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                // 사주 정보 없음 - Fragment 제거하고 바로 motion 요소들 렌더링
                [
                  // Profile Icon - 중앙 정렬
                  <motion.div 
                    key="profile-icon"
                    variants={itemVariants}
                    className="flex items-center justify-center relative shrink-0 w-full pt-[28px]"
                  >
                    <ProfileIcon />
                  </motion.div>,

                  // Text Lines
                  <motion.div 
                    key="text-lines"
                    variants={itemVariants}
                    className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0 w-full pt-[32px]"
                  >
                    <p className="font-semibold leading-[25px] text-[20px] text-black text-center tracking-[-0.34px]">
                      사주 정보가 아직 없어요
                    </p>
                    <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[25.5px] pt-[2px] text-[15px] text-[#848484] text-center tracking-[-0.3px]">
                      사주를 등록하면 운세 풀이가 시작돼요
                    </p>
                  </motion.div>,

                  // Button
                  <motion.button
                    key="register-button"
                    variants={itemVariants}
                    onClick={handleSajuMenuClick}
                    disabled={isCheckingSaju}
                    whileTap={{ scale: 0.96 }}
                    className="bg-[#48b2af] h-[48px] rounded-[12px] shrink-0 w-full cursor-pointer border-none transition-colors disabled:opacity-50 active:bg-[#389998] mt-[40px] mb-[32px]"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[20px] text-[15px] text-white text-nowrap tracking-[-0.45px] select-none" style={{ WebkitTouchCallout: 'none' }}>
                          {isCheckingSaju ? '확인 중...' : '사주 정보 등록하기'}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ]
              )}

              {/* 나다움 태그 Section */}
              {!isLoadingTags && (
                <>
                  {/* Divider */}
                  <motion.div
                    variants={itemVariants}
                    className="h-[8px] -mx-[20px]"
                    style={{ backgroundColor: '#f9f9f9' }}
                  />

                  {traitTags.length > 0 ? (
                    /* 태그가 있을 때 - 태그 카드 표시 */
                    <motion.div
                      variants={itemVariants}
                      style={{ width: 'calc(100% + 40px)', marginLeft: '-20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
                    >
                      <div
                        className="flex items-center justify-between px-[16px] py-[4px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                        onClick={() => {
                          navigate('/profile/nadaum-tags');
                        }}
                      >
                        <div className="flex flex-col gap-[8px] flex-1">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-[8px]">
                              <div className="relative shrink-0 size-[20px]">
                                <TagIcon />
                              </div>
                              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                                나의 성향 태그
                              </p>
                            </div>
                            <div className="relative shrink-0 size-[24px]">
                              <MenuArrowRightIcon />
                            </div>
                          </div>

                          {/* Tags - 실제 DB 데이터 (1줄 유지: 글자 수에 따라 2~3개) */}
                          <div className="flex flex-nowrap gap-[4px] w-full">
                            {traitTags.slice(0, visibleTagCount).map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center justify-center rounded-[999px] shrink-0"
                                style={{ backgroundColor: '#f0f8f8', padding: '5px 7px' }}
                              >
                                <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '-0.24px', color: '#368683', whiteSpace: 'nowrap' }}>
                                  # {tag.tag_name}
                                </p>
                              </div>
                            ))}
                            {/* +N 텍스트 - 표시된 개수보다 많으면 표시 */}
                            {totalTagCount > visibleTagCount && (
                              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '-0.24px', color: '#368683', padding: '5px 0', whiteSpace: 'nowrap' }}>
                                +{totalTagCount - visibleTagCount}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* 태그가 없을 때 - 메뉴 아이템만 표시 */
                    <motion.div
                      variants={itemVariants}
                      style={{ width: 'calc(100% + 40px)', marginLeft: '-20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
                    >
                      <div
                        className="flex items-center justify-between px-[16px] py-[4px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                        onClick={() => {
                          navigate('/profile/nadaum-tags');
                        }}
                      >
                        <div className="flex items-center gap-[8px]">
                          <div className="relative shrink-0 size-[20px]">
                            <TagIcon />
                          </div>
                          <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                            나의 성향 태그
                          </p>
                        </div>
                        <div className="relative shrink-0 size-[24px]">
                          <MenuArrowRightIcon />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Divider */}
                  <motion.div
                    variants={itemVariants}
                    className="h-[8px] -mx-[20px]"
                    style={{ backgroundColor: '#f9f9f9' }}
                  />
                </>
              )}

              {/* Menu List Container */}
              <motion.div
                variants={{ hidden: {}, visible: {} }}
                className="flex flex-col flex-1 mb-[120px] py-[4px]"
                style={{ width: 'calc(100% + 40px)', marginLeft: '-20px', paddingLeft: '20px', paddingRight: '20px' }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 1 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0 } }
                  }}
                  className="flex flex-col flex-1"
                  style={{ width: '100%' }}
                >
                  {/* 1. 콘텐츠 만들기 (마스터 전용) */}
                  {isMaster && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                      style={{ width: '100%' }}
                      onClick={onNavigateToMasterContent}
                    >
                      <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[28.5px] text-[16px] text-black tracking-[-0.32px]">콘텐츠 만들기</p>
                      <div className="relative shrink-0 size-[24px]">
                        <MenuArrowRightIcon />
                      </div>
                    </motion.div>
                  )}
                  {/* 2. 이용 기록 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%' }}
                    onClick={onNavigateToPurchaseHistory}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <ReceiptIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>이용 기록</p>
                      {/* DEV: UI 테스팅용 직접 이동 버튼 */}
                      {DEV && (
                        <button
                          onClick={(e) => {
                            // ⭐️ 이벤트 전파를 완벽하게 차단하여 부모의 로그인 체크 우회
                            e.preventDefault();
                            e.stopPropagation();

                            // ⭐️ 개발용: 더미 구매내역 데이터 생성
                            const devPurchases = [
                              // 2025-01-03 (오늘)
                              {
                                id: 'dev_order_1',
                                content_id: 'dev_content_1',
                                saju_record_id: 'dev_saju_1',
                                paid_amount: 5900,
                                created_at: '2025-01-03T15:20:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '2025년 신년 프리미엄 운세',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '홍길동',
                                  birth_date: '1990-05-15'
                                }
                              },
                              {
                                id: 'dev_order_2',
                                content_id: 'dev_content_2',
                                saju_record_id: 'dev_saju_2',
                                paid_amount: 3900,
                                created_at: '2025-01-03T10:30:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '나의 사랑 타로 운세',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '김영희',
                                  birth_date: '1992-03-22'
                                }
                              },
                              // 2025-01-02 (어제)
                              {
                                id: 'dev_order_3',
                                content_id: 'dev_content_3',
                                saju_record_id: 'dev_saju_3',
                                paid_amount: 4900,
                                created_at: '2025-01-02T14:30:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '1월 월간 운세 풀이',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '이철수',
                                  birth_date: '1985-08-20'
                                }
                              },
                              {
                                id: 'dev_order_4',
                                content_id: 'dev_content_4',
                                saju_record_id: null,
                                paid_amount: 2900,
                                created_at: '2025-01-02T09:15:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '오늘의 운세 풀이',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: null
                              },
                              // 2024-12-30
                              {
                                id: 'dev_order_5',
                                content_id: 'dev_content_5',
                                saju_record_id: 'dev_saju_4',
                                paid_amount: 4500,
                                created_at: '2024-12-30T18:45:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '금전 운세 타로 카드',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '박지민',
                                  birth_date: '1995-11-30'
                                }
                              },
                              {
                                id: 'dev_order_6',
                                content_id: 'dev_content_6',
                                saju_record_id: 'dev_saju_5',
                                paid_amount: 3900,
                                created_at: '2024-12-30T11:20:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '건강 운세 풀이',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '최민수',
                                  birth_date: '1988-07-12'
                                }
                              },
                              // 2024-12-25
                              {
                                id: 'dev_order_7',
                                content_id: 'dev_content_7',
                                saju_record_id: null,
                                paid_amount: 2500,
                                created_at: '2024-12-25T16:00:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '주간 운세',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: null
                              },
                              // 2024-12-20
                              {
                                id: 'dev_order_8',
                                content_id: 'dev_content_8',
                                saju_record_id: 'dev_saju_6',
                                paid_amount: 6900,
                                created_at: '2024-12-20T13:30:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '2025년 연간 프리미엄 사주 풀이',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '정수연',
                                  birth_date: '1993-02-14'
                                }
                              },
                              // 2024-12-15
                              {
                                id: 'dev_order_9',
                                content_id: 'dev_content_9',
                                saju_record_id: 'dev_saju_7',
                                paid_amount: 3500,
                                created_at: '2024-12-15T10:45:00',
                                pstatus: 'completed',
                                master_contents: {
                                  title: '12월 타로 운세',
                                  thumbnail_url: null,
                                  content_type: 'paid'
                                },
                                saju_records: {
                                  full_name: '강민지',
                                  birth_date: '1997-09-05'
                                }
                              }
                            ];

                            // ⭐️ UI TEST 모드 플래그 설정 (구매내역 페이지에서만 사용)
                            localStorage.setItem('ui_test_mode', 'true');

                            // localStorage에 더미 데이터 저장
                            localStorage.setItem('dev_purchase_records', JSON.stringify(devPurchases));

                            console.log('⚡ [DEV] UI TEST 모드 활성화 → 더미 구매내역 페이지로 이동');

                            // localStorage 저장이 확실히 반영된 후 이동
                            setTimeout(() => {
                              onNavigateToPurchaseHistory?.();
                            }, 10);
                          }}
                          className="px-[6px] py-[2px] rounded-[4px] bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold hover:bg-red-200 transition-colors cursor-pointer relative z-10"
                        >
                          UI TEST
                        </button>
                      )}
                    </div>
                    <div className="relative shrink-0 size-[24px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 3. 사주 정보 관리 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%' }}
                    onClick={handleSajuMenuClick}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <FolderIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>사주 정보 관리</p>
                      {/* DEV: UI 테스팅용 직접 이동 버튼 */}
                      {DEV && (
                        <button
                          onClick={(e) => {
                            // ⭐️ 이벤트 전파를 완벽하게 차단하여 부모의 로그인 체크 로직(handleSajuMenuClick)이 실행되지 않도록 함
                            e.preventDefault();
                            e.stopPropagation();

                            // ⭐️ 개발용: 로그인된 유저 상태 강제 주입 (localStorage)
                            const devUser = {
                              id: 'dev_user_1',
                              email: 'dev@test.com',
                              nickname: '개발자',
                              role: 'user',
                              provider: 'dev'
                            };
                            localStorage.setItem('user', JSON.stringify(devUser));

                            console.log('⚡ [DEV] 개발 유저 모드 활성화 -> 사주 관리 페이지 즉시 진입');

                            // localStorage 저장이 확실히 반영된 후 이동
                            setTimeout(() => {
                              onNavigateToSajuManagement?.();
                            }, 10);
                          }}
                          className="px-[6px] py-[2px] rounded-[4px] bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold hover:bg-red-200 transition-colors cursor-pointer relative z-10"
                        >
                          UI TEST
                        </button>
                      )}
                    </div>
                    <div className="relative shrink-0 size-[24px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 4. 의견 전달하기 */}
                  <motion.div
                    variants={itemVariants}
                    onClick={() => window.open('https://docs.google.com/forms/d/1yHM5cioHLaZWCaevJ0ib7Y8i6zmCQTnTfG-KK4nMceU/edit', '_blank')}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%' }}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <MessageCircleIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>의견 전달하기</p>
                    </div>
                    <div className="relative shrink-0 size-[24px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 5. 로그아웃 */}
                  <motion.div
                    variants={itemVariants}
                    onClick={handleLogoutClick}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover:bg-[#f9f9f9] active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%' }}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <LogoutIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>로그아웃</p>
                    </div>
                    <div className="relative shrink-0 size-[24px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>


                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </div>
          {/* Footer Spacer - 최소 130px, 남은 공간 채움 */}
          <div className="grow" style={{ minHeight: 130 }} />
          {/* Footer */}
          <div className="shrink-0 -mx-[20px]">
            <Footer
              onNavigateToTerms={onNavigateToTermsOfService}
              onNavigateToPrivacy={onNavigateToPrivacyPolicy}
            />
          </div>
          </div>{/* Min-height wrapper 닫기 */}
        </div>{/* ⭐ Scrollable Container 닫기 */}
      </div>
      <SessionExpiredDialog isOpen={isSessionExpired} />

      {/* 로그아웃 확인 다이얼로그 */}
      {showLogoutDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleLogoutCancel}
        >
          <div
            className="bg-white rounded-[16px] w-[320px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 제목 */}
            <div className="px-[24px] pt-[32px] pb-[24px]">
              <p
                className="text-center"
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '25.5px',
                  letterSpacing: '-0.36px',
                  color: '#151515'
                }}
              >
                로그아웃하시겠어요?
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-[8px] px-[16px] pb-[16px]">
              {/* 아니요 버튼 */}
              <button
                onClick={handleLogoutCancel}
                className="flex-1 h-[48px] rounded-[12px] transition-colors active:opacity-80"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                <p
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#848484'
                  }}
                >
                  아니요
                </p>
              </button>

              {/* 네 버튼 */}
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 h-[48px] rounded-[12px] transition-colors active:opacity-80"
                style={{ backgroundColor: '#48b2af' }}
              >
                <p
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#ffffff'
                  }}
                >
                  네
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}