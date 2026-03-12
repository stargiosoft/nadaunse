/**
 * 슬롯머신 애니메이션 컴포넌트
 * 3개 릴이 순차적으로 정지하며 결과 공개
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ELEMENT_ICONS = ['🌳', '🔥', '⛰️', '⚔️', '🌊'];
const ELEMENT_MAP: Record<string, string> = {
  '목': '🌳', '화': '🔥', '토': '⛰️', '금': '⚔️', '수': '🌊',
};

interface SlotMachineAnimationProps {
  element: string; // 최종 결과 오행
  onComplete: () => void;
  duration?: number; // 총 애니메이션 시간 (ms)
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
    // 릴 1 정지 (1초 후)
    const t1 = setTimeout(() => {
      setReelStates(prev => [targetIcon, prev[1], prev[2]]);
    }, duration * 0.33);

    // 릴 2 정지 (2초 후)
    const t2 = setTimeout(() => {
      setReelStates(prev => [prev[0], targetIcon, prev[2]]);
    }, duration * 0.66);

    // 릴 3 정지 (3초 후)
    const t3 = setTimeout(() => {
      setReelStates([targetIcon, targetIcon, targetIcon]);
      setIsComplete(true);
    }, duration);

    // 완료 콜백 (약간의 딜레이 후)
    const t4 = setTimeout(onComplete, duration + 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [element, duration, onComplete, targetIcon]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 슬롯머신 프레임 */}
      <div
        className="flex items-center gap-3 p-6 rounded-3xl"
        style={{ backgroundColor: '#1a1a2e', border: '3px solid #48b2af' }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl flex items-center justify-center"
            style={{
              width: '80px',
              height: '100px',
              backgroundColor: '#fff',
              border: '2px solid #e0e0e0',
            }}
          >
            {reelStates[i] ? (
              // 정지된 릴
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ fontSize: '40px' }}
              >
                {reelStates[i]}
              </motion.div>
            ) : (
              // 회전 중인 릴
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

      {/* 분석 중 텍스트 */}
      <AnimatePresence>
        {!isComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: '15px', color: '#888', textAlign: 'center' }}
          >
            당신의 운명을 분석하고 있어요...
          </motion.p>
        )}
      </AnimatePresence>

      {/* 완료 효과 */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ fontSize: '15px', color: '#48b2af', fontWeight: 700 }}
          >
            결과가 나왔어요!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
