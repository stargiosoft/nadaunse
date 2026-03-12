import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';
import ArrowLeft from '../components/ArrowLeft';
import { useSproutBalance, writeSproutBalanceCache } from '../hooks/useSproutBalance';
import { getRandomTarotCards, getTarotCardImageUrl } from '../lib/tarotCards';
import SproutChargingStation from '../components/SproutChargingStation';
import BottomTabBar from '../components/BottomTabBar';
import { trackMindTalkPageView, trackMindTalkModeChange, trackMindTalkMessageSend, trackMindTalkTarotDraw, trackMindTalkSproutInsufficient, trackMindTalkLoginClick, trackMindTalkNewRound } from '../utils/analytics';

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

const GREETINGS: Record<ChatMode, string> = {
  general: '안녕! 잘 지냈어? 오늘은 어떤 이야기 하고 싶어서 찾아왔을까? 😊',
  saju: '안녕! 오늘의 운세가 궁금한 거야? 어떤 이야기가 듣고 싶은지 골라봐 😊',
  tarot: '안녕! 마음속에 궁금한 게 있구나? 카드가 답을 알려줄지도 몰라 🔮',
};

const SUGGESTIONS: Record<ChatMode, string[]> = {
  general: ['오늘 좀 힘들었어', '요즘 고민이 있어', '나에 대해 더 알려줘', '기분 전환할 방법 있을까?'],
  saju: ['오늘 운세가 궁금해', '이번 달 흐름이 어때?', '연애운이 궁금해', '직장 운이 어떻게 될까?'],
  tarot: ['연애 고민이 있어', '진로를 못 정하겠어', '요즘 불안한 마음', '이 선택이 맞을까?'],
};

const FREE_LIMIT = 3;
const SPROUT_COST = 5;

// AI 메시지에서 타로 카드 뽑기 유도 감지
const TAROT_DRAW_KEYWORDS = ['카드를 뽑', '카드를 골라', '카드를 선택', '뽑아볼까', '뽑아보', '골라볼까', '골라보'];
function suggestsCardDraw(text: string): boolean {
  return TAROT_DRAW_KEYWORDS.some(kw => text.includes(kw));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function AiAvatar() {
  return (
    <div className="shrink-0 rounded-full overflow-hidden transform-gpu" style={{ width: 36, height: 36 }}>
      <img src="/maumi-avatar.png" alt="마음이" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

/** **bold** 마크다운을 <strong>으로 변환 */
function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part
  );
}

const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: Message }) {
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
          {renderBoldText(msg.content)}
        </p>
      </div>
    </div>
  );
});

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

/** 타로 카드 뽑기 인라인 CTA (채팅 내) */
function TarotDrawCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-start" style={{ marginBottom: 12 }}>
      <div className="shrink-0" style={{ width: 36, marginRight: 8 }} />
      <button
        onClick={onClick}
        className="flex flex-col items-center transform-gpu"
        style={{
          padding: '16px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, #e8f5f4 0%, #f0f8f8 40%, #f5f0ff 100%)',
          border: `1px solid ${C.primaryBorder}`,
          cursor: 'pointer', transition: 'transform 0.15s ease',
          WebkitTapHighlightColor: 'transparent',
          gap: 10,
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      >
        <img
          src="/home-v2/taro-card-back.png"
          alt="타로 카드"
          style={{ width: 72, height: 108, objectFit: 'contain', borderRadius: 8 }}
        />
        <span style={{
          fontFamily: F, fontSize: '14px', fontWeight: 600,
          letterSpacing: '-0.28px', color: C.primary,
        }}>
          카드 뽑으러 가기
        </span>
      </button>
    </div>
  );
}

