import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';

// ─── Design Tokens ──────────────────────────────────────────────────────────

const F = "'Pretendard Variable', sans-serif";

const C = {
  primary:        '#48b2af',
  primaryPressed: '#41A09E',
  primaryLight:   '#f0f8f8',
  primaryBorder:  '#d6eeee',
  black:          '#151515',
  charcoal:       '#000000',
  gray700:        '#6d6d6d',
  gray600:        '#848484',
  gray400:        '#b7b7b7',
  gray200:        '#d4d4d4',
  gray100:        '#f3f3f3',
  cardBg:         '#f9f9f9',
  inputBg:        '#f9f9f9',
  white:          '#ffffff',
} as const;

// ─── Emotion Data ───────────────────────────────────────────────────────────

const EMOTIONS = [
  { score: 1, label: 'great',    emoji: '😄', text: '좋아요',     bg: '#FFF5F0', ring: '#FFD4BC' },
  { score: 2, label: 'good',     emoji: '🙂', text: '괜찮아요',   bg: '#F5FFF0', ring: '#C8E6B8' },
  { score: 3, label: 'neutral',  emoji: '😐', text: '그저 그래요', bg: '#FFFCF0', ring: '#E8DDB0' },
  { score: 4, label: 'bad',      emoji: '😔', text: '별로예요',   bg: '#F0F4FF', ring: '#B8C8E6' },
  { score: 5, label: 'terrible', emoji: '😢', text: '힘들어요',   bg: '#F5F0FF', ring: '#C8B8E6' },
] as const;

const SUGGESTIONS = [
  '오늘 좀 힘들었어',
  '요즘 고민이 있어',
  '나에 대해 더 알려줘',
  '기분 전환할 방법 있을까?',
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** AI 아바타 (마음이 🌿) */
function AiAvatar() {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #e8f5f4 0%, #d6eeee 100%)' }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>🌿</span>
    </div>
  );
}

