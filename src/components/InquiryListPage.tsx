import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from './ArrowLeft';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

interface Inquiry {
  id: string;
  category: string;
  title: string;
  content: string;
  status: 'pending' | 'replied' | 'closed';
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: '일반 문의',
  bug: '오류 신고',
  payment: '결제/환불',
  suggestion: '개선 제안',
  other: '기타',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: '답변 대기', bg: '#f9f9f9', color: '#848484', border: '#e7e7e7' },
  replied: { label: '답변 완료', bg: '#f0f8f8', color: '#368683', border: '#d4eeec' },
  closed: { label: '종료', bg: '#f9f9f9', color: '#b7b7b7', border: '#e7e7e7' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

export default function InquiryListPage({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('id, category, title, content, status, reply, replied_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
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
                문의 내역
              </span>
              {/* 우측: 문의 작성 버튼 */}
              <div
                onClick={() => navigate('/inquiry/write', { state: { canGoBack: true } })}
                className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
                style={{ width: '44px', height: '44px', borderRadius: '12px' }}
              >
                <Plus
                  className="transition-transform duration-200 group-active:scale-90"
                  style={{ width: '24px', height: '24px', color: '#848484' }}
                  strokeWidth={1.8}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto w-full">
          {isLoading ? (
            /* 로딩 */
            <div className="flex items-center justify-center" style={{ paddingTop: '80px' }}>
              <div
                className="rounded-full animate-spin"
                style={{ width: '32px', height: '32px', border: '3px solid #e7e7e7', borderTopColor: '#41a09e' }}
              />
            </div>
          ) : inquiries.length === 0 ? (
            /* 빈 상태 */
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#f9f9f9', marginBottom: '16px' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b7b7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#848484',
                textAlign: 'center',
              }}>
                아직 문의 내역이 없어요
              </span>
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                lineHeight: '18px',
                letterSpacing: '-0.26px',
                color: '#b7b7b7',
                marginTop: '4px',
                textAlign: 'center',
              }}>
                궁금한 점이 있다면 문의해주세요
              </span>

              {/* 문의하기 버튼 */}
              <button
                onClick={() => navigate('/inquiry/write', { state: { canGoBack: true } })}
                className="flex items-center justify-center"
                style={{
                  marginTop: '24px',
                  height: '44px',
                  padding: '0 24px',
                  borderRadius: '16px',
                  backgroundColor: '#41a09e',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; }}
                onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; }}
              >
                <span style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '20px',
                  letterSpacing: '-0.28px',
                  color: '#ffffff',
                }}>
                  문의하기
                </span>
              </button>
            </div>
          ) : (
            /* 문의 목록 */
            <div style={{ padding: '8px 20px 40px 20px' }}>
              {inquiries.map((inquiry) => {
                const statusCfg = STATUS_CONFIG[inquiry.status];
                const isExpanded = expandedId === inquiry.id;

                return (
                  <div
                    key={inquiry.id}
                    className="overflow-hidden"
                    style={{
                      borderRadius: '16px',
                      border: `1px solid ${isExpanded ? '#d4d4d4' : '#e7e7e7'}`,
                      marginBottom: '12px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    {/* 카드 헤더 */}
                    <div
                      className="cursor-pointer"
                      style={{ padding: '16px' }}
                      onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                    >
                      <div className="flex items-center" style={{ gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          backgroundColor: statusCfg.bg,
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          lineHeight: '16px',
                          color: statusCfg.color,
                        }}>
                          {statusCfg.label}
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '11px',
                          fontWeight: 400,
                          lineHeight: '16px',
                          color: '#b7b7b7',
                        }}>
                          {CATEGORY_LABELS[inquiry.category] || inquiry.category}
                        </span>
                      </div>
                      <span
                        className="block truncate"
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          lineHeight: '22px',
                          letterSpacing: '-0.3px',
                          color: '#151515',
                        }}
                      >
                        {inquiry.title}
                      </span>
                      <span style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '16px',
                        letterSpacing: '-0.24px',
                        color: '#b7b7b7',
                        marginTop: '4px',
                        display: 'block',
                      }}>
                        {formatDate(inquiry.created_at)}
                      </span>
                    </div>

                    {/* 펼친 상세 */}
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #f3f3f3' }}>
                        {/* 문의 내용 */}
                        <div style={{ paddingTop: '16px' }}>
                          <label style={{
                            fontFamily: 'Pretendard Variable, sans-serif',
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '16px',
                            letterSpacing: '-0.24px',
                            color: '#848484',
                            display: 'block',
                            marginBottom: '8px',
                          }}>
                            문의 내용
                          </label>
                          <span style={{
                            fontFamily: 'Pretendard Variable, sans-serif',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '22px',
                            letterSpacing: '-0.28px',
                            color: '#151515',
                            whiteSpace: 'pre-wrap',
                            display: 'block',
                          }}>
                            {inquiry.content}
                          </span>
                        </div>

                        {/* 답변 */}
                        {inquiry.reply && (
                          <div style={{
                            marginTop: '16px',
                            borderRadius: '16px',
                            padding: '16px',
                            backgroundColor: '#f0f8f8',
                          }}>
                            <div className="flex items-center" style={{ gap: '6px', marginBottom: '8px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#41a09e' }} />
                              <span style={{
                                fontFamily: 'Pretendard Variable, sans-serif',
                                fontSize: '12px',
                                fontWeight: 600,
                                lineHeight: '16px',
                                color: '#368683',
                              }}>
                                운영팀 답변
                              </span>
                              {inquiry.replied_at && (
                                <span style={{
                                  fontFamily: 'Pretendard Variable, sans-serif',
                                  fontSize: '11px',
                                  fontWeight: 400,
                                  lineHeight: '16px',
                                  color: '#848484',
                                }}>
                                  {formatDate(inquiry.replied_at)}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontFamily: 'Pretendard Variable, sans-serif',
                              fontSize: '14px',
                              fontWeight: 400,
                              lineHeight: '22px',
                              letterSpacing: '-0.28px',
                              color: '#151515',
                              whiteSpace: 'pre-wrap',
                              display: 'block',
                            }}>
                              {inquiry.reply}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