/** 타로 카드 1장 뽑기 오버레이 (타로 상담 스타일 플립) */
function TarotDrawOverlay({
  onComplete,
  onClose,
}: {
  onComplete: (cards: string[]) => void;
  onClose: () => void;
}) {
  const [card] = useState(() => getRandomTarotCards(1)[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = 'mind-talk-tarot-keyframes';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes mtTaroShine {
        0%   { transform: translateX(-160%) skewX(-20deg); opacity: 1; }
        30%  { transform: translateX(320%)  skewX(-20deg); opacity: 1; }
        31%  { transform: translateX(320%)  skewX(-20deg); opacity: 0; }
        99%  { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
        100% { transform: translateX(-160%) skewX(-20deg); opacity: 1; }
      }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const handleFlip = () => {
    if (isFlipped || isAnimating) return;
    if (shineRef.current) {
      shineRef.current.style.animation = 'none';
      shineRef.current.style.opacity = '0';
    }
    setIsAnimating(true);
    setIsFlipped(true);
  };

  const handleFlipEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === 'transform' && isFlipped) {
      setIsAnimating(false);
      setShowConfirm(true);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: C.white, zIndex: 100 }}
    >
      {/* 닫기 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: C.gray100, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke={C.gray600} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 가이드 텍스트 */}
      <p style={{
        fontFamily: F, fontSize: '17px', fontWeight: 500, lineHeight: '24px',
        letterSpacing: '-0.34px', color: C.black, textAlign: 'center',
        opacity: isFlipped ? 0 : 1, transition: 'opacity 0.3s ease',
        marginBottom: 24,
      }}>
        오늘의 고민 카드를 뽑아보세요
      </p>

      {/* 카드 (190×318 비율) */}
      <div style={{ width: 190, aspectRatio: '160 / 268', position: 'relative' }}>
        <div
          style={{ position: 'absolute', inset: 0, perspective: 1000, cursor: isFlipped ? 'default' : 'pointer', zIndex: 1 }}
          onClick={handleFlip}
        >
          <div
            style={{
              width: '100%', height: '100%', position: 'relative',
              transformStyle: 'preserve-3d', transition: 'transform 0.6s ease-in-out',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onTransitionEnd={handleFlipEnd}
          >
            {/* 뒷면 */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden' }}>
              <img alt="카드 뒷면" src="/home-v2/taro-card-back.png" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block', transform: 'translateZ(0)' }} />
              {/* Shine overlay */}
              <div ref={shineRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)', willChange: 'transform', animation: 'mtTaroShine 3.6s ease-in-out infinite' }} />
              </div>
            </div>
            {/* 앞면 */}
            <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)' }}>
              <img alt={card} src={getTarotCardImageUrl(card)} style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block', borderRadius: 16 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 탭하여 공개 버튼 */}
      {!isFlipped && (
        <button onClick={handleFlip} style={{
          marginTop: 16, backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 12,
          padding: '6px 16px 4px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}>
          <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: C.white, letterSpacing: '-0.42px', lineHeight: '22px' }}>
            탭하여 공개
          </span>
        </button>
      )}

      {/* 카드 이름 + 해석 받기 */}
      {showConfirm && (
        <div className="flex flex-col items-center" style={{ marginTop: 20, gap: 12 }}>
          <p style={{ fontFamily: F, fontSize: '15px', fontWeight: 600, color: C.black, letterSpacing: '-0.3px' }}>
            {card}
          </p>
          <button
            onClick={() => onComplete([card])}
            style={{
              width: 220, height: 48, borderRadius: 14, border: 'none',
              backgroundColor: C.primary, cursor: 'pointer',
              transition: 'transform 0.1s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: C.white }}>
              해석 받기
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MindTalkPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

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
  const [loadingConv, setLoadingConv] = useState(true);
  const [round, setRound] = useState(1);
  const [roundLoaded, setRoundLoaded] = useState(false);

  // Sprout
  const { balance: sproutBalance, refetch: refetchSprout } = useSproutBalance();
  const [showCharge, setShowCharge] = useState(false);

  // Tarot
  const [showTarotDraw, setShowTarotDraw] = useState(false);
  const [lastTarotQuestion, setLastTarotQuestion] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // 일일 무료 사용량 캐시 (모드별, 탭 전환 시 깜빡임 방지)
  const dailyFreeCacheRef = useRef<{ date: string; saju: number; tarot: number }>({
    date: new Date().toISOString().slice(0, 10),
    saju: -1, // -1 = 아직 로드 안 됨
    tarot: -1,
  });

  const isPaidMode = mode === 'saju' || mode === 'tarot';
  const remainingFree = isPaidMode ? Math.max(0, FREE_LIMIT - freeUsed) : -1;
  const needsSprout = isPaidMode && freeUsed >= FREE_LIMIT;

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // ── Auth check + load current round ──
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setAuthChecked(true);
      trackMindTalkPageView(!!user);

      if (user) {
        const today = new Date().toISOString().slice(0, 10);

        // sessionStorage에 저장된 round 우선 (페이지 이동 후 복귀 대응)
        const savedDate = sessionStorage.getItem('mind_talk_round_date');
        const savedRound = sessionStorage.getItem('mind_talk_round');
        if (savedDate === today && savedRound) {
          setRound(parseInt(savedRound, 10));
        } else {
          // DB에서 최신 round 로드
          const { data } = await supabase
            .from('mind_talk_conversations')
            .select('round')
            .eq('user_id', user.id)
            .eq('session_date', today)
            .order('round', { ascending: false })
            .limit(1)
            .maybeSingle();
          const r = data?.round ?? 1;
          setRound(r);
          sessionStorage.setItem('mind_talk_round', String(r));
          sessionStorage.setItem('mind_talk_round_date', today);
        }
      }
      setRoundLoaded(true);
    })();
  }, []);

  // ── Load conversation when mode/round changes ──
  const loadConversation = useCallback(async (chatMode: ChatMode, currentRound: number) => {
    if (!userId) return;
    setLoadingConv(true);
    setConversationId(null);
    setStreaming('');
    setAiSuggestions([]);

    const today = new Date().toISOString().slice(0, 10);
    const cache = dailyFreeCacheRef.current;

    // 날짜 변경 시 캐시 초기화
    if (cache.date !== today) {
      cache.date = today;
      cache.saju = -1;
      cache.tarot = -1;
    }

    // 캐시에 값이 있으면 즉시 적용 (깜빡임 방지)
    const cachedKey = chatMode as 'saju' | 'tarot';
    if ((chatMode === 'saju' || chatMode === 'tarot') && cache[cachedKey] >= 0) {
      setFreeUsed(cache[cachedKey]);
    }

    try {
      // 일일 무료 사용량 집계 + 현재 라운드 conversation을 병렬 조회
      const [todayConvsResult, convResult] = await Promise.all([
        supabase
          .from('mind_talk_conversations')
          .select('free_messages_used')
          .eq('user_id', userId)
          .eq('session_date', today)
          .eq('mode', chatMode),
        supabase
          .from('mind_talk_conversations')
          .select('id, free_messages_used')
          .eq('user_id', userId)
          .eq('session_date', today)
          .eq('mode', chatMode)
          .eq('round', currentRound)
          .maybeSingle(),
      ]);

      const dailyFreeUsed = todayConvsResult.data?.reduce((sum, c) => sum + (c.free_messages_used ?? 0), 0) ?? 0;
      setFreeUsed(dailyFreeUsed);

      // 캐시 업데이트
      if (chatMode === 'saju' || chatMode === 'tarot') {
        cache[chatMode] = dailyFreeUsed;
      }

      const conv = convResult.data;
      if (conv) {
        setConversationId(conv.id);

        const { data: msgs } = await supabase
          .from('mind_talk_messages')
          .select('id, role, content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgs && msgs.length > 0) {
          setMessages(msgs.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
          setLoadingConv(false);
          return;
        }
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    }

    // 기존 대화 없음 → 빈 상태로 전환
    setMessages([]);
    setLoadingConv(false);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authChecked && userId && roundLoaded) {
      loadConversation(mode, round);
    }
  }, [authChecked, userId, mode, round, roundLoaded, loadConversation]);

  // ── 날짜 변경 감지 → 캐시 초기화 + 재로드 ──
  useEffect(() => {
    const checkDateChange = () => {
      const today = new Date().toISOString().slice(0, 10);
      if (dailyFreeCacheRef.current.date !== today) {
        dailyFreeCacheRef.current = { date: today, saju: -1, tarot: -1 };
        setFreeUsed(0);
        if (userId && roundLoaded) {
          loadConversation(mode, round);
        }
      }
    };
    // 탭 포커스 복귀 시 + 1분마다 체크
    const interval = setInterval(checkDateChange, 60_000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') checkDateChange(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [userId, mode, round, roundLoaded, loadConversation]);

  // ── Send message ──
  const sendMessage = async (
    userMessage: string | null,
    meta?: { type: string; cards?: string[]; question?: string; },
    overrideMode?: ChatMode,
  ) => {
    if (sending) return;
    const chatMode = overrideMode ?? mode;

    // 유료 모드 + 무료 소진 + 새싹 부족 → API 호출 없이 바로 충전 페이지
    const chatIsPaid = chatMode === 'saju' || chatMode === 'tarot';
    if (chatIsPaid && freeUsed >= FREE_LIMIT && sproutBalance < SPROUT_COST) {
      setShowCharge(true);
      return;
    }

    setSending(true);
    setStreaming('');
    setAiSuggestions([]);

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
          round,
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

      // SSE streaming (RAF throttle로 리렌더링 최적화)
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      let rafPending = false;
      let latestFullText = '';

      const stripSuggestions = (t: string) => {
        const idx = t.indexOf('---SUGGESTIONS---');
        return idx >= 0 ? t.slice(0, idx).trim() : t;
      };

      const flushStreaming = () => {
        setStreaming(stripSuggestions(latestFullText));
        rafPending = false;
      };

      const scheduleStreamingUpdate = () => {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(flushStreaming);
        }
      };

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]' || !dataStr) return;
        try {
          const data = JSON.parse(dataStr);
          if (data.text) {
            fullText += data.text;
            latestFullText = fullText;
            scheduleStreamingUpdate();
          }
          if (data.conversation_id) setConversationId(data.conversation_id);
          if (data.free_messages_used !== undefined) {
            setFreeUsed(data.free_messages_used);
            const cm = overrideMode ?? mode;
            if (cm === 'saju' || cm === 'tarot') {
              dailyFreeCacheRef.current[cm] = data.free_messages_used;
            }
          }
          if (data.new_sprout_balance !== undefined) {
            writeSproutBalanceCache(data.new_sprout_balance);
            refetchSprout();
          }
          if (data.suggestions) {
            setAiSuggestions(data.suggestions);
          }
        } catch { /* ignore */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) processLine(line);
      }

      // 루프 종료 후 남은 버퍼 처리
      if (buffer.trim()) {
        for (const line of buffer.split('\n')) processLine(line);
      }

      // 마지막 RAF 강제 flush
      if (rafPending) {
        cancelAnimationFrame(0);
        setStreaming(latestFullText);
      }

      if (fullText) {
        const cleanText = stripSuggestions(fullText);
        if (cleanText) {
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: cleanText }]);
        }
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
      trackMindTalkSproutInsufficient(mode as 'saju' | 'tarot', sproutBalance);
      setShowCharge(true);
      return;
    }

    trackMindTalkMessageSend(mode, round, false, needsSprout);
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
    setMessages([]);
    // 캐시된 무료 사용량 즉시 적용 (깜빡임 방지)
    if (newMode === 'saju' || newMode === 'tarot') {
      const cached = dailyFreeCacheRef.current[newMode];
      if (cached >= 0) setFreeUsed(cached);
    }
    trackMindTalkModeChange(newMode);
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
    trackMindTalkTarotDraw(cards.length);

    // Check sprout before sending
    if (needsSprout && sproutBalance < SPROUT_COST) {
      trackMindTalkSproutInsufficient('tarot', sproutBalance);
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
      <div className="flex justify-center" style={{ backgroundColor: '#f7f8f9', minHeight: '100vh' }}>
        <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ paddingBottom: '80px' }}>
          <div className="flex flex-col items-center" style={{ padding: '40px 20px', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>💭</div>
            <p style={{ fontFamily: F, fontSize: '18px', fontWeight: 600, color: C.black, textAlign: 'center', letterSpacing: '-0.36px' }}>
              나보다 나를 더 잘 아는{'\n'}AI 친구
            </p>
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: C.gray700, textAlign: 'center', lineHeight: '22px' }}>
              로그인하고 마음 친구를 만나보세요
            </p>
            <button
              onClick={() => { trackMindTalkLoginClick(); navigate('/login'); }}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '200px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: C.primary,
                border: 'none',
                marginTop: '4px',
                transition: 'transform 0.1s ease',
              }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 500, color: C.white, letterSpacing: '-0.3px' }}>
                마음 친구 만나기
              </span>
            </button>
          </div>
          <BottomTabBar />
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
  const showStaticSuggestions = messages.length === 0 && !sending && !loadingConv && mode !== 'general';
  const showAiSuggestions = aiSuggestions.length > 0 && !sending && !streaming;
  // 캐시가 아직 로드되지 않은 상태(-1)에서는 배지 숨김 (깜빡임 방지)
  const cacheKey = mode as 'saju' | 'tarot';
  const freeBadgeReady = isPaidMode && dailyFreeCacheRef.current[cacheKey] >= 0;

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
            {freeBadgeReady && (
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
                  {remainingFree > 0 ? `하루 ${remainingFree}회 무료` : `${SPROUT_COST}새싹/회`}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (sending) return;
              setRound(prev => {
                const next = prev + 1;
                sessionStorage.setItem('mind_talk_round', String(next));
                sessionStorage.setItem('mind_talk_round_date', new Date().toISOString().slice(0, 10));
                return next;
              });
            }}
            disabled={sending}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.4 : 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gray600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6" /><path d="M21.34 15.57a10 10 0 1 1-.57-8.38L21.5 8" />
            </svg>
          </button>
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
          className="flex-1 w-full"
          style={{ padding: '16px 20px 16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0 }}
        >
          {/* 로딩 */}
          {loadingConv && (
            <div className="flex justify-center" style={{ padding: '40px 0' }}>
              <div className="animate-spin rounded-full" style={{ width: 24, height: 24, border: `2px solid ${C.gray100}`, borderTopColor: C.primary }} />
            </div>
          )}

          {/* 오프닝: 마음이 인사 메시지 */}
          {messages.length === 0 && !sending && !loadingConv && (
            <div className="flex justify-start" style={{ marginBottom: 16 }}>
              <div className="shrink-0 flex items-end" style={{ marginRight: 8 }}>
                <AiAvatar />
              </div>
              <div
                className="transform-gpu"
                style={{
                  maxWidth: '78%', padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4,
                  backgroundColor: C.white, border: `1px solid ${C.gray100}`,
                }}
              >
                <p style={{
                  fontFamily: F, fontSize: '15px', fontWeight: 400, lineHeight: '23px',
                  letterSpacing: '-0.3px', color: C.black, whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {GREETINGS[mode]}
                </p>
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <MessageBubble msg={msg} />
              {/* 타로 모드: AI가 카드 뽑기 유도 시 인라인 CTA */}
              {mode === 'tarot' && msg.role === 'assistant' && idx === messages.length - 1
                && !sending && !showTarotDraw && suggestsCardDraw(msg.content)
                && (
                  <TarotDrawCTA onClick={handleTarotDraw} />
                )}
            </div>
          ))}

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
                  {renderBoldText(streaming)}
                </p>
              </div>
            </div>
          )}

          {sending && !streaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── 질문 슬라이드 (입력창 바로 위): 정적(초기) + 동적(AI 추천) ── */}
        {(showStaticSuggestions || showAiSuggestions) && (() => {
          const items = showAiSuggestions ? aiSuggestions : SUGGESTIONS[mode];
          return (
            <div
              ref={suggestionsRef}
              className="shrink-0 flex overflow-x-auto scrollbar-hide"
              style={{
                gap: 10, paddingTop: 10, paddingBottom: 10,
                scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x', cursor: 'grab',
                backgroundColor: C.white, borderTop: `1px solid ${C.gray100}`,
                scrollPaddingLeft: 16, scrollPaddingRight: 16,
              }}
              onMouseDown={e => {
                const el = suggestionsRef.current;
                if (!el) return;
                dragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
                el.style.cursor = 'grabbing';
              }}
              onMouseMove={e => {
                if (!dragState.current.isDown) return;
                e.preventDefault();
                const el = suggestionsRef.current!;
                const x = e.pageX - el.offsetLeft;
                el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
              }}
              onMouseUp={() => { dragState.current.isDown = false; if (suggestionsRef.current) suggestionsRef.current.style.cursor = 'grab'; }}
              onMouseLeave={() => { dragState.current.isDown = false; if (suggestionsRef.current) suggestionsRef.current.style.cursor = 'grab'; }}
            >
              {items.map((s, i) => (
                <button
                  key={`${showAiSuggestions ? 'ai' : 'static'}-${i}`}
                  onClick={() => { trackMindTalkMessageSend(mode, round, true, needsSprout); sendMessage(s); }}
                  className="shrink-0 flex items-center transform-gpu"
                  style={{
                    padding: '10px 18px', borderRadius: 20,
                    backgroundColor: C.white, border: `1px solid ${C.gray100}`,
                    cursor: 'pointer', transition: 'transform 0.1s ease',
                    scrollSnapAlign: 'start',
                    WebkitTapHighlightColor: 'transparent',
                    marginLeft: i === 0 ? 16 : undefined,
                    marginRight: i === items.length - 1 ? 16 : undefined,
                  }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{
                    fontFamily: F, fontSize: '14px', fontWeight: 500, lineHeight: '20px',
                    letterSpacing: '-0.28px', color: C.black, whiteSpace: 'nowrap',
                  }}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
          );
        })()}

        {/* ── Input Area ── */}
        <div className="shrink-0 w-full" style={{ padding: '10px 16px', borderTop: `1px solid ${C.gray100}`, backgroundColor: C.white }}>
          <div className="flex items-end" style={{ gap: 8 }}>
            {/* 타로 카드 뽑기 버튼 */}
            {mode === 'tarot' && messages.length > 0 && (
              <button
                onClick={handleTarotDraw}
                disabled={sending}
                className="shrink-0 flex items-center justify-center transform-gpu"
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'linear-gradient(145deg, #f5f0ff 0%, #ede5ff 100%)',
                  border: `1.5px solid ${C.purpleBorder}`,
                  boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
                  cursor: sending ? 'default' : 'pointer',
                  transition: 'transform 0.1s ease',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: sending ? 0.5 : 1,
                }}
                onPointerDown={e => { if (!sending) e.currentTarget.style.transform = 'scale(0.93)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {/* 카드 뒷면 */}
                  <rect x="4.5" y="1.5" width="15" height="21" rx="2.5" fill="#8B5CF6" fillOpacity="0.12" stroke={C.purple} strokeWidth="1.4" />
                  {/* 별 문양 */}
                  <path d="M12 7l1.18 2.39 2.64.38-1.91 1.86.45 2.63L12 13.13l-2.36 1.13.45-2.63-1.91-1.86 2.64-.38L12 7z" fill={C.purple} fillOpacity="0.85" />
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
