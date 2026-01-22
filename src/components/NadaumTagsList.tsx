import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import FeedbackToast from "@/imports/FeedbackToast-17-10455";
import svgPathsBase from '@/imports/svg-o5jcc01aog';
import svgPathsHome from '@/imports/svg-rr05b2c3l6';
import svgPathsClose from '@/imports/svg-8tqadibmpl';
import EmptyContent from "@/imports/EmptyContent";
import imgImage from "figma:asset/13545c727434815b8ecda334fd9e453f4a0ea3ac.png";

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
}

function Container() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '4px' }}>
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#6d6d6d', letterSpacing: '-0.24px' }} className="w-full overflow-hidden text-ellipsis whitespace-nowrap">오늘의 한 줄 위로</p>
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', color: '#000000', letterSpacing: '-0.3px' }} className="w-full">조금 늦어도 괜찮아, 결국 너 답게 피어날 거야</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '12px', background: 'linear-gradient(180deg, #F8FEE9 34.21%, #EAF2D5 100%)' }}>
      <div className="flex flex-col items-start relative w-full" style={{ padding: '16px 20px' }}>
        <Container />
      </div>
    </div>
  );
}

function Image() {
  return (
    <div className="flex flex-col items-start justify-end relative shrink-0 w-full" style={{ height: '270px', padding: '16px 20px' }}>
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none" style={{ width: '100%', height: '100%' }} src={imgImage} />
      <Container1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-center relative w-full" style={{ padding: '0 20px 4px 20px' }}>
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
    const isDeleteButton = target.closest('button');

    if (!isDeleteButton) {
      e.preventDefault();
      onSelect();
    }
    touchStartRef.current = null;
    isScrollRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 0) return;
    onSelect();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <motion.div
      className="relative shrink-0"
      style={{ zIndex: isSelected ? 20 : 1 }}
    >
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          flex items-center cursor-pointer relative
          transition-colors duration-200
          ${isSelected
            ? 'ring-1 ring-[#48b2af]'
            : 'hover:bg-[#F0F0F0]'
          }
        `}
        style={{
          padding: '12px 16px',
          borderRadius: '99px',
          width: 'max-content',
          touchAction: 'pan-y',
          backgroundColor: '#f9f9f9'
        }}
      >
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#151515', letterSpacing: '-0.42px' }}>
          {label}
        </p>
      </div>

      {/* Delete Button - Absolute Positioned to prevent shaking */}
      <AnimatePresence>
        {isSelected && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDelete}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-30 flex items-center justify-center shrink-0"
            style={{ width: '32px', height: '32px' }}
            aria-label="Delete tag"
          >
            <div className="flex items-center justify-center rounded-full shadow-sm pointer-events-none" style={{ width: '20px', height: '20px', backgroundColor: '#ff6678' }}>
              <svg className="block" style={{ width: '10px', height: '10px' }} fill="none" viewBox="0 0 10 10">
                <path d="M2.5 2.5L7.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M7.5 2.5L2.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
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

function TagContainer({ isExpanded }: { isExpanded: boolean }) {
  // Initial tags
  const [tags, setTags] = useState([
    "결단력이 있는", "쉽게 흔들리지 않는", "책임감이 강한", "버티는 힘이 있는",
    "스스로를 잘 지키는", "상황을 주도하는", "위기에도 침착한", "기준이 분명한",
    "솔직한", "자유로운", "창의적인", "도전적인", "배려심 깊은", "긍정적인",
    "활기찬", "차분한", "사려 깊은", "열정적인", "성실한", "유머러스한",
    "감각적인", "논리적인", "직관적인", "포용력 있는", "단호한", "융통성 있는",
    "겸손한", "용기 있는", "호기심 많은", "끈기 있는", "낙천적인", "신중한",
    "공감 능력이 뛰어난", "리더십 있는", "협동적인", "독창적인", "분석적인",
    "계획적인", "모험을 즐기는", "이성적인", "감성적인", "정직한",
    "신뢰할 수 있는", "따뜻한", "냉철한", "자신감 있는", "섬세한", "대담한",
    "주체적인", "개방적인", "철저한", "여유로운", "사교적인", "독립적인",
    "실천하는", "균형 잡힌", "통찰력 있는", "지혜로운", "공정한", "너그러운",
    "단단한", "유연한", "꿈이 큰", "현실적인", "다재다능한", "집중력 있는",
    "순수한", "개성 있는", "감동을 주는", "믿음직한", "사랑스러운", "활발한",
    "치밀한", "예리한", "든든한", "상냥한", "친절한", "매력적인", "세련된",
    "당당한", "기발한", "진취적인", "헌신적인", "조화로운", "생동감 있는",
    "안정적인", "강인한", "부드러운", "지적인", "재치 있는", "명랑한"
  ]);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside click/touch to deselect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only deselect if we're not clicking on the toast or other critical elements
        const target = event.target as Element;
        if (!target.closest('[data-sonner-toaster]')) {
             setSelectedTag(null);
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

  const handleDelete = (tagToDelete: string) => {
    const index = tags.indexOf(tagToDelete);
    setTags(prev => prev.filter(tag => tag !== tagToDelete));

    if (selectedTag === tagToDelete) {
      setSelectedTag(null);
    }

    // Custom toast with Undo
    toast.custom((t) => (
      <div className="w-full flex justify-center">
        <div className="w-fit">
          <div className="backdrop-blur-[15px] flex items-center" style={{ padding: '8px 16px 8px 12px', borderRadius: '999px', gap: '8px', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
               <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                 <path d={svgPaths.p19b5fe00} fill="#46BB6F" />
               </svg>
            </div>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '13px', lineHeight: '22px', color: '#ffffff', whiteSpace: 'nowrap' }}>
              태그가 삭제되었어요
            </p>
            <button
              onClick={() => {
                setTags(prev => {
                  const newTags = [...prev];
                  newTags.splice(index, 0, tagToDelete);
                  return newTags;
                });
                toast.dismiss(t);
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
      duration: 3000,
      unstyled: true,
      position: 'bottom-center'
    });
  };

  const handleSelect = (tag: string) => {
    setSelectedTag(prev => (prev === tag ? null : tag));
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
            key={tag}
            label={tag}
            isSelected={selectedTag === tag}
            onSelect={() => handleSelect(tag)}
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
              key={tag}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="shrink-0"
            >
              <TagItem
                label={tag}
                isSelected={selectedTag === tag}
                onSelect={() => handleSelect(tag)}
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

function NadaumTagsListInternal() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col items-start relative shrink-0 w-full">
      <div className="relative shrink-0 w-full">
        <div className="flex flex-col items-start relative w-full" style={{ padding: '14px 0' }}>
          <TagContainer isExpanded={isExpanded} />
        </div>
      </div>
      <MoreSection isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
    </div>
  );
}

export default function NadaumTagsList({ onBack }: NadaumTagsListProps) {
  const [activeTab, setActiveTab] = useState('strong');

  return (
    <div className="bg-white fixed inset-0 z-50 flex flex-col mx-auto w-full" style={{ maxWidth: '440px' }}>
      <Toaster />
      {/* Top Navigation */}
      <div className="bg-white relative shrink-0 w-full z-10" style={{ height: '52px' }}>
        <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
          <div className="flex items-center justify-between relative" style={{ padding: '4px 12px', width: '100%', height: '100%' }}>
            {/* Left Action (Back) */}
            <button
              onClick={onBack}
              className="group flex items-center justify-center relative shrink-0 hover:bg-gray-100 transition-colors duration-200 active:bg-[#F8F8F8]"
              style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
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
            <button className="group flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] hover:bg-gray-100 transition-colors duration-200 active:bg-[#F8F8F8]">
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
        <div className="flex flex-col items-start relative w-full" style={{ gap: '32px' }}>
          <Image />
          <div className="flex flex-col items-start relative shrink-0 w-full">
            <div className="flex flex-col items-start relative shrink-0 w-full">
              <Container2 />
            </div>
            <div className="sticky top-0 z-40 bg-white w-full">
              <Tab activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className={`flex flex-col items-center justify-start relative shrink-0 w-full ${activeTab === 'delicate' ? 'min-h-[calc(100vh-100px)]' : ''}`}>
              {activeTab === 'delicate' ? (
                <EmptyContent />
              ) : (
                <NadaumTagsListInternal />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
