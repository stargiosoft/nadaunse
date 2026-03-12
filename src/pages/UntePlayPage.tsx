/**
 * 운테 플레이 페이지
 * 사주 입력 → 슬롯머신/궁합 애니메이션 → 결과 전환
 */

import { useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseUrl } from '../lib/supabase';
import UnteSajuInput, { type UnteBirthData } from '../components/UnteSajuInput';
import SlotMachineAnimation from '../components/SlotMachineAnimation';
import CompatibilityMeter from '../components/CompatibilityMeter';

interface TestState {
  testId: string;
  test: {
    id: string;
    title: string;
    template_type: string;
    is_adult: boolean;
  };
}

interface ResultData {
  myResult: {
    dayMaster: string;
    element: string;
    resultTitle: string;
    resultDescription: string;
    resultImageUrl: string | null;
    shareImageUrl: string | null;
    score: number;
  };
  partnerResult?: {
    dayMaster: string;
    element: string;
    resultTitle: string;
    resultDescription: string;
    resultImageUrl: string | null;
    score: number;
  } | null;
}

type Phase = 'myInput' | 'partnerInput' | 'loading' | 'animation' | 'done';

export function UntePlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as TestState | undefined;
  const testId = state?.testId;
  const test = state?.test;
  const isCompatibility = test?.template_type === 'compatibility';

  const [phase, setPhase] = useState<Phase>('myInput');
  const [myData, setMyData] = useState<UnteBirthData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 브라우저 fingerprint 간이 생성
  const getFingerprint = (): string => {
    const nav = navigator;
    const raw = `${nav.userAgent}|${nav.language}|${screen.width}x${screen.height}|${new Date().getTimezoneOffset()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const fetchResult = async (
    birthData: UnteBirthData,
    partnerData?: UnteBirthData
  ) => {
    setIsLoading(true);
    setPhase('loading');
    setError('');

    try {
      const body: Record<string, unknown> = {
        testId,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        gender: birthData.gender === 'female' ? '여' : '남',
        calendarType: birthData.calendarType,
        fingerprint: getFingerprint(),
      };

      if (partnerData) {
        body.partnerBirthDate = partnerData.birthDate;
        body.partnerBirthTime = partnerData.birthTime;
        body.partnerGender = partnerData.gender === 'female' ? '여' : '남';
        body.partnerCalendarType = partnerData.calendarType;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/get-viral-test-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '결과를 가져올 수 없습니다.');
      }

      setResult(data);
      setPhase('animation');
    } catch (err) {
      console.error('결과 조회 실패:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setPhase('myInput');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMySubmit = (data: UnteBirthData) => {
    setMyData(data);
    if (isCompatibility) {
      setPhase('partnerInput');
    } else {
      fetchResult(data);
    }
  };

  const handlePartnerSubmit = (partnerData: UnteBirthData) => {
    if (myData) {
      fetchResult(myData, partnerData);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setPhase('done');
    // 결과 페이지로 이동
    setTimeout(() => {
      navigate(`/unte/${slug}/result`, {
        state: { result, test },
      });
    }, 800);
  }, [navigate, slug, result, test]);

  // testId가 없으면 랜딩으로 리다이렉트
  if (!testId || !test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#fafafa' }}>
        <p style={{ fontSize: '14px', color: '#888' }}>테스트 정보를 찾을 수 없어요</p>
        <button
          onClick={() => navigate(`/unte/${slug || ''}`)}
          className="px-6 py-2 rounded-full cursor-pointer"
          style={{ backgroundColor: '#48b2af', color: '#fff', fontSize: '14px', border: 'none' }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-[440px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', fontSize: '20px' }}
          >
            ←
          </button>
          <p
            className="flex-1 truncate"
            style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}
          >
            {test.title}
          </p>
        </div>
      </div>

      <div className="max-w-[440px] mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* 내 사주 입력 */}
          {phase === 'myInput' && (
            <motion.div
              key="myInput"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UnteSajuInput
                onSubmit={handleMySubmit}
                isLoading={isLoading}
                label={isCompatibility ? '내 정보 입력' : '정보를 입력해주세요'}
              />
              {error && (
                <p style={{ fontSize: '13px', color: '#ff4444', marginTop: '12px' }}>{error}</p>
              )}
            </motion.div>
          )}

          {/* 상대방 사주 입력 (궁합) */}
          {phase === 'partnerInput' && (
            <motion.div
              key="partnerInput"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UnteSajuInput
                onSubmit={handlePartnerSubmit}
                isLoading={isLoading}
                label="상대방 정보 입력"
              />
            </motion.div>
          )}

          {/* 로딩 */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: '48px' }}
              >
                🔮
              </motion.div>
              <p style={{ fontSize: '15px', color: '#888' }}>운명을 읽고 있어요...</p>
            </motion.div>
          )}

          {/* 애니메이션 */}
          {phase === 'animation' && result && (
            <motion.div
              key="animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-16"
            >
              {isCompatibility && result.partnerResult ? (
                <CompatibilityMeter
                  score={Math.round((result.myResult.score + result.partnerResult.score) / 2)}
                  myTitle={myData?.name || '나'}
                  partnerTitle="상대"
                  onComplete={handleAnimationComplete}
                />
              ) : (
                <SlotMachineAnimation
                  element={result.myResult.element}
                  onComplete={handleAnimationComplete}
                />
              )}
            </motion.div>
          )}

          {/* 전환 중 */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ fontSize: '64px' }}
              >
                ✨
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UntePlayPage;
