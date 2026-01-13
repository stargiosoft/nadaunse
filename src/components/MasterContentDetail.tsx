import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, ChevronDown, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArrowLeft from './ArrowLeft';
import { generateImagePrompt, generateThumbnail } from '../lib/masterContentAI';
import FreeContentDetail from './FreeContentDetail';
import { toast } from '../lib/toast';

// 🔧 Build v1.2.6 - Router alias fix

interface MasterContentDetailProps {
  contentId: string;
  onBack: () => void;
  onHome: () => void;
}

interface MasterContent {
  id: string;
  content_type: string;
  category_main: string;
  category_sub: string;
  title: string;
  questioner_info: string | null;
  description: string | null;
  user_concern: string | null;
  status: string;
  thumbnail_url: string | null;
  view_count: number;
  weekly_clicks: number;
  created_at: string;
  price_original: number;
  price_discount: number;
  discount_rate: number;
}

interface MasterContentQuestion {
  id: string;
  content_id: string;
  question_order: number;
  question_text: string;
  question_type: string;
  preview_text: string | null;
}

// 카테고리 데이터
const MAIN_CATEGORIES = [
  '개인운세', 
  '연애', 
  '이별', 
  '궁합', 
  '재물', 
  '직업', 
  '시험/학업', 
  '건강', 
  '인간관계', 
  '자��', 
  '이사/매매', 
  '기타'
];

const SUB_CATEGORIES: Record<string, string[]> = {
  '개인운세': [
    '주간/월간 운세',
    '신년 운세',
    '평생 총운',
    '행운 아이템',
    '인생의 황금기',
    '개운법',
    '오행 분석',
    '신살(살풀이)',
    '타고난 성격',
    '장점/단점 분석',
    '숨겨진 잠재력'
  ],
  '연애': [
    '연애운(총론)',
    '새로운 인연',
    '짝사랑',
    '매력 어필',
    '연애 스타일 분석',
    '결혼운/시기',
    '불륜'
  ],
  '이별': [
    '재회',
    '이별극복'
  ],
  '궁합': [
    '연인 궁합',
    '결혼 궁합',
    '속궁합',
    '친구 궁합',
    '동료/동업 궁합',
    '가족 궁합',
    '자녀 궁합',
    '바람기',
    '신뢰도',
    '관계 발전',
    '이별 가능성',
    '재물 궁합'
  ],
  '재물': [
    '재물 황금기',
    '횡재수/복권운',
    '소비/지출 습관',
    '빚/금전문제 해결'
  ],
  '직업': [
    '진로/적성 탐색',
    '직업 재물운',
    '취업/이직운',
    '승진/성공 가능성',
    '사업운'
  ],
  '시험/학업': [
    '타고난 학업운',
    '시험 합격 가능성'
  ],
  '건강': [
    '주의해야 할 질병',
    '사고수',
    '다이어트/미용',
    '성(성) 건강',
    '멘탈 관리'
  ],
  '인간관계': [
    '사교성/인기',
    '사람 보는 눈',
    '등/다툼',
    '소송/분쟁'
  ],
  '자녀': [
    '자',
    '임신/출산 시기',
    '자녀 성별',
    '자녀 성향',
    ' 관계'
  ],
  '이사/매매': [
    '이사/매매 시기',
    '적합한 방향/위치'
  ],
  '기타': [
    '직접 입력'
  ]
};

