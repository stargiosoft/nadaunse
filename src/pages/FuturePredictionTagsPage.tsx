import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';
import {
  TRAIT_TAG_DICTIONARY,
  TAG_CATEGORIES,
  type TagCategory,
  type TraitTagEntry,
} from '../data/태그 정규화/traitTagDictionary';
import { supabase } from '../lib/supabase';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#41a09e',
  primaryLight: '#e8f5f5',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  white: '#ffffff',
  green: '#22c55e',
  yellow: '#eab308',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 정확도 스텝 ───────────────────────────────────────────────────────────
const ACCURACY_STEPS = [
  { min: 0, max: 2, label: '미흡', color: C.gray400, description: '태그가 너무 적어요' },
  { min: 3, max: 5, label: '최소', color: C.yellow, description: '기본적인 예측이 가능해요' },
  { min: 6, max: 14, label: '적정', color: C.primary, description: '정확도 높은 예측이 가능해요' },
  { min: 15, max: 999, label: '이상적', color: C.green, description: '최고의 예측 결과를 받아요' },
] as const;

function getAccuracyStep(count: number) {
  return ACCURACY_STEPS.find(s => count >= s.min && count <= s.max) || ACCURACY_STEPS[0];
}

// ─── 카테고리 랜덤 순환 + 긍정:부정 1:1 배치 ─────────────────────────────────
const ALL_CATEGORIES: TagCategory[] = ['실행력', '사고력', '감성', '관계', '의지력', '안정감', '진실성'];

