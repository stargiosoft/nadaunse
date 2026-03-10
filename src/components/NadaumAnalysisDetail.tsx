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
  bg: '#f7f8f9',
  white: '#ffffff',
} as const;

interface CategoryInfo {
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
  love: { title: '연애·궁합 분석', emoji: '💕', color: '#ef6878', bgColor: '#fff6f7' },
  nature: { title: '기질·성격 분석', emoji: '🧬', color: '#41a09e', bgColor: '#f0f8f8' },
  money: { title: '재물·금전 분석', emoji: '💰', color: '#f5a623', bgColor: '#fff9f0' },
  career: { title: '직업·적성 분석', emoji: '💼', color: '#4590d6', bgColor: '#f0f6ff' },
  health: { title: '건강·체질 분석', emoji: '🏥', color: '#8b5cf6', bgColor: '#f5f3ff' },
};

// ─── Section Parser ─────────────────────────────────────────────

interface Section {
  title: string;
  content: string;
}

function parseSections(text: string): Section[] {
  // [제목] 패턴으로 분리
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

  // 마지막 섹션
  if (lastTitle) {
    sections.push({
      title: lastTitle,
      content: text.slice(lastIndex).trim(),
    });
  }

  // 파싱 실패 시 전체 텍스트를 하나의 섹션으로
  if (sections.length === 0) {
    return [{ title: '분석 결과', content: text.trim() }];
  }

  return sections;
}

// ─── Loading Animation ──────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────

export default function NadaumAnalysisDetail() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tagCount, setTagCount] = useState(0);

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
          } else {
            setError(data.error || '분석 생성에 실패했습니다.');
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('❌ [NadaumAnalysisDetail] 에러:', err);
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
            <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '28px' }}>{info.emoji}</span>
              <div>
                <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600 }}>
                  나다움 태그 {tagCount}개 기반 분석
                </p>
              </div>
            </div>

            {/* Sections */}
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
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
