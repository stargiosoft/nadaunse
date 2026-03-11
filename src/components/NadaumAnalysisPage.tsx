import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { supabase, getAuthUser } from '../lib/supabase';
import { getManseData } from '../lib/manseService';
import { projectId } from '../utils/supabase/info';
import BottomTabBar from './BottomTabBar';
import SEO from './SEO';
import { getZodiacImageUrl } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';

const font = "'Pretendard Variable', sans-serif";

// ─── Design Tokens (★DESIGN_SYSTEM★.md 기준) ────────────────────────────────

const C = {
  primary: '#48b2af',
  primaryAccent: '#41a09e',
  primaryLight: '#f0f8f8',
  primaryDark: '#368683',
  primaryPressed: '#389998',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  cardBg: '#ffffff',
  cardBorder: '#f3f3f3',
  divider: '#f3f3f3',
  white: '#ffffff',
  lockBg: '#f9f9f9',
  // Analysis card colors
  love: '#ef6878',
  loveBg: '#fff6f7',
  money: '#f5a623',
  moneyBg: '#fff9f0',
  career: '#4590d6',
  careerBg: '#f0f6ff',
  nature: '#41a09e',
  natureBg: '#f0f8f8',
  health: '#8b5cf6',
  healthBg: '#f5f3ff',
} as const;

// ─── 오행 (Five Elements) ────────────────────────────────────────────────────

// 한글 키 + 한자 키 모두 매핑 (만세력 API는 한자 키로 반환)
const OHENG_ELEMENTS = [
  { kr: '목', hanja: '木', color: '#22c55e', name: '목(木)' },
  { kr: '화', hanja: '火', color: '#ef4444', name: '화(火)' },
  { kr: '토', hanja: '土', color: '#a16207', name: '토(土)' },
  { kr: '금', hanja: '金', color: '#6b7280', name: '금(金)' },
  { kr: '수', hanja: '水', color: '#3b82f6', name: '수(水)' },
] as const;

// ─── AI 분석 캐시 ──────────────────────────────────────────────────────────

const DNA_CACHE_KEY = 'nadaum_dna_v1';

function getCachedAnalysis(userId: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(`${DNA_CACHE_KEY}_${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.cached_at > 7 * 24 * 60 * 60 * 1000) return null;
    return cached.radar as Record<string, number>;
  } catch { return null; }
}

function getCachedAnalysisTagCount(userId: string): number {
  try {
    const raw = localStorage.getItem(`${DNA_CACHE_KEY}_${userId}`);
    if (!raw) return 0;
    return JSON.parse(raw).tag_count || 0;
  } catch { return 0; }
}

function clearAnalysisCache(userId: string) {
  try { localStorage.removeItem(`${DNA_CACHE_KEY}_${userId}`); } catch { /* ignore */ }
}

function setCachedAnalysis(userId: string, tagCount: number, radar: Record<string, number>) {
  try {
    localStorage.setItem(`${DNA_CACHE_KEY}_${userId}`, JSON.stringify({
      tag_count: tagCount, radar, cached_at: Date.now(),
    }));
  } catch { /* ignore */ }
}

async function fetchAiAnalysis(accessToken: string): Promise<Record<string, number> | null> {
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/analyze-nadaum-dna`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data.radar;
  } catch { return null; }
}

// 발달오행 데이터를 OhengData[]로 변환 (한글/한자 키 모두 지원)
function parseOhengData(baldal: Record<string, number>): OhengData[] {
  const result: OhengData[] = [];
  for (const el of OHENG_ELEMENTS) {
    // 한자 키 우선, 없으면 한글 키
    const value = baldal[el.hanja] ?? baldal[el.kr];
    if (typeof value === 'number' && value > 0) {
      result.push({ name: el.name, value, color: el.color, label: el.kr });
    }
  }
  return result;
}

interface OhengData {
  name: string;
  value: number;
  color: string;
  label: string;
}

// ─── 나다움 유형 카드 ───────────────────────────────────────────────────────

interface NadaumType {
  title: string;
  subtitle: string;
  emoji: string;
  quote: string;
}

