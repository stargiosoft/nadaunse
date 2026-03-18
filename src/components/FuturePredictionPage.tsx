import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Coins, Briefcase, Activity, Users, Lock, ChevronRight } from 'lucide-react';
import { supabase, getAuthUser } from '../lib/supabase';
import BottomTabBar from './BottomTabBar';
import SEO from './SEO';

// ─── Design Tokens (HomeScreenNew 기준) ───────────────────────────────────────

const font = "'Pretendard Variable', sans-serif";

const C = {
  primary: '#48b2af',
  primaryAccent: '#41a09e',
  primaryLight: '#f0f8f8',
  primaryDark: '#368683',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  pageBg: '#f7f8f9',
  white: '#ffffff',
  cardBorder: '#f8f8f8',
  // Category colors
  love: '#ef6878',
  loveBg: '#fff6f7',
  money: '#f5a623',
  moneyBg: '#fff9f0',
  career: '#4590d6',
  careerBg: '#f0f8ff',
  health: '#8b5cf6',
  healthBg: '#f5f3ff',
  relation: '#41a09e',
  relationBg: '#f0f8f8',
} as const;

// ─── Category Data ────────────────────────────────────────────────────────────

interface Category {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
}

const CATEGORIES: Category[] = [
  { key: 'love', title: '연애', subtitle: '나의 연애 흐름과 전환점', icon: Heart, color: C.love, bgColor: C.loveBg },
  { key: 'money', title: '재물', subtitle: '재물운의 흐름과 기회', icon: Coins, color: C.money, bgColor: C.moneyBg },
  { key: 'career', title: '커리어', subtitle: '직업운과 성장 방향', icon: Briefcase, color: C.career, bgColor: C.careerBg },
  { key: 'health', title: '건강', subtitle: '건강 흐름과 주의 시기', icon: Activity, color: C.health, bgColor: C.healthBg },
  { key: 'relation', title: '인간관계', subtitle: '대인관계 패턴과 변화', icon: Users, color: C.relation, bgColor: C.relationBg },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FuturePredictionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [usedCategories, setUsedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getAuthUser();
      setUser(u ? { id: u.id } : null);
      if (u) {
        const { data } = await supabase
          .from('future_predictions')
          .select('category')
          .eq('user_id', u.id);
        if (data) setUsedCategories(data.map(d => d.category));
      }
      setLoading(false);
    })();
  }, []);

  const handleCategorySelect = (cat: Category) => {
    sessionStorage.setItem('future_category', cat.key);
    navigate('/future/test');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.pageBg }}>
        <div className="w-full max-w-[440px] h-full flex items-center justify-center">
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `3px solid ${C.primaryLight}`,
              borderTopColor: C.primary,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.pageBg }}>
      <div className="w-full max-w-[440px] relative h-full overflow-y-auto overflow-x-hidden overscroll-y-contain" style={{ paddingBottom: '80px' }}>
        <SEO title="미래 예측기 | 나다운세" description="AI가 당신의 미래를 시뮬레이션합니다" />

        {/* ─── 헤더 ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 20px 0' }}>
          <p style={{
            fontFamily: font, fontSize: '22px', fontWeight: 600,
            lineHeight: '32.5px', letterSpacing: '-0.22px', color: C.black,
          }}>
            미래 예측
          </p>
          <p style={{
            fontFamily: font, fontSize: '13px', fontWeight: 400,
            lineHeight: '19px', letterSpacing: '-0.26px', color: C.gray600,
            marginTop: '4px',
          }}>
            AI가 사주와 성향을 분석해 미래를 예측해요
          </p>
        </div>

        {/* ─── 메인 배너 카드 ──────────────────────────────── */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: 20,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: '4px 4px 14px 0px rgba(0,0,0,0.04)',
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            {/* 아이콘 */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 56, height: 56, borderRadius: 16,
                backgroundColor: C.primaryLight,
                margin: '0 auto 16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={C.primary} opacity="0.9" />
              </svg>
            </div>
            <p style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              letterSpacing: '-0.36px', lineHeight: '25.5px', color: C.black,
            }}>
              나의 미래를 시뮬레이션해 볼까요?
            </p>
            <p style={{
              fontFamily: font, fontSize: '13px', fontWeight: 400,
              color: C.gray600, letterSpacing: '-0.26px', lineHeight: '19px',
              marginTop: '6px',
            }}>
              간단한 테스트 5문항이면 충분해요
            </p>
          </div>
        </div>

        {/* ─── 카테고리 선택 ──────────────────────────────── */}
        <div style={{ padding: '24px 20px 0' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <p style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              letterSpacing: '-0.36px', lineHeight: '25.5px', color: C.black,
            }}>
              카테고리 선택
            </p>
            {usedCategories.length === 0 && (
              <span style={{
                fontFamily: font, fontSize: '12px', fontWeight: 500,
                color: C.primary,
              }}>
                첫 1회 무료
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORIES.map((cat, idx) => {
              const isUsed = usedCategories.includes(cat.key);
              const isFreeAvailable = usedCategories.length === 0;
              const IconComp = cat.icon;

              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                >
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className="w-full cursor-pointer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      backgroundColor: C.white,
                      borderRadius: 16,
                      border: `1px solid ${C.cardBorder}`,
                      boxShadow: '2px 2px 10px 0px rgba(0,0,0,0.02)',
                      textAlign: 'left',
                      transition: 'transform 0.1s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = ''; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = ''; }}
                  >
                    {/* 아이콘 */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 44, height: 44, borderRadius: 14,
                        backgroundColor: cat.bgColor,
                      }}
                    >
                      <IconComp size={20} style={{ color: cat.color }} strokeWidth={1.8} />
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: font, fontSize: '15px', fontWeight: 600,
                        letterSpacing: '-0.3px', color: C.black,
                      }}>
                        {cat.title}
                      </p>
                      <p style={{
                        fontFamily: font, fontSize: '12px', fontWeight: 400,
                        letterSpacing: '-0.24px', color: C.gray600, marginTop: '2px',
                      }}>
                        {cat.subtitle}
                      </p>
                    </div>

                    {/* 배지 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isUsed ? (
                        <span style={{
                          fontFamily: font, fontSize: '11px', fontWeight: 500,
                          color: C.primary, padding: '3px 8px',
                          borderRadius: 20, backgroundColor: C.primaryLight,
                        }}>
                          완료
                        </span>
                      ) : isFreeAvailable ? (
                        <span style={{
                          fontFamily: font, fontSize: '11px', fontWeight: 600,
                          color: C.career, padding: '3px 8px',
                          borderRadius: 20, backgroundColor: C.careerBg,
                        }}>
                          무료
                        </span>
                      ) : (
                        <div className="flex items-center gap-1"
                          style={{ padding: '3px 8px', borderRadius: 20, backgroundColor: '#f5f5f5' }}
                        >
                          <Lock size={10} style={{ color: C.gray400 }} strokeWidth={2.2} />
                          <span style={{
                            fontFamily: font, fontSize: '11px', fontWeight: 500, color: C.gray600,
                          }}>
                            15새싹
                          </span>
                        </div>
                      )}
                      <ChevronRight size={16} style={{ color: '#d4d4d4' }} strokeWidth={1.8} />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ─── 안내 ─────────────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: C.primaryLight,
              borderRadius: 14,
            }}
          >
            <p style={{
              fontFamily: font, fontSize: '13px', fontWeight: 500,
              lineHeight: '20px', letterSpacing: '-0.26px', color: C.primaryDark,
              marginBottom: '4px',
            }}>
              이렇게 예측해요
            </p>
            <p style={{
              fontFamily: font, fontSize: '12px', fontWeight: 400,
              lineHeight: '18px', letterSpacing: '-0.24px', color: C.gray700,
            }}>
              사주 데이터 + 나다움 태그 + 간단 테스트를 조합해서
              AI 에이전트 3명이 당신의 미래를 토론합니다.
            </p>
          </div>
        </div>

        <BottomTabBar />
      </div>
    </div>
  );
}
