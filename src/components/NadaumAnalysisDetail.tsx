import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import ArrowLeft from './ArrowLeft';
import { supabase, getAuthUser } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';
import SEO from './SEO';

const font = "'Pretendard Variable', sans-serif";

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
  white: '#ffffff',
} as const;

interface CategoryInfo {
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  scoreLabel: string;
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
  love: { title: '연애·궁합 분석', emoji: '💕', color: '#ef6878', bgColor: '#fff6f7', scoreLabel: '연애력' },
  nature: { title: '기질·성격 분석', emoji: '🧬', color: '#41a09e', bgColor: '#f0f8f8', scoreLabel: '자아 이해도' },
  money: { title: '재물·금전 분석', emoji: '💰', color: '#f5a623', bgColor: '#fff9f0', scoreLabel: '재물운' },
  career: { title: '직업·적성 분석', emoji: '💼', color: '#4590d6', bgColor: '#f0f6ff', scoreLabel: '적성 매칭' },
  health: { title: '건강·체질 분석', emoji: '🏥', color: '#8b5cf6', bgColor: '#f5f3ff', scoreLabel: '건강 밸런스' },
};

// ─── Types ──────────────────────────────────────────────────

interface Section {
  title: string;
  content: string;
}

interface SpectrumItem {
  left: string;
  right: string;
  value: number;
}

interface AnalysisMetadata {
  score?: number | null;
  spectrum?: SpectrumItem[] | null;
}

// ─── Section Parser ─────────────────────────────────────────

function parseSections(text: string): Section[] {
  const regex = /\[([^\]]+)\]/g;
  const sections: Section[] = [];
  let lastIndex = 0;
  let lastTitle = '';
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (lastTitle && match.index > lastIndex) {
      sections.push({
        title: lastTitle,
        content: text.slice(lastIndex, match.index).trim(),
      });
    }
    lastTitle = match[1];
    lastIndex = match.index + match[0].length;
  }

  if (lastTitle) {
    sections.push({
      title: lastTitle,
      content: text.slice(lastIndex).trim(),
    });
  }

  if (sections.length === 0) {
    return [{ title: '분석 결과', content: text.trim() }];
  }

  return sections;
}

// ─── Score Gauge (반원형) ───────────────────────────────────

function ScoreGauge({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 70;
  const strokeWidth = 12;
  const cx = 90;
  const cy = 80;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center" style={{ padding: '20px 0' }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={C.gray200}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{
          fontFamily: font,
          fontSize: '32px',
          fontWeight: 700,
          color,
          marginTop: '-40px',
        }}
      >
        {score}
      </motion.p>
      <p style={{
        fontFamily: font,
        fontSize: '13px',
        fontWeight: 400,
        color: C.gray600,
        marginTop: '4px',
      }}>
        {label}
      </p>
    </div>
  );
}

// ─── Spectrum Bar ───────────────────────────────────────────