function computeNadaumType(radarData: { category: string; count: number }[]): NadaumType {
  // 6축: 실행력, 사고력, 감성, 관계, 의지력, 안정감
  const map = new Map(radarData.map(d => [d.category, d.count]));
  const get = (k: string) => map.get(k) || 0;
  // AI 점수(0~100) vs 룰베이스 카운트(0~10) 자동 감지
  const maxVal = Math.max(...radarData.map(d => d.count));
  const threshold = maxVal > 10 ? 50 : 3;

  // 축1: 실행력 vs 사고력 → 행동파/분석파
  const axis1 = get('실행력') >= get('사고력') ? '행동파' : '분석파';
  // 축2: 감성 vs 안정감 → 감성형/이성형
  const axis2 = get('감성') >= get('안정감') ? '감성형' : '이성형';
  // 축3: 관계 → 높으면 사교적, 낮으면 독립적
  const axis3 = get('관계') >= threshold ? '사교적' : '독립적';
  // 축4: 의지력 → 높으면 꾸준한, 낮으면 유연한
  const axis4 = get('의지력') >= threshold ? '꾸준한' : '유연한';

  // 유형명 조합: 감성형 + 행동파 = 메인 타이틀
  const typeMap: Record<string, NadaumType> = {
    '감성형_행동파_사교적_꾸준한': { title: '열정적 리더', subtitle: '감성과 실행력을 겸비한 사람', emoji: '🔥', quote: '세상을 바꾸는 건 논리가 아니라 당신의 열정입니다' },
    '감성형_행동파_사교적_유연한': { title: '자유로운 무드메이커', subtitle: '분위기를 이끄는 에너자이저', emoji: '🎉', quote: '당신이 있는 곳이 곧 축제입니다' },
    '감성형_행동파_독립적_꾸준한': { title: '묵묵한 열정가', subtitle: '자기 길을 꿋꿋이 가는 사람', emoji: '🌋', quote: '조용하지만 누구보다 뜨거운 사람, 그게 당신이에요' },
    '감성형_행동파_독립적_유연한': { title: '감각적 모험가', subtitle: '느낌대로 움직이는 자유영혼', emoji: '🦋', quote: '느낌이 맞으면 바로 움직이는 게 당신의 매력' },
    '감성형_분석파_사교적_꾸준한': { title: '다정한 전략가', subtitle: '따뜻한 마음에 냉철한 머리', emoji: '🧠', quote: '따뜻한 마음에 냉철한 머리, 최강의 조합이에요' },
    '감성형_분석파_사교적_유연한': { title: '공감형 탐험가', subtitle: '사람과 세상을 깊이 이해하는', emoji: '🌊', quote: '사람의 마음을 읽는 게 당신의 초능력이에요' },
    '감성형_분석파_독립적_꾸준한': { title: '깊은 사색가', subtitle: '풍부한 내면을 가진 사람', emoji: '🌙', quote: '깊이 있는 사람은 쉽게 흔들리지 않아요' },
    '감성형_분석파_독립적_유연한': { title: '감성적 몽상가', subtitle: '상상력이 풍부한 예술형', emoji: '🎨', quote: '상상이 현실이 되는 순간을 아는 사람' },
    '이성형_행동파_사교적_꾸준한': { title: '믿음직한 실행자', subtitle: '약속은 반드시 지키는 사람', emoji: '🏔️', quote: '당신의 한마디면 모두가 안심합니다' },
    '이성형_행동파_사교적_유연한': { title: '사교적 해결사', subtitle: '어디서든 적응하는 만능형', emoji: '⚡', quote: '어떤 자리든 빛나는 만능 해결사, 못 하는 게 뭐예요?' },
    '이성형_행동파_독립적_꾸준한': { title: '철두철미 추진가', subtitle: '목표를 향해 흔들림 없이', emoji: '🎯', quote: '목표가 생기면 흔들림 없이 직진하는 사람' },
    '이성형_행동파_독립적_유연한': { title: '쿨한 실용주의자', subtitle: '효율을 추구하는 현실파', emoji: '💎', quote: '복잡한 건 딱 질색, 효율이 곧 정의' },
    '이성형_분석파_사교적_꾸준한': { title: '신뢰의 조언자', subtitle: '논리와 배려를 겸비한 참모형', emoji: '🦉', quote: '모두가 당신에게 먼저 물어보는 이유가 있어요' },
    '이성형_분석파_사교적_유연한': { title: '유연한 중재자', subtitle: '갈등을 풀어내는 소통 전문가', emoji: '🤝', quote: '갈등 속에서 답을 찾아내는 소통의 달인' },
    '이성형_분석파_독립적_꾸준한': { title: '냉철한 전문가', subtitle: '깊이 파고드는 장인 기질', emoji: '🔬', quote: '한 분야를 파고드는 프로의 눈빛, 그게 당신이에요' },
    '이성형_분석파_독립적_유연한': { title: '자유로운 분석가', subtitle: '통찰력 있는 관찰자', emoji: '🔭', quote: '세상을 관찰하는 것 자체가 즐거운 사람' },
  };

  const key = `${axis2}_${axis1}_${axis3}_${axis4}`;
  return typeMap[key] || { title: '성장하는 나', subtitle: '태그를 더 모으면 유형이 선명해져요', emoji: '✨', quote: '모든 경험이 나를 만들어가는 중이에요' };
}

