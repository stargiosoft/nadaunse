/**
 * 궁합 점수 원형 게이지 애니메이션 컴포넌트
 * ★DESIGN_SYSTEM★ 기반
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const font = "'Pretendard Variable', sans-serif";

interface CompatibilityMeterProps {
  score: number;
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
    if (s >= 80) return '#ef6878';
    if (s >= 60) return '#48b2af';
    if (s >= 40) return '#f5a623';
    return '#b7b7b7';
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
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const current = Math.min(score, Math.round(increment * step));
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
    <div className="flex flex-col items-center" style={{ gap: '24px' }}>
      {/* 이름 표시 */}
      <div className="flex items-center justify-center" style={{ gap: '12px' }}>
        <div
          className="flex items-center justify-center"
          style={{
            height: '32px',
            padding: '0 14px',
            borderRadius: '16px',
            backgroundColor: '#E4F7F7',
            fontFamily: font,
            fontSize: '13px',
            fontWeight: 600,
            color: '#48b2af',
          }}
        >
          {myTitle}
        </div>
        <span style={{ fontSize: '18px' }}>💕</span>
        <div
          className="flex items-center justify-center"
          style={{
            height: '32px',
            padding: '0 14px',
            borderRadius: '16px',
            backgroundColor: '#fff6f7',
            fontFamily: font,
            fontSize: '13px',
            fontWeight: 600,
            color: '#ef6878',
          }}
        >
          {partnerTitle}
        </div>
      </div>

      {/* 원형 게이지 */}
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="#f3f3f3"
            strokeWidth="10"
          />
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90, 100, 100)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              fontFamily: font, fontSize: '40px', fontWeight: 600,
              lineHeight: '1', color,
            }}
          >
            {animatedScore}
          </motion.span>
          <span style={{
            fontFamily: font, fontSize: '14px', fontWeight: 400,
            lineHeight: '20px', color: '#848484',
            marginTop: '4px',
          }}>
            점
          </span>
        </div>
      </div>

      {/* 궁합 라벨 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="flex items-center justify-center"
        style={{
          height: '36px',
          padding: '0 20px',
          borderRadius: '18px',
          backgroundColor: color,
          fontFamily: font,
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
        }}
      >
        {getScoreLabel(score)}
      </motion.div>
    </div>
  );
}