function SpectrumBar({ item, color, delay }: { item: SpectrumItem; color: string; delay: number }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.gray700 }}>
          {item.left}
        </span>
        <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.gray700 }}>
          {item.right}
        </span>
      </div>
      <div style={{
        position: 'relative',
        height: '8px',
        backgroundColor: C.gray200,
        borderRadius: '4px',
        overflow: 'visible',
      }}>
        {/* Gradient fill */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '4px',
          background: `linear-gradient(to right, ${color}, ${C.gray200}, ${color})`,
          opacity: 0.3,
        }} />
        {/* Indicator dot */}
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${item.value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 2px 8px ${color}40`,
            border: `2px solid ${C.white}`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Loading Animation ──────────────────────────────────────

function AnalysisLoading({ emoji, title }: { emoji: string; title: string }) {
  const messages = [
    '사주 정보를 분석하고 있어요...',
    '성향 태그를 종합하고 있어요...',
    '나만의 분석 리포트를 작성 중이에요...',
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontSize: '56px' }}
      >
        {emoji}
      </motion.div>
      <p style={{ fontFamily: font, fontSize: '17px', fontWeight: 600, color: C.black, marginTop: '24px' }}>
        {title}
      </p>
      <motion.p
        key={msgIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={{ fontFamily: font, fontSize: '14px', fontWeight: 400, color: C.gray600, marginTop: '12px' }}
      >
        {messages[msgIndex]}
      </motion.p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function NadaumAnalysisDetail() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tagCount, setTagCount] = useState(0);
  const [metadata, setMetadata] = useState<AnalysisMetadata>({});

  const info = category ? CATEGORY_INFO[category] : null;

  useEffect(() => {
    if (!category || !info) return;
    let cancelled = false;

    async function generate() {
      try {
        const { data: { user } } = await getAuthUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/generate-nadaum-analysis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ category }),
          }
        );

        const data = await response.json();

        if (!cancelled) {
          if (data.success && data.analysis) {
            setSections(parseSections(data.analysis.analysis_text));
            setTagCount(data.analysis.tag_count);
            if (data.analysis.metadata) {
              setMetadata(data.analysis.metadata);
            }
          } else {
            setError(data.error || '분석 생성에 실패했습니다.');
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[NadaumAnalysisDetail] 에러:', err);
          setError('분석을 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [category]);

  if (!info) {
    navigate('/nadaum');
    return null;
  }

  return (
    <div className="flex justify-center" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <div className="w-full max-w-[440px] relative">
        <SEO title={`${info.title} | 나다운세`} description={`나만의 ${info.title}`} />

        {/* Header */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => navigate(-1)} />
              <p style={{ fontFamily: font, fontSize: '18px', fontWeight: 600, color: C.black, textAlign: 'center' }}>
                {info.title}
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        <div style={{ height: '8px' }} />

        {/* Loading */}
        {isLoading && <AnalysisLoading emoji={info.emoji} title={info.title} />}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '40vh', padding: '20px' }}>
            <p style={{ fontSize: '40px' }}>😞</p>
            <p style={{ fontFamily: font, fontSize: '15px', fontWeight: 400, color: C.gray600, textAlign: 'center', marginTop: '16px', lineHeight: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => { setError(null); setIsLoading(true); }}
              className="cursor-pointer"
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                borderRadius: '14px',
                backgroundColor: C.primary,
                border: 'none',
              }}
            >
              <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 500, color: C.white }}>
                다시 시도
              </span>
            </button>
          </div>
        )}

        {/* Result */}
        {!isLoading && !error && sections.length > 0 && (
          <div style={{ padding: '0 20px 40px' }}>
            {/* Category Badge */}
            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{info.emoji}</span>
              <div>
                <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600 }}>
                  나다움 태그 {tagCount}개 기반 분석
                </p>
              </div>
            </div>

            {/* Score Gauge + Spectrum Card */}
            {(metadata.score != null || (metadata.spectrum && metadata.spectrum.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginBottom: '16px',
                  padding: '20px',
                  backgroundColor: C.white,
                  borderRadius: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {/* Score Gauge */}
                {metadata.score != null && (
                  <ScoreGauge
                    score={metadata.score}
                    color={info.color}
                    label={info.scoreLabel}
                  />
                )}

                {/* Spectrum Bars */}
                {metadata.spectrum && metadata.spectrum.length > 0 && (
                  <div style={{ marginTop: metadata.score != null ? '8px' : '0', padding: '0 4px' }}>
                    <p style={{
                      fontFamily: font,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: C.black,
                      marginBottom: '16px',
                    }}>
                      성향 스펙트럼
                    </p>
                    {metadata.spectrum.map((item, i) => (
                      <SpectrumBar
                        key={i}
                        item={item}
                        color={info.color}
                        delay={0.5 + i * 0.2}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Text Sections */}
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (metadata.score != null ? 0.3 : 0) + i * 0.1 }}
                style={{
                  marginBottom: '16px',
                  padding: '20px',
                  backgroundColor: C.white,
                  borderRadius: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                  <div style={{ width: '4px', height: '18px', backgroundColor: info.color, borderRadius: '2px' }} />
                  <p style={{ fontFamily: font, fontSize: '15px', fontWeight: 600, color: C.black }}>
                    {section.title}
                  </p>
                </div>
                <p style={{
                  fontFamily: font,
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '24px',
                  letterSpacing: '-0.28px',
                  color: C.gray700,
                  whiteSpace: 'pre-wrap',
                }}>
                  {section.content}
                </p>
              </motion.div>
            ))}

            {/* Disclaimer */}
            <p style={{
              fontFamily: font,
              fontSize: '11px',
              fontWeight: 400,
              color: C.gray400,
              textAlign: 'center',
              marginTop: '20px',
              lineHeight: '18px',
            }}>
              명리학과 성향 태그를 기반으로 한 참고 정보이며,{'\n'}
              전문적인 상담을 대체하지 않습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
