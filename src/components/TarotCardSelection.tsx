import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import img3 from "figma:asset/f494ca2b3b180a2d66b2960718e3e515db3248a2.png"; // 타로 카드 뒷면
import imgCharacter from "figma:asset/e1537c8771a828aa09f2f853176e35c41217f557.png"; // 오리 캐릭터
import { supabase } from '../lib/supabase';
import { SessionExpiredDialog } from './SessionExpiredDialog';

export function TarotCardSelection({ 
  title,
  question = "질문을 떠올리며 카드를 뽑아주세요",
  onComplete 
}: { 
  title?: string;
  question?: string;
  onComplete?: (cardId: number) => void 
}) {
  type Step = 'initial' | 'spread' | 'selected';
  const [step, setStep] = useState<Step>('initial');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ⭐ 세션 체크 - 로그아웃 상태면 다이얼로그 표시
  useEffect(() => {
    const checkSession = async () => {
      // DEV 모드 우회
      if (import.meta.env.DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          const localUser = JSON.parse(localUserJson);
          if (localUser.provider === 'dev') return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSessionExpired(true);
      }
    };
    checkSession();
  }, []);

  // 카드 데이터 (78장의 타로 카드)
  const cards = Array.from({ length: 78 }, (_, i) => ({
    id: i + 1,
    rotation: 0,
    x: 0,
    y: 0,
    scale: 1
  }));

  // 카드 위치 계산
  const getCardTransform = (card: typeof cards[0], index: number) => {
    if (step === 'initial') {
      // 초기: 모두 중앙에 겹쳐서
      return {
        x: 0,
        y: 0,
        rotation: Math.random() * 4 - 2,
        scale: 1
      };
    } else if (step === 'spread') {
      // 펼치기: 부채꼴 형태
      const totalCards = cards.length;
      const angle = ((index / totalCards) * 180) - 90; // -90도 ~ +90도
      const radius = 280;
      const x = Math.sin((angle * Math.PI) / 180) * radius;
      const y = Math.cos((angle * Math.PI) / 180) * radius * 0.5;
      
      return {
        x,
        y: y - 40,
        rotation: angle * 0.8,
        scale: 1
      };
    } else {
      // 선택됨: 선택된 카드는 중앙 아래로, 나머지는 뒤로 페이드
      if (selectedCard === card.id) {
        return {
          x: 0,
          y: 150,
          rotation: 0,
          scale: 1.5
        };
      }
      return {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0
      };
    }
  };

  // 애니메이션 설정
  const getAnimationConfig = () => {
    if (step === 'initial') {
      return {
        type: "spring" as const,
        duration: 0.5
      };
    } else if (step === 'spread') {
      return {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        mass: 0.5
      };
    } else {
      return {
        type: "spring" as const,
        stiffness: 200,
        damping: 25
      };
    }
  };

  // 카드 섞기
  const handleShuffle = () => {
    setIsAnimating(true);
    setStep('spread');
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  // 카드 선택
  const handleCardClick = (cardId: number) => {
    if (step !== 'spread' || isAnimating) return;
    
    setSelectedCard(cardId);
    setStep('selected');
  };

  // 선택 완료
  const handleComplete = () => {
    if (selectedCard !== null && onComplete) {
      onComplete(selectedCard);
    }
  };

  return (
    <div className="bg-white w-full h-screen flex flex-col relative overflow-hidden">
      
      {/* 1. 상단 질문 영역 (absolute 제거 -> flex item으로 변경) */}
      <div className="w-full shrink-0 relative z-0 pt-[60px] pb-[40px] px-[20px]">
        <div className="flex flex-col gap-[8px] items-center text-center">
          <h1 className={`text-[20px] font-bold tracking-[-0.2px] leading-[28px] transition-colors duration-300 ${
            step === 'spread' ? 'text-white' : 'text-[#151515]'
          }`}>
            {title}
          </h1>
          <p className={`text-[14px] tracking-[-0.42px] leading-[22px] transition-colors duration-300 ${
            step === 'spread' ? 'text-white' : 'text-[#848484]'
          }`}>
            {question}
          </p>
        </div>
      </div>

      {/* 2. Teal 배경 영역 (absolute 제거 -> 남은 공간 채우기 flex-1) */}
      {/* 기존 top: 389px 삭제. 대신 flex-1로 남은 공간을 다 차지하게 함 */}
      <div className="flex-1 w-full bg-[#48b2af] border-t-2 border-[#151515] flex flex-col items-center px-[20px] pt-[80px] pb-[24px] relative z-10">
        
        {/* 3. 오리 캐릭터 (위치 이동됨: 배경 div의 자식으로 들어옴) */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ 
            top: '0px', // 배경 박스의 시작점에 붙임
            transform: 'translate(-50%, -65%)', // 자신의 높이 절반 이상 위로 끌어올림 (경계선에 걸치기 위함)
            zIndex: 5,  // 배경(0)보다 높고, 카드(10)보다 낮음
            width: '130px',
            height: '159px'
          }}
        >
          <img 
            src={imgCharacter} 
            alt="캐릭터" 
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
          />
        </div>

        {/* 4. 카드 영역 (z-index 관리 필요) */}
        <div className="relative w-full max-w-[350px] h-[250px] mb-[40px] z-20">
          <div className="absolute inset-0 flex items-center justify-center">
            {cards.map((card, index) => {
              const transform = getCardTransform(card, index);
              const animationConfig = getAnimationConfig();

              return (
                <motion.div
                  key={card.id}
                  className="absolute cursor-pointer"
                  style={{
                    width: 46,
                    height: 77,
                    // [중요] 카드가 오리보다 앞에 오도록 zIndex 조정
                    // 오리가 5이므로, 카드는 최소 10 이상이어야 함
                    zIndex: selectedCard === card.id ? 99 : index + 10,
                  }}
                  initial={false}
                  animate={{
                    x: transform.x,
                    y: transform.y,
                    rotate: transform.rotation,
                    scale: transform.scale,
                  }}
                  transition={animationConfig}
                  onClick={() => handleCardClick(card.id)}
                  whileHover={
                     step === 'spread' && selectedCard !== card.id
                       ? { scale: 1.1, y: transform.y - 10 }
                       : {}
                   }
                >
                  <div className="w-full h-full rounded-[4px] overflow-hidden shadow-lg">
                    <img 
                      src={img3} 
                      alt={`타로 카드 ${card.id}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 점선 박스 및 버튼 영역은 그대로 유지하되, z-index만 신경 씀 */}
        <div className="h-[127px] flex items-center justify-center mb-[20px] relative z-20">
          <AnimatePresence mode="wait">
            {step === 'spread' && selectedCard === null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-[76px] h-[127px] border-2 border-dashed border-white/40 rounded-[8px]"
              />
            )}
            
            {step === 'selected' && selectedCard !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-[76px] h-[127px] rounded-[8px] shadow-lg overflow-hidden"
              >
                <img 
                  src={img3} 
                  alt="선택된 카드"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full pb-[24px] relative z-30">
          <button
            onClick={step === 'initial' ? handleShuffle : handleComplete}
            disabled={isAnimating || (step === 'spread' && selectedCard === null)}
            className={`
              w-full h-[56px] rounded-[16px] text-[16px] tracking-[-0.32px]
              transition-all duration-300
              ${
                step === 'initial'
                  ? 'bg-white text-[#48b2af]'
                  : selectedCard !== null
                  ? 'bg-[#34a19e] text-white'
                  : 'bg-white/30 text-white/50 cursor-not-allowed'
              }
              ${isAnimating ? 'opacity-50 cursor-wait' : ''}
              active:scale-[0.98]
            `}
          >
            {step === 'initial' 
              ? '카드 섞기' 
              : step === 'selected'
              ? '선택 완료'
              : '카드를 선택해주세요'}
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 (relative z-40으로 최상위 보장) */}
      <div className="bg-white h-[80px] shrink-0 flex items-center justify-between px-[28px] border-t border-[#f3f3f3] relative z-40">
        <div className="flex items-center gap-[8px]">
          <div className="w-[36px] h-[36px] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="2" y="4" fill="#151515" />
              <rect width="20" height="2" y="9" fill="#151515" />
              <rect width="20" height="2" y="14" fill="#151515" />
            </svg>
          </div>
          <p className="text-[15px] tracking-[-0.3px] leading-[23.5px]">
            <span className="text-[#151515]">03</span>
            <span className="text-[#b7b7b7]">/10</span>
          </p>
        </div>

        <div className="flex items-center gap-[16px]">
          <button className="text-[14px] tracking-[-0.42px] text-[#151515] flex items-center gap-[4px]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 9L4.5 6L7.5 3" stroke="black" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            이전
          </button>
          <div className="w-[1px] h-[12px] bg-[#e7e7e7]" />
          <button className="text-[14px] tracking-[-0.42px] text-[#151515] flex items-center gap-[4px]">
            다음
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="black" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}
