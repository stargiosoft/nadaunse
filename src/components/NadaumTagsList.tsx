import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from "sonner";
import FeedbackToast from "@/imports/FeedbackToast-17-10455";
import svgPathsBase from '@/imports/svg-o5jcc01aog';
import svgPathsHome from '@/imports/svg-rr05b2c3l6';
import svgPathsClose from '@/imports/svg-8tqadibmpl';
import EmptyContent from "@/imports/EmptyContent";
import imgImage from "@/assets/13545c727434815b8ecda334fd9e453f4a0ea3ac.png";
import { supabase } from '@/lib/supabase';
import { COMFORT_QUOTES } from '@/data/comfortQuotes';
import { DEV } from '@/lib/env'; // ⭐ 개발 환경 체크

// 태그 타입 정의
interface TraitTag {
  id: string;
  user_id: string;
  tag_name: string;
  tag_type: 'positive' | 'negative' | 'neutral';
  source_type: 'free_content' | 'paid_content';
  source_content_id: string | null;
  source_order_id: string | null;
  created_at: string;
}

// Combine all paths
const svgPaths = {
  ...svgPathsBase,
  ...svgPathsHome,
  ...svgPathsClose,
  p2fa24d00: "M2 4.5L6 8.5L10 4.5",
  p10ab6100: "M2 7.5L6 3.5L10 7.5",
  p19b5fe00: "M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z",
};

interface NadaumTagsListProps {
  onBack: () => void;
  onHome: () => void;
}

function Container({ quote }: { quote: string }) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '4px' }}>
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#6d6d6d', letterSpacing: '-0.24px' }} className="w-full overflow-hidden text-ellipsis whitespace-nowrap">오늘의 한 줄 위로</p>
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', color: '#000000', letterSpacing: '-0.3px' }} className="w-full">{quote}</p>
    </div>
  );
}

function Container1({ quote }: { quote: string }) {
  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.94)' }}>
      <div className="flex flex-col items-start relative w-full" style={{ padding: '16px 20px' }}>
        <Container quote={quote} />
      </div>
    </div>
  );
}