/** 메시지 버블 */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} style={{ marginBottom: 12 }}>
      {!isUser && (
        <div className="shrink-0 flex items-end" style={{ marginRight: 8 }}>
          <AiAvatar />
        </div>
      )}
      <div
        className="transform-gpu"
        style={{
          maxWidth: '78%',
          padding: '12px 16px',
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          backgroundColor: isUser ? C.primary : C.white,
          boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          border: isUser ? 'none' : `1px solid ${C.gray100}`,
        }}
      >
        <p style={{
          fontFamily: F, fontSize: '15px', fontWeight: 400, lineHeight: '23px',
          letterSpacing: '-0.3px', color: isUser ? C.white : C.black,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
        }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

/** 타이핑 인디케이터 */
function TypingIndicator() {
  return (
    <div className="flex justify-start" style={{ marginBottom: 12 }}>
      <div className="shrink-0 flex items-end" style={{ marginRight: 8 }}>
        <AiAvatar />
      </div>
      <div
        className="flex items-center transform-gpu"
        style={{
          padding: '14px 18px', borderRadius: 18, borderBottomLeftRadius: 4,
          backgroundColor: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: `1px solid ${C.gray100}`, gap: 5,
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full animate-bounce"
            style={{
              width: 7, height: 7, backgroundColor: C.gray400,
              animationDelay: `${i * 150}ms`, animationDuration: '0.9s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MindTalkPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Emotion
  const [todayEmotion, setTodayEmotion] = useState<{ score: number; label: string; memo: string | null } | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [freeUsed, setFreeUsed] = useState(0);

  const FREE_LIMIT = 3;

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // ── Init ──
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setAuthChecked(true);
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);

      const { data: emotion } = await supabase
        .from('mind_talk_emotions')
        .select('emotion_score, emotion_label, memo')
        .eq('user_id', user.id)
        .eq('checked_date', today)
        .maybeSingle();

      if (emotion) {
        setTodayEmotion({ score: emotion.emotion_score, label: emotion.emotion_label, memo: emotion.memo });
      }

      const { data: conv } = await supabase
        .from('mind_talk_conversations')
        .select('id, free_messages_used')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);
        setFreeUsed(conv.free_messages_used);

        const { data: msgs } = await supabase
          .from('mind_talk_messages')
          .select('id, role, content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
        }
      }
    })();
  }, []);

  // ── Handlers ──
  const handleCheckIn = async () => {
    if (!userId || !selectedEmotion) return;
    setCheckingIn(true);
    try {
      const emotionObj = EMOTIONS.find(e => e.score === selectedEmotion)!;
      const today = new Date().toISOString().slice(0, 10);

      await supabase.from('mind_talk_emotions').upsert({
        user_id: userId,
        emotion_score: selectedEmotion,
        emotion_label: emotionObj.label,
        memo: memo.trim() || null,
        checked_date: today,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,checked_date' });

      setTodayEmotion({ score: selectedEmotion, label: emotionObj.label, memo: memo.trim() || null });
      await sendMessage(null, { type: 'checkin', emotion: emotionObj.text, memo: memo.trim() || null });
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  const sendMessage = async (
    userMessage: string | null,
    meta?: { type: string; emotion?: string; memo?: string | null },
  ) => {
    if (sending) return;
    setSending(true);
    setStreaming('');

    if (userMessage) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: userMessage }]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = `https://${projectId}.supabase.co/functions/v1/mind-talk-chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage, conversation_id: conversationId, meta }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'FREE_LIMIT_REACHED') {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(), role: 'assistant',
            content: '오늘의 무료 대화를 모두 사용했어요.\n내일 다시 만나자!',
          }]);
          return;
        }
        throw new Error('Chat request failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]' || !dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.text) { fullText += data.text; setStreaming(fullText); }
            if (data.conversation_id) setConversationId(data.conversation_id);
            if (data.free_messages_used !== undefined) setFreeUsed(data.free_messages_used);
          } catch { /* ignore */ }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: fullText }]);
      }
      setStreaming('');
    } catch (err) {
      console.error('Send error:', err);
      setStreaming('');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  // ── 미로그인 ──
  if (authChecked && !userId) {
    return (
      <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.white }}>
        <div className="w-full max-w-[440px] flex flex-col items-center justify-center" style={{ padding: '0 24px 80px' }}>
          {/* 일러스트 영역 */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 88, height: 88, background: 'linear-gradient(135deg, #e8f5f4 0%, #d6eeee 100%)', marginBottom: 20 }}
          >
            <span style={{ fontSize: 40 }}>🌿</span>
          </div>
          <p style={{ fontFamily: F, fontSize: '22px', fontWeight: 600, lineHeight: '32.5px', letterSpacing: '-0.22px', color: C.black, marginBottom: 8 }}>
            마음톡
          </p>
          <p style={{ fontFamily: F, fontSize: '15px', fontWeight: 400, lineHeight: '23px', letterSpacing: '-0.3px', color: C.gray700, textAlign: 'center', marginBottom: 32 }}>
            나보다 나를 더 잘 아는 AI 친구<br />로그인하고 나만의 마음 친구를 만나보세요
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center"
            style={{
              height: 56, borderRadius: 16, backgroundColor: C.primary, border: 'none',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = C.primaryPressed; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = C.primary; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = C.primaryPressed; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = C.primary; }}
          >
            <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: C.white }}>
              로그인하기
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── 로딩 ──
  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: C.white }}>
        <div className="animate-spin rounded-full" style={{ width: 32, height: 32, border: `2.5px solid ${C.gray100}`, borderTopColor: C.primary }} />
      </div>
    );
  }

  const showCheckInCard = !todayEmotion;
  const showSuggestions = messages.length === 0 && !sending && todayEmotion;
  const remainingFree = Math.max(0, FREE_LIMIT - freeUsed);

  return (
    <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.white }}>
      <div className="w-full max-w-[440px] h-full flex flex-col" style={{ backgroundColor: C.white }}>

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between w-full" style={{ height: 52, padding: '0 20px', borderBottom: `1px solid ${C.gray100}` }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.36px', color: C.black }}>
              마음톡
            </span>
            <div
              className="flex items-center justify-center rounded-full"
              style={{ padding: '2px 10px', backgroundColor: C.primaryLight, border: `1px solid ${C.primaryBorder}` }}
            >
              <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, letterSpacing: '-0.22px', color: C.primaryPressed }}>
                {remainingFree}회 남음
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable Area ── */}
        <div
          className="flex-1 overflow-auto w-full"
          style={{ padding: '16px 20px 0', WebkitOverflowScrolling: 'touch' }}
        >

          {/* ── 감정 체크인 카드 ── */}
          {showCheckInCard && (
            <div
              className="transform-gpu overflow-hidden"
              style={{
                borderRadius: 20, padding: '24px 20px', marginBottom: 20,
                background: 'linear-gradient(180deg, #fafcfc 0%, #f5f9f9 100%)',
                border: `1px solid ${C.primaryBorder}`,
              }}
            >
              <p style={{ fontFamily: F, fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: C.black, marginBottom: 4 }}>
                오늘 기분은 어때요?
              </p>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: C.gray600, marginBottom: 24 }}>
                기분을 기록하면 마음이가 맞춤 대화를 시작해요
              </p>

              {/* 이모지 선택 */}
              <div className="flex justify-between" style={{ marginBottom: 20 }}>
                {EMOTIONS.map(e => {
                  const isSelected = selectedEmotion === e.score;
                  const isDimmed = selectedEmotion !== null && !isSelected;
                  return (
                    <button
                      key={e.score}
                      onClick={() => setSelectedEmotion(e.score)}
                      className="flex flex-col items-center"
                      style={{
                        gap: 6, border: 'none', background: 'none', padding: 0,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        opacity: isDimmed ? 0.35 : 1,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 52, height: 52,
                          backgroundColor: isSelected ? e.bg : 'transparent',
                          border: isSelected ? `2px solid ${e.ring}` : '2px solid transparent',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: 28, lineHeight: 1 }}>{e.emoji}</span>
                      </div>
                      <span style={{
                        fontFamily: F, fontSize: '11px', fontWeight: isSelected ? 600 : 400,
                        lineHeight: '14px', letterSpacing: '-0.22px',
                        color: isSelected ? C.primaryPressed : C.gray600,
                      }}>
                        {e.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 메모 입력 + 기록 버튼 */}
              {selectedEmotion && (
                <>
                  <div
                    className="flex items-center w-full"
                    style={{ height: 48, backgroundColor: C.white, border: `1px solid ${C.gray100}`, borderRadius: 14, padding: '0 14px', marginBottom: 12 }}
                  >
                    <input
                      type="text"
                      value={memo}
                      onChange={e => setMemo(e.target.value.slice(0, 100))}
                      placeholder="한줄 메모 (선택)"
                      className="w-full outline-none bg-transparent"
                      style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.28px', color: C.black }}
                    />
                  </div>
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full flex items-center justify-center"
                    style={{
                      height: 50, borderRadius: 14, border: 'none',
                      backgroundColor: checkingIn ? C.gray100 : C.primary,
                      cursor: checkingIn ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onTouchStart={e => { if (!checkingIn) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = C.primaryPressed; } }}
                    onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = checkingIn ? C.gray100 : C.primary; }}
                    onMouseDown={e => { if (!checkingIn) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = C.primaryPressed; } }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = checkingIn ? C.gray100 : C.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = checkingIn ? C.gray100 : C.primary; }}
                  >
                    <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 600, lineHeight: '22px', letterSpacing: '-0.3px', color: C.white }}>
                      {checkingIn ? '기록 중...' : '기록하기'}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── 오늘 감정 뱃지 ── */}
          {todayEmotion && messages.length === 0 && !sending && (
            <div
              className="flex items-center"
              style={{
                gap: 8, padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                backgroundColor: EMOTIONS.find(e => e.score === todayEmotion.score)?.bg ?? C.cardBg,
                border: `1px solid ${EMOTIONS.find(e => e.score === todayEmotion.score)?.ring ?? C.gray100}`,
              }}
            >
              <span style={{ fontSize: 20 }}>{EMOTIONS.find(e => e.score === todayEmotion.score)?.emoji}</span>
              <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, lineHeight: '18px', letterSpacing: '-0.26px', color: C.gray700 }}>
                오늘의 기분: {EMOTIONS.find(e => e.score === todayEmotion.score)?.text}
                {todayEmotion.memo && ` — "${todayEmotion.memo}"`}
              </span>
            </div>
          )}

          {/* ── 추천 질문 ── */}
          {showSuggestions && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, lineHeight: '18px', letterSpacing: '-0.26px', color: C.gray600, marginBottom: 10 }}>
                이런 대화를 시작해볼까요?
              </p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="flex items-center"
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      backgroundColor: C.white, border: `1px solid ${C.primaryBorder}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onTouchStart={e => { e.currentTarget.style.backgroundColor = C.primaryLight; }}
                    onTouchEnd={e => { e.currentTarget.style.backgroundColor = C.white; }}
                    onMouseDown={e => { e.currentTarget.style.backgroundColor = C.primaryLight; }}
                    onMouseUp={e => { e.currentTarget.style.backgroundColor = C.white; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.white; }}
                  >
                    <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, lineHeight: '18px', letterSpacing: '-0.26px', color: C.primaryPressed }}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 메시지 목록 ── */}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {/* 스트리밍 중인 AI 메시지 */}
          {streaming && (
            <div className="flex justify-start" style={{ marginBottom: 12 }}>
              <div className="shrink-0 flex items-end" style={{ marginRight: 8 }}>
                <AiAvatar />
              </div>
              <div
                className="transform-gpu"
                style={{
                  maxWidth: '78%', padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4,
                  backgroundColor: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${C.gray100}`,
                }}
              >
                <p style={{
                  fontFamily: F, fontSize: '15px', fontWeight: 400, lineHeight: '23px',
                  letterSpacing: '-0.3px', color: C.black, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                }}>
                  {streaming}
                </p>
              </div>
            </div>
          )}

          {/* 타이핑 인디케이터 */}
          {sending && !streaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div
          className="shrink-0 w-full"
          style={{
            padding: '10px 16px', borderTop: `1px solid ${C.gray100}`, backgroundColor: C.white,
          }}
        >
          <div className="flex items-end" style={{ gap: 8 }}>
            <div
              className="flex-1 flex items-end"
              style={{
                minHeight: 44, backgroundColor: C.inputBg, borderRadius: 22,
                padding: '10px 16px', border: `1px solid ${C.gray100}`,
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                rows={1}
                className="flex-1 resize-none outline-none bg-transparent"
                style={{
                  fontFamily: F, fontSize: '15px', fontWeight: 400, lineHeight: '22px',
                  letterSpacing: '-0.3px', color: C.black, maxHeight: 100,
                  border: 'none', padding: 0, margin: 0,
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 44, height: 44, borderRadius: 22, border: 'none',
                backgroundColor: input.trim() && !sending ? C.primary : C.gray100,
                cursor: input.trim() && !sending ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onTouchStart={e => { if (input.trim() && !sending) { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.backgroundColor = C.primaryPressed; } }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = input.trim() && !sending ? C.primary : C.gray100; }}
              onMouseDown={e => { if (input.trim() && !sending) { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.backgroundColor = C.primaryPressed; } }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = input.trim() && !sending ? C.primary : C.gray100; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = input.trim() && !sending ? C.primary : C.gray100; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L3 21L21 12L3 3L5 12ZM5 12H13" stroke={input.trim() && !sending ? 'white' : C.gray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭바 여백 (56px + safe area) */}
        <div className="shrink-0" style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', backgroundColor: C.white }} />
      </div>
    </div>
  );
}