// 드롭다운 컴포넌트
function Dropdown({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[52px] px-[16px] bg-white border border-[#e0e0e0] rounded-[8px] flex items-center justify-between"
      >
        <p className={`font-['Pretendard_Variable:Regular',sans-serif] text-[14px] ${
          value ? 'text-[#1b1b1b]' : 'text-[#999999]'
        }`}>
          {value || placeholder}
        </p>
        <ChevronDown className={`size-[20px] text-[#868686] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-[56px] left-0 w-full max-h-[240px] bg-white border border-[#e0e0e0] rounded-[8px] shadow-lg overflow-y-auto z-20">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-[16px] py-[12px] text-left hover:bg-[#f9f9f9] transition-colors"
              >
                <p className={`font-['Pretendard_Variable:Regular',sans-serif] text-[14px] ${
                  value === option ? 'text-[#48b2af]' : 'text-[#1b1b1b]'
                }`}>
                  {option}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 확인 다이얼로그
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-[16px]">
      <div className="bg-white rounded-[12px] p-[24px] max-w-[340px] w-full">
        <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[16px] text-[#1b1b1b] text-center mb-[24px] whitespace-pre-line">
          {message}
        </p>
        <div className="flex gap-[8px]">
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] bg-[#f0f0f0] rounded-[8px] font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#666666]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[48px] bg-[#48b2af] rounded-[8px] font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// 이미지 모달
function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-[16px]"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <img
          src={imageUrl}
          alt="썸네일 크게보기"
          className="w-full h-full object-contain rounded-[8px]"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-[-40px] right-0 text-white text-[32px] hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function MasterContentDetail({ contentId, onBack, onHome }: MasterContentDetailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [contentData, setContentData] = useState<MasterContent | null>(null);
  const [questions, setQuestions] = useState<MasterContentQuestion[]>([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'paid' | 'free'>('paid');
  const [questionerInfo, setQuestionerInfo] = useState('');
  const [description, setDescription] = useState('');
  const [userConcern, setUserConcern] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  
  // UI states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [regeneratingPreviewIndexes, setRegeneratingPreviewIndexes] = useState<Set<number>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CACHE_KEY = `master_content_edit_${contentId}_cache`;
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if (now - timestamp < CACHE_EXPIRY) {
          console.log('✅ 캐시에서 데이터 로드 (콘텐츠 수정)');
          setContentData(data.content);
          setQuestions(data.questions);
          // Form 데이터도 캐시에서 복원
          setTitle(data.content.title || '');
          setContentType(data.content.content_type as 'paid' | 'free');
          setQuestionerInfo(data.content.questioner_info || '');
          setDescription(data.content.description || '');
          setUserConcern(data.content.user_concern || '');
          setMainCategory(data.content.category_main || '');
          setSubCategory(data.content.category_sub || '');
          return true;
        } else {
          console.log('⏰ 캐시 만료됨 (콘텐츠 수정)');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, [CACHE_KEY]);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((content: MasterContent, questionsData: MasterContentQuestion[]) => {
    try {
      const cacheData = JSON.stringify({
        data: { content, questions: questionsData },
        timestamp: Date.now()
      });
      
      // 캐시 데이터 크기 체크 (5MB 제한)
      const sizeInBytes = new Blob([cacheData]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 4.5) {
        console.warn('⚠️ 캐시 데이터가 너무 큼 (', sizeInMB.toFixed(2), 'MB). 캐싱 건너뜀.');
        return;
      }
      
      localStorage.setItem(CACHE_KEY, cacheData);
      console.log('💾 캐시에 데이터 저장 (콘텐츠 수정)', sizeInMB.toFixed(2), 'MB');
    } catch (error) {
      console.error('캐시 저장 실패 (quota 초과 가능):', error);
      // quota 초과 시 기존 캐시 삭제
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (e) {
        console.error('캐시 삭제도 실패:', e);
      }
    }
  }, [CACHE_KEY]);

  // 🔒 뒤로가기 방지 (이미지 생성 중일 때)
  useEffect(() => {
    if (!isRegeneratingImage && regeneratingPreviewIndexes.size === 0) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome에서 필요
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRegeneratingImage, regeneratingPreviewIndexes]);

  // 📡 Realtime 구독: 콘텐츠 상태 변경 감지
  useEffect(() => {
    if (!contentId) return;

    console.log('🔔 Realtime 구독 시작: 콘텐츠 업데이트');

    const channel = supabase
      .channel(`content-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'master_contents',
          filter: `id=eq.${contentId}`,
        },
        (payload) => {
          console.log('📡 콘텐츠 업데이트 감지:', payload.new);
          const newData = payload.new as MasterContent;
          
          // 🗑️ 캐시 무효화
          localStorage.removeItem(CACHE_KEY);
          console.log('🗑️ 캐시 무효화됨 (콘텐츠 수정)');

          // 상태 업데이트
          setContentData(prev => prev ? { ...prev, ...newData } : null);

          // 💾 캐싱 (다음 렌더링 사이클에서 실행)
          setTimeout(() => {
            setQuestions(currentQuestions => {
              saveToCache(newData, currentQuestions);
              return currentQuestions;
            });
          }, 0);
          
          // 이미지 재생성 완료 감지
          if (newData.thumbnail_url && newData.status === 'ready') {
            setIsRegeneratingImage(false);
            toast.success('이미지가 생성되었습니다.');
          }
          
          // 이미지 재생성 실패 감지
          if (newData.status === 'failed') {
            setIsRegeneratingImage(false);
            toast.error('이미지 만들기에 실패했어요.');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Realtime 구독 해제: 콘텐츠');
      supabase.removeChannel(channel);
    };
  }, [contentId, CACHE_KEY, saveToCache]); // ✅ questions 제거

  // 📡 Realtime 구독: 질문 예시 업데이트 감지
  useEffect(() => {
    if (!contentId) return;

    const channel = supabase
      .channel(`questions-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'master_content_questions',
          filter: `content_id=eq.${contentId}`,
        },
        (payload) => {
          console.log('📡 질문 업데이트 감지:', payload.new);
          const updatedQuestion = payload.new as MasterContentQuestion;

          // 질문 리스트 업데이트
          setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));

          // 예시 재생성 완료 감지 - preview_text가 업데이트되면 로딩 상태 해제
          if (updatedQuestion.preview_text !== null) {
            // 로딩 상태 클리어 및 토스트 표시
            setRegeneratingPreviewIndexes(current => {
              // 로딩 중이었으면 토스트 예약
              if (current.size > 0) {
                // ⚠️ setTimeout 0으로 React 렌더링 사이클 완료 후 실행
                window.setTimeout(() => toast.success('예시가 생성되었습니다.'), 0);
              }
              return new Set();
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId]); // ✅ questions, regeneratingPreviewIndexes 제거

  // 데이터 로드
  useEffect(() => {
    const loadContentData = async () => {
      try {
        console.log('Loading content:', contentId);

        // 🚀 먼저 캐시에서 로드
        const hasCache = loadFromCache();
        if (hasCache) {
          setIsLoading(false);
        }

        // 1. 콘텐츠 기본 정보 가져오기
        const { data: content, error: contentError } = await supabase
          .from('master_contents')
          .select('*')
          .eq('id', contentId)
          .single();

        if (contentError) {
          console.error('Content load error:', contentError);
          if (!hasCache) {
            alert('콘텐츠를 불러오는데 실패했습니다.');
          }
          return;
        }

        console.log('Content loaded:', content);
        
        // 2. 질문들 가져오기
        const { data: questionsData, error: questionsError } = await supabase
          .from('master_content_questions')
          .select('*')
          .eq('content_id', contentId)
          .order('question_order', { ascending: true });

        if (questionsError) {
          console.error('Questions load error:', questionsError);
        }

        const finalQuestionsData = questionsData || [];
        
        // 💾 캐시에 저장
        saveToCache(content, finalQuestionsData);
        
        setContentData(content);
        setQuestions(finalQuestionsData);
        
        // 폼 데이터 초기화
        setTitle(content.title || '');
        setContentType(content.content_type as 'paid' | 'free');
        setQuestionerInfo(content.questioner_info || '');
        setDescription(content.description || '');
        setUserConcern(content.user_concern || '');
        setMainCategory(content.category_main || '');
        setSubCategory(content.category_sub || '');

        setIsLoading(false);
      } catch (error) {
        console.error('Load error:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    loadContentData();
  }, [contentId, loadFromCache, saveToCache]);

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      ready: '배포전',
      loading: '로딩중',
      failed: '실패',
      deployed: '배포완료',
      published: '배포완료', // 레거시 상태값 호환
    };
    return statusMap[status] || status;
  };

  // 유형 텍스트 변환
  const getTypeText = (type: string) => {
    return type === 'free' ? '무료' : '유료';
  };

  // 질문 타입 변경
  const handleQuestionTypeChange = (index: number, type: 'saju' | 'tarot') => {
    const newQuestions = [...questions];
    newQuestions[index].question_type = type;
    setQuestions(newQuestions);
  };

  // 질문 내용 변
  const handleQuestionTextChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = text;
    setQuestions(newQuestions);
  };

  // 질문 추가
  const handleAddQuestion = () => {
    const newOrder = questions.length > 0 
      ? Math.max(...questions.map(q => q.question_order)) + 1 
      : 1;
    
    const newQuestion: MasterContentQuestion = {
      id: `temp-${Date.now()}`,
      content_id: contentId,
      question_order: newOrder,
      question_text: '',
      question_type: 'saju',
      preview_text: null,
    };
    
    setQuestions([...questions, newQuestion]);
  };

  // 질문 삭제
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // 수정하기
  const handleSave = async () => {
    // 유효성 검사
    if (!mainCategory) {
      alert('대분류를 선택해주세요.');
      return;
    }
    if (!subCategory) {
      alert('중분류를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      alert('콘텐츠 제목을 입력해주세요.');
      return;
    }
    if (questions.some(q => !q.question_text.trim())) {
      alert('모든 질문 내용을 입력해주세요.');
      return;
    }

    try {
      // 카테고리별 자동 가격 설정
      const getPriceByCategory = (categoryMain: string, categorySub: string) => {
        // 연애, 이별, 궁합 -> 29,800원 / 12,900원 (57% 할인)
        const highPriceCategories = ['연애', '이별', '궁합'];
        
        // 건강 > 성(성) 건강 -> 29,800원 / 12,900원 (57% 할인)
        if (categoryMain === '건강' && categorySub === '성(성) 건강') {
          const priceOriginal = 29800;
          const priceDiscount = 12900;
          const discountRate = Math.round((1 - priceDiscount / priceOriginal) * 100);
          return { priceOriginal, priceDiscount, discountRate };
        }
        
        if (highPriceCategories.includes(categoryMain)) {
          const priceOriginal = 29800;
          const priceDiscount = 12900;
          const discountRate = Math.round((1 - priceDiscount / priceOriginal) * 100);
          return { priceOriginal, priceDiscount, discountRate };
        }
        
        // 나머지 카테고리(개인운세, 재물, 직업, 시험/학업, 건강(성 건강 제외), 인간관계, 자녀, 이사/매매, 기타) 
        // -> 19,800원 / 9,900원 (50% 할인)
        const priceOriginal = 19800;
        const priceDiscount = 9900;
        const discountRate = Math.round((1 - priceDiscount / priceOriginal) * 100);
        return { priceOriginal, priceDiscount, discountRate };
      };

      const { priceOriginal, priceDiscount, discountRate } = getPriceByCategory(mainCategory, subCategory);

      // 1. master_contents 업데이트
      const { error: updateError } = await supabase
        .from('master_contents')
        .update({
          category_main: mainCategory,
          category_sub: subCategory,
          title: title,
          questioner_info: questionerInfo || null,
          description: description || null,
          user_concern: userConcern || null,
          price_original: priceOriginal,
          price_discount: priceDiscount,
          discount_rate: discountRate,
          // status는 업데이트하지 않음 (기존 값 유지)
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('Update error:', updateError);
        alert('수정에 실패했습니다.');
        return;
      }

      // 2. 기존 질문 삭제
      const { error: deleteError } = await supabase
        .from('master_content_questions')
        .delete()
        .eq('content_id', contentId);

      if (deleteError) {
        console.error('Delete questions error:', deleteError);
        alert('질문 수정에 실패했습니다.');
        return;
      }

      // 3. 새 질문 추가
      const questionsToInsert = questions.map((q, index) => ({
        content_id: contentId,
        question_order: index + 1,
        question_type: q.question_type,
        question_text: q.question_text,
      }));

      const { error: insertError } = await supabase
        .from('master_content_questions')
        .insert(questionsToInsert);

      if (insertError) {
        console.error('Insert questions error:', insertError);
        alert('질문 저장에 실패했습니다.');
        return;
      }

      console.log('Update successful');
      toast.success('수정되었어요.');
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제하기
  const handleDelete = async () => {
    try {
      // 1. 질문들 삭제
      const { error: deleteQuestionsError } = await supabase
        .from('master_content_questions')
        .delete()
        .eq('content_id', contentId);

      if (deleteQuestionsError) {
        console.error('Delete questions error:', deleteQuestionsError);
        alert('삭제에 실패했습니다.');
        return;
      }

      // 2. 콘텐츠 삭제
      const { error: deleteContentError } = await supabase
        .from('master_contents')
        .delete()
        .eq('id', contentId);

      if (deleteContentError) {
        console.error('Delete content error:', deleteContentError);
        alert('삭제에 실패했습니다.');
        return;
      }

      console.log('Delete successful');
      onBack();
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 썸네일 교체 (파일 업로드)
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 형식 체크 (png, jpeg, jpg만 허용)
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
      toast.error('파일 업로드에 실패했어요.');
      return;
    }

    try {
      // 파일을 base64로 변환
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // DB에 저장
        const { error } = await supabase
          .from('master_contents')
          .update({ thumbnail_url: base64Image })
          .eq('id', contentId);

        if (error) {
          console.error('Thumbnail upload error:', error);
          toast.error('파일 업로드에 실패했어요.');
          return;
        }

        // 화면 업데이트
        setContentData(prev => prev ? { ...prev, thumbnail_url: base64Image } : null);
        toast.success('교체되었습니다.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast.error('파일 업로드에 실패했어요.');
    }

    // input 초기화 (같은 파일 재업로드 가능하게)
    event.target.value = '';
  };

  // 이미지 다시 생성
  const handleRegenerateImage = async () => {
    if (!title.trim()) {
      toast.warning('콘텐츠 제목을 먼저 입력해주세요.');
      setIsRegeneratingImage(false);
      return;
    }

    setIsRegeneratingImage(true);

    try {
      console.log('🚀 썸네일 재생성 요청...');

      // 0. 상태를 'loading'으로 먼저 변경
      const { error: statusError } = await supabase
        .from('master_contents')
        .update({ status: 'loading' })
        .eq('id', contentId);

      if (statusError) {
        console.error('상태 업데이트 실패:', statusError);
      }

      // 1. 이미지 프롬프트 생성
      const promptResult = await supabase.functions.invoke('generate-image-prompt', {
        body: { 
          title, 
          description: description || '',
          questionerInfo: contentData?.questioner_info || ''
        }
      });

      if (promptResult.error || !promptResult.data?.imagePrompt) {
        throw new Error('이미지 프롬프트 생성 실패');
      }

      const imagePrompt = promptResult.data.imagePrompt;

      // 2. 썸네일 재생성 (백그라운드)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const { error: regenerateError } = await supabase.functions.invoke('generate-master-content', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { 
          action: 'regenerate-thumbnail',
          contentId: contentId,
          imagePrompt: imagePrompt
        }
      });

      if (regenerateError) {
        throw new Error('썸네일 재생성 요청 실패');
      }

      console.log('✅ 썸네일 재생성 요청 완료 (백그라운드 실행 중)');

      // 즉시 토스트 메시지 표시
      toast.info('이미지를 생성하고 있어요. 잠시만 기다려주세요.');
      
      // isRegeneratingImage는 Realtime으로 상태 변경 감지 시 false로 변경됨

    } catch (error) {
      console.error('이미지 재생성 오류:', error);
      toast.error('이미지 만들기에 실패했어요.');
      setIsRegeneratingImage(false);
      
      // 실�� 시 상태를 'ready'로 복원
      await supabase
        .from('master_contents')
        .update({ status: 'ready' })
        .eq('id', contentId);
    }
  };

  // ❌ 이전 코드: useEffect로 간접 호출 (안티패턴)
  // useEffect(() => {
  //   if (isRegeneratingImage) {
  //     handleRegenerateImage();
  //   }
  // }, [isRegeneratingImage]);

  // ✅ 해결: 버튼 클릭 시 함수 직접 호출 (아래 1093줄 참조)

  // 예시 다시 만들기
  const handleRegeneratePreview = async (index: number) => {
    const question = questions[index];
    
    if (!question.question_text.trim()) {
      toast.warning('질문을 먼저 입력해주세요.');
      return;
    }

    // temp- ID인 경우 먼저 저장 필요
    if (question.id.startsWith('temp-')) {
      toast.warning('질문을 먼저 저장해주세요.');
      return;
    }

    setRegeneratingPreviewIndexes(prev => new Set(prev).add(index));

    try {
      console.log('🚀 미리보기 재생성 요청...', question.question_type);

      // 0. 상태를 'loading'으로 먼저 변경
      const { error: statusError } = await supabase
        .from('master_contents')
        .update({ status: 'loading' })
        .eq('id', contentId);

      if (statusError) {
        console.error('상태 업데이트 실패:', statusError);
      }

      // 1. 기존 preview_text를 먼저 null로 초기화 (화면에서 기존 내용 제거)
      const { error: clearError } = await supabase
        .from('master_content_questions')
        .update({ preview_text: null })
        .eq('id', question.id);

      if (clearError) {
        console.error('미리보기 초기화 실패:', clearError);
      } else {
        console.log('✅ 미리보기 초기화 완료');
        // 로컬 상태도 업데이트
        setQuestions(prev => prev.map(q => 
          q.id === question.id ? { ...q, preview_text: null } : q
        ));
      }

      // 2. 미리보기 재생성 (백그라운드)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const { error: regenerateError } = await supabase.functions.invoke('generate-master-content', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { 
          action: 'regenerate-preview',
          contentId: contentId,
          questionId: question.id,
          questionType: question.question_type,
          questionText: question.question_text,
          title: title,
          description: description || '',
          questionerInfo: questionerInfo || ''
        }
      });

      if (regenerateError) {
        throw new Error('미리보기 재생성 요청 실패');
      }

      console.log('✅ 미리보기 재생성 요청 완료 (백그라운드 실행 중)');

      // 즉시 토스트 메시지 표시
      toast.info('예시��� 생성하고 있어요. 잠시만 기다려주세요.');
      
      // regeneratingPreviewIndexes는 Realtime으로 데이터 업데이트 감지 시 제거됨

    } catch (error) {
      console.error('예시 재생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '예시 만들기에 실패했어요.';
      toast.error(errorMessage);

      setRegeneratingPreviewIndexes(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      
      // 실패 시 상태를 'ready'로 복원
      await supabase
        .from('master_contents')
        .update({ status: 'ready' })
        .eq('id', contentId);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full">
        <div className="animate-spin rounded-full h-[32px] w-[32px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full">
        <p className="text-[#151515]">콘텐츠를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 무료 콘텐츠도 수정 가능하도록 변경 (FreeContentDetail 리다이렉트 제거)
  // 이전 코드: if (contentData.content_type === 'free') { return <FreeContentDetail .../> }

  return (
    <div className="bg-[#f9f9f9] relative w-full min-h-screen flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-[#f9f9f9]">
        {/* Top Navigation - Sticky */}
        <div className="bg-white content-stretch flex flex-col items-start shrink-0 w-full sticky top-0 z-20 border-b border-[#f3f3f3]">
          <div className="h-[60px] content-stretch flex items-center justify-between relative shrink-0 w-full px-[16px]">
            <ArrowLeft onClick={onBack} />
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[18px] text-[#1b1b1b] tracking-[-0.2px] absolute left-1/2 transform -translate-x-1/2">
              마스터 콘텐츠 수정하기
            </p>
            <div
              onClick={onHome}
              className="flex items-center justify-center relative shrink-0 size-[24px] cursor-pointer z-10"
            >
              <Home className="size-[22px] text-[#030303]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-[24px] p-[16px] pb-[160px] overflow-y-auto">
          {/* 본 정보 */}
          <div className="flex flex-col gap-[16px]">
            <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[20px] text-[#1b1b1b]">
              기본 정보
            </p>

            {/* 상태 */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[12px]">
                <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#222222]">
                  상태: {getStatusText(contentData.status)}
                </p>
                {(contentData.status === 'loading' || contentData.status === 'failed' || contentData.status === 'deployed') && (
                  <button
                    onClick={async () => {
                      if (!confirm('상태를 "배포전"으로 변경하시겠어요?\n운영에서 해당 콘텐츠가 보이지 않게 됩니다.')) return;
                      try {
                        const { error } = await supabase
                          .from('master_contents')
                          .update({ status: 'ready' })
                          .eq('id', contentId);
                        
                        if (error) {
                          alert('상태 변경 실패: ' + error.message);
                        } else {
                          setContentData(prev => prev ? { ...prev, status: 'ready' } : null);
                          toast.success('상태가 "배포전"으로 변경되었습니다.');
                        }
                      } catch (error) {
                        console.error('상태 변경 에러:', error);
                        alert('상태 변경 중 오류가 발생했습니다.');
                      }
                    }}
                    className="px-[12px] py-[4px] bg-[#48b2af] rounded-[6px] hover:bg-[#3fa3a0] transition-colors"
                  >
                    <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[12px] text-white whitespace-nowrap">
                      배포전으로 변경
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* 유형 */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#222222]">
                유형: {getTypeText(contentData.content_type)}
              </p>
            </div>

            {/* 썸네일 영역 */}
            <div className="flex flex-col gap-[8px]">
              <div 
                className="relative w-[260px] h-[180px] rounded-[8px] overflow-hidden bg-[#f0f0f0] cursor-pointer"
                onClick={() => {
                  if (contentData.thumbnail_url) {
                    setShowImageModal(true);
                  }
                }}
              >
                {contentData.thumbnail_url === null && isRegeneratingImage ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48b2af]"></div>
                  </div>
                ) : contentData.thumbnail_url ? (
                  <img
                    src={contentData.thumbnail_url}
                    alt="썸네일"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#999999]">
                      썸네일 없음
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-[8px]">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRegeneratingImage}
                  className="px-[16px] py-[8px] bg-white border border-[#f0f0f0] rounded-[8px] disabled:opacity-50"
                >
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-black">
                    썸네일 교체
                  </p>
                </button>
                <button
                  onClick={handleRegenerateImage}
                  disabled={isRegeneratingImage}
                  className="px-[16px] py-[8px] bg-white border border-[#48b2af] rounded-[8px] disabled:opacity-50 flex items-center gap-[8px]"
                >
                  {isRegeneratingImage && (
                    <div className="animate-spin rounded-full h-[16px] w-[16px] border-b-2 border-[#48b2af]"></div>
                  )}
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-black">
                    {isRegeneratingImage ? '이미지 생성 중...' : '이미지 다시 만들기'}
                  </p>
                </button>
              </div>
            </div>

            {/* 대분류 */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                대분류<span className="text-[#ff0000]">*</span>
              </p>
              <Dropdown
                value={mainCategory}
                options={MAIN_CATEGORIES}
                onChange={(value) => {
                  setMainCategory(value);
                  setSubCategory(''); // 대분류 변경 시 중분류 초기화
                }}
                placeholder="대분류 선택"
              />
            </div>

            {/* 중분류 */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                중분류<span className="text-[#ff0000]">*</span>
              </p>
              <Dropdown
                value={subCategory}
                options={mainCategory ? SUB_CATEGORIES[mainCategory] || [] : []}
                onChange={setSubCategory}
                placeholder="중분류 선택"
              />
            </div>

            {/* 콘텐츠 제목 */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                콘텐츠 제목<span className="text-[#ff0000]">*</span>
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 짝사랑하는 그 사람의 마음"
                className="w-full h-[52px] px-[16px] bg-white border border-[#e0e0e0] rounded-[8px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] placeholder:text-[#999999]"
              />
            </div>

            {/* 질문자 정보 - 유료 콘텐츠만 표시 */}
            {contentData.content_type === 'paid' && (
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                  질문자 보
                </p>
                <input
                  type="text"
                  value={questionerInfo}
                  onChange={(e) => setQuestionerInfo(e.target.value)}
                  placeholder="질문자 정보를 입력하세요"
                  className="w-full h-[52px] px-[16px] bg-white border border-[#e0e0e0] rounded-[8px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] placeholder:text-[#999999]"
                />
              </div>
            )}

            {/* 콘텐츠 소개글 */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                콘텐츠 소개글
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="콘텐츠에 한 간단한 소개를 입력하세요"
                className="w-full h-[100px] px-[16px] py-[12px] bg-white border border-[#e0e0e0] rounded-[8px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] placeholder:text-[#999999] resize-none"
              />
            </div>

            {/* 사용자 고민글 - 유료 콘텐츠만 표시 */}
            {contentData.content_type === 'paid' && (
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                  사용자 고민글
                </p>
                <textarea
                  value={userConcern}
                  onChange={(e) => setUserConcern(e.target.value)}
                  placeholder="사용자가 특별히 궁금해하거나 신경쓰는 부분을 적어주세요"
                  className="w-full h-[100px] px-[16px] py-[12px] bg-white border border-[#e0e0e0] rounded-[8px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] placeholder:text-[#999999] resize-none"
                />
              </div>
            )}
          </div>

          {/* 미리보기 예시 - 유료 콘텐츠만 표시, 최대 3개 */}
          {contentData.content_type === 'paid' && questions.slice(0, 3).map((question, index) => (
            <div key={question.id} className="flex flex-col gap-[16px] bg-white p-[16px] rounded-[12px]">
              {/* 미리보기 예시 헤더 */}
              <div className="flex items-center justify-between">
                <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[16px] text-[#1b1b1b]">
                  미리보기 예시 {index + 1}
                </p>
              </div>

              {/* 질문 */}
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#868686]">
                  질문
                </p>
                <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b]">
                  {question.question_text || '질문을 입력해주세요.'}
                </p>
              </div>

              {/* 답변 */}
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#868686]">
                  답변
                </p>
                {regeneratingPreviewIndexes.has(index) && question.preview_text === null ? (
                  <div className="flex items-center gap-[8px] py-[12px]">
                    <div className="animate-spin rounded-full h-[20px] w-[20px] border-b-2 border-[#48b2af]"></div>
                    <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#868686]">
                      {question.question_type === 'saju' ? '사주 예시 생성 중...' : '타로 예시 생성 중...'}
                    </p>
                  </div>
                ) : (
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] whitespace-pre-wrap">
                    {question.preview_text || '미리보기 답변을 아직 생성하지 않았습니다.'}
                  </p>
                )}
              </div>

              {/* 예시 다시 만들기 버튼 */}
              <button
                onClick={() => handleRegeneratePreview(index)}
                disabled={regeneratingPreviewIndexes.has(index)}
                className={`w-full h-[40px] rounded-[8px] flex items-center justify-center gap-[8px] transition-all ${
                  regeneratingPreviewIndexes.has(index)
                    ? 'bg-[#e6f3f3] border border-[#48b2af] cursor-wait'
                    : 'bg-white border border-[#48b2af] hover:bg-[#f0f8f8]'
                }`}
              >
                {regeneratingPreviewIndexes.has(index) && (
                  <div className="relative w-[18px] h-[18px]">
                    <div className="absolute inset-0 border-2 border-[#d0e8e7] rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-[#48b2af] rounded-full border-t-transparent animate-spin"></div>
                  </div>
                )}
                <p className={`font-['Pretendard_Variable:${regeneratingPreviewIndexes.has(index) ? 'SemiBold' : 'Medium'}',sans-serif] text-[14px] text-[#48b2af]`}>
                  {regeneratingPreviewIndexes.has(index) ? '예시 생성 중...' : '예시 다시 만들기'}
                </p>
              </button>
            </div>
          ))}

          {/* 질문지 */}
          <div className="flex flex-col gap-[16px]">
            <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[20px] text-[#1b1b1b]">
              질문지
            </p>

            {questions.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-[16px] bg-white p-[16px] rounded-[12px]">
                <div className="flex items-center justify-between">
                  <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[16px] text-[#1b1b1b]">
                    질문지 {index + 1}
                  </p>
                  {questions.length > 1 && (
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="flex items-center justify-center size-[24px]"
                    >
                      <X className="size-[20px] text-[#999999]" />
                    </button>
                  )}
                </div>

                {/* 사주/타로 선택 - 유료 콘텐츠만 표시 */}
                {contentData.content_type === 'paid' && (
                  <div className="flex gap-[12px]">
                    <button
                      onClick={() => handleQuestionTypeChange(index, 'saju')}
                      className={`flex-1 h-[44px] rounded-[8px] border ${
                        question.question_type === 'saju'
                          ? 'bg-[#48b2af] border-[#48b2af]'
                          : 'bg-white border-[#e0e0e0]'
                      }`}
                    >
                      <p className={`font-['Pretendard_Variable:Medium',sans-serif] text-[14px] ${
                        question.question_type === 'saju' ? 'text-white' : 'text-[#1b1b1b]'
                      }`}>
                        사주
                      </p>
                    </button>
                    <button
                      onClick={() => handleQuestionTypeChange(index, 'tarot')}
                      className={`flex-1 h-[44px] rounded-[8px] border ${
                        question.question_type === 'tarot'
                          ? 'bg-[#48b2af] border-[#48b2af]'
                          : 'bg-white border-[#e0e0e0]'
                      }`}
                    >
                      <p className={`font-['Pretendard_Variable:Medium',sans-serif] text-[14px] ${
                        question.question_type === 'tarot' ? 'text-white' : 'text-[#1b1b1b]'
                      }`}>
                        타로
                      </p>
                    </button>
                  </div>
                )}

                {/* 질문 입력 */}
                <div className="flex flex-col gap-[8px]">
                  <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#1b1b1b]">
                    질문<span className="text-[#ff0000]">*</span>
                  </p>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                    placeholder="예) 내 사주상 나는 그 사람과 어울리는 편인가요?"
                    className="w-full h-[80px] px-[16px] py-[12px] bg-white border border-[#e0e0e0] rounded-[8px] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] placeholder:text-[#999999] resize-none"
                  />
                </div>
              </div>
            ))}

            {/* 질문지 추가 버튼 */}
            <button
              onClick={handleAddQuestion}
              className="w-full h-[52px] bg-white border border-[#e0e0e0] rounded-[8px] flex items-center justify-center gap-[8px]"
            >
              <Plus className="size-[20px] text-[#48b2af]" />
              <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[14px] text-[#48b2af]">
                질문지 추가
              </p>
            </button>
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white px-[16px] py-[16px] max-w-[430px] mx-auto w-full border-t border-[#f0f0f0]">
          <div className="flex gap-[8px]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 h-[52px] rounded-[8px] bg-[#f0f0f0] flex items-center justify-center"
            >
              <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[16px] text-[#666666]">
                삭제하기
              </p>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-[52px] rounded-[8px] bg-[#48b2af] flex items-center justify-center hover:bg-[#3fa3a0] transition-colors"
            >
              <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[16px] text-white">
                수정하기
              </p>
            </button>
          </div>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        {showDeleteConfirm && (
          <ConfirmDialog
            message="이 콘텐츠를 삭제하시겠습니까?&#10;삭제된 콘텐츠는 복구할 수 없습니다."
            onConfirm={() => {
              setShowDeleteConfirm(false);
              handleDelete();
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}

        {/* 이미지 모달 */}
        {showImageModal && contentData.thumbnail_url && (
          <ImageModal
            imageUrl={contentData.thumbnail_url}
            onClose={() => setShowImageModal(false)}
          />
        )}

        {/* Hidden file input for thumbnail upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleThumbnailUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}