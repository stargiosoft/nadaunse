import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ButtonSquareButton } from "./ButtonSquareButton";
import cardImage from "figma:asset/f494ca2b3b180a2d66b2960718e3e515db3248a2.png"; // Using existing card image from TarotShufflePage

// 배경 이미지 URL 정의
const tarotBackground = "https://i.postimg.cc/WzwkjYXT/talo-seupeuledeu-batang-(wonbon).jpg";

// Design base width (440px)
const BASE_WIDTH = 440;
const MIN_WIDTH = 320;
const MOBILE_Y_OFFSET = -16;

const isMobileChrome = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (/Android.*Chrome|CriOS/i.test(ua) && /Mobile/i.test(ua)) || /iPhone|iPod|iPad/i.test(ua);
};

const getScaleRatio = (screenWidth: number) => {
  return Math.max(MIN_WIDTH / BASE_WIDTH, Math.min(1, screenWidth / BASE_WIDTH));
};

const cardPositions = [
  { inset: "2.43% 77.21% 24.48% -6.97%", rotate: 45.451, skewX: 2.498, h: 96.216, w: 55.028 },
  { inset: "6.9% 73.7% 18.83% -2.76%", rotate: 41.237, skewX: 2.461, h: 96.521, w: 54.852 },
  { inset: "12.03% 70.27% 12.91% 1.53%", rotate: 36.995, skewX: 2.372, h: 96.825, w: 54.681 },
  { inset: "16.84% 66.91% 7.73% 5.91%", rotate: 32.728, skewX: 2.231, h: 97.105, w: 54.517 },
  { inset: "21.28% 63.62% 3.32% 10.36%", rotate: 28.435, skewX: 2.043, h: 97.353, w: 54.364 },
  { inset: "25.35% 60.39% -0.31% 14.89%", rotate: 24.12, skewX: 1.811, h: 97.595, w: 54.226 },
  { inset: "28.99% 57.23% -3.13% 19.48%", rotate: 19.784, skewX: 1.54, h: 97.801, w: 54.106 },
  { inset: "32.23% 54.13% -5.12% 24.13%", rotate: 15.43, skewX: 1.236, h: 97.958, w: 54.006 },
  { inset: "35.02% 51.09% -6.29% 28.85%", rotate: 11.062, skewX: 0.905, h: 98.099, w: 53.929 },
  { inset: "37.36% 48.1% -6.62% 33.62%", rotate: 6.683, skewX: 0.555, h: 98.183, w: 53.877 },
  { inset: "39.21% 45.15% -6.1% 38.45%", rotate: 2.298, skewX: 0.192, h: 98.232, w: 53.85 },
  { inset: "39.3% 41.32% -6.05% 42.37%", rotate: 357.911, skewX: 359.825, h: 98.221, w: 53.849 },
  { inset: "37.46% 36.49% -6.61% 45.32%", rotate: 353.526, skewX: 359.463, h: 98.185, w: 53.875 },
  { inset: "35.14% 31.72% -6.33% 48.3%", rotate: 349.147, skewX: 359.111, h: 98.099, w: 53.926 },
  { inset: "32.37% 27% -5.2% 51.34%", rotate: 344.778, skewX: 358.779, h: 97.975, w: 54.002 },
  { inset: "29.16% 22.34% -3.24% 54.44%", rotate: 340.423, skewX: 358.474, h: 97.813, w: 54.101 },
  { inset: "25.53% 17.74% -0.46% 57.6%", rotate: 336.086, skewX: 358.201, h: 97.601, w: 54.22 },
  { inset: "21.48% 13.21% 3.12% 60.82%", rotate: 331.77, skewX: 357.967, h: 97.377, w: 54.357 },
  { inset: "12.27% 4.38% 12.65% 67.47%", rotate: 323.208, skewX: 357.634, h: 96.834, w: 54.673 },
  { inset: "7.15% 0.08% 18.54% 70.9%", rotate: 318.965, skewX: 357.542, h: 96.532, w: 54.844 },
  { inset: "1.73% -4.14% 25.12% 74.41%", rotate: 314.749, skewX: 357.502, h: 96.223, w: 55.019 },
];

