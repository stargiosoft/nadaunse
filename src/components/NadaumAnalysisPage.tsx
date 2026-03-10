import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { supabase, getAuthUser } from '../lib/supabase';
import { getManseData } from '../lib/manseService';
import BottomTabBar from './BottomTabBar';
import SEO from './SEO';
import { getZodiacImageUrl } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';
import { useShareRewardStatus } from '../hooks/useShareRewardStatus';
import ShareRewardModal from './ShareRewardModal';

const font = "'Pretendard Variable', sans-serif";

// ─── Design Tokens ──────────────────────────────────────────────────────────

const C = {
  primary: '#41a09e',
  primaryLight: '#f0f8f8',
  primaryDark: '#368683',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  cardBg: '#ffffff',
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

const OHENG_CONFIG = [
  { key: '목', label: '木', color: '#22c55e', name: '목(木)' },
  { key: '화', label: '火', color: '#ef4444', name: '화(火)' },
  { key: '토', label: '土', color: '#a16207', name: '토(土)' },
  { key: '금', label: '金', color: '#6b7280', name: '금(金)' },
  { key: '수', label: '水', color: '#3b82f6', name: '수(水)' },
] as const;

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
}

function computeNadaumType(radarData: { category: string; count: number }[]): NadaumType {
  // 6축: 실행력, 사고력, 감성, 관계, 의지력, 안정감
  const map = new Map(radarData.map(d => [d.category, d.count]));
  const get = (k: string) => map.get(k) || 0;

  // 축1: 실행력 vs 사고력 → 행동파/분석파
  const axis1 = get('실행력') >= get('사고력') ? '행동파' : '분석파';
  // 축2: 감성 vs 안정감 → 감성형/이성형
  const axis2 = get('감성') >= get('안정감') ? '감성형' : '이성형';
  // 축3: 관계 → 높으면 사교적, 낮으면 독립적
  const axis3 = get('관계') >= 3 ? '사교적' : '독립적';
  // 축4: 의지력 → 높으면 꾸준한, 낮으면 유연한
  const axis4 = get('의지력') >= 3 ? '꾸준한' : '유연한';

  // 유형명 조합: 감성형 + 행동파 = 메인 타이틀
  const typeMap: Record<string, NadaumType> = {
    '감성형_행동파_사교적_꾸준한': { title: '열정적 리더', subtitle: '감성과 실행력을 겸비한 사람', emoji: '🔥' },
    '감성형_행동파_사교적_유연한': { title: '자유로운 무드메이커', subtitle: '분위기를 이끄는 에너자이저', emoji: '🎉' },
    '감성형_행동파_독립적_꾸준한': { title: '묵묵한 열정가', subtitle: '자기 길을 꿋꿋이 가는 사람', emoji: '🌋' },
    '감성형_행동파_독립적_유연한': { title: '감각적 모험가', subtitle: '느낌대로 움직이는 자유영혼', emoji: '🦋' },
    '감성형_분석파_사교적_꾸준한': { title: '다정한 전략가', subtitle: '따뜻한 마음에 냉철한 머리', emoji: '🧠' },
    '감성형_분석파_사교적_유연한': { title: '공감형 탐험가', subtitle: '사람과 세상을 깊이 이해하는', emoji: '🌊' },
    '감성형_분석파_독립적_꾸준한': { title: '깊은 사색가', subtitle: '풍부한 내면을 가진 사람', emoji: '🌙' },
    '감성형_분석파_독립적_유연한': { title: '감성적 몽상가', subtitle: '상상력이 풍부한 예술형', emoji: '🎨' },
    '이성형_행동파_사교적_꾸준한': { title: '믿음직한 실행자', subtitle: '약속은 반드시 지키는 사람', emoji: '🏔️' },
    '이성형_행동파_사교적_유연한': { title: '사교적 해결사', subtitle: '어디서든 적응하는 만능형', emoji: '⚡' },
    '이성형_행동파_독립적_꾸준한': { title: '철두철미 추진가', subtitle: '목표를 향해 흔들림 없이', emoji: '🎯' },
    '이성형_행동파_독립적_유연한': { title: '쿨한 실용주의자', subtitle: '효율을 추구하는 현실파', emoji: '💎' },
    '이성형_분석파_사교적_꾸준한': { title: '신뢰의 조언자', subtitle: '논리와 배려를 겸비한 참모형', emoji: '🦉' },
    '이성형_분석파_사교적_유연한': { title: '유연한 중재자', subtitle: '갈등을 풀어내는 소통 전문가', emoji: '🤝' },
    '이성형_분석파_독립적_꾸준한': { title: '냉철한 전문가', subtitle: '깊이 파고드는 장인 기질', emoji: '🔬' },
    '이성형_분석파_독립적_유연한': { title: '자유로운 분석가', subtitle: '통찰력 있는 관찰자', emoji: '🔭' },
  };

  const key = `${axis2}_${axis1}_${axis3}_${axis4}`;
  return typeMap[key] || { title: '성장하는 나', subtitle: '태그를 더 모으면 유형이 선명해져요', emoji: '✨' };
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
  referralRequired: number; // 0 = 무료, 1+ = 친구 초대 N명 필요
  description: string;
}

