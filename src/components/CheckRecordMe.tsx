import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import svgPaths from '@/imports/svg-rr05b2c3l6';
import Frame427322492 from '@/imports/Frame427322492';
import ReceiveMyAnalysis from '@/components/ReceiveMyAnalysis';
import ArrowLeft from './ArrowLeft';
// NOTE: CompletionCoupon과 MypageProfile은 삭제된 컴포넌트입니다
// import CompletionCoupon from '@/components/CompletionCoupon';
// import MypageProfile from '@/components/MypageProfile';
import ReportWeeklyDetail from '@/components/ReportWeeklyDetail';
import ReportWeeklyTarot from '@/components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from '@/components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from '@/components/ReportWeeklyMindCare';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

interface SajuRecord {
  id: string;
  phone_number: string | null;
  notes: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface TagOption {
  id: string;
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  selected: boolean;
}

interface CheckRecordMeProps {
  contentId?: string; // 콘텐츠 ID (태그 저장 시 source_content_id로 사용)
  orderId?: string;   // ⭐ 주문 ID (유료 콘텐츠용 - source_order_id로 사용)
  tags?: { name: string; type: 'positive' | 'negative' | 'neutral' }[]; // API에서 받은 태그
  sourceType?: 'free_content' | 'paid_content'; // ⭐ 콘텐츠 유형
  onBack?: () => void;
  onHome?: () => void;
  onSkip?: () => void; // 다음에 할래요
  onComplete?: () => void; // ⭐ 저장 완료 후 콜백 (유료 콘텐츠용)
}

export default function CheckRecordMe({
  contentId,
  orderId,           // ⭐ 추가
  tags: initialTags,
  sourceType = 'free_content', // ⭐ 추가
  onBack: onBackProp,
  onHome: onHomeProp,
  onSkip,
  onComplete         // ⭐ 추가
}: CheckRecordMeProps = {}) {
  // 태그 초기화: props에서 받거나 기본값 사용
  // 첫 번째 장점(positive) 태그만 기본 선택
  const defaultTags: TagOption[] = [
    { id: '1', label: '설득력 있는', type: 'positive', selected: true },
    { id: '2', label: '리더십 있는', type: 'positive', selected: false },
    { id: '3', label: '경쟁심 있는', type: 'negative', selected: false },
  ];

  const [tags, setTags] = useState<TagOption[]>(() => {
    if (initialTags && initialTags.length > 0) {
      // 첫 번째 positive 태그의 인덱스 찾기
      const firstPositiveIdx = initialTags.findIndex(tag => tag.type === 'positive');

      return initialTags.map((tag, idx) => ({
        id: String(idx + 1),
        label: tag.name,
        type: tag.type,
        selected: idx === firstPositiveIdx // 첫 번째 positive 태그만 선택
      }));
    }
    return defaultTags;
  });
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [view, setView] = useState<'recording' | 'result' | 'mypage' | 'dev-report' | 'dev-tarot-picking' | 'dev-tarot-result' | 'dev-mind-prescription'>('recording');

  // 휴대폰 번호를 부모 컴포넌트에서 관리하여 바텀 시트가 닫혀도 유지되도록 함
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ⭐ 본인 사주 레코드 (phone_number 확인용)
  const [mySajuRecord, setMySajuRecord] = useState<SajuRecord | null>(null);
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(true);

  // ⭐ 마운트 시 saju_records에서 note='본인'인 레코드의 phone_number 확인
  useEffect(() => {
    const checkPhoneNumber = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          console.log('ℹ️ [CheckRecordMe] 비로그인 상태 → phone_number 체크 스킵');
          setIsCheckingPhone(false);
          setNeedsPhoneNumber(true); // 비로그인 시에도 바텀시트 표시
          return;
        }

        console.log('🔍 [CheckRecordMe] 본인 사주 레코드 조회...');
        const { data: sajuRecord, error } = await supabase
          .from('saju_records')
          .select('id, phone_number, notes')
          .eq('user_id', session.user.id)
          .eq('notes', '본인')
          .maybeSingle();

        if (error) {
          console.error('❌ [CheckRecordMe] 사주 레코드 조회 실패:', error);
          setIsCheckingPhone(false);
          return;
        }

        if (sajuRecord) {
          console.log('✅ [CheckRecordMe] 본인 사주 레코드:', sajuRecord);
          setMySajuRecord(sajuRecord);
          setNeedsPhoneNumber(!sajuRecord.phone_number);
          console.log('📌 [CheckRecordMe] phone_number 필요 여부:', !sajuRecord.phone_number);
        } else {
          console.log('ℹ️ [CheckRecordMe] 본인 사주 레코드 없음');
          setNeedsPhoneNumber(true);
        }
      } catch (err) {
        console.error('❌ [CheckRecordMe] phone_number 체크 오류:', err);
      } finally {
        setIsCheckingPhone(false);
      }
    };

