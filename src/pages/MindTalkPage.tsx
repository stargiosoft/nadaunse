import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';
import ArrowLeft from '../components/ArrowLeft';
import { useSproutBalance, writeSproutBalanceCache } from '../hooks/useSproutBalance';
import { getRandomTarotCards, getTarotCardImageUrl } from '../lib/tarotCards';
import SproutChargingStation from '../components/SproutChargingStation';

// ─── Design Tokens ──────────────────────────────────────────────────────────

const F = "'Pretendard Variable', sans-serif";

const C = {
  primary:        '#48b2af',
  primaryPressed: '#41A09E',
  primaryLight:   '#f0f8f8',
  primaryBorder:  '#d6eeee',
  black:          '#151515',
  gray700:        '#6d6d6d',
  gray600:        '#848484',
  gray400:        '#b7b7b7',
  gray200:        '#d4d4d4',
  gray100:        '#f3f3f3',
  cardBg:         '#f9f9f9',
  inputBg:        '#f9f9f9',
  white:          '#ffffff',
  purple:         '#8B5CF6',
  purpleLight:    '#F3EEFF',
  purpleBorder:   '#DDD6FE',
  amber:          '#D97706',
  amberLight:     '#FFFBEB',
  amberBorder:    '#FDE68A',
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

type ChatMode = 'general' | 'saju' | 'tarot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const MODES: { key: ChatMode; label: string; color: string; bg: string; border: string }[] = [
  { key: 'general', label: '일반', color: C.primary, bg: C.primaryLight, border: C.primaryBorder },
  { key: 'saju', label: '사주', color: C.amber, bg: C.amberLight, border: C.amberBorder },
  { key: 'tarot', label: '타로', color: C.purple, bg: C.purpleLight, border: C.purpleBorder },
];

const SUGGESTIONS: Record<ChatMode, string[]> = {
  general: ['오늘 좀 힘들었어', '요즘 고민이 있어', '나에 대해 더 알려줘', '기분 전환할 방법 있을까?'],
  saju: ['오늘 운세가 궁금해', '이번 달 흐름이 어때?', '연애운이 궁금해', '직장 운이 어떻게 될까?'],
  tarot: ['연애 고민이 있어', '진로를 못 정하겠어', '요즘 불안한 마음', '이 선택이 맞을까?'],
};

const FREE_LIMIT = 3;
const SPROUT_COST = 5;

// ─── Sub-components ─────────────────────────────────────────────────────────