const ANALYSIS_CARDS: AnalysisCard[] = [
  { key: 'nature', title: '기질·성격', emoji: '🧬', color: C.nature, bgColor: C.natureBg, referralRequired: 0, description: '타고난 기질과 성격 심층 분석' },
  { key: 'love', title: '연애·궁합', emoji: '💕', color: C.love, bgColor: C.loveBg, referralRequired: 1, description: '나의 연애 성향과 이상형, 궁합 분석' },
  { key: 'money', title: '재물·금전', emoji: '💰', color: C.money, bgColor: C.moneyBg, referralRequired: 2, description: '나의 재물운과 금전 관리 성향' },
  { key: 'career', title: '직업·적성', emoji: '💼', color: C.career, bgColor: C.careerBg, referralRequired: 3, description: '적성에 맞는 진로와 업무 스타일' },
  { key: 'health', title: '건강·체질', emoji: '🏥', color: C.health, bgColor: C.healthBg, referralRequired: 4, description: '사주로 보는 체질과 건강 관리법' },
];

// ─── Skeleton ───────────────────────────────────────────────────────────────

function NadaumSkeleton() {
  return (
    <div className="flex flex-col gap-4" style={{ padding: '20px' }}>
      <div className="rounded-2xl" style={{ height: '120px', backgroundColor: '#f3f3f3' }} />
      <div className="rounded-2xl" style={{ height: '280px', backgroundColor: '#f3f3f3' }} />
      <div className="rounded-2xl" style={{ height: '80px', backgroundColor: '#f3f3f3' }} />
      <div className="rounded-2xl" style={{ height: '80px', backgroundColor: '#f3f3f3' }} />
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
  const [showShareModal, setShowShareModal] = useState(false);
  const { status: rewardStatus } = useShareRewardStatus();
  const totalReferred = rewardStatus?.totalFriendsReferred ?? 0;

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

        if (!cancelled) setIsLoggedIn(true);

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
                oheng = OHENG_CONFIG.map((cfg) => ({
                  name: cfg.name,
                  value: baldal[cfg.key] || 0,
                  color: cfg.color,
                  label: cfg.label,
                })).filter((d) => d.value > 0);
                console.log('[나다움] 파싱된 오행:', oheng.length, '개');
              }
            }
          } catch (err) {
            console.error('[나다움] 만세력 에러:', err);
          }
        } else {
          console.log('[나다움] saju 데이터 없음, 오행 스킵');
        }

        if (!cancelled) {
          if (sajuRes.data) setSaju(sajuRes.data);
          if (tagsRes.data) setTags(tagsRes.data);
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

  const radarData = useMemo(() => {
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
  }, [tags]);

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

  // Positive / Negative ratio
  const positiveCount = tags.filter((t) => t.tag_type === 'positive').length;
  const negativeCount = tags.filter((t) => t.tag_type === 'negative').length;
  const totalPN = positiveCount + negativeCount || 1;
  const positivePercent = Math.round((positiveCount / totalPN) * 100);

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
          <div className="flex flex-col items-center gap-4" style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '48px' }}>🔮</div>
            <p style={{ fontFamily: font, fontSize: '18px', fontWeight: 600, color: C.black, textAlign: 'center' }}>
              나다움 분석
            </p>
            <p style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, color: C.gray700, textAlign: 'center', lineHeight: '22px' }}>
              로그인하고 운세를 보면{'\n'}나만의 성향 분석 리포트가 만들어져요
            </p>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '200px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: C.primary,
                border: 'none',
                marginTop: '8px',
              }}
            >
              <span style={{ fontFamily: font, fontSize: '15px', fontWeight: 500, color: C.white }}>
                로그인하기
              </span>
            </button>
          </div>
          <BottomTabBar />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <div className="w-full max-w-[440px] relative" style={{ paddingBottom: '80px' }}>
        <SEO title="나다움 분석 | 나다운세" description="나만의 성향 분석 리포트" />

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ fontFamily: font, fontSize: '22px', fontWeight: 600, lineHeight: '32px', letterSpacing: '-0.22px', color: C.black }}>
            나다움 분석
          </p>
          <p style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: C.gray700, marginTop: '4px' }}>
            운세를 볼수록 나를 더 정확히 알 수 있어요
          </p>
        </div>

        {/* ─── Profile Card ───────────────────────────────────────── */}
        {saju && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ margin: '12px 20px', padding: '20px', backgroundColor: C.cardBg, borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
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
              <div className="flex flex-col gap-1">
                <p style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: C.black }}>
                  {saju.full_name}
                </p>
                <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 400, color: C.gray700 }}>
                  {birthText} {zodiacText && `· ${zodiacText}띠`}
                </p>
              </div>
            </div>

            {/* Tag Count Badge */}
            <div className="flex items-center gap-2" style={{ marginTop: '16px' }}>
              <div
                className="flex items-center gap-1"
                style={{ padding: '4px 10px', backgroundColor: C.primaryLight, borderRadius: '20px' }}
              >
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.primaryDark }}>
                  나다움 태그 {confirmedCount}개
                </span>
              </div>
              {!isUnlocked && (
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600 }}>
                  {5 - confirmedCount}개 더 모으면 분석이 열려요!
                </span>
              )}
            </div>

            {/* Progress Bar (if locked) */}
            {!isUnlocked && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ height: '6px', backgroundColor: '#f3f3f3', borderRadius: '3px', overflow: 'hidden' }}>
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
          style={{ margin: '8px 20px', padding: '24px 16px', backgroundColor: C.cardBg, borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black }}>
              나다움 DNA
            </p>
            {!isUnlocked && (
              <div className="flex items-center gap-1" style={{ padding: '3px 8px', backgroundColor: C.lockBg, borderRadius: '8px' }}>
                <span style={{ fontSize: '12px' }}>🔒</span>
                <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 400, color: C.gray600 }}>
                  태그 5개 필요
                </span>
              </div>
            )}
          </div>

          {isUnlocked ? (
            <>
              <div style={{ width: '100%', height: '260px', marginTop: '8px' }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#e7e7e7" />
                    <PolarAngleAxis dataKey="category" tick={<CustomAxisTick />} />
                    <Radar
                      dataKey="value"
                      stroke={C.primary}
                      fill={C.primary}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Tags - 가로 스크롤 */}
              {topPositive.length > 0 && (
                <div className="flex gap-2 overflow-x-auto" style={{ marginTop: '12px', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
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
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {topNegative.length > 0 && (
                <div className="flex gap-2 overflow-x-auto" style={{ marginTop: '8px', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
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
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Locked State */
            <div className="flex flex-col items-center justify-center" style={{ height: '200px' }}>
              <div style={{ fontSize: '40px', opacity: 0.4 }}>📊</div>
              <p style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, color: C.gray600, textAlign: 'center', marginTop: '12px', lineHeight: '22px' }}>
                운세를 보고 나다움 태그를 모으면{'\n'}나만의 DNA 차트가 완성돼요
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  backgroundColor: C.primaryLight,
                  border: 'none',
                }}
              >
                <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary }}>
                  운세 보러가기
                </span>
              </button>
            </div>
          )}
        </motion.div>

        {/* ─── Balance Bar (긍정/부정 비율) ────────────────────────── */}
        {isUnlocked && (positiveCount > 0 || negativeCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ margin: '8px 20px', padding: '20px', backgroundColor: C.cardBg, borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black }}>
              성향 밸런스
            </p>
            <div className="flex items-center" style={{ marginTop: '16px', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${positivePercent}%`,
                  height: '100%',
                  backgroundColor: C.primary,
                  borderRadius: positivePercent === 100 ? '12px' : '12px 0 0 12px',
                  transition: 'width 0.6s ease',
                }}
              />
              <div
                style={{
                  width: `${100 - positivePercent}%`,
                  height: '100%',
                  backgroundColor: '#f0a0a8',
                  borderRadius: positivePercent === 0 ? '12px' : '0 12px 12px 0',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
              <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary }}>
                긍정 {positivePercent}%
              </span>
              <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: '#e88090' }}>
                보완점 {100 - positivePercent}%
              </span>
            </div>
          </motion.div>
        )}

        {/* ─── 나다움 유형 카드 ──────────────────────────────────── */}
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            style={{
              margin: '8px 20px',
              padding: '24px 20px',
              backgroundColor: C.cardBg,
              borderRadius: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black, marginBottom: '16px' }}>
              나다움 유형
            </p>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{nadaumType.emoji}</div>
            <p style={{ fontFamily: font, fontSize: '20px', fontWeight: 700, color: C.primary, letterSpacing: '-0.4px' }}>
              {nadaumType.title}
            </p>
            <p style={{ fontFamily: font, fontSize: '13px', fontWeight: 400, color: C.gray700, marginTop: '6px' }}>
              {nadaumType.subtitle}
            </p>
          </motion.div>
        )}

        {/* ─── 오행 에너지 분포 ──────────────────────────────────── */}
        {isUnlocked && ohengData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{
              margin: '8px 20px',
              padding: '24px 16px',
              backgroundColor: C.cardBg,
              borderRadius: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black, marginBottom: '4px' }}>
              오행 에너지 분포
            </p>
            <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600, marginBottom: '16px' }}>
              사주 만세력 기반 타고난 에너지 비율
            </p>
            {/* 오행 수평 바 차트 */}
            <div className="flex flex-col gap-3">
              {ohengData.map((entry, i) => {
                const maxVal = Math.max(...ohengData.map((d) => d.value));
                const barWidth = Math.max((entry.value / maxVal) * 100, 8);
                return (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: entry.color, width: '52px', textAlign: 'right' }}>
                      {entry.name}
                    </span>
                    <div className="flex-1" style={{ height: '22px', backgroundColor: '#f3f3f3', borderRadius: '11px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          backgroundColor: entry.color,
                          borderRadius: '11px',
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
          </motion.div>
        )}

        {/* ─── Analysis Cards ─────────────────────────────────────── */}
        <div style={{ padding: '8px 20px 0' }}>
          <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black, marginBottom: '12px' }}>
            상세 분석
          </p>
        </div>

        {ANALYSIS_CARDS.map((card, i) => {
          const unlocked = card.referralRequired === 0 || totalReferred >= card.referralRequired;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              onClick={() => {
                if (unlocked) {
                  navigate(`/nadaum/${card.key}`);
                } else {
                  setShowShareModal(true);
                }
              }}
              className="cursor-pointer"
              style={{
                margin: '0 20px 10px',
                padding: '16px 20px',
                backgroundColor: unlocked ? card.bgColor : C.lockBg,
                borderRadius: '16px',
                opacity: unlocked ? 1 : 0.7,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '24px' }}>{card.emoji}</span>
                  <div>
                    <p style={{ fontFamily: font, fontSize: '15px', fontWeight: 600, color: unlocked ? C.black : C.gray600 }}>
                      {card.title}
                    </p>
                    <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: unlocked ? C.gray700 : C.gray400, marginTop: '2px' }}>
                      {unlocked ? card.description : `친구 ${card.referralRequired}명 초대로 해금`}
                    </p>
                  </div>
                </div>
                {unlocked ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke={C.gray400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="flex items-center gap-1" style={{ padding: '4px 10px', backgroundColor: C.white, borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px' }}>🔗</span>
                    <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 500, color: C.primary }}>
                      초대하기
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* ─── CTA: 친구 초대 안내 (잠긴 카드가 있을 때) ───────────── */}
        {ANALYSIS_CARDS.some((card) => card.referralRequired > 0 && totalReferred < card.referralRequired) && (
          <div style={{ padding: '12px 20px 20px' }}>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
              style={{
                height: '52px',
                borderRadius: '16px',
                backgroundColor: C.primary,
                border: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontFamily: font, fontSize: '15px', fontWeight: 500, color: C.white, letterSpacing: '-0.3px' }}>
                친구 초대하고 분석 해금하기
              </span>
            </button>
            <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600, textAlign: 'center', marginTop: '8px' }}>
              현재 {totalReferred}명 초대 완료
            </p>
          </div>
        )}

        {/* Bottom padding for tab bar */}
        <div style={{ height: '20px' }} />

        <BottomTabBar />

        {/* Share Reward Modal */}
        <ShareRewardModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          contentId="nadaum-analysis"
        />
      </div>
    </div>
  );
}
