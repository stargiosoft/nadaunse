/**
 * 궁합 점수 원형 게이지 애니메이션 컴포넌트
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface CompatibilityMeterProps {
  score: number; // 0~100
  myTitle: string;
  partnerTitle: string;
  onComplete?: () => void;
}

export default function CompatibilityMeter({
  score,
  myTitle,
  partnerTitle,
  onComplete,
}: CompatibilityMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#ff6b9d';
    if (s >= 60) return '#48b2af';
    if (s >= 40) return '#f5a623';
    return '#888';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return '천생연분';
    if (s >= 80) return '환상 궁합';
    if (s >= 70) return '좋은 궁합';
    if (s >= 60) return '무난한 궁합';
    if (s >= 50) return '보통 궁합';
    if (s >= 40) return '노력형 궁합';
    return '도전적 궁합';
  };

  useEffect(() => {
    // 점수 카운트 애니메이션
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(score, Math.round(increment * step));
      setAnimatedScore(current);

      if (step >= steps) {
        clearInterval(interval);
        setAnimatedScore(score);
        setTimeout(() => onComplete?.(), 500);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score, onComplete]);

  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 이름 표시 */}
      <div className="flex items-center gap-4 w-full justify-center">
        <div
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: '#f0f8f8', fontSize: '14px', fontWeight: 600, color: '#48b2af' }}
        >
          {myTitle}
        </div>
        <span style={{ fontSize: '20px' }}>💕</span>
        <div
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: '#fff0f5', fontSize: '14px', fontWeight: 600, color: '#ff6b9d' }}
        >
          {partnerTitle}
        </div>
      </div>

      {/* 원형 게이지 */}
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* 배경 원 */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="12"
          />
          {/* 진행 원 */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90, 100, 100)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </svg>

        {/* 중앙 점수 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{ fontSize: '42px', fontWeight: 800, color }}
          >
            {animatedScore}
          </motion.span>
          <span style={{ fontSize: '14px', color: '#888' }}>점</span>
        </div>
      </div>

      {/* 궁합 라벨 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="px-6 py-2 rounded-full"
        style={{ backgroundColor: color, color: '#fff', fontSize: '16px', fontWeight: 700 }}
      >
        {getScoreLabel(score)}
      </motion.div>
    </div>
  );
}