const getFanPositions = (scaleRatio: number) => {
  const positions = [];
  const totalCards = 21;
  const centerIndex = 10;
  const baseContainerWidth = 313;
  const containerWidth = baseContainerWidth * scaleRatio;
  const cardWidth = 68 * scaleRatio;
  const totalWidth = containerWidth - cardWidth;
  const spacing = totalWidth / (totalCards - 1);
  const maxHeight = 70 * scaleRatio;
  const minHeight = 0;
  for (let i = 0; i < totalCards; i++) {
    const left = i * spacing;
    const distanceFromCenter = Math.abs(i - centerIndex);
    const normalizedDistance = distanceFromCenter / centerIndex;
    const top = minHeight + (maxHeight - minHeight) * Math.pow(normalizedDistance, 2);
    const angleRange = 90;
    const angle = -45 + (i / (totalCards - 1)) * angleRange;
    positions.push({ left: left, top: top, rotate: angle });
  }
  return positions;
};

const generateMixingPositions = (pattern: number, scaleRatio: number) => {
  const positions = [];
  const containerW = 313 * scaleRatio;
  const containerH = 178 * scaleRatio;
  const cardW = 68 * scaleRatio;
  const cardH = 114 * scaleRatio;
  const cx = (containerW - cardW) / 2;
  const cy = (containerH - cardH) / 2;
  for (let i = 0; i < 21; i++) {
    let left, top, rotate;
    const noise = (amount: number) => (Math.random() - 0.5) * amount;
    switch (pattern) {
      case 0: left = Math.random() * (containerW - cardW); top = Math.random() * (containerH - cardH); rotate = Math.random() * 360; break;
      case 1: const angle = (Math.random() * Math.PI * 2); const radius = Math.random() * (containerH * 0.4); left = cx + Math.cos(angle) * radius + noise(20 * scaleRatio); top = cy + Math.sin(angle) * radius + noise(20 * scaleRatio); rotate = (angle * 180 / Math.PI) + 90 + noise(60); break;
      case 2: const side = Math.random() > 0.5 ? 0.25 : 0.75; left = (containerW - cardW) * side + noise(50 * scaleRatio); top = cy + noise(70 * scaleRatio); rotate = Math.random() * 360; break;
      case 3: left = Math.random() * (containerW - cardW); top = Math.random() * (containerH - cardH); rotate = Math.random() * 360; break;
      case 4: left = cx + noise(50 * scaleRatio); top = cy + noise(50 * scaleRatio); rotate = Math.random() * 360; break;
      default: left = Math.random() * (containerW - cardW); top = Math.random() * (containerH - cardH); rotate = Math.random() * 360;
    }
    left = Math.max(0, Math.min(containerW - cardW, left));
    top = Math.max(0, Math.min(containerH - cardH, top));
    positions.push({ left, top, rotate });
  }
  return positions;
};

const getGatheredPosition = (scaleRatio: number) => ({ left: 0, top: 70 * scaleRatio, rotate: -45 });

interface CardProps {
  index: number; shufflePhase: 'idle' | 'mixing' | 'gathered' | 'spreading'; currentMixingPosition: { left: number; top: number; rotate: number }; displayIndex: number; isSelected: boolean; onSelect: (index: number, rect: DOMRect) => void; isHovered: boolean; isPressed: boolean; onHoverChange: (index: number | null) => void; onPressChange: (index: number | null) => void; scaleRatio: number; anyCardSelected: boolean;
}