// ─── Tag Category Mapping ───────────────────────────────────────────────────

interface CategoryMap {
  label: string;
  keywords: string[];
}

const TAG_CATEGORIES: CategoryMap[] = [
  {
    label: '실행력',
    keywords: ['추진력', '도전', '적극', '결단', '행동', '실천', '진취', '주도', '과감', '대범'],
  },
  {
    label: '사고력',
    keywords: ['분석', '논리', '전략', '통찰', '지적', '지혜', '탐구', '관찰', '냉철', '사려'],
  },
  {
    label: '감성',
    keywords: ['감성', '감수성', '섬세', '공감', '따뜻', '다정', '포근', '온화', '감정', '깊은'],
  },
  {
    label: '관계',
    keywords: ['사교', '배려', '친화', '소통', '친근', '협력', '포용', '이해심', '친절', '헌신'],
  },
  {
    label: '의지력',
    keywords: ['끈기', '인내', '꾸준', '집중', '묵묵', '뚝심', '견디', '굳건', '일관', '우직'],
  },
  {
    label: '안정감',
    keywords: ['차분', '신중', '균형', '현실', '안정', '절제', '침착', '담담', '조심', '신뢰'],
  },
];

function categorizeTag(tagName: string): number {
  for (let i = 0; i < TAG_CATEGORIES.length; i++) {
    if (TAG_CATEGORIES[i].keywords.some((kw) => tagName.includes(kw))) {
      return i;
    }
  }
  return -1;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SajuRecord {
  id: string;
  full_name: string;
  gender: string;
  birth_date: string;
  birth_time: string;
  calendar_type: string;
  zodiac: string;
  is_primary: boolean;
}

interface TraitTag {
  tag_name: string;
  tag_type: string;
  is_confirmed: boolean;
}

interface AnalysisCard {
  key: string;
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagRequired: number; // 태그 N개 모으면 해금
  description: string;
}

const ANALYSIS_CARDS: AnalysisCard[] = [
  { key: 'nature', title: '기질·성격', emoji: '🧬', color: C.nature, bgColor: C.natureBg, tagRequired: 5, description: '타고난 기질과 성격 심층 분석' },
  { key: 'career', title: '직업·적성', emoji: '💼', color: C.career, bgColor: C.careerBg, tagRequired: 10, description: '적성에 맞는 진로와 업무 스타일' },
  { key: 'health', title: '건강·체질', emoji: '🏥', color: C.health, bgColor: C.healthBg, tagRequired: 15, description: '사주로 보는 체질과 건강 관리법' },
  { key: 'love', title: '연애·궁합', emoji: '💕', color: C.love, bgColor: C.loveBg, tagRequired: 20, description: '나의 연애 성향과 이상형, 궁합 분석' },
  { key: 'money', title: '재물·금전', emoji: '💰', color: C.money, bgColor: C.moneyBg, tagRequired: 25, description: '나의 재물운과 금전 관리 성향' },
];

// ─── Insight Generators ─────────────────────────────────────────────────────

const RADAR_INSIGHTS: Record<string, string> = {
  '실행력': '생각보다 행동이 먼저! 망설이지 않는 실행의 아이콘',
  '사고력': '분석과 판단력이 탁월한 전략형 두뇌의 소유자',
  '감성': '감정이 풍부하고 공감 능력이 남다른 사람',
  '관계': '사람과의 연결에서 에너지를 얻는 관계 중심형',
  '의지력': '한번 시작하면 끝까지! 꺾이지 않는 마음의 소유자',
  '안정감': '어디서든 중심을 잡는 든든한 안정형',
};

function getRadarInsight(radarData: { category: string; count: number }[]): string {
  const sorted = [...radarData].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  if (!top || top.count === 0) return '';
  return RADAR_INSIGHTS[top.category] || '';
}

function getRadarTopCategory(radarData: { category: string; count: number }[]): string {
  const sorted = [...radarData].sort((a, b) => b.count - a.count);
  return sorted[0]?.category || '';
}

function getBalanceInsight(passionPct: number): string {
  if (passionPct >= 80) return '불꽃 같은 열정파! 감정과 행동이 먼저인 당신, 주변을 뜨겁게 달궈요';
  if (passionPct >= 60) return '열정이 앞서지만 냉철함도 갖춘 타입 — 뜨거운 가슴에 차가운 머리!';
  if (passionPct >= 40) return '열정과 냉정이 절묘하게 공존하는 밸런스형, 상황에 따라 자유자재';
  if (passionPct >= 20) return '이성적이고 침착한 판단가, 감정에 흔들리지 않는 단단한 사람';
  return '얼음 같은 냉정함의 소유자, 흔들림 없는 판단력이 최고 무기';
}

const OHENG_INSIGHTS: Record<string, string> = {
  '목': '성장과 창의의 에너지! 새로운 시작에 강해요',
  '화': '열정과 표현의 에너지! 주목받는 카리스마의 원천',
  '토': '안정과 신뢰의 에너지! 어디서든 중심을 잡아요',
  '금': '결단과 정의의 에너지! 날카로운 판단력의 소유자',
  '수': '지혜와 유연함의 에너지! 흐름을 읽는 통찰력',
};

function getOhengInsight(data: OhengData[]): string {
  if (data.length === 0) return '';
  const top = data.reduce((a, b) => (a.value > b.value ? a : b));
  return `${top.name} 에너지가 ${top.value}%로 가장 강해요 — ${OHENG_INSIGHTS[top.label] || ''}`;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function NadaumSkeleton() {
  return (
    <div className="flex flex-col" style={{ padding: '20px', gap: '12px' }}>
      {/* Header */}
      <div className="animate-pulse" style={{ height: '56px', backgroundColor: '#f0f0f0', borderRadius: '12px' }} />
      {/* Profile Card */}
      <div className="animate-pulse" style={{ height: '100px', backgroundColor: '#f0f0f0', borderRadius: '16px' }} />
      {/* DNA Card */}
      <div className="animate-pulse" style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '16px' }} />
      {/* Balance Card */}
      <div className="animate-pulse" style={{ height: '120px', backgroundColor: '#f0f0f0', borderRadius: '16px' }} />
      {/* Type Card */}
      <div className="animate-pulse" style={{ height: '160px', backgroundColor: '#f0f0f0', borderRadius: '16px' }} />
    </div>
  );
}

