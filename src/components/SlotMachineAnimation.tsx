/**
 * 슬롯머신 애니메이션 컴포넌트
 * ★DESIGN_SYSTEM★ 기반 — 3개 릴 순차 정지
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const font = "'Pretendard Variable', sans-serif";

const ELEMENT_ICONS = ['🌳', '🔥', '⛰️', '⚔️', '🌊'];
const ELEMENT_MAP: Record<string, string> = {
  '목': '🌳', '화': '🔥', '토': '⛰️', '금': '⚔️', '수': '🌊',
};

interface SlotMachineAnimationProps {
  element: string;
  onComplete: () => void;
  duration?: number;
}

export default function SlotMachineAnimation({
  element,
  onComplete,
  duration = 3000,
}: SlotMachineAnimationProps) {
  const [reelStates, setReelStates] = useState<(string | null)[]>([null, null, null]);
  const [isComplete, setIsComplete] = useState(false);

  const targetIcon = ELEMENT_MAP[element] || '⛰️';

  useEffect(() => {
    const t1 = setTimeout(() => {
      setReelStates(prev => [targetIcon, prev[1], prev[2]]);
    }, duration * 0.33);

    const t2 = setTimeout(() => {
      setReelStates(prev => [prev[0], targetIcon, prev[2]]);
    }, duration * 0.66);

    const t3 = setTimeout(() => {
      setReelStates([targetIcon, targetIcon, targetIcon]);
      setIsComplete(true);
    }, duration);

    const t4 = setTimeout(onComplete, duration + 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [element, duration, onComplete, targetIcon]);

  return (
    <div className="flex flex-col items-center" style={{ gap: '24px' }}>
      {/* 슬롯머신 프레임 */}
      <div
        className="flex items-center"
        style={{
          gap: '8px',
          padding: '20px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid #e7e7e7',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden flex items-center justify-center transform-gpu"
            style={{
              width: '80px',
              height: '100px',
              backgroundColor: '#f9f9f9',
              borderRadius: '16px',
              border: reelStates[i] ? '1.5px solid #48b2af' : '1px solid #e7e7e7',
              transition: 'border 0.2s ease',
            }}
          >
            {reelStates[i] ? (
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ fontSize: '40px' }}
              >
                {reelStates[i]}
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center"
                animate={{ y: [0, -200, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.3,
                  ease: 'linear',
                }}
              >
                {ELEMENT_ICONS.map((icon, j) => (
                  <div key={j} style={{ fontSize: '40px', height: '50px' }}>
                    {icon}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* 텍스트 */}
      <AnimatePresence>
        {!isComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: font, fontSize: '15px', fontWeight: 400,
              lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
              textAlign: 'center',
            }}
          >
            당신의 운명을 분석하고 있어요...
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && (
          <motion.p
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              fontFamily: font, fontSize: '16px', fontWeight: 600,
              lineHeight: '22px', letterSpacing: '-0.32px', color: '#48b2af',
            }}
          >
            결과가 나왔어요!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
