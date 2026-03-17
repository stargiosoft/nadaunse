import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, getAuthUser } from '../lib/supabase';
import { useSproutBalance } from '../hooks/useSproutBalance';
import { NavigationHeader } from '../components/NavigationHeader';
import SEO from '../components/SEO';

const font = "'Pretendard Variable', sans-serif";

// ─── Design Tokens (★DESIGN_SYSTEM★.md 기준) ─────────────────────────────────

const C = {
  primary: '#48b2af',
  primaryLight: '#f0f8f8',
  primaryDark: '#41a09e',
  primaryPressed: '#389998',
  textPrimary: '#151515',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  surface: '#ffffff',
  surfaceSecondary: '#f9f9f9',
  borderDefault: '#e7e7e7',
  borderDivider: '#f3f3f3',
  overlay: 'rgba(0, 0, 0, 0.6)',
  // semantic
  nature: '#41a09e',
  natureBg: '#f0f8f8',
  career: '#4590d6',
  careerBg: '#f0f6ff',
  health: '#8b5cf6',
  healthBg: '#f5f3ff',
  love: '#ef6878',
  loveBg: '#fff6f7',
  money: '#f5a623',
  moneyBg: '#fff9f0',
} as const;

// ─── Mission Definitions ────────────────────────────────────────────────────

interface MissionDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagRequired: number;
  rewardType: 'sprout' | 'report';
  rewardAmount?: number;
  rewardLabel: string;
  ctaPath?: string;
  ctaLabel?: string;
}

const MISSIONS: MissionDef[] = [
  {
    id: 'first-tags',
    title: '나다움 태그 5개 모으기',
    description: '운세를 보고 나다움 태그를 5개 수집하세요',
    emoji: '🌱',
    color: C.primary,
    bgColor: C.primaryLight,
    tagRequired: 5,
    rewardType: 'sprout',
    rewardAmount: 30,
    rewardLabel: '새싹 30개',
  },
  {
    id: 'unlock-report',
    title: '나다움 보고서 열기',
    description: '태그 5개를 모아 주간 보고서를 오픈하세요',
    emoji: '📊',
    color: C.career,
    bgColor: C.careerBg,
    tagRequired: 5,
    rewardType: 'report',
    rewardLabel: '나다움 보고서 오픈',
  },
  {
    id: 'analysis-nature',
    title: '기질·성격 상세 분석',
    description: '태그 5개 달성 시 기질·성격 분석이 열려요',
    emoji: '🧬',
    color: C.nature,
    bgColor: C.natureBg,
    tagRequired: 5,
    rewardType: 'report',
    rewardLabel: '상세 분석 오픈',
    ctaPath: '/nadaum/nature',
    ctaLabel: '분석 보러가기',
  },
  {
    id: 'analysis-career',
    title: '직업·적성 상세 분석',
    description: '태그 10개 달성 시 직업·적성 분석이 열려요',
    emoji: '💼',
    color: C.career,
    bgColor: C.careerBg,
    tagRequired: 10,
    rewardType: 'report',
    rewardLabel: '상세 분석 오픈',
    ctaPath: '/nadaum/career',
    ctaLabel: '분석 보러가기',
  },
  {
    id: 'analysis-health',
    title: '건강·체질 상세 분석',
    description: '태그 15개 달성 시 건강·체질 분석이 열려요',
    emoji: '🏥',
    color: C.health,
    bgColor: C.healthBg,
    tagRequired: 15,
    rewardType: 'report',
    rewardLabel: '상세 분석 오픈',
    ctaPath: '/nadaum/health',
    ctaLabel: '분석 보러가기',
  },
  {
    id: 'analysis-love',
    title: '연애·궁합 상세 분석',
    description: '태그 20개 달성 시 연애·궁합 분석이 열려요',
    emoji: '💕',
    color: C.love,
    bgColor: C.loveBg,
    tagRequired: 20,
    rewardType: 'report',
    rewardLabel: '상세 분석 오픈',
    ctaPath: '/nadaum/love',
    ctaLabel: '분석 보러가기',
  },
  {
    id: 'analysis-money',
    title: '재물·금전 상세 분석',
    description: '태그 25개 달성 시 재물·금전 분석이 열려요',
    emoji: '💰',
    color: C.money,
    bgColor: C.moneyBg,
    tagRequired: 25,
    rewardType: 'report',
    rewardLabel: '상세 분석 오픈',
    ctaPath: '/nadaum/money',
    ctaLabel: '분석 보러가기',
  },
];

// ─── CheckIcon ──────────────────────────────────────────────────────────────

function CheckCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={color} />
      <path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.textDisabled} strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke={C.textDisabled} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RewardMissionPage() {
  const navigate = useNavigate();
  const { balance, loading: balanceLoading } = useSproutBalance();
  const [tagCount, setTagCount] = useState(0);
  const [totalRewardSprouts, setTotalRewardSprouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getAuthUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);

        const [tagsResult, rewardResult] = await Promise.all([
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_confirmed', true),
          supabase
            .from('sprout_transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('transaction_type', 'reward'),
        ]);

        setTagCount(tagsResult.count || 0);
        const total = (rewardResult.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
        setTotalRewardSprouts(total);
      } catch (err) {
        console.error('[RewardMissionPage] 데이터 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isCompleted = (m: MissionDef) => tagCount >= m.tagRequired;
  const getProgress = (m: MissionDef) => Math.min(tagCount / m.tagRequired, 1);

  return (
    <>
      <SEO title="리워드함 | 나다운세" />

      {/* ── 페이지 레이아웃 (디자인 시스템 §2.1) ── */}
      <div className="relative min-h-screen min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: C.surfaceSecondary }}>
        <div className="w-full max-w-[440px] relative flex flex-col" style={{ backgroundColor: C.surfaceSecondary }}>

          {/* NavigationHeader (§3.1) */}
          <NavigationHeader title="리워드함" onBack={() => navigate(-1)} />

          {/* 헤더 높이 여백 */}
          <div style={{ height: 60 }} className="shrink-0" />

          {/* ── 새싹 잔고 카드 ── */}
          <div style={{ padding: '0 20px' }}>
            <div
              style={{
                backgroundColor: C.surface,
                borderRadius: 16,
                padding: '20px',
                border: `1px solid ${C.borderDivider}`,
              }}
            >
              <div className="flex items-center justify-between">
                {/* 잔고 */}
                <div className="flex items-center" style={{ gap: 14 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.primaryLight }}
                  >
                    <span style={{ fontSize: 24 }}>🌱</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: C.textCaption }}>
                      내 새싹
                    </p>
                    <div className="flex items-baseline" style={{ gap: 3, marginTop: 2 }}>
                      <span style={{ fontFamily: font, fontSize: 24, fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.48px', color: C.textPrimary }}>
                        {balanceLoading ? '–' : balance.toLocaleString()}
                      </span>
                      <span style={{ fontFamily: font, fontSize: 14, fontWeight: 500, lineHeight: '20px', color: C.textCaption }}>
                        개
                      </span>
                    </div>
                  </div>
                </div>

                {/* 리워드 적립 */}
                <div
                  className="flex flex-col items-center"
                  style={{ backgroundColor: C.primaryLight, borderRadius: 12, padding: '8px 14px' }}
                >
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, lineHeight: '16px', color: C.textCaption }}>
                    리워드 적립
                  </span>
                  <span style={{ fontFamily: font, fontSize: 17, fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.34px', color: C.primary }}>
                    +{loading ? '–' : totalRewardSprouts.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 태그 진행 현황 ── */}
          <div style={{ padding: '12px 20px 0' }}>
            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: C.surface,
                borderRadius: 12,
                padding: '14px 16px',
                border: `1px solid ${C.borderDivider}`,
              }}
            >
              <span style={{ fontFamily: font, fontSize: 14, fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.42px', color: C.textTertiary }}>
                나다움 태그
              </span>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, lineHeight: '20px', letterSpacing: '-0.3px', color: C.primary }}>
                {tagCount}개 수집
              </span>
            </div>
          </div>

          {/* ── 미션 섹션 ── */}
          <div style={{ padding: '24px 20px 8px' }}>
            <p style={{ fontFamily: font, fontSize: 18, fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.36px', color: C.textPrimary }}>
              미션
            </p>
            <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.26px', color: C.textCaption, marginTop: 4 }}>
              태그를 모아 리워드를 받으세요
            </p>
          </div>

          {/* ── 미션 카드 리스트 ── */}
          <div className="flex flex-col" style={{ padding: '0 20px', gap: 10, paddingBottom: 120 }}>
            {MISSIONS.map((mission, i) => {
              const done = isCompleted(mission);
              const progress = getProgress(mission);

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 16,
                    padding: '16px',
                    border: `1px solid ${C.borderDivider}`,
                  }}
                >
                  <div className="flex items-start" style={{ gap: 14 }}>
                    {/* 아이콘 박스 (§3.11) */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        backgroundColor: done ? mission.bgColor : C.surfaceSecondary,
                        transition: 'background-color 0.3s ease',
                      }}
                    >
                      <span style={{ fontSize: 20, opacity: done ? 1 : 0.45 }}>
                        {mission.emoji}
                      </span>
                    </div>

                    {/* 미션 내용 */}
                    <div className="flex-1 min-w-0">
                      {/* 제목 + 상태 */}
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <span style={{
                          fontFamily: font, fontSize: 15, fontWeight: 600,
                          lineHeight: '20px', letterSpacing: '-0.45px',
                          color: done ? C.textPrimary : C.textTertiary,
                        }}>
                          {mission.title}
                        </span>
                        {done ? (
                          <CheckCircle color={mission.color} />
                        ) : (
                          <LockIcon />
                        )}
                      </div>

                      {/* 설명 */}
                      <p style={{
                        fontFamily: font, fontSize: 13, fontWeight: 400,
                        lineHeight: '18px', letterSpacing: '-0.26px',
                        color: C.textCaption, marginTop: 3,
                      }}>
                        {mission.description}
                      </p>

                      {/* 보상 뱃지 */}
                      <div className="flex items-center" style={{ marginTop: 8, gap: 6 }}>
                        <span style={{
                          fontFamily: font, fontSize: 12, fontWeight: 600,
                          lineHeight: '16px',
                          color: done ? mission.color : C.textDisabled,
                          backgroundColor: done ? mission.bgColor : C.surfaceSecondary,
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          {mission.rewardType === 'sprout'
                            ? `🌱 ${mission.rewardLabel}`
                            : `📋 ${mission.rewardLabel}`
                          }
                        </span>
                        {done && (
                          <span style={{
                            fontFamily: font, fontSize: 11, fontWeight: 500,
                            lineHeight: '16px', color: mission.color,
                          }}>
                            달성!
                          </span>
                        )}
                      </div>

                      {/* 프로그레스 바 (미완료) */}
                      {!done && (
                        <div style={{ marginTop: 10 }}>
                          <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                            <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.textDisabled }}>
                              {tagCount} / {mission.tagRequired}개
                            </span>
                            <span style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: C.textCaption }}>
                              {Math.round(progress * 100)}%
                            </span>
                          </div>
                          <div style={{
                            height: 6, borderRadius: 3,
                            backgroundColor: C.borderDivider, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.max(progress * 100, 2)}%`,
                              borderRadius: 3,
                              backgroundColor: progress > 0 ? mission.color : C.borderDivider,
                              transition: 'width 0.5s ease',
                              opacity: progress > 0 ? 0.6 : 0,
                            }} />
                          </div>
                        </div>
                      )}

                      {/* CTA 버튼 (완료 + 경로 있을 때) */}
                      {done && mission.ctaPath && (
                        <button
                          className="w-full cursor-pointer"
                          style={{
                            marginTop: 12,
                            height: 38,
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: mission.bgColor,
                            fontFamily: font,
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: '18px',
                            letterSpacing: '-0.26px',
                            color: mission.color,
                            transition: 'all 0.15s ease',
                          }}
                          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                          onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                          onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                          onClick={() => navigate(mission.ctaPath!)}
                        >
                          {mission.ctaLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 비로그인 오버레이 (§3.5 ConfirmDialog 스타일) ── */}
      {!loading && !isLoggedIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: C.overlay }}
        >
          <div
            className="flex flex-col items-center"
            style={{
              backgroundColor: C.surface,
              borderRadius: 24,
              border: `1px solid ${C.borderDivider}`,
              width: 320,
              padding: '40px 32px 20px',
              textAlign: 'center',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 76, height: 76, borderRadius: 38,
                backgroundColor: '#E4F7F7', marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 36 }}>🔒</span>
            </div>

            <p style={{
              fontFamily: font, fontSize: 18, fontWeight: 600,
              lineHeight: '24px', letterSpacing: '-0.34px', color: C.textPrimary,
            }}>
              로그인이 필요해요
            </p>
            <p style={{
              fontFamily: font, fontSize: 15, fontWeight: 400,
              lineHeight: '26px', letterSpacing: '-0.3px', color: C.textCaption,
              marginTop: 4,
            }}>
              리워드 미션을 확인하려면<br />로그인해주세요
            </p>

            {/* 버튼 영역 (§3.5) */}
            <div className="flex w-full" style={{ gap: 10, marginTop: 28, padding: '0' }}>
              <button
                className="flex-1 flex items-center justify-center cursor-pointer"
                style={{
                  height: 48, borderRadius: 16, border: 'none',
                  backgroundColor: '#f3f3f3',
                  fontFamily: font, fontSize: 15, fontWeight: 500,
                  lineHeight: '20px', letterSpacing: '-0.45px', color: '#525252',
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                onClick={() => navigate(-1)}
              >
                돌아가기
              </button>
              <button
                className="flex-1 flex items-center justify-center cursor-pointer"
                style={{
                  height: 48, borderRadius: 16, border: 'none',
                  backgroundColor: C.primary,
                  fontFamily: font, fontSize: 15, fontWeight: 500,
                  lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff',
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                onClick={() => navigate('/login', { state: { canGoBack: true } })}
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