/** Fisher-Yates 셔플 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTagPool(): TraitTagEntry[] {
  // 카테고리 순서 랜덤화
  const categories = shuffle(ALL_CATEGORIES);

  // 카테고리별 긍정/부정 분리 후 빈도순 정렬
  const posByCat = new Map<TagCategory, TraitTagEntry[]>();
  const negByCat = new Map<TagCategory, TraitTagEntry[]>();
  for (const cat of categories) {
    posByCat.set(cat, TRAIT_TAG_DICTIONARY
      .filter(t => t.category === cat && t.polarity === 'positive')
      .sort((a, b) => b.frequency - a.frequency));
    negByCat.set(cat, TRAIT_TAG_DICTIONARY
      .filter(t => t.category === cat && t.polarity === 'negative')
      .sort((a, b) => b.frequency - a.frequency));
  }

  // 긍정/부정 각각 카테고리 라운드로빈으로 flat 리스트 생성
  const posFlat: TraitTagEntry[] = [];
  const negFlat: TraitTagEntry[] = [];
  const posI = new Map<TagCategory, number>();
  const negI = new Map<TagCategory, number>();
  for (const cat of categories) { posI.set(cat, 0); negI.set(cat, 0); }

  let more = true;
  while (more) {
    more = false;
    for (const cat of categories) {
      const pt = posByCat.get(cat)!; const pi = posI.get(cat)!;
      if (pi < pt.length) { posFlat.push(pt[pi]); posI.set(cat, pi + 1); more = true; }
      const nt = negByCat.get(cat)!; const ni = negI.get(cat)!;
      if (ni < nt.length) { negFlat.push(nt[ni]); negI.set(cat, ni + 1); more = true; }
    }
  }

  // 긍정, 부정, 긍정, 부정... 순서로 1:1 인터리브
  const pool: TraitTagEntry[] = [];
  let pi = 0, ni = 0;
  while (pi < posFlat.length || ni < negFlat.length) {
    if (pi < posFlat.length) pool.push(posFlat[pi++]);
    if (ni < negFlat.length) pool.push(negFlat[ni++]);
  }

  return pool;
}

// ─── FuturePredictionTagsPage ───────────────────────────────────────────────
export function FuturePredictionTagsPage() {
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [userExistingTags, setUserExistingTags] = useState<string[]>([]);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [tagPool] = useState(() => buildTagPool());

  // 회원이면 기존 태그 로드
  useEffect(() => {
    const loadExistingTags = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_trait_tags')
        .select('tag_name')
        .eq('user_id', user.id)
        .eq('is_confirmed', true);

      if (data && data.length > 0) {
        const tagNames = data.map(t => t.tag_name);
        setUserExistingTags(tagNames);
        setSelectedTags(new Set(tagNames));
      }
    };
    loadExistingTags();
  }, []);

  // 카테고리 체크
  useEffect(() => {
    const cat = sessionStorage.getItem('fp_category');
    if (!cat) {
      navigate('/future-prediction/category', { replace: true });
    }
  }, [navigate]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const handleProceed = () => {
    if (selectedTags.size < 3) return;
    if (selectedTags.size < 7) {
      setShowWarningDialog(true);
      return;
    }
    goToLoading();
  };

  const goToLoading = async () => {
    const tagsArray = [...selectedTags];
    sessionStorage.setItem('fp_selected_tags', JSON.stringify(tagsArray));

    // 회원이면 새로 선택한 태그를 DB에 저장
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const newTags = tagsArray.filter(t => !userExistingTags.includes(t));
      if (newTags.length > 0) {
        const tagDict = new Map(TRAIT_TAG_DICTIONARY.map(t => [t.canonical, t]));
        const rows = newTags.map(tagName => {
          const entry = tagDict.get(tagName);
          return {
            user_id: user.id,
            tag_name: tagName,
            tag_type: entry?.polarity === 'negative' ? 'negative' : 'positive',
            source_type: 'self_selected',
            is_confirmed: true,
          };
        });
        await supabase.from('user_trait_tags').insert(rows);
      }
    }

    navigate('/future-prediction/loading');
  };

  const count = selectedTags.size;
  const step = getAccuracyStep(count);

  // 기존 태그 제외한 풀에서 보여줄 태그
  const filteredPool = tagPool.filter(t => !userExistingTags.includes(t.canonical));
  const visibleTags = filteredPool.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPool.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <SEO title="나다움 태그 선택" noIndex={true} />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.bg,
          overflow: 'auto',
        }}
      >
        <NavigationHeader title="태그 선택" onBack={() => navigate('/future-prediction/test')} />

        <div style={{ padding: '80px 20px 0' }}>
          {/* ── 정확도 스텝퍼 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              padding: '16px 20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px' }}>
                예측 정확도
              </p>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  backgroundColor: C.primaryLight,
                  fontFamily: font,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.primary,
                  letterSpacing: '-0.26px',
                }}
              >
                선택된 태그: {count}개
              </span>
            </div>

            {/* 4-step bar */}
            <div style={{ display: 'flex', gap: 4 }}>
              {ACCURACY_STEPS.map((s, i) => {
                const isActive = count >= s.min;
                const isCurrent = count >= s.min && count <= s.max;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: isActive ? s.color : C.gray200,
                        transition: 'background-color 0.3s ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: font,
                        fontSize: 11,
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? s.color : C.gray400,
                        letterSpacing: '-0.22px',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: step.color, letterSpacing: '-0.24px', textAlign: 'center', marginTop: 8 }}>
              {step.description}
            </p>
          </motion.div>

          {/* ── 기존 태그 (회원) ── */}
          {userExistingTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{ marginBottom: 16 }}
            >
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 8 }}>
                내 기존 태그
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {userExistingTags.map((tag, idx) => {
                  const isSelected = selectedTags.has(tag);
                  return (
                    <motion.button
                      key={`${tag}_${idx}`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${isSelected ? C.primary : C.gray200}`,
                        backgroundColor: isSelected ? C.primaryLight : C.white,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontFamily: font, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.primary : C.gray700, letterSpacing: '-0.26px' }}>
                        {tag}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── 태그 선택 영역 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 4 }}>
              나를 표현하는 태그를 골라주세요
            </p>
            <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: C.gray600, letterSpacing: '-0.24px', marginBottom: 4 }}>
              HEXACO 성격 모델 기반 · {Object.keys(TAG_CATEGORIES).length}개 카테고리
            </p>
            <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: C.primary, letterSpacing: '-0.24px', marginBottom: 12 }}>
              솔직하게 고를수록 미래를 더 정확하게 예측해요
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <AnimatePresence>
                {visibleTags.map((tag, idx) => {
                  const isSelected = selectedTags.has(tag.canonical);
                  return (
                    <motion.button
                      key={tag.canonical}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx < 5 ? idx * 0.05 : 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTag(tag.canonical)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${isSelected ? C.primary : C.gray200}`,
                        backgroundColor: isSelected ? C.primaryLight : C.white,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'border-color 0.2s ease, background-color 0.2s ease',
                      }}
                    >
                      <span style={{ fontFamily: font, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.primary : C.gray700, letterSpacing: '-0.26px' }}>
                        {tag.canonical}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <button
                onClick={handleShowMore}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.gray200}`,
                  backgroundColor: C.white,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <p style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, letterSpacing: '-0.26px' }}>
                  다른 태그 보기
                </p>
              </button>
            )}
          </motion.div>
        </div>

        {/* ── 하단 버튼 ── */}
        <div style={{ padding: '24px 20px 40px', marginTop: 'auto' }}>
          <button
            onClick={handleProceed}
            disabled={count < 3}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: count >= 3 ? C.primary : C.gray200,
              cursor: count >= 3 ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: count >= 3 ? C.white : C.gray400, letterSpacing: '-0.3px' }}>
              미래 예측하기
            </p>
          </button>
        </div>
      </div>

      {/* ── 경고 다이얼로그 ── */}
      <AnimatePresence>
        {showWarningDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              padding: 20,
            }}
            onClick={() => setShowWarningDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: C.white,
                borderRadius: 20,
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.black, letterSpacing: '-0.32px', marginBottom: 8 }}>
                태그가 부족해요
              </p>
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray600, letterSpacing: '-0.28px', lineHeight: '22px', marginBottom: 20 }}>
                태그가 부족하면 미래 예측 정확도가
                <br />
                떨어질 수 있어요. 그래도 진행할까요?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowWarningDialog(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: `1.5px solid ${C.gray200}`,
                    backgroundColor: C.white,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <p style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.gray700 }}>태그 더 선택</p>
                </button>
                <button
                  onClick={() => { setShowWarningDialog(false); goToLoading(); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: C.primary,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <p style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.white }}>진행하기</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