function AnimatedCard({ index, shufflePhase, currentMixingPosition, displayIndex, isSelected, onSelect, isHovered, isPressed, onHoverChange, onPressChange, scaleRatio, anyCardSelected }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const fanPosition = getFanPositions(scaleRatio)[index];
  const gatheredPosition = getGatheredPosition(scaleRatio);
  const isMixing = shufflePhase === 'mixing';
  const isGathered = shufflePhase === 'gathered';
  const isSpreading = shufflePhase === 'spreading';
  const isIdle = shufflePhase === 'idle';
  const spreadDelay = isSpreading ? (20 - index) * 0.03 : (isGathered ? index * 0.01 : 0);
  const baseCardWidth = 68;
  const baseCardHeight = 114;
  const cardWidth = baseCardWidth * scaleRatio;
  const cardHeight = baseCardHeight * scaleRatio;
  const yOffset = isMobileChrome() ? MOBILE_Y_OFFSET : 0;
  
  let left, top, rotate, scale;
  if (isSpreading) {
    left = fanPosition.left;
    top = (index > 10) ? [gatheredPosition.top + yOffset, yOffset, fanPosition.top + yOffset] : fanPosition.top + yOffset;
    rotate = fanPosition.rotate;
    scale = 1;
  } else if (isIdle) {
    left = fanPosition.left; top = fanPosition.top + yOffset; rotate = fanPosition.rotate; scale = 1;
  } else if (isGathered) {
    left = gatheredPosition.left; top = gatheredPosition.top + yOffset; rotate = gatheredPosition.rotate; scale = 1;
  } else {
    left = currentMixingPosition.left; top = currentMixingPosition.top + yOffset; rotate = currentMixingPosition.rotate; scale = 1.05;
  }
  
  const canClick = isIdle && !isSelected && !anyCardSelected;
  if (isSelected) return null;

  const isPreInteracting = canClick && (isHovered || isPressed);
  const basePreInteractDistance = 10;
  const preInteractDistance = basePreInteractDistance * scaleRatio;
  const angleInRadians = (rotate * Math.PI) / 180;
  const preInteractX = isPreInteracting ? Math.sin(angleInRadians) * preInteractDistance : 0;
  const preInteractY = isPreInteracting ? -Math.cos(angleInRadians) * preInteractDistance : 0;
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canClick) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    onPressChange(index);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    onPressChange(null);
    if (!canClick || !pointerStartRef.current || !cardRef.current) return;
    const distance = Math.sqrt(Math.pow(e.clientX - pointerStartRef.current.x, 2) + Math.pow(e.clientY - pointerStartRef.current.y, 2));
    if (distance < 10) onSelect(index, cardRef.current.getBoundingClientRect());
    pointerStartRef.current = null;
  };
  
  return (
    <motion.div
      layoutId={`card-${index}`} ref={cardRef} className={`absolute flex items-center justify-center ${canClick ? 'cursor-pointer' : ''}`}
      initial={false}
      animate={{ left, top, scale, opacity: isSelected ? 0 : 1, x: preInteractX, y: preInteractY }}
      transition={{
        layout: { type: "spring", stiffness: 230, damping: 25 },
        ...(isIdle ? { type: "spring", stiffness: 320, damping: 28, mass: 0.6 } : { duration: isSpreading ? 0.7 : isGathered ? 0.6 : isMixing ? 0.25 : 0.45, ease: "easeInOut" }),
        delay: spreadDelay,
        top: (isSpreading && index > 10) ? { duration: 0.7, ease: ["easeInOut", "easeInOut"], times: [0, 10 / index, 1], delay: spreadDelay } : undefined,
        x: { type: "spring", stiffness: 300, damping: 25 },
        y: { type: "spring", stiffness: 300, damping: 25 },
        scale: { duration: 0.2, ease: "easeOut" },
      }}
      style={{ zIndex: isIdle || isSpreading ? index : displayIndex, touchAction: canClick ? 'none' : 'auto', boxShadow: 'none', width: `${cardWidth}px`, height: `${cardHeight}px` }}
      onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerEnter={() => canClick && onHoverChange(index)} onPointerLeave={() => { onHoverChange(null); onPressChange(null); }}
    >
      <motion.div layoutId={`card-inner-${index}`} className="flex-none w-full h-full" animate={{ rotate }} transition={{ duration: isSpreading ? 0.45 : isGathered ? 0.45 : isMixing ? 0.25 : 0.45, ease: "easeInOut", delay: spreadDelay }} style={{ boxShadow: 'none' }}>
        <div className="content-stretch flex flex-col items-start relative size-full">
          <div className="relative shrink-0 w-full h-full">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px] ring-[0.5px] ring-[#008986]">
              <img alt="" className="absolute inset-0 size-full object-cover" src={cardImage} style={{ transform: (isGathered || isSpreading || isIdle) ? 'rotate(0deg)' : 'rotate(180deg)', boxShadow: 'none' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CardFan({ shufflePhase, mixingPositions, deckOrder, selectedCard, onCardSelect, scaleRatio }: any) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [pressedCard, setPressedCard] = useState<number | null>(null);
  
  useEffect(() => {
    setHoveredCard(null);
    setPressedCard(null);
  }, [shufflePhase, selectedCard]);

  const containerWidth = 313 * scaleRatio;
  const containerHeight = 178 * scaleRatio;
  
  return (
    <div style={{ height: `${containerHeight}px`, width: `${containerWidth}px`, transform: 'translateY(-44px)', boxShadow: 'none' }} className="relative">
      {cardPositions.map((_, index) => (
        <AnimatedCard key={index} index={index} shufflePhase={shufflePhase} currentMixingPosition={mixingPositions[index] || { left: 0, top: 0, rotate: 0 }} displayIndex={deckOrder.indexOf(index)} isSelected={selectedCard === index} onSelect={onCardSelect} isHovered={hoveredCard === index} isPressed={pressedCard === index} onHoverChange={setHoveredCard} onPressChange={setPressedCard} scaleRatio={scaleRatio} anyCardSelected={selectedCard !== null} />
      ))}
    </div>
  );
}

function Frame({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
      <div ref={targetRef} className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px] top-[-40px]">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-start min-h-[86px] relative shrink-0 text-center w-full" data-name="Container">
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[30px] relative shrink-0 text-[20px] text-white tracking-[-0.5px] w-full">우리 관계, 지금이 전환점일까?</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#f3f3f3] text-[14px] tracking-[-0.42px] w-full">질문을 떠올리며 카드를 뽑아주세요</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start px-[20px] py-[10px] relative w-full">
          <Container />
        </div>
      </div>
    </div>
  );
}

function Frame2({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="content-stretch flex flex-col gap-[44px] items-center relative shrink-0 w-full">
      <Container1 />
      <Frame targetRef={targetRef} />
    </div>
  );
}

function Frame3({ shufflePhase, mixingPositions, deckOrder, selectedCard, onCardSelect, targetRef, scaleRatio }: any) {
  return (
    <div className="absolute content-stretch flex flex-col gap-[50px] items-center left-0 top-[18px] w-full">
      <Frame2 targetRef={targetRef} />
      <div className="flex items-center justify-center relative shrink-0">
        <CardFan shufflePhase={shufflePhase} mixingPositions={mixingPositions} deckOrder={deckOrder} selectedCard={selectedCard} onCardSelect={onCardSelect} scaleRatio={scaleRatio} />
      </div>
    </div>
  );
}

function Frame1({ shufflePhase, mixingPositions, deckOrder, selectedCard, onCardSelect, targetRef, scaleRatio, onShuffle, isShuffling, isCardSelected }: any) {
  const buttonLabel = isShuffling ? "섞는 중..." : isCardSelected ? "선택 완료" : "카드 섞기";

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        backgroundColor: '#41a09e',
        height: 'calc(var(--vh, 1vh) * 100)'
      }}
    >
      <img 
        src={tarotBackground} 
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0" 
        alt="" 
      />
      <div className="absolute inset-0 z-10 w-full h-full">
        <Frame3 shufflePhase={shufflePhase} mixingPositions={mixingPositions} deckOrder={deckOrder} selectedCard={selectedCard} onCardSelect={onCardSelect} targetRef={targetRef} scaleRatio={scaleRatio} />
        <div 
          className="fixed left-0 right-0 px-[20px] z-50"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
        >
          <div className="h-[56px] w-full">
            <ButtonSquareButton onClick={onShuffle} label={buttonLabel} disabled={isShuffling} isActive={isCardSelected} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SelectedCardData { index: number; startX: number; startY: number; targetX: number; targetY: number; cardWidth: number; cardHeight: number; isReturning: boolean; }