function ImageSection({ quote }: { quote: string }) {
  return (
    <div className="flex flex-col items-start justify-end relative shrink-0 w-full" style={{ height: '270px', padding: '16px 20px' }}>
      <img alt="나다움 태그 배경" className="absolute inset-0 max-w-none object-cover pointer-events-none" style={{ width: '100%', height: '100%' }} src={imgImage} />
      <Container1 quote={quote} />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-center relative w-full" style={{ padding: '12px 20px 1px 20px' }}>
          <div className="flex flex-col justify-center relative shrink-0">
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 600, fontSize: '18px', lineHeight: '24px', color: '#000000', letterSpacing: '-0.36px' }}>나의 성향 태그</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const prevActiveTabRef = useRef(activeTab);

  useEffect(() => {
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '1px', backgroundColor: '#f8f8f8' }} />
      <div className="sticky top-0 z-50 bg-white flex items-center w-full border-b" style={{ padding: '0 20px', borderColor: '#f8f8f8' }}>
        {[
          { id: 'strong', label: '강한 모습' },
          { id: 'delicate', label: '섬세한 모습' }
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center justify-center relative shrink-0"
              style={{ padding: '12px 16px' }}
            >
              {isActive && (
                <motion.div
                  layoutId="nadaum-tag-tab-indicator"
                  initial={false}
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{ height: '1.5px', backgroundColor: '#48b2af' }}
                  transition={prevActiveTabRef.current !== activeTab ? { type: "spring", stiffness: 500, damping: 30 } : { duration: 0 }}
                />
              )}
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: isActive ? 600 : 400,
                fontSize: '15px',
                lineHeight: '20px',
                color: isActive ? '#48b2af' : '#999999',
                letterSpacing: '-0.45px'
              }}>
                {item.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TagItemProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function TagItem({ label, isSelected, onSelect, onDelete }: TagItemProps) {
  // Touch handling refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const isScrollRef = useRef(false);
  const touchHandledRef = useRef(false); // 터치 후 중복 클릭 방지

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      isScrollRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const xDiff = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const yDiff = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (xDiff > 10 || yDiff > 10) {
      isScrollRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrollRef.current) {
      touchStartRef.current = null;
      isScrollRef.current = false;
      return;
    }
    const target = e.target as HTMLElement;
    const isDeleteButton = target.closest('[data-delete-button]');

    // 터치 처리됨 표시 (클릭 이벤트 무시용)
    touchHandledRef.current = true;
    setTimeout(() => { touchHandledRef.current = false; }, 300);

    if (isDeleteButton) {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    } else {
      e.preventDefault();
      onSelect();
    }
    touchStartRef.current = null;
    isScrollRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    // 터치 이벤트 후 발생하는 클릭은 무시
    if (touchHandledRef.current) return;
    if (e.detail === 0) return;

    const target = e.target as HTMLElement;
    const isDeleteButton = target.closest('[data-delete-button]');

    if (isDeleteButton) {
      e.stopPropagation();
      onDelete();
    } else {
      onSelect();
    }
  };

  return (
    <div
      className="relative shrink-0"
      style={{ zIndex: isSelected ? 20 : 1 }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center cursor-pointer relative transition-all duration-200"
        style={{
          padding: '10px 16px',
          borderRadius: '99px',
          width: 'max-content',
          touchAction: 'pan-y',
          backgroundColor: isSelected ? '#ffffff' : '#f9f9f9',
          border: isSelected ? '1.5px solid #48b2af' : '1.5px solid transparent'
        }}
      >
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#151515', letterSpacing: '-0.42px' }}>
          {label}
        </p>
      </div>

      {/* X 버튼 - 태그 오른쪽 중앙에 겹쳐서 표시 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            data-delete-button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 flex items-center justify-center cursor-pointer"
            style={{
              width: '18px',
              height: '18px',
              top: '50%',
              right: '-6px',
              marginTop: '-9px'
            }}
          >
            <div
              className="flex items-center justify-center rounded-full shadow-sm"
              style={{ width: '18px', height: '18px', backgroundColor: '#ff6678' }}
            >
              <svg className="block" style={{ width: '10px', height: '10px' }} fill="none" viewBox="0 0 10 10">
                <path d="M2.5 2.5L7.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M7.5 2.5L2.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoreTagItem({ count }: { count: number }) {
  return (
    <div className="flex items-center relative shrink-0" style={{ padding: '12px 4px 10px 4px', borderRadius: '99px', gap: '8px' }}>
       <div className="flex flex-col justify-center relative shrink-0">
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#999999', letterSpacing: '-0.42px' }}>+{count}</p>
      </div>
    </div>
  );
}

interface TagContainerProps {
  isExpanded: boolean;
  tagType: 'positive' | 'negative';
  tags: TraitTag[];
  onDeleteTag: (tag: TraitTag, index: number) => void;
  onRestoreTag: (tag: TraitTag, index: number) => void;
}

function TagContainer({ isExpanded, tagType, tags, onDeleteTag, onRestoreTag }: TagContainerProps) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deletingRef = useRef<Set<string>>(new Set()); // 삭제 중인 태그 ID 추적

  // 🔧 Stale closure 방지: 항상 최신 onRestoreTag 호출
  const onRestoreTagRef = useRef(onRestoreTag);
  useEffect(() => {
    onRestoreTagRef.current = onRestoreTag;
  }, [onRestoreTag]);

  // Handle outside click/touch to deselect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only deselect if we're not clicking on the toast or other critical elements
        const target = event.target as Element;
        if (!target.closest('[data-sonner-toaster]')) {
             setSelectedTagId(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleDelete = (tagToDelete: TraitTag) => {
    // 이미 삭제 중인 태그는 무시 (중복 방지)
    if (deletingRef.current.has(tagToDelete.id)) {
      return;
    }
    deletingRef.current.add(tagToDelete.id);

    const index = tags.findIndex(t => t.id === tagToDelete.id);
    onDeleteTag(tagToDelete, index);

    if (selectedTagId === tagToDelete.id) {
      setSelectedTagId(null);
    }

    // 고유 토스트 ID로 중복 방지
    const toastId = `delete-tag-${tagToDelete.id}`;

    // Custom toast with Undo (2.2초 = 2200ms)
    toast.custom((t) => (
      <div className="w-full flex justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="w-fit">
          <div className="flex items-center" style={{ padding: '6px 11px 6px 8px', borderRadius: '9999px', gap: '6px', backgroundColor: 'rgba(0, 0, 0, 0.40)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <div className="relative shrink-0" style={{ width: '23px', height: '23px', overflow: 'hidden' }}>
               <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                 <path d={svgPaths.p19b5fe00} fill="#46BB6F" />
               </svg>
            </div>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '13px', lineHeight: '22px', color: '#ffffff', whiteSpace: 'nowrap' }}>
              태그가 삭제되었어요
            </p>
            <button
              onClick={() => {
                // 🔧 ref를 통해 항상 최신 함수 호출 (stale closure 방지)
                onRestoreTagRef.current(tagToDelete, index);
                toast.dismiss(t);
                deletingRef.current.delete(tagToDelete.id);
              }}
              style={{ fontFamily: 'Pretendard Variable', fontWeight: 600, fontSize: '13px', color: '#48b2af', marginLeft: '4px', whiteSpace: 'nowrap' }}
              className="active:opacity-70 transition-opacity"
            >
              실행 취소
            </button>
          </div>
        </div>
      </div>
    ), {
      id: toastId,
      duration: 2200, // 기획서: 2.2초
      unstyled: true,
      position: 'bottom-center',
      onDismiss: () => {
        // 토스트가 사라지면 삭제 완료로 간주
        deletingRef.current.delete(tagToDelete.id);
      }
    });
  };

  const handleSelect = (tagId: string) => {
    setSelectedTagId(prev => (prev === tagId ? null : tagId));
  };

  const visibleTags = tags.slice(0, 7);
  const hiddenTags = tags.slice(7);
  const remainingCount = tags.length - 7;

  return (
    <div className="flex flex-col w-full items-start" ref={containerRef}>
      <motion.div className="flex items-center w-full relative z-10" style={{ flexWrap: 'wrap', gap: '10px 8px', padding: '0 20px' }}>
        {/* Render visible tags */}
        {visibleTags.map((tag) => (
          <TagItem
            key={tag.id}
            label={tag.tag_name}
            isSelected={selectedTagId === tag.id}
            onSelect={() => handleSelect(tag.id)}
            onDelete={() => handleDelete(tag)}
          />
        ))}

        {/* Dynamic content: either More button or Hidden tags */}
        <AnimatePresence mode="popLayout">
          {!isExpanded && remainingCount > 0 && (
            <motion.div
              key="more-tag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MoreTagItem count={remainingCount} />
            </motion.div>
          )}

          {isExpanded && hiddenTags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="shrink-0"
            >
              <TagItem
                label={tag.tag_name}
                isSelected={selectedTagId === tag.id}
                onSelect={() => handleSelect(tag.id)}
                onDelete={() => handleDelete(tag)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ButtonTextButton({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center relative shrink-0 transition-colors active:bg-gray-100"
      style={{ height: '34px', padding: '0 8px', borderRadius: '12px', gap: '4px' }}
    >
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#848484', letterSpacing: '-0.42px' }}>
        {isExpanded ? '접기' : '더보기'}
      </p>
      <div className="relative shrink-0" style={{ width: '12px', height: '12px' }}>
        <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <path
            d={isExpanded ? svgPaths.p10ab6100 : svgPaths.p2fa24d00}
            stroke="#848484"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth="1.7"
          />
        </svg>
      </div>
    </button>
  );
}

function MoreSection({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col items-center relative shrink-0 w-full" style={{ gap: '8px' }}>
      <div className="h-px w-full" style={{ backgroundColor: '#F8F8F8' }} />
      <ButtonTextButton isExpanded={isExpanded} onClick={onToggle} />
    </div>
  );
}

interface NadaumTagsListInternalProps {
  tagType: 'positive' | 'negative';
  tags: TraitTag[];
  isLoading: boolean;
  onDeleteTag: (tag: TraitTag, index: number) => void;
  onRestoreTag: (tag: TraitTag, index: number) => void;
}

function NadaumTagsListInternal({ tagType, tags, isLoading, onDeleteTag, onRestoreTag }: NadaumTagsListInternalProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 태그 타입이 바뀔 때 접힌 상태로 리셋
  useEffect(() => {
    setIsExpanded(false);
  }, [tagType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#48b2af] border-t-transparent" />
      </div>
    );
  }

  if (tags.length === 0) {
    return <EmptyContent />;
  }

  return (
    <div className="flex flex-col items-start relative shrink-0 w-full">
      <div className="relative shrink-0 w-full">
        <div className="flex flex-col items-start relative w-full" style={{ padding: '12px 0' }}>
          <TagContainer
            isExpanded={isExpanded}
            tagType={tagType}
            tags={tags}
            onDeleteTag={onDeleteTag}
            onRestoreTag={onRestoreTag}
          />
        </div>
      </div>
      {tags.length > 7 && (
        <MoreSection isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
      )}
    </div>
  );
}

export default function NadaumTagsList({ onBack, onHome }: NadaumTagsListProps) {
  // 🎯 오늘의 한 줄 위로 - 마운트 시 1회 랜덤 선택
  const [randomQuote] = useState(() =>
    COMFORT_QUOTES[Math.floor(Math.random() * COMFORT_QUOTES.length)]
  );

  // 🎨 헤더 버튼 터치 상태 (모바일 피드백용)
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  const [homeButtonPressed, setHomeButtonPressed] = useState(false);

  // 🧪 DEV 모드: 강제로 빈 상태로 만들기 위한 플래그
  const [devForceEmpty, setDevForceEmpty] = useState<'strong' | 'delicate' | null>(null);

  // 🚀 동기적 캐시 확인 (초기화 시점) - 로딩 플래시 방지
  const getInitialState = () => {
    try {
      const cachedJson = localStorage.getItem('nadaum_all_tags_cache');
      if (cachedJson) {
        const cache = JSON.parse(cachedJson);
        const EXPIRY_MS = 5 * 60 * 1000; // 5분
        if (Date.now() - cache.timestamp < EXPIRY_MS) {
          // ⭐ __SKIPPED__ 마커 제외
          const filteredTags = (cache.tags || []).filter(
            (tag: TraitTag) => tag.tag_name !== '__SKIPPED__'
          );
          console.log('🚀 [NadaumTagsList] 캐시에서 로드:', filteredTags.length, '개');
          return {
            tags: filteredTags,
            isLoading: false,
            hasCache: true
          };
        }
      }
    } catch (e) {
      console.error('❌ [NadaumTagsList] 캐시 파싱 실패:', e);
    }
    return { tags: [], isLoading: true, hasCache: false };
  };

  const initialState = getInitialState();

  const [activeTab, setActiveTab] = useState('strong');
  const [allTags, setAllTags] = useState<TraitTag[]>(initialState.tags);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);

  // 🔧 Stale closure 방지: 항상 최신 allTags에 접근
  const allTagsRef = useRef(allTags);
  useEffect(() => {
    allTagsRef.current = allTags;
  }, [allTags]);

  // DB에서 태그 데이터 가져오기
  const fetchTags = useCallback(async () => {
    try {
      // 🚀 캐시가 있고 refresh 불필요하면 API 호출 스킵
      const needsRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';
      if (initialState.hasCache && !needsRefresh) {
        console.log('✅ [NadaumTagsList] 유효한 캐시 존재 → API 호출 스킵');
        return;
      }

      if (needsRefresh) {
        localStorage.removeItem('trait_tags_needs_refresh');
        console.log('🔄 [NadaumTagsList] refresh 플래그 감지 → API 호출');
      }

      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('사용자 인증 필요');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_trait_tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_confirmed', true)  // ⭐ 확정된 태그만 조회
        .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
        .order('created_at', { ascending: false });

      if (error) {
        console.error('태그 조회 실패:', error);
        return;
      }

      setAllTags(data || []);

      // 🚀 캐시에 저장 (만료 시간 포함)
      localStorage.setItem('nadaum_all_tags_cache', JSON.stringify({
        tags: data || [],
        timestamp: Date.now()
      }));
      console.log('✅ [NadaumTagsList] 태그 로드 및 캐시 저장:', data?.length, '개');
    } catch (err) {
      console.error('태그 조회 중 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialState.hasCache]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // 태그 타입에 따른 필터링 (positive = 강한 모습, negative = 섬세한 모습)
  const currentTagType = activeTab === 'strong' ? 'positive' : 'negative';
  let filteredTags = allTags.filter(tag => tag.tag_type === currentTagType);

  // 🧪 DEV 모드: 강제로 빈 상태로 표시
  if (DEV && devForceEmpty) {
    if ((devForceEmpty === 'strong' && activeTab === 'strong') ||
        (devForceEmpty === 'delicate' && activeTab === 'delicate')) {
      filteredTags = [];
    }
  }

  // 🚀 캐시 업데이트 헬퍼 함수
  const updateCache = useCallback((newTags: TraitTag[]) => {
    console.log('🔄 [NadaumTagsList] updateCache 호출 - 태그 수:', newTags.length);
    const now = Date.now();

    // 🔧 중복 제거 (id 기준)
    const uniqueTags = newTags.filter((tag, index, self) =>
      index === self.findIndex(t => t.id === tag.id)
    );

    // NadaumTagsList 전체 캐시 업데이트
    localStorage.setItem('nadaum_all_tags_cache', JSON.stringify({
      tags: uniqueTags,
      timestamp: now
    }));

    // 🚀 ProfilePage 캐시도 직접 업데이트 (API 호출 없이 즉시 반영)
    // ProfilePage는 최신 3개 태그 + 전체 개수를 표시
    const sortedTags = [...uniqueTags].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const top3Tags = sortedTags.slice(0, 3).map(tag => ({
      id: tag.id,
      tag_name: tag.tag_name
    }));

    localStorage.setItem('trait_tags_cache', JSON.stringify({
      tags: top3Tags,
      totalCount: uniqueTags.length,
      timestamp: now
    }));

    // refresh 플래그는 이제 불필요 (캐시가 이미 최신)
    localStorage.removeItem('trait_tags_needs_refresh');
    console.log('✅ [NadaumTagsList] ProfilePage 캐시 직접 업데이트 완료 - 중복 제거 후:', uniqueTags.length);
  }, []);

  // 태그 삭제 핸들러
  const handleDeleteTag = useCallback(async (tagToDelete: TraitTag, index: number) => {
    // 🔧 ref를 사용하여 항상 최신 allTags 접근
    const currentTags = allTagsRef.current;

    // Optimistic update - UI에서 먼저 제거
    const newTags = currentTags.filter(tag => tag.id !== tagToDelete.id);
    setAllTags(newTags);
    updateCache(newTags);

    // DB에서 삭제
    const { error } = await supabase
      .from('user_trait_tags')
      .delete()
      .eq('id', tagToDelete.id);

    if (error) {
      console.error('태그 삭제 실패:', error);
      // 실패 시 복원
      const restoredTags = [...newTags];
      restoredTags.splice(index, 0, tagToDelete);
      setAllTags(restoredTags);
      updateCache(restoredTags);
    } else {
      // 🚀 삭제 성공 시 나의 분석 보고서 캐시도 무효화
      localStorage.setItem('my_report_needs_refresh', 'true');
    }
  }, [updateCache]);

  // 태그 복원 핸들러 (실행 취소)
  const handleRestoreTag = useCallback(async (tagToRestore: TraitTag, _index: number) => {
    // 🔧 ref를 사용하여 항상 최신 allTags 접근 (stale closure 방지)
    const currentTags = allTagsRef.current;

    // DB에 다시 삽입 (확정된 상태로)
    const { data, error } = await supabase
      .from('user_trait_tags')
      .insert({
        user_id: tagToRestore.user_id,
        tag_name: tagToRestore.tag_name,
        tag_type: tagToRestore.tag_type,
        source_type: tagToRestore.source_type,
        source_content_id: tagToRestore.source_content_id,
        source_order_id: tagToRestore.source_order_id,
        is_confirmed: true,  // ⭐ 복원 시 확정 상태로
      })
      .select()
      .single();

    if (error) {
      console.error('태그 복원 실패:', error);
      // 원래 태그로 UI 복원 시도 - 배열 앞에 추가 후 정렬에 맡김
      const restoredTags = [tagToRestore, ...currentTags];
      setAllTags(restoredTags);
      updateCache(restoredTags);
    } else if (data) {
      // 새로 생성된 태그로 UI 업데이트 - 배열 앞에 추가 (새 created_at이므로 가장 최신)
      const restoredTags = [data, ...currentTags];
      setAllTags(restoredTags);
      updateCache(restoredTags);
      // 🚀 복원 성공 시 나의 분석 보고서 캐시도 무효화
      localStorage.setItem('my_report_needs_refresh', 'true');
    }
  }, [updateCache]);

  return (
    <div className="bg-white fixed inset-0 z-50 flex flex-col mx-auto w-full" style={{ maxWidth: '440px' }}>
      {/* Top Navigation */}
      <div className="bg-white relative shrink-0 w-full z-10" style={{ height: '52px' }}>
        <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
          <div className="flex items-center justify-between relative" style={{ padding: '4px 12px', width: '100%', height: '100%' }}>
            {/* Left Action (Back) */}
            <button
              onClick={() => {
                // 태그 변경 시 ProfilePage에 알림
                console.log('🔙 [NadaumTagsList] 뒤로가기 클릭 - tagsModified 이벤트 발생');
                window.dispatchEvent(new CustomEvent('tagsModified'));
                onBack();
              }}
              onTouchStart={() => setBackButtonPressed(true)}
              onTouchEnd={() => setTimeout(() => setBackButtonPressed(false), 100)}
              onTouchCancel={() => setTimeout(() => setBackButtonPressed(false), 100)}
              onMouseDown={() => setBackButtonPressed(true)}
              onMouseUp={() => setBackButtonPressed(false)}
              onMouseLeave={() => setBackButtonPressed(false)}
              className="group flex items-center justify-center relative shrink-0 hover:bg-gray-100 transition-colors duration-200"
              style={{
                padding: '4px',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                WebkitTapHighlightColor: 'transparent',
                backgroundColor: backButtonPressed ? '#F8F8F8' : 'transparent'
              }}
            >
              <div className="relative shrink-0 transition-transform duration-200 group-active:scale-90" style={{ width: '24px', height: '24px' }}>
                 <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                </svg>
              </div>
            </button>

            {/* Title */}
            <p className="flex-[1_0_0] text-center overflow-hidden text-ellipsis" style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              color: '#000000',
              letterSpacing: '-0.36px'
            }}>
              나다움 태그
            </p>

            {/* Right Action (Home) */}
            <button
              onClick={onHome}
              onTouchStart={() => setHomeButtonPressed(true)}
              onTouchEnd={() => setTimeout(() => setHomeButtonPressed(false), 100)}
              onTouchCancel={() => setTimeout(() => setHomeButtonPressed(false), 100)}
              onMouseDown={() => setHomeButtonPressed(true)}
              onMouseUp={() => setHomeButtonPressed(false)}
              onMouseLeave={() => setHomeButtonPressed(false)}
              className="group flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] hover:bg-gray-100 transition-colors duration-200"
              style={{
                WebkitTapHighlightColor: 'transparent',
                backgroundColor: homeButtonPressed ? '#F8F8F8' : 'transparent'
              }}>
              <div className="relative shrink-0 transition-transform duration-200 group-active:scale-90" style={{ width: '24px', height: '24px' }}>
                 <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p3d07f180} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d="M12 17.99V14.99" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden" style={{ paddingBottom: '40px' }}>
        <div className="flex flex-col items-start relative w-full" style={{ gap: '12px' }}>
          <ImageSection quote={randomQuote} />
          <div className="flex flex-col items-start relative shrink-0 w-full">
            <div className="flex flex-col items-start relative shrink-0 w-full">
              <Container2 />
            </div>
            <div className="sticky top-0 z-40 bg-white w-full">
              <Tab activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className={`flex flex-col items-center justify-start relative shrink-0 w-full ${filteredTags.length === 0 && !isLoading ? 'min-h-[calc(100vh-100px)]' : ''}`}>
              <NadaumTagsListInternal
                tagType={currentTagType}
                tags={filteredTags}
                isLoading={isLoading}
                onDeleteTag={handleDeleteTag}
                onRestoreTag={handleRestoreTag}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🧪 DEV 전용 - 빈 상태 테스트 버튼 */}
      {DEV && (
        <div
          className="w-full bg-white"
          style={{
            padding: '12px 20px',
            marginTop: '24px'
          }}
        >
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                setDevForceEmpty(devForceEmpty === 'strong' ? null : 'strong');
                setActiveTab('strong');
              }}
              className="flex-1 flex items-center justify-center transition-colors"
              style={{
                height: '36px',
                borderRadius: '10px',
                backgroundColor: devForceEmpty === 'strong' ? '#ff6678' : '#48b2af',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: '18px',
                  letterSpacing: '-0.26px',
                  color: '#ffffff',
                }}
              >
                {devForceEmpty === 'strong' ? '✓ ' : ''}강한 모습 빈 상태
              </span>
            </button>

            <button
              onClick={() => {
                setDevForceEmpty(devForceEmpty === 'delicate' ? null : 'delicate');
                setActiveTab('delicate');
              }}
              className="flex-1 flex items-center justify-center transition-colors"
              style={{
                height: '36px',
                borderRadius: '10px',
                backgroundColor: devForceEmpty === 'delicate' ? '#ff6678' : '#48b2af',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: '18px',
                  letterSpacing: '-0.26px',
                  color: '#ffffff',
                }}
              >
                {devForceEmpty === 'delicate' ? '✓ ' : ''}섬세한 모습 빈 상태
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