    checkPhoneNumber();
  }, []);

  const toggleTag = (id: string) => {
    setTags(tags.map(tag =>
      tag.id === id ? { ...tag, selected: !tag.selected } : tag
    ));
  };

  // ⭐ 태그 확정 함수 (임시 태그 → 선택한 것만 확정, 나머지 삭제)
  const saveTags = async (): Promise<boolean> => {
    const selectedTagNames = tags
      .filter(tag => tag.selected)
      .map(tag => tag.label);

    const unselectedTagNames = tags
      .filter(tag => !tag.selected)
      .map(tag => tag.label);

    if (selectedTagNames.length === 0) {
      toast.error('태그를 1개 이상 선택해주세요.');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        console.log('🏷️ [CheckRecordMe] 태그 확정 시작...');
        console.log('  - 선택된 태그:', selectedTagNames);
        console.log('  - 선택 안 된 태그:', unselectedTagNames);

        // ⭐ 1. 선택한 태그: is_confirmed = true로 UPDATE
        if (selectedTagNames.length > 0) {
          // 유료 콘텐츠: source_order_id 기준
          // 무료 콘텐츠: source_content_id + source_type 기준
          const updateQuery = supabase
            .from('user_trait_tags')
            .update({ is_confirmed: true })
            .eq('user_id', session.user.id)
            .in('tag_name', selectedTagNames);

          if (orderId) {
            await updateQuery.eq('source_order_id', orderId);
          } else if (contentId) {
            await updateQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
          }
          console.log('✅ [CheckRecordMe] 선택 태그 확정 완료');
        }

        // ⭐ 2. 선택 안 한 태그: DELETE
        if (unselectedTagNames.length > 0) {
          const deleteQuery = supabase
            .from('user_trait_tags')
            .delete()
            .eq('user_id', session.user.id)
            .in('tag_name', unselectedTagNames);

          if (orderId) {
            await deleteQuery.eq('source_order_id', orderId);
          } else if (contentId) {
            await deleteQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
          }
          console.log('🗑️ [CheckRecordMe] 미선택 태그 삭제 완료');
        }

        console.log('✅ [CheckRecordMe] 태그 확정 완료');
        // 🚀 ProfilePage & NadaumTagsList 캐시 무효화
        localStorage.setItem('trait_tags_needs_refresh', 'true');
        localStorage.removeItem('trait_tags_cache');
        localStorage.removeItem('nadaum_all_tags_cache');
        // 토스트는 호출하는 쪽에서 처리
        return true;
      } else {
        // 게스트 사용자: localStorage에 임시 저장
        console.log('ℹ️ [CheckRecordMe] 게스트 모드 → localStorage에 임시 저장');
        const selectedTags = tags.filter(tag => tag.selected);
        const guestTags = JSON.parse(localStorage.getItem('guest_trait_tags') || '[]');
        const newTags = selectedTags.map(tag => ({
          name: tag.label,
          type: tag.type,
          source_content_id: contentId,
          source_order_id: orderId,
          source_type: sourceType,
          created_at: new Date().toISOString()
        }));
        localStorage.setItem('guest_trait_tags', JSON.stringify([...guestTags, ...newTags]));
        toast.success('태그가 임시 저장되었습니다. 로그인하면 자동으로 동기화됩니다.');
        return true;
      }
    } catch (err) {
      console.error('❌ [CheckRecordMe] 태그 확정 중 오류:', err);
      toast.error('태그 저장 중 오류가 발생했습니다.');
      return false;
    }
  };

  // ⭐ Primary 버튼 클릭 핸들러 (phone_number 체크 후 바텀시트 or 직접 저장)
  const handlePrimaryButtonClick = async () => {
    // 태그 선택 여부 체크
    if (!tags.some(t => t.selected)) {
      toast.error('태그를 1개 이상 선택해주세요.');
      return;
    }

    // phone_number가 필요하면 바텀시트 열기
    if (needsPhoneNumber) {
      console.log('📱 [CheckRecordMe] phone_number 필요 → 바텀시트 열기');
      setIsBottomSheetOpen(true);
      return;
    }

    // phone_number가 이미 있으면 바로 태그 저장
    console.log('✅ [CheckRecordMe] phone_number 있음 → 바로 태그 저장');
    setIsSaving(true);
    const success = await saveTags();
    setIsSaving(false);

    if (success) {
      // 토스트 표시 (2줄)
      toast.success('태그가 저장됐어요!', {
        subtitle: '프로필에서 확인할 수 있어요.',
        duration: 2200
      });

      // ⭐ onComplete 콜백이 있으면 호출 (유료 콘텐츠 → 구매내역으로 이동)
      if (onComplete) {
        onComplete();
      } else if (onHomeProp) {
        onHomeProp();
      }
    }
  };

  // ⭐ 바텀시트에서 저장 버튼 클릭 (phone_number 저장 + 태그 확정)
  const handleSave = async () => {
    const selectedTagNames = tags
      .filter(tag => tag.selected)
      .map(tag => tag.label);

    const unselectedTagNames = tags
      .filter(tag => !tag.selected)
      .map(tag => tag.label);

    if (selectedTagNames.length === 0) {
      toast.error('태그를 1개 이상 선택해주세요.');
      return;
    }

    // 휴대폰 번호 유효성 검사
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token && mySajuRecord) {
        // ⭐ 1. phone_number를 saju_records에 업데이트
        console.log('📱 [CheckRecordMe] phone_number 저장 중...');
        const { error: phoneError } = await supabase
          .from('saju_records')
          .update({ phone_number: cleanPhone })
          .eq('id', mySajuRecord.id);

        if (phoneError) {
          console.error('❌ [CheckRecordMe] phone_number 저장 실패:', phoneError);
          toast.error('휴대폰 번호 저장에 실패했습니다.');
          setIsSaving(false);
          return;
        }
        console.log('✅ [CheckRecordMe] phone_number 저장 성공');

        // ⭐ 2. 선택한 태그: is_confirmed = true로 UPDATE
        console.log('🏷️ [CheckRecordMe] 태그 확정 시작...');
        if (selectedTagNames.length > 0) {
          const updateQuery = supabase
            .from('user_trait_tags')
            .update({ is_confirmed: true })
            .eq('user_id', session.user.id)
            .in('tag_name', selectedTagNames);

          if (orderId) {
            await updateQuery.eq('source_order_id', orderId);
          } else if (contentId) {
            await updateQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
          }
          console.log('✅ [CheckRecordMe] 선택 태그 확정 완료');
        }

        // ⭐ 3. 선택 안 한 태그: DELETE
        if (unselectedTagNames.length > 0) {
          const deleteQuery = supabase
            .from('user_trait_tags')
            .delete()
            .eq('user_id', session.user.id)
            .in('tag_name', unselectedTagNames);

          if (orderId) {
            await deleteQuery.eq('source_order_id', orderId);
          } else if (contentId) {
            await deleteQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
          }
          console.log('🗑️ [CheckRecordMe] 미선택 태그 삭제 완료');
        }

        console.log('✅ [CheckRecordMe] 태그 확정 완료');

        // 🚀 ProfilePage & NadaumTagsList 캐시 무효화
        localStorage.setItem('trait_tags_needs_refresh', 'true');
        localStorage.removeItem('trait_tags_cache');
        localStorage.removeItem('nadaum_all_tags_cache');
      } else {
        // 게스트 사용자: localStorage에 임시 저장
        console.log('ℹ️ [CheckRecordMe] 게스트 모드 → localStorage에 임시 저장');
        const selectedTags = tags.filter(tag => tag.selected);
        const guestTags = JSON.parse(localStorage.getItem('guest_trait_tags') || '[]');
        const newTags = selectedTags.map(tag => ({
          name: tag.label,
          type: tag.type,
          source_content_id: contentId,
          source_order_id: orderId,
          source_type: sourceType,
          created_at: new Date().toISOString()
        }));
        localStorage.setItem('guest_trait_tags', JSON.stringify([...guestTags, ...newTags]));

        // 게스트 phone_number도 localStorage에 저장
        localStorage.setItem('guest_phone_number', cleanPhone);
      }
    } catch (err) {
      console.error('❌ [CheckRecordMe] 저장 중 오류:', err);
      toast.error('저장 중 오류가 발생했습니다.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsBottomSheetOpen(false);

    // 토스트 표시 (2줄)
    toast.success('태그가 저장됐어요!', {
      subtitle: '프로필에서 확인할 수 있어요.',
      duration: 2200
    });

    // 바텀 시트가 닫히는 애니메이션(0.3s)이 끝난 후 화면 전환
    setTimeout(() => {
      // ⭐ onComplete 콜백이 있으면 호출 (유료 콘텐츠 → 구매내역으로 이동)
      if (onComplete) {
        onComplete();
      } else if (onHomeProp) {
        onHomeProp();
      }
    }, 300);
  };

  const handleBack = () => {
    if (view === 'mypage') {
      setView('result');
      return;
    }
    if (view === 'dev-report') {
      setView('result');
      return;
    }
    if (view === 'dev-tarot-picking') {
      setView('dev-report');
      return;
    }
    if (view === 'dev-mind-prescription') {
      setView('dev-tarot-result');
      return;
    }
    if (view === 'dev-tarot-result') {
      setView('dev-tarot-picking');
      return;
    }
    // recording 상태에서 뒤로가기 → props로 전달받은 핸들러 호출
    if (view === 'recording' && onBackProp) {
      onBackProp();
      return;
    }
    setView('recording');
  };

  const handleHome = () => {
    // 홈으로 가기 → props로 전달받은 핸들러 호출
    if (onHomeProp) {
      onHomeProp();
      return;
    }
    // 홈으로 가면 초기화 (선택 사항)
    setView('recording');
    setPhoneNumber("");
    setTags(tags.map(t => ({...t, selected: false})));
  };

  // NOTE: MypageProfile 컴포넌트가 삭제되어 임시로 result 화면으로 리다이렉트
  if (view === 'mypage') {
    setView('result');
    return null;
  }

  if (view === 'dev-report') {
    return <ReportWeeklyDetail onBack={handleBack} onTarotStart={() => setView('dev-tarot-picking')} />;
  }

  if (view === 'dev-tarot-picking') {
    return <ReportWeeklyTarot onBack={handleBack} onNext={() => setView('dev-tarot-result')} />;
  }

  if (view === 'dev-tarot-result') {
    return <ReportWeeklyTarotResult onBack={handleBack} onNext={() => setView('dev-mind-prescription')} />;
  }

  if (view === 'dev-mind-prescription') {
    return <ReportWeeklyMindCare onBack={handleBack} onPrev={handleBack} />;
  }

  // NOTE: CompletionCoupon 컴포넌트가 삭제되어 임시 placeholder 표시
  if (view === 'result') {
    return (
      <div className="bg-white relative w-full h-screen flex flex-col items-center justify-center mx-auto" style={{ maxWidth: '440px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', color: '#999' }}>
          완료 화면 (CompletionCoupon 컴포넌트 필요)
        </p>
        <button
          onClick={handleHome}
          className="mt-4 px-6 py-3 rounded-xl"
          style={{ backgroundColor: '#48b2af' }}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', color: '#fff' }}>홈으로</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white relative w-full h-screen flex flex-col mx-auto" style={{ maxWidth: '440px' }}>
      {/* Top Navigation */}
      <div className="bg-white relative shrink-0 w-full">
        <div className="flex flex-col justify-center" style={{ height: '52px' }}>
          <div className="flex items-center justify-between" style={{ padding: '4px 12px' }}>
            {/* Left Action - Back Button */}
            <ArrowLeft onClick={handleBack} />

            {/* Title */}
            <p className="flex-[1_0_0] text-center overflow-hidden text-ellipsis" style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              color: '#000000',
              letterSpacing: '-0.36px'
            }}>
              나다움 기록하기
            </p>

            {/* Right Action - Home Button */}
            <button
              type="button"
              onClick={handleHome}
              className="group flex items-center justify-center shrink-0 transition-colors duration-200 active:bg-gray-100"
              style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
            >
              <div className="relative shrink-0 transition-transform duration-200 group-active:scale-90" style={{ width: '24px', height: '24px' }}>
                <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g>
                    <path d={svgPaths.p3d07f180} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    <path d="M12 17.99V14.99" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        <motion.div
          className="flex flex-col w-full mx-auto"
          style={{ gap: '64px', maxWidth: '350px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.1 }
            }
          }}
        >
          {/* Header Section */}
          <motion.div
            className="w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
            }}
          >
            <div className="flex flex-col" style={{ gap: '8px', padding: '0 4px' }}>
              <div className="flex flex-col" style={{ gap: '6px' }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#000000',
                  letterSpacing: '-0.2px'
                }}>
                  현재의
                </p>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#000000',
                  letterSpacing: '-0.2px'
                }}>
                  내 모습과 가장 가까운 태그는?
                </p>
              </div>
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#999999',
                letterSpacing: '-0.42px'
              }}>
                태그가 모일수록 나에 대한 분석이 더 정확해요!
              </p>
            </div>
          </motion.div>

          {/* Illustration and Tag Options */}
          <motion.div
            className="flex flex-col w-full"
            style={{ gap: '8px' }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            {/* Illustration */}
            <motion.div
              className="relative shrink-0"
              style={{ height: '96px', width: '150px', overflow: 'hidden' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                }
              }}
            >
              <Frame427322492 />
            </motion.div>

            {/* Tag Options */}
            <motion.div
              className="flex flex-col w-full"
              style={{ gap: '8px', marginTop: '-12px' }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {tags.map((tag) => (
                <motion.button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    gap: '16px'
                  }}
                  className="group flex items-center w-full"
                >
                  <div
                    className="flex-1 relative transition-all duration-200 ease-in-out box-border"
                    style={{
                      borderRadius: '16px',
                      backgroundColor: tag.selected ? '#f0f8f8' : '#f8f8f8',
                      // border 대신 box-shadow(inset)을 사용해 레이아웃 흔들림 방지
                      boxShadow: tag.selected ? 'inset 0 0 0 1.5px #48b2af' : 'inset 0 0 0 1.5px transparent'
                    }}
                  >
                    <div className="flex items-center" style={{ padding: '16px 24px' }}>
                      <p className="transition-colors duration-200" style={{
                        fontFamily: 'Pretendard Variable',
                        fontWeight: 400,
                        fontSize: '15px',
                        lineHeight: '25.5px',
                        color: tag.selected ? '#368683' : '#151515',
                        letterSpacing: '-0.3px'
                      }}>
                        {tag.label}
                      </p>
                    </div>
                  </div>

                  <div className="relative shrink-0" style={{ width: '28px', height: '28px' }}>
                    <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
                      <g>
                        <path
                          className="transition-colors duration-200"
                          d={svgPaths.p2249c900}
                          stroke={tag.selected ? '#41A09E' : '#E7E7E7'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                        />
                      </g>
                    </svg>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Divider and Message */}
          <motion.div
            className="flex items-start justify-center w-full"
            style={{ gap: '12px', marginTop: '-32px', paddingLeft: '3px' }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
            }}
          >
            <div className="relative self-stretch shrink-0" style={{ width: 0 }}>
              <div className="absolute" style={{ inset: '-1.7% -0.75px' }}>
                <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 45.5">
                  <path d="M0.75 0.75V44.75" stroke="#E7E7E7" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center" style={{ padding: '0 4px' }}>
                <p className="flex-1" style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '22px',
                  color: '#999999'
                }}>
                  내 약함도, 내 강함도 모두 소중한 나예요.
                  <br />
                  그 모습들이 모여 지금의 나를 만들어요.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Button Container */}
      <div className="bg-white relative shrink-0 w-full" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
        <div className="flex flex-col items-center justify-center" style={{ padding: '12px 20px' }}>
          <div className="flex flex-col w-full" style={{ gap: '8px' }}>
            {/* Primary Button */}
            <button
              onClick={handlePrimaryButtonClick}
              disabled={!tags.some(t => t.selected) || isSaving || isCheckingPhone}
              className={`w-full flex items-center justify-center transition-all ${
                tags.some(t => t.selected) && !isSaving && !isCheckingPhone
                  ? 'active:scale-[0.99]'
                  : 'cursor-not-allowed'
              }`}
              style={{
                borderRadius: '16px',
                height: '56px',
                backgroundColor: (tags.some(t => t.selected) && !isSaving && !isCheckingPhone) ? '#48b2af' : '#f8f8f8'
              }}
            >
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '25px',
                color: (tags.some(t => t.selected) && !isSaving && !isCheckingPhone) ? '#ffffff' : '#b7b7b7',
                letterSpacing: '-0.32px'
              }}>
                {isSaving ? '저장 중...' : '태그 저장하고 나의 분석 보고서 받기'}
              </p>
            </button>

            {/* Secondary Button - 다음에 할래요 */}
            <button
              onClick={onSkip}
              className="group flex flex-col items-center justify-center relative self-center transition-colors duration-200 active:bg-gray-100"
              style={{ padding: '0 8px', borderRadius: '12px', height: '34px' }}
            >
              <div className="flex items-center relative shrink-0 w-full justify-center transition-transform duration-200 group-active:scale-95" style={{ gap: '4px' }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: '#848484',
                  letterSpacing: '-0.42px'
                }}>
                  다음에 할래요
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <ReceiveMyAnalysis
            onClose={() => !isSaving && setIsBottomSheetOpen(false)} // 저장 중에는 닫기 방지
            onSave={handleSave}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
