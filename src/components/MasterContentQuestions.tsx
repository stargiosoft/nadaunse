import React, { useState, useEffect } from 'react';
import { Home, X } from 'lucide-react';
import svgPaths from "../imports/svg-a0mkm9p61i";
import { ContentFormData } from './MasterContentCreate';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import ArrowLeft from './ArrowLeft';
import { generateMasterContentAI } from '../lib/masterContentAI';

interface MasterContentQuestionsProps {
  onBack: () => void;
  onHome?: () => void;
  onComplete?: () => void;
  formData: ContentFormData | null;
  questions?: Question[];
  onQuestionsChange?: (questions: Question[]) => void;
}

export interface Question {
  id: string;
  type: 'saju' | 'tarot';
  content: string;
}

export interface ContentFullData {
  basicInfo: ContentFormData;
  questions: Question[];
}

// 라디오 버튼 컴포넌트
function RadioButton({ 
  checked, 
  label, 
  onChange 
}: { 
  checked: boolean; 
  label: string; 
  onChange: () => void;
}) {
  return (
    <div 
      onClick={onChange}
      className="flex items-center gap-[10px] cursor-pointer"
    >
      <div className={`relative size-[20px] rounded-full ${
        checked ? 'bg-[#48b2af] border-2 border-[#48b2af]' : 'bg-[#c7c7c7] border-2 border-[#c7c7c7]'
      }`}>
        <div className={`absolute inset-0 m-auto rounded-full bg-white ${
          checked ? 'size-[12px]' : 'size-[18px]'
        }`} />
      </div>
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[12px] text-black">
        {label}
      </p>
    </div>
  );
}

