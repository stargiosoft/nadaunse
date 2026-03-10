import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from './ArrowLeft';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

const CATEGORIES = [
  { value: 'general', label: '일반 문의' },
  { value: 'bug', label: '오류 신고' },
  { value: 'payment', label: '결제/환불' },
  { value: 'suggestion', label: '개선 제안' },
  { value: 'other', label: '기타' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

export default function InquiryWritePage({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryValue>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim().length > 0 && content.trim().length > 0;
  const canSubmit = isValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const { error } = await supabase.from('customer_inquiries').insert({
        user_id: user.id,
        category,
        title: title.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast.success('문의가 등록되었습니다.');
      navigate('/inquiry', { replace: true });
    } catch {
      toast.error('문의 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* 상단 네비게이션 */}
        <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between relative size-full" style={{ padding: '4px 12px' }}>
              <ArrowLeft onClick={onBack} />
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: '25.5px',
                letterSpacing: '-0.36px',
                color: '#000000',
                textAlign: 'center',
              }}>
                문의하기
              </span>
              <div style={{ width: '44px' }} />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 (스크롤 영역) */}
        <div className="flex-1 overflow-auto w-full">
          <div style={{ padding: '12px 20px 40px 20px' }}>

            {/* 문의 유형 */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '16px',
                letterSpacing: '-0.24px',
                color: '#848484',
              }}>
                문의 유형
              </label>
              <div className="flex overflow-x-auto" style={{ gap: '8px', marginTop: '10px', paddingBottom: '2px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="shrink-0"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '16px',
                      border: category === cat.value ? '1px solid #41a09e' : '1px solid #e7e7e7',
                      backgroundColor: category === cat.value ? '#f0f8f8' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '20px',
                      letterSpacing: '-0.28px',
                      color: category === cat.value ? '#368683' : '#6d6d6d',
                    }}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '16px',
                letterSpacing: '-0.24px',
                color: '#848484',
              }}>
                제목
              </label>
              <div
                className="flex items-center w-full"
                style={{
                  height: '56px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e7e7e7',
                  borderRadius: '16px',
                  padding: '0 12px',
                  marginTop: '8px',
                }}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력해주세요"
                  maxLength={100}
                  className="w-full outline-none bg-transparent"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#151515',
                  }}
                />
              </div>
              <div className="flex justify-end" style={{ marginTop: '4px' }}>
                <span style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  letterSpacing: '-0.24px',
                  color: '#b7b7b7',
                }}>
                  {title.length}/100
                </span>
              </div>
            </div>

            {/* 내용 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '16px',
                letterSpacing: '-0.24px',
                color: '#848484',
              }}>
                내용
              </label>
              <div
                className="w-full"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e7e7e7',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  marginTop: '8px',
                }}
              >
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="문의 내용을 자세히 적어주세요"
                  maxLength={2000}
                  className="w-full outline-none bg-transparent resize-none"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '22px',
                    letterSpacing: '-0.45px',
                    color: '#151515',
                    minHeight: '180px',
                  }}
                />
              </div>
              <div className="flex justify-end" style={{ marginTop: '4px' }}>
                <span style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  letterSpacing: '-0.24px',
                  color: '#b7b7b7',
                }}>
                  {content.length}/2000
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div
          className="shrink-0 w-full bg-white"
          style={{
            padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px)) 20px',
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center"
            style={{
              height: '56px',
              borderRadius: '16px',
              backgroundColor: canSubmit ? '#41a09e' : '#f8f8f8',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseDown={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; } }}
            onMouseUp={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
            onMouseLeave={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
            onTouchStart={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; } }}
            onTouchEnd={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
          >
            <span style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '25px',
              letterSpacing: '-0.32px',
              color: canSubmit ? '#ffffff' : '#b7b7b7',
            }}>
              {isSubmitting ? '등록 중...' : '문의 등록'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