// ─── Radar Chart Custom Tick ────────────────────────────────────────────────

function CustomAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontFamily: font,
        fontSize: '11px',
        fontWeight: 500,
        fill: C.gray700,
      }}
    >
      {payload?.value}
    </text>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NadaumAnalysisPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [saju, setSaju] = useState<SajuRecord | null>(null);
  const [tags, setTags] = useState<TraitTag[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ohengData, setOhengData] = useState<OhengData[]>([]);
  const [aiScores, setAiScores] = useState<Record<string, number> | null>(null);
  const [lastAnalyzedTagCount, setLastAnalyzedTagCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await getAuthUser();
        if (!user) {
          if (!cancelled) {
            setIsLoggedIn(false);
            setIsLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setIsLoggedIn(true);
          setUserId(user.id);
          setLastAnalyzedTagCount(getCachedAnalysisTagCount(user.id));
        }

        // Parallel fetch
        const [sajuRes, tagsRes] = await Promise.all([
          supabase
            .from('saju_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single(),
          supabase
            .from('user_trait_tags')
            .select('tag_name, tag_type, is_confirmed')
            .eq('user_id', user.id)
            .eq('is_confirmed', true),
        ]);

        // 오행 데이터도 여기서 가져오기
        let oheng: OhengData[] = [];
        if (sajuRes.data) {
          try {
            console.log('[나다움] 만세력 요청 시작...');
            const manseResult = await getManseData({
              id: sajuRes.data.id,
              birth_date: sajuRes.data.birth_date,
              birth_time: sajuRes.data.birth_time,
              gender: sajuRes.data.gender,
              calendar_type: sajuRes.data.calendar_type,
            });
            console.log('[나다움] 만세력 결과:', manseResult.success, manseResult.success ? '키:' + Object.keys(manseResult.data).length : ('에러:' + (manseResult as { error: string }).error));
            if (manseResult.success) {
              const baldal = manseResult.data['발달오행'] as Record<string, number> | undefined;
              console.log('[나다움] 발달오행:', baldal);
              if (baldal) {
                oheng = parseOhengData(baldal);
                console.log('[나다움] 파싱된 오행:', oheng.length, '개');
              }
            }
          } catch (err) {
            console.error('[나다움] 만세력 에러:', err);
          }
        } else {
          console.log('[나다움] saju 데이터 없음, 오행 스킵');
        }

        // ── AI DNA 분석 (태그 5개 이상일 때) ──
        let aiRadar: Record<string, number> | null = null;
        if (tagsRes.data && tagsRes.data.length >= 5) {
          const cached = getCachedAnalysis(user.id);
          if (cached) {
            aiRadar = cached;
            console.log('[나다움] AI 분석 캐시 히트');
          } else {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                aiRadar = await fetchAiAnalysis(session.access_token);
                if (aiRadar) {
                  setCachedAnalysis(user.id, tagsRes.data.length, aiRadar);
                  console.log('[나다움] AI 분석 완료:', aiRadar);
                }
              }
            } catch (err) {
              console.error('[나다움] AI 분석 에러:', err);
            }
          }
        }

        if (!cancelled) {
          if (sajuRes.data) setSaju(sajuRes.data);
          if (tagsRes.data) setTags(tagsRes.data);
          if (aiRadar) setAiScores(aiRadar);
          if (oheng.length > 0) setOhengData(oheng);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Compute radar data
  const confirmedCount = tags.length;
  const isUnlocked = confirmedCount >= 5;

  // 다시 분석하기 (태그 5개 이상 증가 시)
  const canRefresh = isUnlocked && lastAnalyzedTagCount > 0 && (confirmedCount - lastAnalyzedTagCount >= 5);

  async function handleRefresh() {
    if (!userId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      clearAnalysisCache(userId);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const newRadar = await fetchAiAnalysis(session.access_token);
        if (newRadar) {
          setAiScores(newRadar);
          setCachedAnalysis(userId, confirmedCount, newRadar);
          setLastAnalyzedTagCount(confirmedCount);
        }
      }
    } catch (err) {
      console.error('[나다움] 다시 분석 에러:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const radarData = useMemo(() => {
    // AI 점수가 있으면 우선 사용
    if (aiScores) {
      const axes = ['실행력', '사고력', '감성', '관계', '의지력', '안정감'];
      return axes.map(axis => ({
        category: axis,
        value: aiScores[axis] || 0,
        count: aiScores[axis] || 0,
      }));
    }
    // Fallback: 룰베이스 (AI 실패 시)
    const counts = new Array(TAG_CATEGORIES.length).fill(0);
    for (const tag of tags) {
      const idx = categorizeTag(tag.tag_name);
      if (idx >= 0) counts[idx]++;
    }
    const max = Math.max(...counts, 1);
    return TAG_CATEGORIES.map((cat, i) => ({
      category: cat.label,
      value: Math.round((counts[i] / max) * 100),
      count: counts[i],
    }));
  }, [tags, aiScores]);

  // 나다움 유형
  const nadaumType = useMemo(() => {
    return computeNadaumType(radarData);
  }, [radarData]);

  // Top tags
  const topPositive = useMemo(() => {
    const positives = tags.filter((t) => t.tag_type === 'positive');
    const freq = new Map<string, number>();
    for (const t of positives) freq.set(t.tag_name, (freq.get(t.tag_name) || 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
  }, [tags]);

  const topNegative = useMemo(() => {
    const negatives = tags.filter((t) => t.tag_type === 'negative');
    const freq = new Map<string, number>();
    for (const t of negatives) freq.set(t.tag_name, (freq.get(t.tag_name) || 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  }, [tags]);

  // 열정 / 냉정 밸런스 (레이더 기반)
  // 열정축: 실행력 + 감성 + 관계 | 냉정축: 사고력 + 의지력 + 안정감
  const { passionScore, coolScore, passionPercent } = useMemo(() => {
    const map = new Map(radarData.map(d => [d.category, d.count]));
    const passion = (map.get('실행력') || 0) + (map.get('감성') || 0) + (map.get('관계') || 0);
    const cool = (map.get('사고력') || 0) + (map.get('의지력') || 0) + (map.get('안정감') || 0);
    const total = passion + cool || 1;
    return { passionScore: passion, coolScore: cool, passionPercent: Math.round((passion / total) * 100) };
  }, [radarData]);

  // Format birth date
  const birthText = useMemo(() => {
    if (!saju) return '';
    const d = new Date(saju.birth_date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const cal = saju.calendar_type === 'lunar' ? '음력' : '양력';
    const gen = saju.gender === 'male' ? '남' : '여';
    return `${cal} ${yyyy}.${mm}.${dd} · ${gen}`;
  }, [saju]);

  // Zodiac
  const zodiacText = useMemo(() => {
    if (!saju) return '';
    if (saju.zodiac) return saju.zodiac;
    try {
      // getChineseZodiacByLichun expects (birthDate: string, birthTime?: string)
      const dateStr = typeof saju.birth_date === 'string'
        ? saju.birth_date
        : new Date(saju.birth_date).toISOString().split('T')[0];
      return getChineseZodiacByLichun(dateStr, saju.birth_time) || '';
    } catch {
      return '';
    }
  }, [saju]);

  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
        <div className="w-full max-w-[440px] relative" style={{ paddingBottom: '80px' }}>
          <NadaumSkeleton />
          <BottomTabBar />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex justify-center" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
        <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ paddingBottom: '80px' }}>
          <SEO title="나다움 분석 | 나다운세" description="나만의 성향 분석 리포트" />
          <div className="flex flex-col items-center" style={{ padding: '40px 20px', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>🔮</div>
            <p style={{ fontFamily: font, fontSize: '18px', fontWeight: 600, color: C.black, textAlign: 'center', letterSpacing: '-0.36px' }}>
              나다움 분석
            </p>
            <p style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, color: C.gray700, textAlign: 'center', lineHeight: '22px' }}>
              당신의 숨겨진 성격 DNA,{'\n'}운세를 볼수록 정확해져요
            </p>
            <button
              onClick={() => navigate('/login')}
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
              <span style={{ fontFamily: font, fontSize: '15px', fontWeight: 500, color: C.white, letterSpacing: '-0.3px' }}>
                로그인하기
              </span>
            </button>
          </div>
          <BottomTabBar />
        </div>
      </div>
    );
  }

  // ─── Card wrapper style ──────────────────────────────────────────────────
  const cardStyle = {
    backgroundColor: C.cardBg,
    borderRadius: '16px',
    border: `1px solid ${C.cardBorder}`,
  };

  return (
    <div className="flex justify-center" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <div className="w-full max-w-[440px] relative" style={{ paddingBottom: '80px' }}>
        <SEO title="나다움 분석 | 나다운세" description="나만의 성향 분석 리포트" />

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div style={{ padding: '16px 20px 12px' }}>
          <p style={{ fontFamily: font, fontSize: '22px', fontWeight: 600, lineHeight: '32.5px', letterSpacing: '-0.22px', color: C.black }}>
            나다움 분석
          </p>
          <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 400, lineHeight: '20px', color: C.gray600, marginTop: '4px' }}>
            나다움 태그를 모을수록 선명해지는 성격 DNA
          </p>
        </div>

        {/* ─── Profile Card ───────────────────────────────────────── */}
        {saju && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ margin: '0 20px 12px', padding: '20px', ...cardStyle }}
          >
            <div className="flex items-center gap-3">
              {/* Zodiac Image */}
              {zodiacText && (
                <div
                  className="flex items-center justify-center shrink-0 overflow-hidden rounded-full transform-gpu"
                  style={{ width: '48px', height: '48px', backgroundColor: C.primaryLight }}
                >
                  <img
                    src={getZodiacImageUrl(zodiacText)}
                    alt={zodiacText}
                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex flex-col" style={{ gap: '2px' }}>
                <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black, letterSpacing: '-0.32px' }}>
                  {saju.full_name}
                </p>
                <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 400, color: C.gray600, letterSpacing: '-0.26px' }}>
                  {birthText} {zodiacText && `· ${zodiacText}띠`}
                </p>
              </div>
            </div>

            {/* Tag Count Badge */}
            <div className="flex items-center gap-2" style={{ marginTop: '16px' }}>
              <div
                className="flex items-center"
                style={{ padding: '4px 10px', backgroundColor: C.primaryLight, borderRadius: '20px' }}
              >
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.primaryDark, letterSpacing: '-0.24px' }}>
                  나다움 태그 {confirmedCount}개
                </span>
              </div>
              {!isUnlocked ? (
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600 }}>
                  {5 - confirmedCount}개 더 모으면 분석이 열려요!
                </span>
              ) : (() => {
                const nextMilestone = lastAnalyzedTagCount > 0
                  ? lastAnalyzedTagCount + 5
                  : Math.ceil(confirmedCount / 5) * 5 + 5;
                const remaining = nextMilestone - confirmedCount;
                return remaining > 0 ? (
                  <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600 }}>
                    {remaining}개 더 모으면 다시 분석!
                  </span>
                ) : null;
              })()}
            </div>

            {/* Progress Bar (if locked) */}
            {!isUnlocked && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ height: '6px', backgroundColor: C.divider, borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((confirmedCount / 5) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', backgroundColor: C.primary, borderRadius: '3px' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Radar Chart (나다움 DNA) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ margin: '0 20px 12px', padding: '20px 16px', ...cardStyle }}
        >
          <div className="flex items-center justify-between" style={{ padding: '0 4px' }}>
            <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black, letterSpacing: '-0.32px' }}>
              나다움 DNA
            </p>
            {!isUnlocked ? (
              <div className="flex items-center gap-1" style={{ padding: '3px 8px', backgroundColor: C.lockBg, borderRadius: '8px' }}>
                <span style={{ fontSize: '11px' }}>🔒</span>
                <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 400, color: C.gray600 }}>
                  태그 5개 필요
                </span>
              </div>
            ) : canRefresh ? (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 cursor-pointer"
                style={{
                  padding: '4px 10px',
                  backgroundColor: C.primaryLight,
                  borderRadius: '10px',
                  border: 'none',
                  opacity: isRefreshing ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: '11px' }}>{isRefreshing ? '...' : '🔄'}</span>
                <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 500, color: C.primaryDark }}>
                  {isRefreshing ? '분석 중' : '다시 분석'}
                </span>
              </button>
            ) : null}
          </div>

          {isUnlocked ? (
            <>
              <div style={{ width: '100%', height: '260px', marginTop: '4px' }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={C.gray200} strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="category" tick={<CustomAxisTick />} />
                    <Radar
                      dataKey="value"
                      stroke={C.primary}
                      fill={C.primary}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Tags (한 줄) */}
              {(topPositive.length > 0 || topNegative.length > 0) && (
                <div className="flex flex-wrap gap-2 overflow-hidden" style={{ marginTop: '8px', padding: '0 4px', maxHeight: '30px' }}>
                  {topPositive.map((tag) => (
                    <span
                      key={tag}
                      className="shrink-0"
                      style={{
                        fontFamily: font,
                        fontSize: '13px',
                        fontWeight: 400,
                        color: C.primaryDark,
                        backgroundColor: C.primaryLight,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        letterSpacing: '-0.26px',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {topNegative.map((tag) => (
                    <span
                      key={tag}
                      className="shrink-0"
                      style={{
                        fontFamily: font,
                        fontSize: '13px',
                        fontWeight: 400,
                        color: '#9b6d6d',
                        backgroundColor: '#fdf5f5',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        letterSpacing: '-0.26px',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Radar Insight */}
              {getRadarInsight(radarData) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: C.primaryLight,
                    borderRadius: '12px',
                    borderLeft: `3px solid ${C.primaryAccent}`,
                  }}
                >
                  <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primaryDark, lineHeight: '20px', letterSpacing: '-0.26px' }}>
                    <span style={{ fontWeight: 600 }}>{getRadarTopCategory(radarData)}</span>이 가장 높아요 — {getRadarInsight(radarData)}
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            /* Locked State */
            <div className="flex flex-col items-center justify-center" style={{ height: '200px' }}>
              <div style={{ fontSize: '40px', opacity: 0.4 }}>📊</div>
              <p style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, color: C.gray600, textAlign: 'center', marginTop: '12px', lineHeight: '22px' }}>
                운세를 {5 - confirmedCount}번만 더 보면{'\n'}나만의 성격 DNA가 공개돼요
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '16px',
                  backgroundColor: C.primaryLight,
                  border: 'none',
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary, letterSpacing: '-0.26px' }}>
                  운세 보러가기
                </span>
              </button>
            </div>
          )}
        </motion.div>

        {/* ─── Balance Bar (열정/냉정 밸런스) ──────────────────────── */}
        {isUnlocked && (passionScore > 0 || coolScore > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ margin: '0 20px 12px', padding: '20px', ...cardStyle }}
          >
            <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black, letterSpacing: '-0.32px' }}>
              성향 밸런스
            </p>
            {/* Labels above bar */}
            <div className="flex items-center justify-between" style={{ marginTop: '16px', marginBottom: '8px' }}>
              <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#ef6878', letterSpacing: '-0.26px' }}>
                🔥 열정 {passionPercent}%
              </span>
              <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#4590d6', letterSpacing: '-0.26px' }}>
                🧊 냉정 {100 - passionPercent}%
              </span>
            </div>
            {/* Bar */}
            <div className="flex items-center" style={{ height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${passionPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef6878 0%, #f5a623 100%)',
                  borderRadius: passionPercent === 100 ? '12px' : '12px 0 0 12px',
                }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - passionPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #60a5fa 0%, #4590d6 100%)',
                  borderRadius: passionPercent === 0 ? '12px' : '0 12px 12px 0',
                }}
              />
            </div>
            {/* Balance Insight */}
            <p style={{
              fontFamily: font,
              fontSize: '12px',
              fontWeight: 400,
              color: C.gray600,
              marginTop: '14px',
              lineHeight: '18px',
              textAlign: 'center',
              letterSpacing: '-0.24px',
            }}>
              {getBalanceInsight(passionPercent)}
            </p>
          </motion.div>
        )}

        {/* ─── 나다움 유형 카드 ───────────────────────────────────── */}
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            style={{ margin: '0 20px 12px', overflow: 'hidden', ...cardStyle }}
          >
            {/* Gradient Result Card */}
            <div
              style={{
                margin: '12px',
                padding: '28px 24px 24px',
                background: 'linear-gradient(135deg, #e8f5f4 0%, #f0f8f8 40%, #f5f0ff 100%)',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35, type: 'spring', stiffness: 200 }}
                style={{ fontSize: '48px', marginBottom: '12px' }}
              >
                {nadaumType.emoji}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ fontFamily: font, fontSize: '22px', fontWeight: 700, color: C.black, letterSpacing: '-0.44px' }}
              >
                {nadaumType.title}
              </motion.p>
              <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 400, color: C.gray700, marginTop: '6px', letterSpacing: '-0.26px' }}>
                {nadaumType.subtitle}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── 오행 에너지 분포 ──────────────────────────────────── */}
        {isUnlocked && ohengData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{ margin: '0 20px 12px', padding: '20px 16px', ...cardStyle }}
          >
            <div style={{ padding: '0 4px' }}>
              <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black, marginBottom: '4px', letterSpacing: '-0.32px' }}>
                오행 에너지 분포
              </p>
              <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600, marginBottom: '16px', letterSpacing: '-0.24px' }}>
                사주 만세력 기반 타고난 에너지 비율
              </p>
            </div>
            {/* 오행 수평 바 차트 */}
            <div className="flex flex-col" style={{ gap: '10px' }}>
              {ohengData.map((entry, i) => {
                const maxVal = Math.max(...ohengData.map((d) => d.value));
                const barWidth = Math.max((entry.value / maxVal) * 100, 8);
                return (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: entry.color, width: '48px', textAlign: 'right', letterSpacing: '-0.26px' }}>
                      {entry.name}
                    </span>
                    <div className="flex-1" style={{ height: '20px', backgroundColor: C.divider, borderRadius: '10px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          backgroundColor: entry.color,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px',
                        }}
                      >
                        <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 600, color: C.white }}>
                          {entry.value}%
                        </span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Oheng Insight */}
            {getOhengInsight(ohengData) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  fontFamily: font,
                  fontSize: '12px',
                  fontWeight: 400,
                  color: C.gray600,
                  marginTop: '16px',
                  lineHeight: '18px',
                  textAlign: 'center',
                  letterSpacing: '-0.24px',
                }}
              >
                {getOhengInsight(ohengData)}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* ─── Analysis Cards ─────────────────────────────────────── */}
        <div style={{ padding: '8px 20px 0' }}>
          <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black, marginBottom: '12px', letterSpacing: '-0.32px' }}>
            상세 분석
          </p>
        </div>

        {ANALYSIS_CARDS.map((card, i) => {
          const unlocked = confirmedCount >= card.tagRequired;
          const remaining = Math.max(0, card.tagRequired - confirmedCount);
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              onClick={() => {
                if (unlocked) {
                  navigate(`/nadaum/${card.key}`);
                }
              }}
              className={unlocked ? 'cursor-pointer active:opacity-80' : ''}
              style={{
                margin: '0 20px 10px',
                padding: '16px 20px',
                backgroundColor: unlocked ? card.bgColor : C.lockBg,
                borderRadius: '16px',
                border: `1px solid ${unlocked ? 'transparent' : C.cardBorder}`,
                opacity: unlocked ? 1 : 0.7,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '24px' }}>{card.emoji}</span>
                  <div>
                    <p style={{ fontFamily: font, fontSize: '15px', fontWeight: 600, color: unlocked ? C.black : C.gray600, letterSpacing: '-0.3px' }}>
                      {card.title}
                    </p>
                    <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: unlocked ? C.gray700 : C.gray400, marginTop: '2px', letterSpacing: '-0.24px' }}>
                      {unlocked ? card.description : `태그 ${remaining}개 더 모으면 해금`}
                    </p>
                  </div>
                </div>
                {unlocked ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke={C.gray400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="flex items-center gap-1" style={{ padding: '4px 10px', backgroundColor: C.white, borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px' }}>🔒</span>
                    <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 500, color: C.gray600, letterSpacing: '-0.22px' }}>
                      {card.tagRequired}개
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* ─── CTA: 태그 모으기 (잠긴 카드가 있을 때) ─────────────── */}
        {ANALYSIS_CARDS.some((card) => confirmedCount < card.tagRequired) && (
          <div style={{ padding: '12px 20px 20px' }}>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
              style={{
                height: '56px',
                borderRadius: '16px',
                backgroundColor: C.primary,
                border: 'none',
                transition: 'transform 0.1s ease',
              }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <span style={{ fontFamily: font, fontSize: '16px', fontWeight: 500, color: C.white, letterSpacing: '-0.32px', lineHeight: '25px' }}>
                운세 보고 태그 모으기
              </span>
            </button>
            <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600, textAlign: 'center', marginTop: '8px', letterSpacing: '-0.24px' }}>
              현재 나다움 태그 {confirmedCount}개
            </p>
          </div>
        )}

        {/* Bottom padding for tab bar */}
        <div style={{ height: '20px' }} />

        <BottomTabBar />

      </div>
    </div>
  );
}
