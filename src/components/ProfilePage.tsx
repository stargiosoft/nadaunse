import { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import SEO from './SEO';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom'; // ⭐ useNavigate 추가
import svgPathsArrows from "../imports/svg-iwpvhe731i";
import svgPathsProfile from "../imports/svg-33ktykwr5e";
import { supabase } from '../lib/supabase';
import { signOut, clearUserCaches } from '../lib/auth';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import Footer from './Footer';
import BottomTabBar from './BottomTabBar';
import { getZodiacImageUrl, getConstellation } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';
import { ProfileSkeletonWithSaju } from './skeletons/ProfileSkeleton';
import { ProfileImage } from './ProfileImage';
import { DEV } from '../lib/env';
import { useSproutBalance } from '../hooks/useSproutBalance';
import { BarChart3, PenSquare } from 'lucide-react'; // ⭐ 통계 대시보드, 콘텐츠 만들기 아이콘
import ReceiveMyAnalysis from './ReceiveMyAnalysis';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToMasterContent?: () => void;
  onNavigateToStatsDashboard?: () => void; // ⭐ 통계 대시보드
  onNavigateToTermsOfService?: () => void;
  onNavigateToPrivacyPolicy?: () => void;
  onNavigateToPurchaseHistory?: () => void;
  onNavigateToSajuInput?: () => void;
  onNavigateToSajuManagement?: () => void;
  onNavigateToManse?: () => void;
  onNavigateToBlog?: () => void;
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
  phone_number?: string;  // 휴대폰 번호
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
    <div className="relative shrink-0" style={{ width: '56px', height: '56px' }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62 62">
        <g id="Group">
          <path d={svgPathsProfile.p961370} fill="var(--fill-0, #F6F6F6)" id="Vector" />
        </g>
      </svg>
      <div className="absolute inset-[20.11%_23.69%_18.25%_23.68%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 39">
          <g id="Profile Icon">
            <path d={svgPathsProfile.pa9095f0} fill="var(--fill-0, #9F9F9F)" id="Vector" />
            <path d={svgPathsProfile.p1139d800} fill="var(--fill-0, #D2D2D2)" id="Vector_2" />
            <path d={svgPathsProfile.p4bd4980} fill="var(--fill-0, #E6E6E6)" id="Vector_3" />
            <path d={svgPathsProfile.p36a0700} fill="var(--fill-0, #D2D2D2)" id="Vector_4" />
            <path d={svgPathsProfile.p786fd00} fill="var(--fill-0, #D2D2D2)" id="Vector_5" />
            <path d={svgPathsProfile.p1a321300} fill="var(--fill-0, #FFFFFF)" id="Vector_6" />
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
  return <img src="/icon-tag.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function ReceiptIcon() {
  return <img src="/icon-receipt.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function FolderIcon() {
  return <img src="/icon-folder.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function LogoutIcon() {
  return <img src="/icon-logout.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function MessageCircleIcon() {
  return <img src="/icon-message.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function ManseIcon() {
  return <img src="/icon-manse.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

function BlogIcon() {
  return <img src="/icon-document-text.svg" alt="" aria-hidden="true" className="block size-full" style={{ filter: 'brightness(0) saturate(100%)' }} />;
}

// 메뉴용 Arrow Right 아이콘 (24px, 회색)
function MenuArrowRightIcon() {
  return <img src="/icon-arrow-right.svg" alt="" aria-hidden="true" className="block size-full" />;
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
  onNavigateToStatsDashboard, // ⭐ 통계 대시보드
  onNavigateToTermsOfService,
  onNavigateToPrivacyPolicy,
  onNavigateToPurchaseHistory,
  onNavigateToSajuInput,
  onNavigateToSajuManagement,
  onNavigateToManse,
  onNavigateToBlog
}: ProfilePageProps) {
  // 🚀 동기적 캐시 확인 (useState 초기화 시점) - 스켈레톤 플래시 방지
  const getInitialState = () => {
    try {
      const cachedUserJson = localStorage.getItem('user');
      const cachedSajuJson = localStorage.getItem('primary_saju');
      const cachedTagsJson = localStorage.getItem('trait_tags_cache');
      // ⭐ 사주 조회 완료 여부 (사주가 없어도 조회를 완료했으면 캐시 유효)
      const sajuCacheChecked = localStorage.getItem('saju_cache_checked') === 'true';

      if (cachedUserJson) {
        const cachedUser = JSON.parse(cachedUserJson);
        const cachedSaju = cachedSajuJson ? JSON.parse(cachedSajuJson) : null;

        // ⭐ 태그 캐시 로드 (Stale-While-Revalidate 패턴)
        // refresh 플래그가 있어도 이전 캐시 데이터를 먼저 보여주고, 새 데이터가 오면 업데이트
        let cachedTags: { id: string; tag_name: string }[] = [];
        let cachedTotalCount = 0;
        let hasValidTagCache = false;
        let needsTagRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';

        if (cachedTagsJson) {
          const tagCache = JSON.parse(cachedTagsJson);
          const EXPIRY_MS = 5 * 60 * 1000; // 5분
          const isExpired = Date.now() - tagCache.timestamp >= EXPIRY_MS;

          // 🚀 캐시 데이터가 있으면 일단 로드 (stale 데이터라도 표시)
          cachedTags = tagCache.tags || [];
          cachedTotalCount = tagCache.totalCount || 0;

          // 캐시가 만료되지 않고 refresh 플래그도 없으면 완전히 유효
          if (!isExpired && !needsTagRefresh) {
            hasValidTagCache = true;
          }
          // 캐시 데이터는 있으니 로딩 상태는 false (API는 백그라운드에서 호출)
        }

        // ⭐ 유효성 검사: primary_saju 데이터가 실제로 있어야 캐시 유효
        // sajuCacheChecked만으로는 API 스킵 안 함 (다른 페이지에서 primary_saju만 삭제되는 경우 방어)
        const hasValidCache = !!(cachedUser && cachedSaju);

        console.log('🚀 [ProfilePage] 초기화 시 캐시 확인');
        console.log('  - User 정보:', cachedUser ? '있음' : '없음');
        console.log('  - Primary Saju:', cachedSaju ? '있음' : '없음');
        console.log('  - Saju Cache Checked:', sajuCacheChecked ? 'YES' : 'NO');
        console.log('  - Trait Tags:', hasValidTagCache ? `${cachedTags.length}개 (총 ${cachedTotalCount}개)` : '없음');
        console.log('  - 유효한 캐시:', hasValidCache ? 'YES' : 'NO');

        // ⭐ 완전한 캐시가 있으면 → 즉시 렌더링 (로딩 스킵)
        // ⭐ user만 있고 사주 조회도 안했으면 → API 호출 필요 (isLoadingSaju: true)
        return {
          user: cachedUser,
          isMaster: cachedUser.role === 'master',
          primarySaju: cachedSaju,
          isLoadingSaju: !hasValidCache, // 캐시 없으면 API 호출 동안 로딩 표시
          hasCache: hasValidCache, // primary_saju가 실제로 있어야 API 스킵
          traitTags: cachedTags,
          totalTagCount: cachedTotalCount,
          // 🚀 Stale-While-Revalidate: 캐시 데이터가 있으면 로딩 없이 바로 표시
          isLoadingTags: cachedTags.length === 0 && !cachedTagsJson, // 캐시가 아예 없을 때만 로딩
          needsTagRefresh // API 호출 필요 여부 전달
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
      isLoadingTags: true,
      needsTagRefresh: false
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
  const { balance: sproutBalance } = useSproutBalance();

  // ⭐ 의견 전달하기 미읽은 답변 알림 dot
  const [hasUnreadReply, setHasUnreadReply] = useState(false);

  // ⭐ 핸드폰 번호 바텀시트 상태
  const [showPhoneBottomSheet, setShowPhoneBottomSheet] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneSaving, setIsPhoneSaving] = useState(false);


  // ⭐ 스크롤 기반 탭 바 숨김/표시
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  // ⭐ 탭 슬라이딩 애니메이션 (0: 프로필, 1: 나의 분석 보고서)
  // SessionStorage로 이전 탭 위치 체크하여 부드러운 복귀 애니메이션
  const getInitialTabIndex = () => {
    const fromReportList = sessionStorage.getItem('from_report_list');
    if (fromReportList === 'true') {
      sessionStorage.removeItem('from_report_list');
      return 1; // 보고서에서 왔으면 1에서 시작
    }
    return 0;
  };
  const [activeTabIndex, setActiveTabIndex] = useState(getInitialTabIndex());

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
      let forceReload = sessionStorage.getItem('force_profile_reload') === 'true';

      // 🔄 브라우저 새로고침 감지 (F5, Cmd+R 등)
      // ⚠️ SPA에서 navigation type은 세션 내내 동일하므로,
      // 실제 새로고침 직후(5초 이내)에만 강제 API 호출 (이후 SPA 내비게이션은 캐시 사용)
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isPageRefresh = navEntries.length > 0 && navEntries[0].type === 'reload' && performance.now() < 5000;

      // 🚀 태그 refresh 플래그도 미리 체크
      const needsTagRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';

      console.log('🔍 [ProfilePage] 캐시 & 플래그 체크');
      console.log('  - hasCache:', initialState.hasCache);
      console.log('  - hasTagData:', initialState.traitTags.length > 0);
      console.log('  - needsRefresh:', needsRefresh);
      console.log('  - needsTagRefresh:', needsTagRefresh);
      console.log('  - forceReload:', forceReload);
      console.log('  - isPageRefresh:', isPageRefresh);

      // 🔐 계정 불일치 감지: 캐시된 사용자와 현재 세션 사용자 비교
      const { data: { session } } = await supabase.auth.getSession();
      const cachedUserJson = localStorage.getItem('user');
      if (session && cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          if (cachedUser.id !== session.user.id) {
            console.log('⚠️ [ProfilePage] 계정 불일치 감지! 캐시:', cachedUser.id, '→ 현재:', session.user.id);
            clearUserCaches();
            forceReload = true; // 강제 API 호출
          }
        } catch { /* 파싱 실패 시 아래에서 API 호출 */ }
      }

      // 🚀 모든 캐시가 유효할 때만 API 호출 스킵 (user + saju + tags)
      // → iOS 스와이프 뒤로가기 시 불필요한 리로드 완전 방지
      // 🚀 태그는 Stale-While-Revalidate: 캐시 데이터가 있으면 API 호출해도 UI는 즉시 표시
      // ⚠️ 태그 캐시가 없으면 (isLoadingTags=true) API 호출 필요!
      // 🔄 새로고침 시에는 항상 API 호출
      const hasTagCache = !!localStorage.getItem('trait_tags_cache');
      if (initialState.hasCache && !initialState.needsTagRefresh && !needsRefresh && !needsTagRefresh && !forceReload && !isPageRefresh && hasTagCache) {
        console.log('✅ [ProfilePage] 모든 캐시 유효 + refresh 불필요 + 강제 리로드 아님 + 새로고침 아님');
        console.log('   → API 호출 완전 스킵 (캐시만 사용)');
        return;
      }

      if (isPageRefresh) {
        console.log('🔄 [ProfilePage] 브라우저 새로고침 감지 → 강제 API 호출');
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
        // 🚀 API 병렬화: users + saju_records + trait_tags 동시 실행
        // 🔄 새로고침 시에도 태그 로드
        const shouldLoadTags = initialState.isLoadingTags || needsTagRefresh || isPageRefresh;

        if (needsTagRefresh) {
          localStorage.removeItem('trait_tags_needs_refresh');
        }

        const [userResult, sajuResult, tagsResult, tagsCountResult] = await Promise.all([
          supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single(),
          supabase
            .from('saju_records')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: true }),
          // 🚀 태그도 병렬로 로드 (캐시 없거나 refresh 필요 시)
          shouldLoadTags
            ? supabase
                .from('user_trait_tags')
                .select('id, tag_name, created_at')
                .eq('user_id', authUser.id)
                .eq('is_confirmed', true)
                .neq('tag_name', '__SKIPPED__')
                .order('created_at', { ascending: false })
                .limit(3)
            : Promise.resolve({ data: null, error: null }),
          shouldLoadTags
            ? supabase
                .from('user_trait_tags')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', authUser.id)
                .eq('is_confirmed', true)
                .neq('tag_name', '__SKIPPED__')
            : Promise.resolve({ count: null, error: null })
        ]);

        const { data: userData, error: userError } = userResult;
        const { data: sajuList, error: sajuError } = sajuResult;

        // users 처리
        if (userData && !userError) {
          setUser(userData);
          setIsMaster(userData.role === 'master');
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (!userData) {
          // ⭐ 회원가입 미완료 (약관 동의 안하고 스와이프 뒤로가기 등)
          // → 세션만 있고 users 테이블에 데이터 없음 → 세션 삭제 + 로그인 페이지로 리다이렉트
          console.log('⚠️ [ProfilePage] users 데이터 없음 (회원가입 미완료) → 세션 삭제');
          localStorage.removeItem('user');
          localStorage.removeItem('tempUser');
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_cache_checked');
          await supabase.auth.signOut();
          navigate('/login/new', { replace: true });
          return;
        }

        // saju_records 처리
        if (sajuError) {
          console.error('❌ 사주 정보 로드 실패:', sajuError);
          setPrimarySaju(null);
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_records_cache');
          localStorage.removeItem('saju_cache_checked');
        } else if (sajuList && sajuList.length > 0) {
          const primary = sajuList.find((s: any) => s.is_primary) || sajuList[0];
          setPrimarySaju(primary);
          // ⭐ 사주 정보 캐시에 저장 (primary + 전체 리스트)
          localStorage.setItem('primary_saju', JSON.stringify(primary));
          localStorage.setItem('saju_records_cache', JSON.stringify(sajuList));
          localStorage.setItem('saju_cache_checked', 'true'); // 조회 완료 플래그
          console.log('✅ 대표 사주 로드 완료:', primary);
        } else {
          setPrimarySaju(null);
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_records_cache');
          // ⭐ 사주가 없어도 "조회 완료" 플래그 저장 → 다음 방문 시 로딩 스킵
          localStorage.setItem('saju_cache_checked', 'true');
          console.log('📭 등록된 사주 없음 (캐시 체크 완료)');
        }

        // 🚀 trait_tags 처리 (병렬 로드 결과)
        if (shouldLoadTags) {
          const tags = tagsResult.data || [];
          const totalCount = (tagsCountResult as { count: number | null }).count || 0;
          setTraitTags(tags);
          setTotalTagCount(totalCount);
          setIsLoadingTags(false);
          // 캐시 저장
          localStorage.setItem('trait_tags_cache', JSON.stringify({
            tags,
            totalCount,
            timestamp: Date.now()
          }));
          console.log('✅ 나다움 태그 로드 완료 (병렬):', tags.length, '개, 총:', totalCount);
          if (tagsResult.error) {
            console.error('⚠️ 태그 로드 에러 (테이블 미생성 가능):', tagsResult.error.message);
          }
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
        localStorage.removeItem('saju_cache_checked'); // 사주 조회 완료 플래그 삭제
        navigate('/login/new', { replace: true });
        return;
      }
    };

    loadUser();
  }, []);

  // ⭐ 나다움 태그 초기 로드: loadUser()에서 병렬 처리로 통합됨
  // (별도 useEffect 제거 - 중복 API 호출 방지)

  // ⭐ 탭 애니메이션: 보고서 페이지에서 돌아올 때 1→0으로 슬라이드
  useEffect(() => {
    if (activeTabIndex === 1) {
      // 1에서 시작했으면 (보고서에서 돌아옴) 짧은 지연 후 0으로 애니메이션
      const timer = setTimeout(() => {
        setActiveTabIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // ⭐ 스크롤 방향 감지 및 탭 바 표시/숨김
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop;
          const scrollDelta = currentScrollY - lastScrollYRef.current;

          // 스크롤이 최상단에 있으면 항상 탭바 표시
          if (currentScrollY <= 5) { // 5px threshold로 최상단 감지 개선
            setIsTabBarVisible(true);
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // 스크롤이 최하단에 있으면 탭바 상태 변경 안 함 (점핑 방지)
          const scrollHeight = scrollContainer.scrollHeight;
          const clientHeight = scrollContainer.clientHeight;
          const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 80; // 80px threshold로 점핑 방지

          if (isAtBottom) {
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // 스크롤 방향에 따라 탭바 표시/숨김
          // 아래로 스크롤 (scrollDelta > 0) → 숨김
          // 위로 스크롤 (scrollDelta < 0) → 표시
          if (Math.abs(scrollDelta) > 5) { // 5px 이상 스크롤 시에만 반응 (민감도 낮춤)
            setIsTabBarVisible(scrollDelta < 0);
            lastScrollYRef.current = currentScrollY;
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // ⭐ 의견 전달하기: 미읽은 답변 체크
  useEffect(() => {
    const checkUnreadReplies = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const lastViewed = localStorage.getItem('last_viewed_inquiry_reply_at');

        let query = supabase
          .from('customer_inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('status', 'replied');

        if (lastViewed) {
          query = query.gt('replied_at', lastViewed);
        }

        const { count, error } = await query;
        if (!error && (count ?? 0) > 0) {
          setHasUnreadReply(true);
        }
      } catch {
        // 조용히 실패
      }
    };

    checkUnreadReplies();
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
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
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

        {/* ⭐ Tab Bar - 프로필 / 나의 분석 보고서 */}
        <div
          className="bg-white w-full overflow-hidden"
          style={{
            borderBottom: isTabBarVisible ? '1px solid #f8f8f8' : 'none',
            padding: isTabBarVisible ? '8px 16px' : '0 16px',
            maxHeight: isTabBarVisible ? '200px' : '0',
            opacity: isTabBarVisible ? 1 : 0,
            transition: 'max-height 0.25s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0.0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)',
            willChange: 'max-height, opacity',
            zIndex: 10
          }}
        >
          <div className="flex items-center w-full relative">
            {/* 슬라이딩 인디케이터 */}
            <div
              className="absolute bg-[#f8f8f8] rounded-[12px]"
              style={{
                width: '50%',
                height: '36px',
                top: '0',
                left: '0',
                transform: `translateX(${activeTabIndex * 100}%)`,
                transition: 'transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)'
              }}
            />
            {/* 프로필 탭 (선택됨) */}
            <div
              className="flex-1 flex items-center justify-center rounded-[12px] cursor-pointer relative z-10"
              style={{
                padding: '8px 16px'
              }}
              onClick={() => setActiveTabIndex(0)}
            >
              <p
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: activeTabIndex === 0 ? 600 : 500,
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.45px',
                  color: activeTabIndex === 0 ? '#151515' : '#999999',
                  transition: 'color 0.2s ease, font-weight 0.2s ease'
                }}
              >
                프로필
              </p>
            </div>
            {/* 나의 분석 보고서 탭 (선택 안됨) - ⭐ replace: true로 히스토리 교체 (iOS 스와이프 뒤로가기 → 홈) */}
            <div
              className="flex-1 flex items-center justify-center rounded-[12px] cursor-pointer relative z-10"
              style={{
                padding: '8px 16px'
              }}
              onClick={async () => {
                // ⭐ 본인 사주에 phone_number 없고, 아직 바텀시트를 본 적 없으면 1회만 표시
                const alreadyShown = localStorage.getItem('phone_bottomsheet_shown');
                if (!alreadyShown) {
                  const cachedList = JSON.parse(localStorage.getItem('saju_records_cache') || '[]');
                  const mySaju = cachedList.find((s: SajuRecord) => s.notes === '본인');
                  if (mySaju && !mySaju.phone_number) {
                    localStorage.setItem('phone_bottomsheet_shown', 'true');
                    setShowPhoneBottomSheet(true);
                    return;
                  }
                }
                setActiveTabIndex(1);
                // 애니메이션 보여주고 페이지 이동
                setTimeout(() => {
                  // 보고서 페이지로 이동함을 표시 (돌아올 때 애니메이션용)
                  sessionStorage.setItem('from_report_list', 'true');
                  navigate('/my-report-list', { replace: true });
                }, 200);
              }}
            >
              <p
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: activeTabIndex === 1 ? 600 : 500,
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.45px',
                  color: activeTabIndex === 1 ? '#151515' : '#999999',
                  transition: 'color 0.2s ease, font-weight 0.2s ease'
                }}
              >
                나의 분석 보고서
              </p>
            </div>
          </div>
        </div>

        {/* ⭐ Scrollable Content Area - overscroll-y-contain으로 iOS 바운스 방지, overflow-x-hidden으로 좌우 스와이프 방지 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          {/* Min-height wrapper - 스크롤 영역 전체를 채우면서 Footer가 항상 맨 아래에 위치 */}
          <div className="min-h-full flex flex-col">
          {/* Spacer */}
          <div className="h-[10px] shrink-0 w-full" />

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
                    className="content-stretch flex gap-[12px] items-center w-full pb-[8px]"
                  >
                    {/* Profile Image with Shimmer Skeleton (YouTube Style) */}
                    <div className="profile-group relative shrink-0 overflow-hidden bg-[#e5e5e5]" style={{ width: '64px', height: '64px', borderRadius: '16px' }}>
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
                        className="absolute inset-0 max-w-none object-cover rounded-[16px] size-full z-0"
                        loading="lazy"
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
                      />
                    </div>

                    <div className="basis-0 content-stretch flex flex-col gap-[0px] grow items-start min-h-px min-w-px text-nowrap">
                      <p className="font-['Pretendard_Variable:Regular',sans-serif] h-[16px] leading-[16px] overflow-ellipsis overflow-hidden text-[#848484] text-[12px] tracking-[-0.24px] w-full">
                        {formatBirthDate(primarySaju.birth_date, primarySaju.calendar_type)}
                      </p>
                      <p
                        className="min-w-full overflow-ellipsis overflow-hidden w-[min-content]"
                        style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '25px', letterSpacing: '-0.32px', color: '#000000' }}
                      >
                        {primarySaju.full_name} ({primarySaju.notes})
                      </p>
                    </div>
                  </motion.div>

                  {/* 새싹 잔여 + 충전 버튼 */}
                  <motion.div
                    variants={itemVariants}
                    className="shrink-0 w-full"
                    style={{
                      padding: '1px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(85,202,198,0.5) 0%, rgba(120,199,255,0.5) 22%, rgba(255,220,248,0.5) 53%, rgba(120,199,255,0.5) 78%, rgba(85,202,198,0.5) 100%)',
                    }}
                  >
                    <div
                      className="flex items-center w-full"
                      style={{
                        height: '79px',
                        borderRadius: '19px',
                        background: 'linear-gradient(90deg, #F4FEFF 0%, #F7F7FF 100%)',
                        paddingLeft: '24px',
                        paddingRight: '20px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                      }}
                    >
                    <div className="flex flex-1 gap-[8px] items-center">
                      <div className="flex flex-1 flex-col items-start justify-center" style={{ paddingTop: '5px' }}>
                        <div className="flex gap-[3px] items-center justify-center">
                          <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#525252' }}>
                            남은 새싹
                          </span>
                          <svg className="shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.44587 3.97257C8.5912 5.39257 8.85053 7.3679 8.12387 9.1279C8.05853 9.28523 7.91787 9.39857 7.74987 9.42923C7.42987 9.48724 7.10854 9.51523 6.7912 9.51523C5.25453 9.51523 3.8032 8.85257 2.85387 7.67523C1.7092 6.25523 1.44987 4.2799 2.17587 2.51923C2.2412 2.3619 2.38187 2.24857 2.54987 2.2179C4.4212 1.87723 6.30053 2.5519 7.44587 3.97257ZM14.1239 5.85257C14.0585 5.69523 13.9179 5.5819 13.7499 5.55123C12.3219 5.29723 10.8912 5.80657 10.0159 6.89123C9.14187 7.97457 8.94387 9.48124 9.49787 10.8226C9.5632 10.9799 9.70387 11.0932 9.87187 11.1239C10.1159 11.1679 10.3599 11.1899 10.6025 11.1899C11.7739 11.1899 12.8805 10.6832 13.6052 9.78523C14.4799 8.7019 14.6779 7.19523 14.1239 5.85323V5.85257Z" fill="#97D729"/>
                            <path d="M11.7023 8.3276C11.5163 8.12494 11.2003 8.1116 10.9956 8.29827C10.0336 9.18227 9.2143 10.1829 8.53564 11.2669C8.45164 10.4116 8.2363 9.4556 7.79097 8.4616C7.00364 6.70694 5.82164 5.57427 4.9683 4.93294C4.74697 4.7656 4.43364 4.8116 4.2683 5.03227C4.1023 5.25294 4.14697 5.56627 4.36764 5.73227C5.12697 6.30227 6.1783 7.31027 6.8783 8.87027C7.65697 10.6063 7.64964 12.2176 7.50564 13.2649C7.50497 13.2709 7.51097 13.2756 7.51097 13.2809C7.48897 13.4923 7.59697 13.7023 7.8023 13.7916C7.86764 13.8196 7.93497 13.8329 8.00164 13.8329C8.1943 13.8329 8.3783 13.7203 8.4603 13.5323C8.65097 13.0923 8.8663 12.6596 9.1023 12.2476C9.77964 11.0616 10.6436 9.98094 11.673 9.03427C11.8763 8.8476 11.889 8.53094 11.7023 8.3276Z" fill="#79AD22"/>
                          </svg>
                        </div>
                        <div className="flex flex-col items-start justify-center w-full">
                          <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }}>
                            {sproutBalance ?? 0}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => navigate('/sprout-charging/profile', { state: { requiredAmount: 30, currentBalance: sproutBalance ?? 0 } })}
                        className="flex items-center justify-center rounded-full border-none cursor-pointer shrink-0"
                        style={{ background: 'linear-gradient(90deg, #5AC7EA 0%, #80A3F9 47%, #A795FE 99%)', height: '38px', width: '94px', paddingLeft: '12px', paddingRight: '12px', transformOrigin: 'center center', willChange: 'transform' }}
                        whileTap={{ scale: 0.99, y: 0 }}
                      >
                        <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.42px', color: '#fff' }}>
                          새싹 충전
                        </span>
                      </motion.button>
                    </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                // 사주 정보 없음 - Fragment 제거하고 바로 motion 요소들 렌더링
                [
                  // Icon & Text Group (29px top padding, 17px gap between icon and text)
                  <motion.div
                    key="icon-text-group"
                    variants={itemVariants}
                    className="flex flex-col items-center w-full"
                    style={{ paddingTop: '29px', gap: '17px' }}
                  >
                    <div style={{ paddingTop: '3px' }}>
                      <ProfileIcon />
                    </div>
                    <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#b7b7b7' }} className="w-full">
                        사주 정보가 아직 없어요
                      </p>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
                        사주를 등록하면 운세 풀이가 시작돼요
                      </p>
                    </div>
                  </motion.div>,

                  // Button
                  <motion.button
                    key="register-button"
                    variants={itemVariants}
                    onClick={handleSajuMenuClick}
                    disabled={isCheckingSaju}
                    whileTap={{ scale: 0.99 }}
                    className="bg-[#48b2af] shrink-0 w-full cursor-pointer border-none transition-colors disabled:opacity-50 active:bg-[#389998]"
                    style={{ height: '48px', borderRadius: '12px', marginTop: '36px', marginBottom: '20px' }}
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
                  {traitTags.length > 0 ? (
                    /* 태그가 있을 때 - 태그 카드 표시 */
                    <motion.div
                      variants={itemVariants}
                      style={{ width: 'calc(100% + 40px)', marginLeft: '-20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '4px', paddingBottom: '4px' }}
                    >
                      <div
                        className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                        onClick={() => {
                          navigate('/profile/nadaum-tags');
                        }}
                      >
                        <div className="flex flex-col gap-[2px] flex-1">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-[8px]">
                              <div className="relative shrink-0 size-[20px]">
                                <TagIcon />
                              </div>
                              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                                나의 성향 태그
                              </p>
                            </div>
                            <div className="relative shrink-0 size-[16px]" style={{ transform: 'translateY(1px)' }}>
                              <MenuArrowRightIcon />
                            </div>
                          </div>

                          {/* Tags - 실제 DB 데이터 (1줄 유지: 글자 수에 따라 2~3개) */}
                          <div className="flex flex-nowrap gap-[4px] w-full">
                            {traitTags.slice(0, visibleTagCount).map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center justify-center rounded-[999px] shrink-0"
                                style={{ backgroundColor: '#f0f8f8', padding: '3px 7px' }}
                              >
                                <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '11.5px', lineHeight: '16px', letterSpacing: '-0.02em', color: '#368683', whiteSpace: 'nowrap' }}>
                                  # {tag.tag_name}
                                </p>
                              </div>
                            ))}
                            {/* +N 텍스트 - 표시된 개수보다 많으면 표시 */}
                            {totalTagCount > visibleTagCount && (
                              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '11.5px', lineHeight: '16px', letterSpacing: '-0.02em', color: '#368683', padding: '4px 0 3px 0', whiteSpace: 'nowrap' }}>
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
                      style={{ width: 'calc(100% + 40px)', marginLeft: '-20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '4px', paddingBottom: '4px' }}
                    >
                      <div
                        className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
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
                        <div className="relative shrink-0 size-[16px]" style={{ transform: 'translateY(1px)' }}>
                          <MenuArrowRightIcon />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Divider */}
                  <motion.div
                    variants={itemVariants}
                    className="h-[4px] -mx-[20px]"
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
                      className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                      style={{ width: '100%' }}
                      onClick={onNavigateToMasterContent}
                    >
                      <div className="flex items-center gap-[8px]">
                        <div className="relative shrink-0 size-[20px]">
                          <PenSquare size={18} className="text-black" />
                        </div>
                        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                          콘텐츠 만들기
                        </p>
                      </div>
                      <div className="relative shrink-0 size-[16px]">
                        <MenuArrowRightIcon />
                      </div>
                    </motion.div>
                  )}
                  {/* 1-2. 통계 대시보드 (마스터 전용) */}
                  {isMaster && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                      style={{ width: '100%', marginTop: '-6px' }}
                      onClick={onNavigateToStatsDashboard}
                    >
                      <div className="flex items-center gap-[8px]">
                        <div className="relative shrink-0 size-[20px]">
                          <BarChart3 size={18} className="text-black" />
                        </div>
                        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                          통계 대시보드
                        </p>
                      </div>
                      <div className="relative shrink-0 size-[16px]">
                        <MenuArrowRightIcon />
                      </div>
                    </motion.div>
                  )}
                  {/* 1-3. 문의 관리 (마스터 전용) */}
                  {isMaster && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                      style={{ width: '100%', marginTop: '-6px' }}
                      onClick={() => navigate('/master/inquiries', { state: { canGoBack: true } })}
                    >
                      <div className="flex items-center gap-[8px]">
                        <div className="relative shrink-0 size-[20px]">
                          <MessageCircleIcon />
                        </div>
                        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                          문의 관리
                        </p>
                      </div>
                      <div className="relative shrink-0 size-[16px]">
                        <MenuArrowRightIcon />
                      </div>
                    </motion.div>
                  )}
                  {/* 2. 이용 기록 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '8px' }}
                    onClick={onNavigateToPurchaseHistory}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0" style={{ width: '21.5px', height: '21.5px', paddingTop: '1px' }}>
                        <ReceiptIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>이용 기록</p>
                    </div>
                    <div className="relative shrink-0 size-[16px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 3. 사주 정보 관리 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '-6px' }}
                    onClick={handleSajuMenuClick}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <FolderIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>사주 정보 관리</p>
                    </div>
                    <div className="relative shrink-0 size-[16px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 4. 만세력 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '-6px' }}
                    onClick={() => {
                      if (onNavigateToManse) {
                        onNavigateToManse();
                      }
                    }}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0" style={{ width: '21px', height: '21px', marginTop: '1px' }}>
                        <ManseIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>만세력</p>
                    </div>
                    <div className="relative shrink-0 size-[16px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 5. 운세 콘텐츠 (블로그) */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '-6px' }}
                    onClick={onNavigateToBlog}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <BlogIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>운세 콘텐츠</p>
                    </div>
                    <div className="relative shrink-0 size-[16px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 5. 의견 전달하기 (문의 내역으로 이동) */}
                  <motion.div
                    variants={itemVariants}
                    onClick={() => navigate('/inquiry', { state: { canGoBack: true } })}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '-6px' }}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <MessageCircleIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>의견 전달하기</p>
                      {hasUnreadReply && (
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#6AC9C6', marginTop: '-7px' }} />
                      )}
                    </div>
                    <div className="relative shrink-0 size-[16px]">
                      <MenuArrowRightIcon />
                    </div>
                  </motion.div>
                  {/* 5. 로그아웃 */}
                  <motion.div
                    variants={itemVariants}
                    onClick={handleLogoutClick}
                    className="flex items-center justify-between px-[16px] py-[12px] rounded-[16px] cursor-pointer hover-bg-gray active:bg-[#f9f9f9] transition-colors"
                    style={{ width: '100%', marginTop: '-6px' }}
                  >
                    <div className="flex items-center gap-[8px]">
                      <div className="relative shrink-0 size-[20px]">
                        <LogoutIcon />
                      </div>
                      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>로그아웃</p>
                    </div>
                    <div className="relative shrink-0 size-[16px]">
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
          <div className="shrink-0" style={{ marginBottom: 80 }}>
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
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="로그아웃하시겠어요?"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
      </div>

      {/* ⭐ 핸드폰 번호 입력 바텀시트 */}
      <AnimatePresence>
        {showPhoneBottomSheet && (
          <ReceiveMyAnalysis
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            isLoading={isPhoneSaving}
            onClose={() => {
              setShowPhoneBottomSheet(false);
              // 닫기(스킵) 후 보고서 페이지로 이동
              setActiveTabIndex(1);
              setTimeout(() => {
                sessionStorage.setItem('from_report_list', 'true');
                navigate('/my-report-list', { replace: true });
              }, 200);
            }}
            onSave={async () => {
              setIsPhoneSaving(true);
              try {
                const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                  console.error('❌ [ProfilePage] 세션 없음');
                  setIsPhoneSaving(false);
                  return;
                }

                // ⭐ notes='본인' 사주에 전화번호 저장 (대표사주가 지인일 수 있으므로)
                const cachedList = JSON.parse(localStorage.getItem('saju_records_cache') || '[]');
                const mySaju = cachedList.find((s: SajuRecord) => s.notes === '본인');
                if (!mySaju) {
                  console.error('❌ [ProfilePage] 본인 사주를 찾을 수 없음');
                  setIsPhoneSaving(false);
                  return;
                }

                const { error } = await supabase
                  .from('saju_records')
                  .update({ phone_number: cleanPhone })
                  .eq('id', mySaju.id)
                  .eq('user_id', authUser.id);

                if (error) {
                  console.error('❌ [ProfilePage] 핸드폰 번호 저장 실패:', JSON.stringify(error));
                  setIsPhoneSaving(false);
                  return;
                }

                console.log('✅ [ProfilePage] 본인 사주에 핸드폰 번호 저장 성공:', cleanPhone);

                // 캐시 무효화 - saju_cache_checked도 제거해야 다음 방문 시 API 재호출
                localStorage.removeItem('primary_saju');
                localStorage.removeItem('saju_records_cache');
                localStorage.removeItem('saju_cache_checked');

                setShowPhoneBottomSheet(false);
                setIsPhoneSaving(false);

                // 보고서 페이지로 이동
                setActiveTabIndex(1);
                setTimeout(() => {
                  sessionStorage.setItem('from_report_list', 'true');
                  navigate('/my-report-list', { replace: true });
                }, 200);
              } catch (err) {
                console.error('❌ [ProfilePage] 핸드폰 번호 저장 예외:', err);
                setIsPhoneSaving(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      <BottomTabBar />
    </>
  );
}