// 질문지 카드 컴포넌트
function QuestionCard({
  question,
  index,
  onTypeChange,
  onContentChange,
  onDelete,
  canDelete,
  isFree,
}: {
  question: Question;
  index: number;
  onTypeChange: (type: 'saju' | 'tarot') => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  canDelete: boolean;
  isFree: boolean;
}) {
  return (
    <div className="bg-white flex flex-col gap-[15px] px-[30px] py-[20px] w-full">
      {/* 제목과 삭제 버튼 */}
      <div className="flex items-center justify-between">
        <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[16px] text-black">
          질문지 {index + 1}
        </p>
        {canDelete && (
          <button
            onClick={onDelete}
            className="size-[16px] flex items-center justify-center text-[#d9d9d9] hover:text-[#999999] transition-colors"
          >
            <X className="size-full" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* 사주/타로 선택 - 유료일 때만 표시 */}
      {!isFree && (
        <div className="flex gap-[40px]">
          <RadioButton
            checked={question.type === 'saju'}
            label="사주"
            onChange={() => onTypeChange('saju')}
          />
          <RadioButton
            checked={question.type === 'tarot'}
            label="타로"
            onChange={() => onTypeChange('tarot')}
          />
        </div>
      )}

      {/* 질문지 입력 */}
      <input
        type="text"
        value={question.content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="콘텐츠 질문지"
        className="w-full h-[40px] rounded-[8px] border border-[gainsboro] px-[18px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-black placeholder:text-[#a7a7a7]"
      />
    </div>
  );
}

export default function MasterContentQuestions({
  onBack,
  onHome,
  onComplete,
  formData,
  questions: initialQuestions,
  onQuestionsChange,
}: MasterContentQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || [
    { id: '1', type: 'saju', content: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 컴포넌트 마운트 시 로그인 및 권한 확인
  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        // localStorage에서 사용자 정보 확인
        const userStr = localStorage.getItem('user');
        
        if (!userStr) {
          alert('로그인이 필요합니다.');
          onHome?.();
          return;
        }

        const user = JSON.parse(userStr);

        // role이 master인지 확인
        if (user.role !== 'master') {
          alert('마스터 권한이 필요합니다.');
          onHome?.();
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        alert('인증 확인 중 오류가 발생했습니다.');
        onHome?.();
      }
    };

    checkAuthAndRole();
  }, [onHome]);

  // 질문지 추가
  const handleAddQuestion = () => {
    const newId = (Math.max(...questions.map(q => parseInt(q.id))) + 1).toString();
    setQuestions([...questions, { id: newId, type: 'saju', content: '' }]);
    onQuestionsChange?.([...questions, { id: newId, type: 'saju', content: '' }]);
  };

  // 질문지 삭제
  const handleDeleteQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
      onQuestionsChange?.(questions.filter(q => q.id !== id));
    }
  };

  // 질문지 타입 변경
  const handleTypeChange = (id: string, type: 'saju' | 'tarot') => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, type } : q)));
    onQuestionsChange?.(questions.map(q => (q.id === id ? { ...q, type } : q)));
  };

  // 질문지 내용 변경
  const handleContentChange = (id: string, content: string) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, content } : q)));
    onQuestionsChange?.(questions.map(q => (q.id === id ? { ...q, content } : q)));
  };

  // 저장 버튼 클릭
  const handleSave = async () => {
    if (!formData) {
      alert('기본 정보가 없습니다.');
      console.error('formData is null or undefined:', formData);
      return;
    }

    console.log('저장 시작 - formData:', formData);
    console.log('저장 시작 - questions:', questions);

    setIsSaving(true);

    try {
      // localStorage에서 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        alert('로그인이 필요합니다.');
        setIsSaving(false);
        return;
      }

      const user = JSON.parse(userStr);
      console.log('현재 사용자:', user);

      // 유료 콘텐츠 통일 가격
      const priceOriginal = 19800;
      const priceDiscount = 9900;
      const discountRate = 50;

      // 1. 질문 데이터 준비 (무료 콘텐츠는 모든 질문이 사주(saju)로 고정)
      const isFree = formData.content_type === 'free';
      const questionInserts = questions.map((q, index) => ({
        question_order: index + 1,
        question_text: q.content,
        question_type: isFree ? 'saju' : q.type,
      }));

      // 2. 콘텐츠 데이터 준비
      const contentData = {
        content_type: formData.content_type,
        category_main: formData.category_main,
        category_sub: formData.category_sub,
        title: formData.title,
        questioner_info: formData.questioner_info || null,
        description: formData.description || null,
        user_concern: formData.user_concern || null,
        price_original: formData.content_type === 'free' ? 0 : priceOriginal,
        price_discount: formData.content_type === 'free' ? 0 : priceDiscount,
        discount_rate: formData.content_type === 'free' ? 0 : discountRate,
        status: 'loading',  // AI 생성 전까지는 'loading' 상태
        view_count: 0,
        weekly_clicks: 0,
      };

      console.log('📦 Edge Function 호출 데이터:', { contentData, questions: questionInserts });

      // 3. Edge Function 호출 (master-content)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        setIsSaving(false);
        return;
      }

      const { data: createResult, error: createError } = await supabase.functions.invoke(
        'master-content',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            action: 'create',
            content_data: contentData,
            questions: questionInserts,
          },
        }
      );

      if (createError || !createResult?.success) {
        console.error('❌ 마스터 콘텐츠 생성 실패:', createError || createResult);
        alert(`저장에 실패했습니다.\n${createError?.message || createResult?.error || '알 수 없는 오류'}`);
        setIsSaving(false);
        return;
      }

      console.log('✅ 마스터 콘텐츠 생성 완료:', createResult.content);

      // 4. 백그라운드 AI 생성 요청
      const savedContent = createResult.content;
      console.log('🤖 백그라운드 AI 생성 요청...');
      
      // Edge Function 호출 (await 없음 - 즉시 반환)
      const aiQuestionInserts = questionInserts.map((q, index) => ({
        content_id: savedContent.id,
        question_order: q.question_order,
        question_text: q.question_text,
        question_type: q.question_type,
      }));

      supabase.functions.invoke('generate-master-content', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          contentId: savedContent.id,
          title: formData.title,
          description: formData.description,
          questionerInfo: formData.questioner_info,
          questions: aiQuestionInserts,
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ 백그라운드 생성 요청 실패:', error);
        } else {
          console.log('✅ 백그라운드 생성 요청 완료:', data);
        }
      });

      // 5. 즉시 성공 토스트 표시 (AI 완료 대기 없음)
      toast.success('저장되었습니다.');
      
      // 6. 0.8초 후 기본정보 입력 페이지로 이동 (입력값 초기화)
      setTimeout(() => {
        setIsSaving(false);
        // 질문지 초기화 (연속 등록 목적)
        setQuestions([{ id: '1', type: 'saju', content: '' }]);
        onQuestionsChange?.([{ id: '1', type: 'saju', content: '' }]);
        onComplete?.();
      }, 800);

    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] relative w-full min-h-screen flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-[#f9f9f9]">
        {/* Top Navigation */}
        <div className="bg-white content-stretch flex flex-col items-start shrink-0 w-full">
          <div className="h-[60px] content-stretch flex items-center justify-between relative shrink-0 w-full px-[16px]">
            <ArrowLeft onClick={onBack} />
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[18px] text-[#1b1b1b] tracking-[-0.2px] absolute left-1/2 transform -translate-x-1/2">
              마스터 콘텐츠 만들기
            </p>
            <div
              onClick={onHome}
              className="flex items-center justify-center relative shrink-0 size-[24px] cursor-pointer z-10"
            >
              <Home className="size-[22px] text-[#030303]" />
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 flex flex-col gap-[8px] pb-[140px] overflow-y-auto mt-[8px]">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onTypeChange={(type) => handleTypeChange(question.id, type)}
              onContentChange={(content) => handleContentChange(question.id, content)}
              onDelete={() => handleDeleteQuestion(question.id)}
              canDelete={questions.length > 1}
              isFree={formData?.content_type === 'free'}
            />
          ))}

          {/* 질문지 추가 버튼 */}
          <div className="bg-white px-[30px] py-[20px] w-full">
            <button
              onClick={handleAddQuestion}
              className="w-full h-[40px] rounded-[8px] border border-[#48b2af] flex items-center justify-center hover:bg-[#f0f8f8] transition-colors"
            >
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] text-black">
                질문지 추가
              </p>
            </button>
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white px-[35px] py-[20px] max-w-[430px] mx-auto w-full">
          <div className="flex gap-[20px]">
            <button
              onClick={onBack}
              disabled={isSaving}
              className="w-[170px] h-[52px] rounded-[8px] border border-[#f0f0f0] flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[18px] text-black">
                이전
              </p>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-[52px] rounded-[8px] bg-[#48b2af] flex items-center justify-center hover:bg-[#3fa3a0] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center gap-[8px]">
                  <div className="animate-spin size-[18px] border-2 border-white border-t-transparent rounded-full" />
                  <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[18px] text-white">
                    저장 중...
                  </p>
                </div>
              ) : (
                <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[18px] text-white">
                  저장하기
                </p>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}