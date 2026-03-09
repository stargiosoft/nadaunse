import { useState, useEffect } from 'react';
import ArrowLeft from './ArrowLeft';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { Send } from 'lucide-react';

interface InquiryWithUser {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  status: 'pending' | 'replied' | 'closed';
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  users: {
    nickname: string | null;
    email: string | null;
  } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: '일반 문의',
  bug: '오류 신고',
  payment: '결제/환불',
  suggestion: '개선 제안',
  other: '기타',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: '답변 대기', bg: '#fff8f0', color: '#d4850e', border: '#ffe0b2' },
  replied: { label: '답변 완료', bg: '#f0f8f8', color: '#368683', border: '#d4eeec' },
  closed: { label: '종료', bg: '#f9f9f9', color: '#b7b7b7', border: '#e7e7e7' },
};

type FilterStatus = 'all' | 'pending' | 'replied' | 'closed';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

interface MasterInquiryPageProps {
  onBack: () => void;
  onHome: () => void;
}

export default function MasterInquiryPage({ onBack }: MasterInquiryPageProps) {
  const [inquiries, setInquiries] = useState<InquiryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('id, user_id, category, title, content, status, reply, replied_at, created_at, users(nickname, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries((data as unknown as InquiryWithUser[]) || []);
    } catch {
      toast.error('문의 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (inquiryId: string) => {
    const replyText = replyTexts[inquiryId]?.trim();
    if (!replyText || submittingId) return;

    setSubmittingId(inquiryId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('customer_inquiries')
        .update({
          reply: replyText,
          status: 'replied',
          replied_at: new Date().toISOString(),
          replied_by: user.id,
        })
        .eq('id', inquiryId);

      if (error) throw error;

      toast.success('답변이 등록되었습니다.');
      setReplyTexts((prev) => ({ ...prev, [inquiryId]: '' }));
      await fetchInquiries();
    } catch {
      toast.error('답변 등록에 실패했습니다.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleClose = async (inquiryId: string) => {
    try {
      const { error } = await supabase
        .from('customer_inquiries')
        .update({ status: 'closed' })
        .eq('id', inquiryId);

      if (error) throw error;
      toast.success('문의가 종료되었습니다.');
      await fetchInquiries();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter((i) => i.status === filter);

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  const canReply = (id: string) => !!replyTexts[id]?.trim() && submittingId !== id;

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
                문의 관리
              </span>
              <div style={{ width: '44px' }} />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto w-full">

          {/* 통계 바 */}
          <div className="flex items-center justify-between" style={{ padding: '12px 20px' }}>
            <span style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '20px',
              letterSpacing: '-0.28px',
              color: '#151515',
            }}>
              전체 {inquiries.length}건
              {pendingCount > 0 && (
                <span style={{ color: '#d4850e', marginLeft: '8px' }}>
                  (대기 {pendingCount}건)
                </span>
              )}
            </span>
          </div>

          {/* 필터 탭 */}
          <div className="flex overflow-x-auto" style={{ gap: '8px', padding: '0 20px 16px 20px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {([
              { value: 'all', label: '전체' },
              { value: 'pending', label: '답변 대기' },
              { value: 'replied', label: '답변 완료' },
              { value: 'closed', label: '종료' },
            ] as { value: FilterStatus; label: string }[]).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="shrink-0"
                style={{
                  padding: '7px 14px',
                  borderRadius: '16px',
                  border: filter === tab.value ? '1px solid #41a09e' : '1px solid #e7e7e7',
                  backgroundColor: filter === tab.value ? '#f0f8f8' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: '18px',
                  letterSpacing: '-0.26px',
                  color: filter === tab.value ? '#368683' : '#6d6d6d',
                }}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center" style={{ paddingTop: '80px' }}>
              <div
                className="rounded-full animate-spin"
                style={{ width: '32px', height: '32px', border: '3px solid #e7e7e7', borderTopColor: '#41a09e' }}
              />
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '80px' }}>
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#848484',
              }}>
                {filter === 'all' ? '문의가 없습니다' : `${STATUS_CONFIG[filter]?.label || ''} 문의가 없습니다`}
              </span>
            </div>
          ) : (
            <div style={{ padding: '0 20px 40px 20px' }}>
              {filteredInquiries.map((inquiry) => {
                const statusCfg = STATUS_CONFIG[inquiry.status];
                const isExpanded = expandedId === inquiry.id;
                const userDisplay = inquiry.users?.nickname || inquiry.users?.email || '(알 수 없음)';

                return (
                  <div
                    key={inquiry.id}
                    className="overflow-hidden"
                    style={{
                      borderRadius: '16px',
                      border: `1px solid ${inquiry.status === 'pending' ? '#ffe0b2' : isExpanded ? '#d4d4d4' : '#e7e7e7'}`,
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
                      <div className="flex items-center" style={{ gap: '8px', marginBottom: '6px' }}>
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
                      <div className="flex items-center" style={{ gap: '6px', marginTop: '4px' }}>
                        <span style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          lineHeight: '16px',
                          letterSpacing: '-0.24px',
                          color: '#848484',
                        }}>
                          {userDisplay}
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#e7e7e7',
                        }}>|</span>
                        <span style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          lineHeight: '16px',
                          letterSpacing: '-0.24px',
                          color: '#b7b7b7',
                        }}>
                          {formatDate(inquiry.created_at)}
                        </span>
                      </div>
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

                        {/* 기존 답변 */}
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

                        {/* 답변 입력 (pending 또는 replied 상태에서만) */}
                        {inquiry.status !== 'closed' && (
                          <div style={{ marginTop: '16px' }}>
                            <div
                              className="w-full"
                              style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e7e7e7',
                                borderRadius: '16px',
                                padding: '16px 12px',
                              }}
                            >
                              <textarea
                                value={replyTexts[inquiry.id] || ''}
                                onChange={(e) => setReplyTexts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                                placeholder={inquiry.reply ? '추가 답변을 작성해주세요' : '답변을 작성해주세요'}
                                className="w-full outline-none bg-transparent resize-none"
                                style={{
                                  fontFamily: 'Pretendard Variable, sans-serif',
                                  fontSize: '15px',
                                  fontWeight: 400,
                                  lineHeight: '22px',
                                  letterSpacing: '-0.45px',
                                  color: '#151515',
                                  minHeight: '100px',
                                }}
                              />
                            </div>
                            <div className="flex" style={{ gap: '8px', marginTop: '12px' }}>
                              <button
                                onClick={() => handleReply(inquiry.id)}
                                disabled={!canReply(inquiry.id)}
                                className="flex-1 flex items-center justify-center"
                                style={{
                                  height: '48px',
                                  borderRadius: '16px',
                                  backgroundColor: canReply(inquiry.id) ? '#41a09e' : '#f8f8f8',
                                  cursor: canReply(inquiry.id) ? 'pointer' : 'not-allowed',
                                  border: 'none',
                                  gap: '6px',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseDown={(e) => { if (canReply(inquiry.id)) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; } }}
                                onMouseUp={(e) => { if (canReply(inquiry.id)) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
                                onMouseLeave={(e) => { if (canReply(inquiry.id)) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
                                onTouchStart={(e) => { if (canReply(inquiry.id)) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#368683'; } }}
                                onTouchEnd={(e) => { if (canReply(inquiry.id)) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#41a09e'; } }}
                              >
                                <Send style={{ width: '14px', height: '14px', color: canReply(inquiry.id) ? '#ffffff' : '#b7b7b7' }} />
                                <span style={{
                                  fontFamily: 'Pretendard Variable, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  lineHeight: '20px',
                                  letterSpacing: '-0.28px',
                                  color: canReply(inquiry.id) ? '#ffffff' : '#b7b7b7',
                                }}>
                                  {submittingId === inquiry.id ? '등록 중...' : '답변 등록'}
                                </span>
                              </button>
                              {inquiry.status === 'replied' && (
                                <button
                                  onClick={() => handleClose(inquiry.id)}
                                  className="flex items-center justify-center"
                                  style={{
                                    height: '48px',
                                    padding: '0 20px',
                                    borderRadius: '16px',
                                    backgroundColor: '#f9f9f9',
                                    border: '1px solid #e7e7e7',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                                >
                                  <span style={{
                                    fontFamily: 'Pretendard Variable, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    lineHeight: '20px',
                                    letterSpacing: '-0.28px',
                                    color: '#848484',
                                  }}>
                                    종료
                                  </span>
                                </button>
                              )}
                            </div>
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
