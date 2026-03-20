/**
 * 운테 플레이 페이지
 * ★DESIGN_SYSTEM★ 기반
 * 1. checking → 로그인+사주 확인
 * 2. selectSaju → FreeSajuSelectPage 재활용 (사주 있을 때)
 * 3. myInput → FreeBirthInfoInput (사주 없을 때 / 직접 입력)
 * 4. partnerInput → 궁합 상대 입력
 * 5. loading → API 호출
 * 6. animation → 슬롯/궁합 애니메이션
 * 7. done → 결과 전환
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, supabaseUrl } from '../lib/supabase';
import FreeBirthInfoInput from '../components/FreeBirthInfoInput';
import FreeSajuSelectPage from '../components/FreeSajuSelectPage';
import SlotMachineAnimation from '../components/SlotMachineAnimation';
import CompatibilityMeter from '../components/CompatibilityMeter';
import { PageLoader } from '../components/ui/PageLoader';

const font = "'Pretendard Variable', sans-serif";

interface BirthInfoData {
  name: string;
  gender: 'female' | 'male';
  birthDate: string;
  birthTime: string;
}

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
    resultLabel?: string | null;
    relationType?: string | null;
  };
  partnerDayMaster?: string | null;
  relationType?: string | null;
  isCompatibility?: boolean;
}

type Phase = 'checking' | 'selectSaju' | 'myInput' | 'partnerInput' | 'loading' | 'animation' | 'done';

export function UntePlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as TestState | undefined;
  const testId = state?.testId;
  const test = state?.test;
  const isCompatibility = test?.template_type === 'compatibility';

  const [phase, setPhase] = useState<Phase>('checking');
  const [hasSajuRecords, setHasSajuRecords] = useState(false);
  const [myData, setMyData] = useState<BirthInfoData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // 1단계: 로그인 + 사주 확인
  useEffect(() => {
    if (!testId) return;
    const checkSaju = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setPhase('myInput');
        return;
      }

      const { data: records } = await supabase
        .from('saju_records')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (records && records.length > 0) {
        setHasSajuRecords(true);
        setPhase('selectSaju');
      } else {
        setPhase('myInput');
      }
    };
    checkSaju();
  }, [testId]);

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
    birthData: BirthInfoData,
    partnerData?: BirthInfoData
  ) => {
    setPhase('loading');

    try {
      const body: Record<string, unknown> = {
        testId,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        gender: birthData.gender === 'female' ? '여' : '남',
        calendarType: 'solar',
        fingerprint: getFingerprint(),
      };

      if (partnerData) {
        body.partnerBirthDate = partnerData.birthDate;
        body.partnerBirthTime = partnerData.birthTime;
        body.partnerGender = partnerData.gender === 'female' ? '여' : '남';
        body.partnerCalendarType = 'solar';
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
      setPhase(hasSajuRecords ? 'selectSaju' : 'myInput');
    }
  };

  // 사주 선택/입력 완료 → 결과 조회
  const handleBirthComplete = (data: BirthInfoData) => {
    setMyData(data);
    if (isCompatibility) {
      setPhase('partnerInput');
    } else {
      fetchResult(data);
    }
  };

  const handlePartnerBirthComplete = (partnerData: BirthInfoData) => {
    if (myData) {
      fetchResult(myData, partnerData);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setPhase('done');
    setTimeout(() => {
      navigate(`/unte/${slug}/result`, {
        state: { result, test },
      });
    }, 800);
  }, [navigate, slug, result, test]);

  /* testId 없으면 fallback */
  if (!testId || !test) {
    return (
      <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ paddingTop: '120px', gap: '20px' }}>
          <div
            className="flex items-center justify-center"
            style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#f9f9f9' }}
          >
            <span style={{ fontSize: '32px' }}>😢</span>
          </div>
          <div className="flex flex-col items-center" style={{ gap: '8px' }}>
            <p style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
              textAlign: 'center',
            }}>
              테스트 정보를 찾을 수 없어요
            </p>
          </div>
          <button
            onClick={() => navigate(`/unte/${slug || ''}`)}
            className="flex items-center justify-center cursor-pointer"
            style={{
              height: '48px', padding: '0 32px', borderRadius: '16px',
              backgroundColor: '#48b2af', border: 'none', transition: 'transform 0.1s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{
              fontFamily: font, fontSize: '15px', fontWeight: 500,
              lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff',
            }}>
              돌아가기
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Phase: 초기 확인 중 (깜빡임 방지)
  if (phase === 'checking') {
    return <PageLoader showMessage={false} />;
  }

  // Phase: 사주 선택 (FreeSajuSelectPage 재활용)
  if (phase === 'selectSaju') {
    return (
      <FreeSajuSelectPage
        productId=""
        onBack={() => navigate(-1)}
        mode="consult"
        onConsultComplete={handleBirthComplete}
      />
    );
  }

  // Phase: 사주 입력 (사주 없는 경우 / 직접 입력)
  if (phase === 'myInput') {
    return (
      <FreeBirthInfoInput
        productId=""
        onBack={() => {
          if (hasSajuRecords) {
            setPhase('selectSaju');
          } else {
            navigate(-1);
          }
        }}
        mode="consult"
        onConsultComplete={handleBirthComplete}
        skipAutoComplete={hasSajuRecords}
      />
    );
  }

  // Phase: 궁합 상대방 입력
  if (phase === 'partnerInput') {
    return (
      <FreeBirthInfoInput
        productId=""
        onBack={() => setPhase(hasSajuRecords ? 'selectSaju' : 'myInput')}
        mode="consult"
        onConsultComplete={handlePartnerBirthComplete}
      />
    );
  }

  // Phase: 로딩 / 애니메이션 / 전환
  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative">

        {/* 헤더 — 52px */}
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f3f3' }}
        >
          <div
            className="flex items-center"
            style={{ height: '52px', padding: '0 20px', gap: '12px' }}
          >
            <span
              className="flex-1 truncate"
              style={{
                fontFamily: font, fontSize: '16px', fontWeight: 600,
                lineHeight: '22px', letterSpacing: '-0.32px', color: '#151515',
              }}
            >
              {test.title}
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <AnimatePresence mode="wait">
            {/* 로딩 */}
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
                style={{ paddingTop: '100px' }}
              >
                <PageLoader message="운명을 읽고 있어요..." />
              </motion.div>
            )}

            {/* 애니메이션 */}
            {phase === 'animation' && result && (
              <motion.div
                key="animation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
                style={{ paddingTop: '60px' }}
              >
                {isCompatibility && result.relationType ? (
                  <CompatibilityMeter
                    score={result.myResult.score}
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
                className="flex items-center justify-center"
                style={{ paddingTop: '100px' }}
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
    </div>
  );
}

export default UntePlayPage;
