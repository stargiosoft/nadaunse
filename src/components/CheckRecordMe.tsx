import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import svgPaths from '@/imports/svg-rr05b2c3l6';
import Frame427322492 from '@/imports/Frame427322492';
import ReceiveMyAnalysis from '@/components/ReceiveMyAnalysis';
import TagCouponBottomSheet from '@/components/TagCouponBottomSheet';
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
  resultKey?: string; // ⭐ localStorage 결과 키 (게스트→로그인 시 정확한 결과 매칭용)
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
  resultKey,         // ⭐ localStorage 결과 키
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
  const [isPromoBottomSheetOpen, setIsPromoBottomSheetOpen] = useState(false); // 프로모션 바텀시트
  const [isTagEncourageOpen, setIsTagEncourageOpen] = useState(false); // 태그 모으기 유도 바텀시트
  const [remainingTagCount, setRemainingTagCount] = useState(0); // 쿠폰까지 남은 태그 수
  const [view, setView] = useState<'recording' | 'result' | 'mypage' | 'tag-saved-info' | 'coupon-info' | 'dev-report' | 'dev-tarot-picking' | 'dev-tarot-result' | 'dev-mind-prescription'>('recording');
  const [completionRemainingTags, setCompletionRemainingTags] = useState(0); // 완료 페이지: 남은 태그 수
  const navigate = useNavigate();

  // 휴대폰 번호를 부모 컴포넌트에서 관리하여 바텀 시트가 닫혀도 유지되도록 함
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ⭐ 본인 사주 레코드 (phone_number 확인용) - 무료 콘텐츠에서만 체크
  // 🚀 유료 콘텐츠는 이미 앞에서 phone_number를 받으므로 체크 불필요
  const getInitialPhoneCheckState = () => {
    // ⭐ 유료 콘텐츠면 phone_number 체크 스킵
    if (sourceType === 'paid_content') {
      console.log('✅ [CheckRecordMe] 유료 콘텐츠 → phone_number 체크 스킵');
      return {
        mySajuRecord: null,
        needsPhoneNumber: false,
        isCheckingPhone: false
      };
    }

    // 무료 콘텐츠: 캐시에서 phone_number 확인
    try {
      const primarySajuJson = localStorage.getItem('primary_saju');
      if (primarySajuJson) {
        const primarySaju = JSON.parse(primarySajuJson);
        if (primarySaju && primarySaju.notes === '본인') {
          console.log('🚀 [CheckRecordMe] 캐시에서 phone_number 확인:', primarySaju.phone_number ? '있음' : '없음');
          return {
            mySajuRecord: primarySaju,
            needsPhoneNumber: !primarySaju.phone_number,
            isCheckingPhone: false
          };
        }
      }
    } catch (e) {
      console.error('❌ [CheckRecordMe] 캐시 파싱 실패:', e);
    }
    return {
      mySajuRecord: null,
      needsPhoneNumber: false,
      isCheckingPhone: true
    };
  };

  const initialPhoneState = getInitialPhoneCheckState();
  const [mySajuRecord, setMySajuRecord] = useState<SajuRecord | null>(initialPhoneState.mySajuRecord);
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(initialPhoneState.needsPhoneNumber);
  const [isCheckingPhone, setIsCheckingPhone] = useState(initialPhoneState.isCheckingPhone);

  // ⭐ 무료 콘텐츠 + 캐시 미스 시에만 API 호출
  useEffect(() => {
    // 유료 콘텐츠거나 캐시에서 이미 확인 완료했으면 스킵
    if (sourceType === 'paid_content' || !initialPhoneState.isCheckingPhone) {
      return;
    }

    const checkPhoneNumber = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          console.log('ℹ️ [CheckRecordMe] 비로그인 상태 → phone_number 체크 스킵');
          setIsCheckingPhone(false);
          setNeedsPhoneNumber(true);
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
  }, [sourceType]);

  // ⭐ 로그인 후 태그 저장 및 홈으로 이동 처리 (바텀시트 없이)
  // NOTE: 이 로직은 이제 PendingTagsCheckPage에서 처리하므로 거의 실행되지 않음
  // 하지만 엣지 케이스를 위해 open_phone_bottomsheet 플래그도 함께 체크
  useEffect(() => {
    const saveTagsAndGoHome = async () => {
      const shouldOpenBottomSheet = localStorage.getItem('open_phone_bottomsheet');
      const pendingTagsJson = localStorage.getItem('pending_trait_tags');

      // ⭐ open_phone_bottomsheet + pending_trait_tags 둘 다 있어야 처리
      // (PendingTagsCheckPage에서 이동한 경우에만 실행 - 이제는 거의 발생 안 함)
      if (shouldOpenBottomSheet === 'true' && pendingTagsJson) {
        console.log('📱 [CheckRecordMe] 회원가입 후 태그 저장 플래그 감지');

        // ⭐ 로그인 상태 체크 먼저!
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          console.log('⚠️ [CheckRecordMe] 비로그인 상태 → 처리 취소 (로그인 후 처리)');
          return;
        }

        try {
          const pendingData = JSON.parse(pendingTagsJson);
          console.log('📋 [CheckRecordMe] pending_trait_tags 데이터:', pendingData);

          // ⭐ 태그를 바로 DB에 저장하고 홈으로 이동
          if (pendingData.tags && pendingData.tags.length > 0) {
            const selectedTagLabels = pendingData.tags.map((t: { label: string }) => t.label);
            console.log('📋 [CheckRecordMe] 저장할 태그:', selectedTagLabels);

            // DB에 태그 INSERT (확정 상태로)
            const tagsToInsert = pendingData.tags.map((tag: { label: string; type?: string }) => ({
              user_id: session.user.id,
              tag_name: tag.label,
              tag_type: tag.type || 'positive', // ⭐ tag_type 필수 (NOT NULL)
              source_order_id: pendingData.orderId || null,
              source_content_id: pendingData.contentId || null,
              source_type: pendingData.sourceType || 'free',
              is_confirmed: true, // 확정 상태로 저장
            }));

            const { error: insertError } = await supabase
              .from('user_trait_tags')
              .insert(tagsToInsert);

            if (insertError) {
              console.error('❌ [CheckRecordMe] 태그 INSERT 실패:', insertError);
            } else {
              console.log('✅ [CheckRecordMe] 태그 저장 완료:', selectedTagLabels.length, '개');
            }
          }

          // ⭐ 미선택 태그 → users.rejected_tags에 추가 (AI 재추출 방지)
          const unselectedTags: string[] = pendingData.unselectedTags || [];
          if (unselectedTags.length > 0) {
            await appendRejectedTags(session.user.id, unselectedTags);
          }

          // 플래그 제거
          localStorage.removeItem('open_phone_bottomsheet');
          localStorage.removeItem('pending_trait_tags');
          localStorage.removeItem('redirectAfterLogin');

          // 캐시 무효화
          localStorage.setItem('trait_tags_needs_refresh', 'true');

          // ⭐ "로그인되었어요" 토스트 대신 "태그가 저장됐어요" 토스트 표시 플래그
          sessionStorage.setItem('show_tag_saved_toast', 'true');
          sessionStorage.removeItem('show_login_toast');

          // 홈으로 이동 (App.tsx에서 토스트 표시)
          console.log('🏠 [CheckRecordMe] 홈으로 이동');
          navigate('/', { replace: true });
        } catch (e) {
          console.error('❌ [CheckRecordMe] 태그 저장 실패:', e);
          localStorage.removeItem('open_phone_bottomsheet');
          localStorage.removeItem('pending_trait_tags');
        }
      }
    };

    saveTagsAndGoHome();
  }, [navigate]);

  const toggleTag = (id: string) => {
    setTags(tags.map(tag =>
      tag.id === id ? { ...tag, selected: !tag.selected } : tag
    ));
  };

  /** 미선택 태그를 users.rejected_tags에 추가 (중복 제거) */
  const appendRejectedTags = async (userId: string, newRejectedTags: string[]) => {
    if (newRejectedTags.length === 0) return;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('rejected_tags')
        .eq('id', userId)
        .single();

      const currentRejected: string[] = userData?.rejected_tags || [];
      const merged = [...new Set([...currentRejected, ...newRejectedTags])];

      await supabase
        .from('users')
        .update({ rejected_tags: merged })
        .eq('id', userId);

      console.log('✅ [CheckRecordMe] rejected_tags 업데이트:', newRejectedTags);
    } catch (err) {
      console.warn('⚠️ [CheckRecordMe] rejected_tags 업데이트 실패:', err);
    }
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

        // ⭐ 먼저 기존 태그가 DB에 있는지 확인
        let existingTagsQuery = supabase
          .from('user_trait_tags')
          .select('tag_name')
          .eq('user_id', session.user.id);

        if (orderId) {
          existingTagsQuery = existingTagsQuery.eq('source_order_id', orderId);
        } else if (contentId) {
          existingTagsQuery = existingTagsQuery
            .eq('source_content_id', contentId)
            .eq('source_type', sourceType);
        }

        const { data: existingTags } = await existingTagsQuery;
        const hasExistingTags = existingTags && existingTags.length > 0;
        console.log('📌 [CheckRecordMe] 기존 태그 존재 여부:', hasExistingTags, '개수:', existingTags?.length || 0);

        if (selectedTagNames.length > 0) {
          if (!hasExistingTags) {
            // ⭐ DB에 태그가 없으면 INSERT (로그인 후 첫 저장인 경우)
            console.log('📝 [CheckRecordMe] DB에 태그 없음 → INSERT 수행');

            const tagsToInsert = tags
              .filter(tag => tag.selected)
              .map(tag => ({
                user_id: session.user.id,
                tag_name: tag.label,
                tag_type: tag.type,
                source_type: sourceType,
                source_content_id: contentId || null,
                source_order_id: orderId || null,
                is_confirmed: true
              }));

            const { data: insertedTags, error: insertError } = await supabase
              .from('user_trait_tags')
              .insert(tagsToInsert)
              .select();

            if (insertError) {
              console.error('❌ [CheckRecordMe] 태그 INSERT 실패:', insertError);
            } else {
              console.log('✅ [CheckRecordMe] 태그 INSERT 완료:', insertedTags?.length || 0, '개');
            }
          } else {
            // ⭐ DB에 태그가 있으면 UPDATE
            console.log('📝 [CheckRecordMe] DB에 태그 있음 → UPDATE 수행');

            // 유료 콘텐츠: source_order_id 기준
            // 무료 콘텐츠: source_content_id + source_type 기준
            let updateResult;
            if (orderId) {
              updateResult = await supabase
                .from('user_trait_tags')
                .update({ is_confirmed: true })
                .eq('user_id', session.user.id)
                .in('tag_name', selectedTagNames)
                .eq('source_order_id', orderId)
                .select();
            } else if (contentId) {
              updateResult = await supabase
                .from('user_trait_tags')
                .update({ is_confirmed: true })
                .eq('user_id', session.user.id)
                .in('tag_name', selectedTagNames)
                .eq('source_content_id', contentId)
                .eq('source_type', sourceType)
                .select();
            }

            if (updateResult?.error) {
              console.error('❌ [CheckRecordMe] 태그 확정 실패:', updateResult.error);
            } else {
              console.log('✅ [CheckRecordMe] 선택 태그 확정 완료:', updateResult?.data?.length || 0, '개');
            }
          }
        }

        // ⭐ 2. 선택 안 한 태그: DELETE (기존 태그가 있을 때만)
        if (unselectedTagNames.length > 0 && hasExistingTags) {
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

        // ⭐ 3. 선택 안 한 태그: rejected_tags에 추가 (AI 재추출 방지)
        await appendRejectedTags(session.user.id, unselectedTagNames);

        console.log('✅ [CheckRecordMe] 태그 확정 완료');
        // 🚀 ProfilePage & NadaumTagsList & MyReportList 캐시 무효화
        localStorage.setItem('trait_tags_needs_refresh', 'true');
        localStorage.setItem('my_report_needs_refresh', 'true');
        localStorage.removeItem('trait_tags_cache');
        localStorage.removeItem('nadaum_all_tags_cache');
        localStorage.removeItem('pending_trait_tags'); // 로그인 후 임시 저장 태그 삭제
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

  // ⭐ Primary 버튼 클릭 핸들러 (태그 저장 → 총 태그 수 확인 → 완료 페이지 이동)
  // 📌 핸드폰 번호 유효성 검사는 이 플로우에서 제거됨 (프로필 페이지에서 시행)
  const handlePrimaryButtonClick = async () => {
    // 태그 선택 여부 체크
    if (!tags.some(t => t.selected)) {
      toast.error('태그를 1개 이상 선택해주세요.');
      return;
    }

    // ⭐ 로그인 상태 체크
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      // 🔐 로그아웃 상태 → 태그 임시 저장 후 로그인 페이지로 이동
      console.log('🔐 [CheckRecordMe] 로그아웃 상태 → 로그인 페이지로 이동');

      // 선택된 태그 임시 저장
      const selectedTags = tags.filter(t => t.selected).map(t => ({
        label: t.label,
        type: t.type
      }));

      // 미선택 태그도 함께 저장 (로그인 후 rejected_tags 업데이트용)
      const unselectedTags = tags.filter(t => !t.selected).map(t => t.label);

      localStorage.setItem('pending_trait_tags', JSON.stringify({
        tags: selectedTags,
        unselectedTags: unselectedTags,
        contentId: contentId,
        orderId: orderId,
        resultKey: resultKey,
        sourceType: sourceType
      }));

      // 로그인 후 돌아올 URL 저장 (특별 플래그와 함께)
      localStorage.setItem('redirectAfterLogin', '/pending-tags-check');

      // 로그인 페이지로 이동
      navigate('/login/new', { state: { canGoBack: true } });
      return;
    }

    // ⭐ 저장 전 기존 확정 태그 수 조회 (최초 5개 달성 여부 판단용)
    const { data: beforeTags, error: beforeError } = await supabase
      .from('user_trait_tags')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_confirmed', true)
      .neq('tag_name', '__SKIPPED__');

    if (beforeError) {
      console.error('❌ [CheckRecordMe] 저장 전 태그 수 조회 실패:', beforeError);
    }
    const beforeTagCount = beforeTags?.length || 0;
    console.log('🏷️ [CheckRecordMe] 저장 전 확정 태그 수:', beforeTagCount);

    // ⭐ 바로 태그 저장 (phone_number 체크 제거)
    console.log('✅ [CheckRecordMe] 태그 저장 시작...');
    setIsSaving(true);
    const success = await saveTags();

    if (success) {
      // ⭐ 저장 후 총 확정 태그 수 조회
      const { data: allConfirmedTags, error: countError } = await supabase
        .from('user_trait_tags')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_confirmed', true)
        .neq('tag_name', '__SKIPPED__');

      if (countError) {
        console.error('❌ [CheckRecordMe] 총 태그 수 조회 실패:', countError);
      }

      const totalTagCount = allConfirmedTags?.length || 0;
      console.log('🏷️ [CheckRecordMe] 총 확정 태그 수:', totalTagCount);

      if (totalTagCount >= 5 && beforeTagCount < 5) {
        // ⭐ 최초로 태그 5개 달성 → 쿠폰 발급 안내 페이지
        console.log('🎉 [CheckRecordMe] 최초 5개 달성 → 쿠폰 발급 안내 페이지');
        setView('coupon-info');
      } else if (totalTagCount >= 5 && beforeTagCount >= 5) {
        // ⭐ 이미 5개 이상이었음 → 바로 홈으로
        console.log('🏠 [CheckRecordMe] 이미 5개 이상 보유 → 바로 홈으로 이동');
        toast.success('태그가 저장됐어요!', {
          subtitle: '프로필에서 확인할 수 있어요.',
          duration: 2200,
        });
        navigate('/');
      } else {
        // ⭐ 태그 1~4개 → 모아야할 태그수 안내 페이지
        const remaining = 5 - totalTagCount;
        console.log(`📊 [CheckRecordMe] 태그 ${totalTagCount}개 (${remaining}개 남음) → 태그수 안내 페이지`);
        setCompletionRemainingTags(remaining);
        setView('tag-saved-info');
      }
    }

    setIsSaving(false);
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

        // ⭐ 2. 먼저 기존 태그가 DB에 있는지 확인
        console.log('🏷️ [CheckRecordMe] 태그 확정 시작...');

        let existingTagsQuery = supabase
          .from('user_trait_tags')
          .select('tag_name')
          .eq('user_id', session.user.id);

        if (orderId) {
          existingTagsQuery = existingTagsQuery.eq('source_order_id', orderId);
        } else if (contentId) {
          existingTagsQuery = existingTagsQuery
            .eq('source_content_id', contentId)
            .eq('source_type', sourceType);
        }

        const { data: existingTags } = await existingTagsQuery;
        const hasExistingTags = existingTags && existingTags.length > 0;
        console.log('📌 [CheckRecordMe/handleSave] 기존 태그 존재 여부:', hasExistingTags, '개수:', existingTags?.length || 0);

        if (selectedTagNames.length > 0) {
          if (!hasExistingTags) {
            // ⭐ DB에 태그가 없으면 INSERT (로그인 후 첫 저장인 경우)
            console.log('📝 [CheckRecordMe/handleSave] DB에 태그 없음 → INSERT 수행');

            const tagsToInsert = tags
              .filter(tag => tag.selected)
              .map(tag => ({
                user_id: session.user.id,
                tag_name: tag.label,
                tag_type: tag.type,
                source_type: sourceType,
                source_content_id: contentId || null,
                source_order_id: orderId || null,
                is_confirmed: true
              }));

            const { data: insertedTags, error: insertError } = await supabase
              .from('user_trait_tags')
              .insert(tagsToInsert)
              .select();

            if (insertError) {
              console.error('❌ [CheckRecordMe/handleSave] 태그 INSERT 실패:', insertError);
            } else {
              console.log('✅ [CheckRecordMe/handleSave] 태그 INSERT 완료:', insertedTags?.length || 0, '개');
            }
          } else {
            // ⭐ DB에 태그가 있으면 UPDATE
            console.log('📝 [CheckRecordMe/handleSave] DB에 태그 있음 → UPDATE 수행');

            let updateResult;
            if (orderId) {
              updateResult = await supabase
                .from('user_trait_tags')
                .update({ is_confirmed: true })
                .eq('user_id', session.user.id)
                .in('tag_name', selectedTagNames)
                .eq('source_order_id', orderId)
                .select();
            } else if (contentId) {
              updateResult = await supabase
                .from('user_trait_tags')
                .update({ is_confirmed: true })
                .eq('user_id', session.user.id)
                .in('tag_name', selectedTagNames)
                .eq('source_content_id', contentId)
                .eq('source_type', sourceType)
                .select();
            }

            if (updateResult?.error) {
              console.error('❌ [CheckRecordMe/handleSave] 태그 확정 실패:', updateResult.error);
            } else {
              console.log('✅ [CheckRecordMe/handleSave] 선택 태그 확정 완료:', updateResult?.data?.length || 0, '개');
            }
          }
        }

        // ⭐ 3. 선택 안 한 태그: DELETE (기존 태그가 있을 때만)
        if (unselectedTagNames.length > 0 && hasExistingTags) {
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
          console.log('🗑️ [CheckRecordMe/handleSave] 미선택 태그 삭제 완료');
        }

        // ⭐ 4. 선택 안 한 태그: rejected_tags에 추가 (AI 재추출 방지)
        await appendRejectedTags(session.user.id, unselectedTagNames);

        console.log('✅ [CheckRecordMe/handleSave] 태그 확정 완료');

        // 🚀 ProfilePage & NadaumTagsList & MyReportList 캐시 무효화
        localStorage.setItem('trait_tags_needs_refresh', 'true');
        localStorage.setItem('my_report_needs_refresh', 'true');
        localStorage.removeItem('trait_tags_cache');
        localStorage.removeItem('nadaum_all_tags_cache');
        localStorage.removeItem('pending_trait_tags'); // 로그인 후 임시 저장 태그 삭제
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

  // ⭐ 스킵 로직 공통 함수 (미확정 태그 삭제 + SKIPPED 마커 삽입 + 캐시 무효화)
  const executeSkipLogic = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      console.log('🗑️ [CheckRecordMe] 스킵 처리 시작...');

      // 1. 해당 콘텐츠/주문의 미확정 태그 삭제
      const deleteQuery = supabase
        .from('user_trait_tags')
        .delete()
        .eq('user_id', session.user.id)
        .eq('is_confirmed', false);

      if (orderId) {
        await deleteQuery.eq('source_order_id', orderId);
      } else if (contentId) {
        await deleteQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
      }

      console.log('✅ [CheckRecordMe] 미확정 태그 삭제 완료');

      // 2. __SKIPPED__ 마커 태그 삽입 (이미 있으면 스킵)
      let existingMarkerQuery = supabase
        .from('user_trait_tags')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('tag_name', '__SKIPPED__');

      if (orderId) {
        existingMarkerQuery = existingMarkerQuery.eq('source_order_id', orderId);
      } else if (contentId) {
        existingMarkerQuery = existingMarkerQuery.eq('source_content_id', contentId).eq('source_type', sourceType);
      }

      const { data: existingMarker } = await existingMarkerQuery.maybeSingle();

      if (!existingMarker) {
        const skippedTag = {
          user_id: session.user.id,
          tag_name: '__SKIPPED__',
          tag_type: 'neutral',
          source_type: sourceType,
          source_content_id: contentId || null,
          source_order_id: orderId || null,
          is_confirmed: true
        };

        const { error: insertError } = await supabase
          .from('user_trait_tags')
          .insert(skippedTag);

        if (insertError) {
          console.warn('⚠️ [CheckRecordMe] __SKIPPED__ 마커 삽입 실패:', insertError);
        } else {
          console.log('✅ [CheckRecordMe] __SKIPPED__ 마커 삽입 완료');
        }
      } else {
        console.log('ℹ️ [CheckRecordMe] __SKIPPED__ 마커 이미 존재');
      }

      // 캐시 무효화
      localStorage.setItem('trait_tags_needs_refresh', 'true');
      localStorage.setItem('my_report_needs_refresh', 'true');
      localStorage.removeItem('trait_tags_cache');
      localStorage.removeItem('nadaum_all_tags_cache');
    } catch (err) {
      console.error('❌ [CheckRecordMe] 스킵 처리 실패:', err);
    }
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
    return <ReportWeeklyDetail onClose={handleBack} onPrev={handleBack} onNext={() => setView('dev-tarot-picking')} />;
  }

  if (view === 'dev-tarot-picking') {
    return <ReportWeeklyTarot onClose={handleBack} onNext={() => setView('dev-tarot-result')} />;
  }

  if (view === 'dev-tarot-result') {
    return <ReportWeeklyTarotResult onClose={handleBack} onNext={() => setView('dev-mind-prescription')} />;
  }

  if (view === 'dev-mind-prescription') {
    return <ReportWeeklyMindCare onClose={handleBack} onPrev={handleBack} />;
  }

  // ⭐ 1-4) 모아야할 태그수 안내 페이지 (태그 1~4개)
  if (view === 'tag-saved-info') {
    return (
      <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ paddingTop: '76px', paddingLeft: '32px', paddingRight: '32px' }}>
            {/* Text Group */}
            <motion.div
              className="flex flex-col items-start w-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              style={{ gap: '12px', transformOrigin: "left center", containerType: 'inline-size' }}
            >
              {/* Title */}
              <div className="flex flex-col items-start w-full" style={{ gap: 0 }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: 'clamp(24px, 9.5cqw, 26px)',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.78px',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}>
                  태그가 저장됐어요
                </p>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: 'clamp(24px, 9.5cqw, 26px)',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.78px',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}>
                  무료 쿠폰까지{' '}
                  <span style={{ color: '#48B2AF' }}>태그 {completionRemainingTags}개</span>
                  {' '}남았어요
                </p>
              </div>
              {/* Subtitle */}
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '14px',
                fontWeight: 400,
                color: '#999999',
                lineHeight: '22px',
                letterSpacing: '-0.42px',
                margin: '-4px 0 0 0',
                paddingLeft: '1px'
              }}>
                태그 5개를 모으면 무료 쿠폰 지급돼요
              </p>
            </motion.div>

            {/* Coupon Icon */}
            <div className="flex items-center justify-center w-full overflow-hidden" style={{ marginTop: '52px', height: '250px' }}>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                style={{ width: '194px', height: '194px', transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              >
                <img src="/coupon-mint.svg" alt="쿠폰 아이콘" style={{ width: '100%', height: '100%' }} />
              </motion.div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="bg-white relative shrink-0 w-full z-20">
            <div className="absolute top-[-20px] left-0 right-0 h-[20px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
            <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px 20px' }}>
              <button
                onClick={handleHome}
                className="w-full flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#48b2af', height: '56px', borderRadius: '16px', border: 'none', padding: 0 }}
              >
                <span style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#ffffff',
                  letterSpacing: '-0.32px',
                  lineHeight: '25px'
                }}>
                  확인했어요
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ 1-5) 쿠폰 발급 안내 페이지 (태그 5개 이상)
  if (view === 'coupon-info') {
    return (
      <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ paddingTop: '76px', paddingLeft: '32px', paddingRight: '32px' }}>
            {/* Text Group */}
            <motion.div
              className="flex flex-col items-start w-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              style={{ gap: '12px', transformOrigin: "left center", containerType: 'inline-size' }}
            >
              {/* Title */}
              <div className="flex flex-col items-start w-full" style={{ gap: 0 }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: 'clamp(24px, 9.5cqw, 26px)',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.78px',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}>
                  태그 5개를 모두 모았어요
                </p>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: 'clamp(24px, 9.5cqw, 26px)',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.78px',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}>
                  일요일에{' '}
                  <span style={{ color: '#48B2AF' }}>무료 쿠폰</span>
                  이 지급돼요
                </p>
              </div>
              {/* Subtitle */}
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '14px',
                fontWeight: 400,
                color: '#999999',
                lineHeight: '22px',
                letterSpacing: '-0.42px',
                margin: '-4px 0 0 0',
                paddingLeft: '1px'
              }}>
                쿠폰 지급 : 일요일 나의 분석 보고서 확인 후 자동 발급
              </p>
            </motion.div>

            {/* Coupon Icon */}
            <div className="flex items-center justify-center w-full overflow-hidden" style={{ marginTop: '52px', height: '250px' }}>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                style={{ width: '194px', height: '194px', transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              >
                <img src="/coupon-mint.svg" alt="쿠폰 아이콘" style={{ width: '100%', height: '100%' }} />
              </motion.div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="bg-white relative shrink-0 w-full z-20">
            <div className="absolute top-[-20px] left-0 right-0 h-[20px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
            <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px 20px' }}>
              <button
                onClick={handleHome}
                className="w-full flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#48b2af', height: '56px', borderRadius: '16px', border: 'none', padding: 0 }}
              >
                <span style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#ffffff',
                  letterSpacing: '-0.32px',
                  lineHeight: '25px'
                }}>
                  확인했어요
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NOTE: CompletionCoupon 컴포넌트가 삭제되어 임시 placeholder 표시
  if (view === 'result') {
    return (
      <div className="bg-white fixed inset-0 flex flex-col items-center justify-center">
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
    <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
      {/* Top Navigation */}
      <div className="bg-white relative shrink-0 w-full z-10">
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

      {/* Main Content - iOS 바운스 방지 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" style={{ padding: '20px' }}>
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
              onClick={async () => {
                // ⭐ "다음에 할래요" 클릭 시 분기:
                // - 로그아웃 유저 → 프로모션 바텀시트 노출
                // - 로그인 유저, 태그 0개 → 프로모션 바텀시트 노출
                // - 로그인 유저, 태그 1~4개 → 태그 모으기 유도 바텀시트 노출
                // - 로그인 유저, 태그 5개 이상 → 별도 안내 없이 홈으로 이동
                try {
                  const { data: { session } } = await supabase.auth.getSession();

                  // 🔐 로그아웃 유저 → 프로모션 바텀시트 노출
                  if (!session?.user?.id) {
                    console.log('🎁 [CheckRecordMe] 로그아웃 유저 → 프로모션 바텀시트 노출');
                    setIsPromoBottomSheetOpen(true);
                    return;
                  }

                  // 🔍 로그인 유저 → 확정된 태그 개수 조회 (__SKIPPED__ 제외)
                  const { data: confirmedTags, error: tagError } = await supabase
                    .from('user_trait_tags')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('is_confirmed', true)
                    .neq('tag_name', '__SKIPPED__');

                  if (tagError) {
                    console.error('❌ [CheckRecordMe] 태그 조회 실패:', tagError);
                  }

                  const tagCount = confirmedTags?.length || 0;
                  console.log('🏷️ [CheckRecordMe] 확정된 태그 개수:', tagCount);

                  // ✅ 태그 5개 이상 → 별도 안내 없이 홈으로 이동
                  if (tagCount >= 5) {
                    console.log('🏠 [CheckRecordMe] 태그 5개 이상 → 스킵 후 홈으로 이동');
                    await executeSkipLogic();
                    if (onSkip) onSkip();
                    return;
                  }

                  // 🎯 태그 1~4개 → 태그 모으기 유도 바텀시트 노출
                  if (tagCount >= 1) {
                    const remaining = 5 - tagCount;
                    console.log(`🎯 [CheckRecordMe] 태그 ${tagCount}개 (${remaining}개 남음) → 태그 모으기 유도 바텀시트 노출`);
                    setRemainingTagCount(remaining);
                    setIsTagEncourageOpen(true);
                    return;
                  }

                  // 🎁 태그 0개 → 프로모션 바텀시트 노출
                  console.log('🎁 [CheckRecordMe] 태그 0개 유저 → 프로모션 바텀시트 노출');
                  setIsPromoBottomSheetOpen(true);
                } catch (err) {
                  console.error('❌ [CheckRecordMe] 스킵 처리 실패:', err);
                  // 에러 발생 시에도 onSkip 호출
                  if (onSkip) {
                    onSkip();
                  }
                }
              }}
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

      {/* Bottom Sheet Overlay - 휴대폰 번호 입력 */}
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

      {/* Bottom Sheet - 프로모션 (태그 5개 모으면 쿠폰 지급) */}
      <TagCouponBottomSheet
        isOpen={isPromoBottomSheetOpen}
        onClose={() => {
          setIsPromoBottomSheetOpen(false);
          // 닫기 버튼 클릭 시 onSkip 콜백 호출 (홈으로 이동)
          if (onSkip) {
            onSkip();
          }
        }}
        onOverlayClick={() => {
          // 바텀시트 외부 클릭 시 바텀시트만 닫기 (페이지 유지)
          setIsPromoBottomSheetOpen(false);
        }}
        onSelectTag={() => {
          // 태그 선택하기 → 바텀시트 닫고 현재 화면 유지 (태그 선택 계속)
          setIsPromoBottomSheetOpen(false);
        }}
      />

      {/* Bottom Sheet - 태그 모으기 유도 (태그 1~4개 보유 시) */}
      <TagCouponBottomSheet
        isOpen={isTagEncourageOpen}
        remainingTags={remainingTagCount}
        onClose={async () => {
          setIsTagEncourageOpen(false);
          // 닫기 버튼 클릭 시 스킵 처리 후 홈으로 이동
          await executeSkipLogic();
          if (onSkip) {
            onSkip();
          }
        }}
        onOverlayClick={() => {
          // 바텀시트 외부 클릭 시 바텀시트만 닫기 (페이지 유지)
          setIsTagEncourageOpen(false);
        }}
        onSelectTag={() => {
          // 태그 선택하기 → 바텀시트 닫고 현재 화면 유지 (태그 선택 계속)
          setIsTagEncourageOpen(false);
        }}
      />
      </div>{/* max-w-[440px] wrapper 닫기 */}
    </div>
  );
}