function AiAvatar() {
  return (
    <div className="shrink-0 rounded-full overflow-hidden transform-gpu" style={{ width: 36, height: 36 }}>
      <img src="/maumi-avatar.png" alt="마음이" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

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
          maxWidth: '78%', padding: '12px 16px', borderRadius: 18,
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

/** 타로 카드 뽑기 오버레이 */
function TarotDrawOverlay({
  onComplete,
  onClose,
}: {
  onComplete: (cards: string[]) => void;
  onClose: () => void;
}) {
  const [candidates] = useState(() => getRandomTarotCards(7));
  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const toggleCard = (idx: number) => {
    if (revealed) return;
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= 3) return prev;
      return [...prev, idx];
    });
  };

  const handleReveal = () => setRevealed(true);

  const handleConfirm = () => {
    const cards = selected.map(i => candidates[i]);
    onComplete(cards);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100 }}
    >
      <div className="w-full max-w-[400px] flex flex-col items-center" style={{ padding: '0 24px' }}>
        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <p style={{
          fontFamily: F, fontSize: '20px', fontWeight: 700, lineHeight: '28px',
          letterSpacing: '-0.4px', color: C.white, marginBottom: 8, textAlign: 'center',
        }}>
          카드를 3장 선택하세요
        </p>
        <p style={{
          fontFamily: F, fontSize: '14px', fontWeight: 400, lineHeight: '20px',
          letterSpacing: '-0.28px', color: 'rgba(255,255,255,0.6)', marginBottom: 32, textAlign: 'center',
        }}>
          마음이 이끄는 대로 골라보세요
        </p>

        {/* 카드 그리드 */}
        <div
          className="flex flex-wrap justify-center"
          style={{ gap: 12, marginBottom: 32 }}
        >
          {candidates.map((card, idx) => {
            const isSelected = selected.includes(idx);
            const selectionOrder = isSelected ? selected.indexOf(idx) + 1 : 0;
            return (
              <button
                key={idx}
                onClick={() => toggleCard(idx)}
                style={{
                  width: 80, height: 120, borderRadius: 10, border: 'none',
                  cursor: revealed ? 'default' : 'pointer',
                  transition: 'all 0.4s ease',
                  transform: isSelected && !revealed ? 'translateY(-8px)' : 'none',
                  position: 'relative', overflow: 'hidden', padding: 0,
                  boxShadow: isSelected ? `0 4px 16px rgba(139,92,246,0.4)` : '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {revealed && isSelected ? (
                  /* 앞면: 카드 이미지 */
                  <img
                    src={getTarotCardImageUrl(card)}
                    alt={card}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                  />
                ) : (
                  /* 뒷면 */
                  <div style={{
                    width: '100%', height: '100%',
                    background: isSelected
                      ? 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)'
                      : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #A78BFA' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected ? (
                      <span style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: C.white }}>
                        {selectionOrder}
                      </span>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 버튼 */}
        {!revealed && selected.length === 3 && (
          <button
            onClick={handleReveal}
            style={{
              width: '100%', maxWidth: 280, height: 52, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: C.white }}>
              카드 확인하기
            </span>
          </button>
        )}

        {revealed && (
          <div className="w-full flex flex-col items-center" style={{ gap: 12 }}>
            <div className="flex justify-center" style={{ gap: 8, marginBottom: 8 }}>
              {selected.map(idx => (
                <p key={idx} style={{
                  fontFamily: F, fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)',
                  textAlign: 'center',
                }}>
                  {candidates[idx]}
                </p>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              style={{
                width: '100%', maxWidth: 280, height: 52, borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: C.white }}>
                해석 받기
              </span>
            </button>
          </div>
        )}
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

  // Mode
  const [mode, setMode] = useState<ChatMode>('general');

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [freeUsed, setFreeUsed] = useState(0);
  const [loadingConv, setLoadingConv] = useState(false);
  const greetedModesRef = useRef<Set<string>>(new Set());

  // Sprout
  const { balance: sproutBalance, refetch: refetchSprout } = useSproutBalance();
  const [showCharge, setShowCharge] = useState(false);

  // Tarot
  const [showTarotDraw, setShowTarotDraw] = useState(false);
  const [lastTarotQuestion, setLastTarotQuestion] = useState('');

  const isPaidMode = mode === 'saju' || mode === 'tarot';
  const remainingFree = isPaidMode ? Math.max(0, FREE_LIMIT - freeUsed) : -1;
  const needsSprout = isPaidMode && freeUsed >= FREE_LIMIT;

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // ── Auth check ──
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setAuthChecked(true);
    })();
  }, []);

  // ── Load conversation when mode changes ──
  const loadConversation = useCallback(async (chatMode: ChatMode) => {
    if (!userId) return;
    setLoadingConv(true);
    setMessages([]);
    setConversationId(null);
    setFreeUsed(0);
    setStreaming('');

    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: conv } = await supabase
        .from('mind_talk_conversations')
        .select('id, free_messages_used')
        .eq('user_id', userId)
        .eq('session_date', today)
        .eq('mode', chatMode)
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);
        setFreeUsed(conv.free_messages_used);

        const { data: msgs } = await supabase
          .from('mind_talk_messages')
          .select('id, role, content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgs && msgs.length > 0) {
          setMessages(msgs.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
          setLoadingConv(false);
          return; // Already has messages, no greeting needed
        }
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    }

    setLoadingConv(false);

    // Trigger AI greeting if not already greeted for this mode today
    const greetKey = `${new Date().toISOString().slice(0, 10)}_${chatMode}`;
    if (!greetedModesRef.current.has(greetKey)) {
      greetedModesRef.current.add(greetKey);
      // Small delay to let UI settle
      setTimeout(() => {
        sendMessage(null, { type: 'greeting' }, chatMode);
      }, 300);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authChecked && userId) {
      loadConversation(mode);
    }
  }, [authChecked, userId, mode, loadConversation]);

  // ── Send message ──
  const sendMessage = async (
    userMessage: string | null,
    meta?: { type: string; cards?: string[]; question?: string; },
    overrideMode?: ChatMode,
  ) => {
    if (sending) return;
    const chatMode = overrideMode ?? mode;
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
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
          mode: chatMode,
          meta,
        }),
      });

      const contentType = response.headers.get('Content-Type') || '';

      if (!response.ok || contentType.includes('application/json')) {
        const errData = await response.json().catch(() => ({}));

        if (errData.error === 'INSUFFICIENT_SPROUTS') {
          if (userMessage) {
            setMessages(prev => prev.filter(m => m.content !== userMessage || m.role !== 'user'));
          }
          setShowCharge(true);
          return;
        }

        throw new Error(errData.error || 'Chat request failed');
      }

      // SSE streaming
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
            if (data.new_sprout_balance !== undefined) {
              writeSproutBalanceCache(data.new_sprout_balance);
              refetchSprout();
            }
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

    // For paid modes, check if we need sprouts and don't have enough
    if (needsSprout && sproutBalance < SPROUT_COST) {
      setShowCharge(true);
      return;
    }

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

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === mode || sending) return;
    setMode(newMode);
  };

  const handleTarotDraw = () => {
    // Save latest user question for context
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    setLastTarotQuestion(lastUserMsg?.content || '');
    setShowTarotDraw(true);
  };

  const handleTarotComplete = (cards: string[]) => {
    setShowTarotDraw(false);

    // Check sprout before sending
    if (needsSprout && sproutBalance < SPROUT_COST) {
      setShowCharge(true);
      return;
    }

    // Show drawn cards as a user message
    const cardMsg = `${cards.join(', ')} 카드를 뽑았어!`;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: cardMsg }]);

    sendMessage(null, {
      type: 'tarot_cards',
      cards,
      question: lastTarotQuestion,
    });
  };

  // ── 미로그인 ──
  if (authChecked && !userId) {
    return (
      <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.white }}>
        <div className="w-full max-w-[440px] flex flex-col items-center justify-center" style={{ padding: '0 24px 80px' }}>
          <div className="rounded-full overflow-hidden transform-gpu" style={{ width: 88, height: 88, marginBottom: 20 }}>
            <img src="/maumi-avatar.png" alt="마음이" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

  const currentModeConfig = MODES.find(m => m.key === mode)!;
  const showSuggestions = messages.length === 0 && !sending && !loadingConv;

  return (
    <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.white }}>
      <div className="w-full max-w-[440px] h-full flex flex-col" style={{ backgroundColor: C.white }}>

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center w-full" style={{ height: 52, padding: '0 12px', borderBottom: `1px solid ${C.gray100}` }}>
          <ArrowLeft onClick={() => navigate(-1)} />
          <div className="flex-1 flex items-center justify-center" style={{ gap: 8 }}>
            <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.36px', color: C.black }}>
              마음톡
            </span>
            {isPaidMode && (
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  padding: '2px 10px',
                  backgroundColor: remainingFree > 0 ? currentModeConfig.bg : C.cardBg,
                  border: `1px solid ${remainingFree > 0 ? currentModeConfig.border : C.gray200}`,
                }}
              >
                <span style={{
                  fontFamily: F, fontSize: '11px', fontWeight: 600, letterSpacing: '-0.22px',
                  color: remainingFree > 0 ? currentModeConfig.color : C.gray600,
                }}>
                  {remainingFree > 0 ? `${remainingFree}회 무료` : `${SPROUT_COST}새싹/회`}
                </span>
              </div>
            )}
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* ── Mode Selector ── */}
        <div className="shrink-0 flex items-center" style={{ padding: '10px 20px', gap: 8, borderBottom: `1px solid ${C.gray100}` }}>
          {MODES.map(m => {
            const isActive = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                disabled={sending}
                className="flex items-center justify-center"
                style={{
                  padding: '6px 16px', borderRadius: 20,
                  backgroundColor: isActive ? m.bg : 'transparent',
                  border: `1px solid ${isActive ? m.border : C.gray200}`,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: sending && !isActive ? 0.5 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  fontFamily: F, fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  letterSpacing: '-0.26px', color: isActive ? m.color : C.gray600,
                }}>
                  {m.label}
                </span>
              </button>
            );
          })}

          {/* 새싹 잔액 (유료 모드) */}
          {isPaidMode && (
            <div className="flex items-center" style={{ marginLeft: 'auto', gap: 4 }}>
              <span style={{ fontSize: 14 }}>🌱</span>
              <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, letterSpacing: '-0.26px', color: C.gray700 }}>
                {sproutBalance}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable Chat Area ── */}
        <div
          className="flex-1 overflow-auto w-full"
          style={{ padding: '16px 20px 16px', WebkitOverflowScrolling: 'touch' }}
        >
          {/* 로딩 */}
          {loadingConv && (
            <div className="flex justify-center" style={{ padding: '40px 0' }}>
              <div className="animate-spin rounded-full" style={{ width: 24, height: 24, border: `2px solid ${C.gray100}`, borderTopColor: C.primary }} />
            </div>
          )}

          {/* 추천 질문 */}
          {showSuggestions && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, lineHeight: '18px', letterSpacing: '-0.26px', color: C.gray600, marginBottom: 10 }}>
                이런 대화를 시작해볼까요?
              </p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {SUGGESTIONS[mode].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="flex items-center"
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      backgroundColor: C.white, border: `1px solid ${currentModeConfig.border}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onTouchStart={e => { e.currentTarget.style.backgroundColor = currentModeConfig.bg; }}
                    onTouchEnd={e => { e.currentTarget.style.backgroundColor = C.white; }}
                    onMouseDown={e => { e.currentTarget.style.backgroundColor = currentModeConfig.bg; }}
                    onMouseUp={e => { e.currentTarget.style.backgroundColor = C.white; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.white; }}
                  >
                    <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, lineHeight: '18px', letterSpacing: '-0.26px', color: currentModeConfig.color }}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
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

          {sending && !streaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="shrink-0 w-full" style={{ padding: '10px 16px', borderTop: `1px solid ${C.gray100}`, backgroundColor: C.white }}>
          <div className="flex items-end" style={{ gap: 8 }}>
            {/* 타로 카드 뽑기 버튼 */}
            {mode === 'tarot' && messages.length > 0 && (
              <button
                onClick={handleTarotDraw}
                disabled={sending}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 44, height: 44, borderRadius: 22, border: `1px solid ${C.purpleBorder}`,
                  backgroundColor: C.purpleLight,
                  cursor: sending ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: sending ? 0.5 : 1,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2" stroke={C.purple} strokeWidth="1.5" />
                  <path d="M12 8L13.5 11H10.5L12 8Z" fill={C.purple} />
                  <circle cx="12" cy="14" r="1.5" fill={C.purple} />
                </svg>
              </button>
            )}

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

        {/* 탭바 여백 */}
        <div className="shrink-0" style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', backgroundColor: C.white }} />
      </div>

      {/* ── 타로 카드 뽑기 오버레이 ── */}
      {showTarotDraw && (
        <TarotDrawOverlay
          onComplete={handleTarotComplete}
          onClose={() => setShowTarotDraw(false)}
        />
      )}

      {/* ── 새싹 충전 오버레이 ── */}
      {showCharge && (
        <div className="fixed inset-0" style={{ zIndex: 100, backgroundColor: C.white }}>
          <SproutChargingStation
            currentBalance={sproutBalance}
            requiredAmount={SPROUT_COST}
            onBack={() => setShowCharge(false)}
            onChargeComplete={(newBalance) => {
              writeSproutBalanceCache(newBalance);
              refetchSprout();
              setShowCharge(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