function SelectedCard({ data, onReturn }: { data: SelectedCardData; onReturn: () => void; }) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  return (
    <motion.div
      layoutId={`card-${data.index}`} key="selected-card" className="absolute flex items-center justify-center cursor-pointer"
      style={{ left: data.targetX, top: data.targetY, zIndex: 1000, width: `${data.cardWidth}px`, height: `${data.cardHeight}px`, touchAction: 'none', boxShadow: 'none' }}
      onPointerDown={(e) => { pointerStartRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => { if (pointerStartRef.current && Math.sqrt(Math.pow(e.clientX - pointerStartRef.current.x, 2) + Math.pow(e.clientY - pointerStartRef.current.y, 2)) < 10) onReturn(); pointerStartRef.current = null; }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div layoutId={`card-inner-${data.index}`} className="flex-none w-full h-full" animate={{ rotate: 0 }}>
        <div className="content-stretch flex flex-col items-start relative size-full">
          <div className="relative shrink-0 w-full h-full">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px] ring-[0.5px] ring-[#008986]">
              <img alt="Selected card" className="absolute inset-0 size-full object-cover" src={cardImage} style={{ boxShadow: 'none' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface TarotGameProps {
  onConfirm?: () => void;
}

export function TarotGame({ onConfirm }: TarotGameProps) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'mixing' | 'gathered' | 'spreading'>('idle');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedCardData, setSelectedCardData] = useState<SelectedCardData | null>(null);
  const [scaleRatio, setScaleRatio] = useState(() => getScaleRatio(typeof window !== 'undefined' ? window.innerWidth : BASE_WIDTH));
  const [mixingPositions, setMixingPositions] = useState<{ left: number; top: number; rotate: number }[]>([]);
  const [deckOrder, setDeckOrder] = useState<number[]>(cardPositions.map((_, i) => i));
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setScaleRatio(getScaleRatio(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shuffleArray = (arr: number[]) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const performShuffle = async () => {
    if (isShuffling) return;
    setIsShuffling(true); setSelectedCard(null); setSelectedCardData(null);
    for (let i = 0; i < 5; i++) {
      setShufflePhase('mixing'); setMixingPositions(generateMixingPositions(Math.floor(Math.random() * 5), scaleRatio)); setDeckOrder(prev => shuffleArray(prev)); await delay(300);
    }
    setShufflePhase('gathered'); await delay(800);
    setShufflePhase('spreading'); setDeckOrder(cardPositions.map((_, i) => i)); await delay(1200);
    setShufflePhase('idle'); setIsShuffling(false);
  };

  const handleClickAction = () => {
    if (selectedCard !== null) {
      if (onConfirm) onConfirm();
    } else {
      performShuffle();
    }
  };

  const handleCardSelect = (index: number, cardRect: DOMRect) => {
    if (selectedCard === index) {
      setSelectedCard(null); setSelectedCardData(prev => prev ? { ...prev, isReturning: true } : null);
    } else if (targetBoxRef.current && containerRef.current) {
      const targetRect = targetBoxRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setSelectedCard(index);
      setSelectedCardData({ index, startX: cardRect.left - containerRect.left, startY: cardRect.top - containerRect.top, targetX: targetRect.left - containerRect.left, targetY: targetRect.top - containerRect.top, cardWidth: targetRect.width, cardHeight: targetRect.height, isReturning: false });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" data-name="카드 뽑기 섞기">
      <Frame1 shufflePhase={shufflePhase} mixingPositions={mixingPositions} deckOrder={deckOrder} selectedCard={selectedCard} onCardSelect={handleCardSelect} targetRef={targetBoxRef} scaleRatio={scaleRatio} onShuffle={handleClickAction} isShuffling={isShuffling} isCardSelected={selectedCard !== null} />
      {selectedCardData && <SelectedCard data={selectedCardData} onReturn={() => { setSelectedCard(null); setSelectedCardData(null); }} />}
    </div>
  );
}