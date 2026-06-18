import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabaseUrl } from '../lib/supabase';
import ArrowLeft from '../components/ArrowLeft';
import { VariationSlider } from '../components/ui/VariationSlider';

// ── Types ──

type Step = 'input' | 'result';
type BackgroundConcept = 'pure' | 'heavy' | 'natural' | 'dark';

type GeneratedImage = {
  id: number;
  src: string; // data:image/...;base64,...
  label?: string; // 항목별 생성 시 라벨
  itemPrompt?: string; // 항목별 개별 프롬프트
};

// ── Constants ──

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const C = {
  primary: '#48b2af',
  primaryDark: '#41a09e',
  primaryLight: '#f0f8f8',
  surface: '#ffffff',
  surfaceDisabled: '#f8f8f8',
  surfaceSecondary: '#f9f9f9',
  borderDefault: '#e7e7e7',
  borderDivider: '#f3f3f3',
  textPrimary: '#151515',
  textBlack: '#000000',
  textSecondary: '#525252',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  textWhite: '#ffffff',
};

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', desc: '릴스·쇼츠·틱톡', width: 1080, height: 1920 },
  { id: '3:4', label: '3:4', desc: '네이버 블로그', width: 900, height: 1200 },
  { id: '2:3', label: '2:3', desc: '로맨스 타로', width: 1000, height: 1500 },
  { id: '1:1', label: '1:1', desc: '인스타·스마트스토어 대표', width: 1080, height: 1080 },
  { id: '16:9', label: '16:9', desc: '유튜브 썸네일', width: 1280, height: 720 },
  { id: 'smartstore-detail', label: '상페', desc: '스마트스토어 상세 (860px)', width: 860, height: 1290 },
  { id: 'saju-consult', label: '약 20:9', desc: '사주GPT 캐릭터 상담', width: 1866, height: 843 },
] as const;

const REFERENCE_MODES = [
  { id: 'faithful', label: '레퍼런스 그대로', desc: '화풍·색감을 그대로 유지하고 명령어가 시킨 것만 변경 — 제미나이 사이트처럼 명령 충실. 색·스타일 유지가 목표일 때' },
  { id: 'style_only', label: '스타일만 참고', desc: '레퍼런스의 기법(붓·선·질감·마감)만 차용 — 색감·구도는 명령어/주제대로. 기법 정확하나 소재가 새어들 수 있음' },
  { id: 'style_text_only', label: '스타일만 (텍스트)', desc: '레퍼런스 이미지를 모델에 안 보냄 — 소재·색 누출 거의 없이 기법만, 색감·구도는 명령어대로' },
  { id: 'style_and_character', label: '캐릭터+스타일', desc: '레퍼런스 인물·얼굴까지 유지' },
  { id: 'outpaint', label: '여백 채우기', desc: '레퍼런스 그대로, 빈 공간만 자동 확장' },
] as const;

const IMAGE_COUNTS = [1, 2, 3, 4] as const;

const CUT_PRESETS = [
  { id: 'product', label: '제품컷' },
  { id: 'wearing', label: '착용컷' },
  { id: 'detail', label: '디테일컷' },
  { id: 'white', label: '흰배경컷' },
] as const;

const PRODUCT_CUTS = [
  { id: 'flatlay', label: '플랫레이' },
  { id: 'holder', label: '홀더컷' },
  { id: 'props', label: '소품컷' },
  { id: 'slab', label: '슬랩컷' },
] as const;

const BG_CONCEPTS: { id: BackgroundConcept; label: string }[] = [
  { id: 'pure', label: '퓨어' },
  { id: 'heavy', label: '무드' },
  { id: 'natural', label: '자연' },
  { id: 'dark', label: '다크' },
];

const WHITE_TYPES = [
  { id: 'circle', label: '정면 (원형)' },
  { id: 'diagonal', label: '사선 앵글' },
] as const;

const WEARING_POSES = [
  { id: 'wrist', label: '손목 클로즈업' },
  { id: 'adjust', label: '고쳐끼기' },
  { id: 'face_casual', label: '얼굴 턱' },
  { id: 'face_elegant', label: '자유 포즈' },
] as const;

const WEARING_OUTFITS_FEMALE = [
  { id: 'cream_chiffon',  label: '크림 시폰',    outfit: '크림 아이보리색 시폰 블라우스 — 넥라인: 넓은 V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형(풍성하게 떨어짐), 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈 플로우' },
  { id: 'white_silk',     label: '화이트 실크',   outfit: '순백색 실크 새틴 블라우스 — 넥라인: 클린 라운드넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 커프스밴드에 플리츠 정확히 2개·버튼 1개, 핏: 세미핏' },
  { id: 'ivory_lace',     label: '아이보리 레이스',outfit: '아이보리색 레이스 블라우스 — 넥라인: 하이넥 레이스 칼라, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 레이스 나팔형 플레어(개더링 있음·밴드 없음), 핏: 루즈' },
  { id: 'beige_ruffle',   label: '베이지 러플',   outfit: '베이지 시폰 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 소매 끝 러플 플레어(개더링 풍성·밴드 없음), 핏: 루즈' },
  { id: 'cream_ribbed',   label: '크림 리브드',   outfit: '크림색 리브드 코튼 탑 — 넥라인: 심플 라운드넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 리브드 밴드(개더링·플리츠 없이 밴드에 바로 봉제), 핏: 세미핏' },
  { id: 'white_drape',    label: '화이트 드레이프',outfit: '흰색 드레이프 시폰 탑 — 넥라인: 비대칭 원숄더, 소매: 한쪽 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 드레이프형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈 드레이프' },
  { id: 'off_shoulder',   label: '오프숄더',      outfit: '크림 아이보리 오프숄더 탑 — 넥라인: 오프숄더 스트레이트, 소매: 소매 없음(어깨·쇄골 완전 노출), 핏: 세미핏' },
  { id: 'light_gray',     label: '라이트 그레이', outfit: '연한 그레이 시폰 블라우스 — 넥라인: 와이드 V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'peach_pink',     label: '피치 핑크',     outfit: '피치 핑크 실크 블라우스 — 넥라인: 스퀘어넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'light_blue',     label: '라이트 블루',   outfit: '연한 하늘색 시폰 블라우스 — 넥라인: 라운드넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'lavender',       label: '라벤더',        outfit: '라벤더 퍼플 실크 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 새틴 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'mint_green',     label: '민트 그린',     outfit: '민트 그린 시폰 블라우스 — 넥라인: 라운드넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'soft_yellow',    label: '소프트 옐로우', outfit: '소프트 옐로우 린넨 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'rose_gold',      label: '로즈 골드',     outfit: '로즈 골드 새틴 탑 — 넥라인: 카울넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 새틴 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'powder_pink',    label: '파우더 핑크',   outfit: '파우더 핑크 시폰 블라우스 — 넥라인: 라운드넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'terracotta',     label: '테라코타',      outfit: '테라코타 린넨 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 좁은 커프스밴드에 플리츠 정확히 2개·버튼 1개, 핏: 루즈' },
  { id: 'olive_green',    label: '올리브 그린',   outfit: '올리브 그린 실크 블라우스 — 넥라인: 칼라 없는 라운드넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 세미핏' },
  { id: 'camel_brown',    label: '카멜 브라운',   outfit: '카멜 브라운 새틴 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 새틴 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'burgundy',       label: '버건디',        outfit: '버건디 시폰 블라우스 — 넥라인: 딥 V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'navy_silk',      label: '네이비 실크',   outfit: '네이비 블루 실크 블라우스 — 넥라인: 스퀘어넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 새틴 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'mustard',        label: '머스터드',      outfit: '머스터드 옐로우 시폰 블라우스 — 넥라인: 라운드넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'coral',          label: '코랄',          outfit: '코랄 린넨 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 좁은 커프스밴드에 플리츠 정확히 2개·버튼 1개, 핏: 루즈' },
  { id: 'sage',           label: '세이지 그린',   outfit: '세이지 그린 시폰 블라우스 — 넥라인: 라운드넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
  { id: 'dusty_rose',     label: '더스티 로즈',   outfit: '더스티 로즈 실크 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨에서 손목으로 균일하게 슬림한 직선형, 커프스: 좁은 새틴 커프스밴드(개더링·플리츠 없이 직봉제·버튼 없음), 핏: 세미핏' },
  { id: 'black_chiffon',  label: '블랙 시폰',     outfit: '블랙 시폰 블라우스 — 넥라인: V넥, 소매: 긴소매·소매통 어깨~손목 전체 루즈하게 드리워지는 플로우형, 커프스: 개더링·플리츠 없이 직선 컷 플레인 헴(밴드 없음), 핏: 루즈' },
];

const WEARING_OUTFITS_MALE = [
  { id: 'white_cotton', label: '화이트 셔츠', outfit: '화이트 코튼 셔츠 — 넥라인: 레귤러 칼라, 소매: 긴소매, 커프스: 버튼 두 개 있는 배럴 커프스, 핏: 레귤러' },
  { id: 'cream_linen',  label: '크림 린넨',   outfit: '크림 린넨 셔츠 — 넥라인: 밴드 칼라(스탠드업), 소매: 긴소매, 커프스: 플레인 밴드 커프스, 핏: 루즈' },
  { id: 'light_gray_m', label: '라이트 그레이',outfit: '연한 그레이 코튼 셔츠 — 넥라인: 레귤러 칼라, 소매: 긴소매, 커프스: 버튼 한 개 있는 배럴 커프스, 핏: 슬림' },
  { id: 'navy_m',       label: '네이비 셔츠', outfit: '네이비 코튼 셔츠 — 넥라인: 레귤러 칼라, 소매: 긴소매, 커프스: 버튼 두 개 있는 배럴 커프스, 핏: 레귤러' },
  { id: 'beige_m',      label: '베이지 셔츠', outfit: '베이지 린넨 셔츠 — 넥라인: 밴드 칼라, 소매: 긴소매, 커프스: 플레인 밴드 커프스, 핏: 루즈' },
  { id: 'black_m',      label: '블랙 셔츠',   outfit: '블랙 코튼 셔츠 — 넥라인: 레귤러 칼라, 소매: 긴소매, 커프스: 버튼 한 개 있는 배럴 커프스, 핏: 슬림' },
];

const PRODUCTS = [
  // 연애운
  { id: 'rainbow_moonstone', category: 'love',    label: '레인보우 문스톤',         color: '화이트 크리스탈', stone: '레인보우 문스톤' },
  { id: 'coral_gold',        category: 'love',    label: '산호+실버골드',           color: '레드 코랄',       stone: '산호' },
  { id: 'emerald_rutile',    category: 'love',    label: '에메랄드+금침수정',       color: '초록 골드',       stone: '에메랄드, 금침수정' },
  { id: 'coral_turquoise',   category: 'love',    label: '산호+터키석+파이라이트',  color: '레드 코랄',       stone: '산호, 터키석, 골드파이라이트' },
  { id: 'red_zircon_green_onyx', category: 'love', label: '레드 지르콘+그린 오닉스', color: '레드',            stone: '레드 지르콘, 그린 오닉스' },
  // 재물운
  { id: 'green_onyx_a',      category: 'money',   label: '그린오닉스 A',            color: '초록',            stone: '그린 오닉스' },
  { id: 'green_onyx_b',      category: 'money',   label: '그린오닉스 B',            color: '초록',            stone: '그린 오닉스' },
  { id: 'carnelian',         category: 'money',   label: '카넬리언',                color: '주황 오렌지',     stone: '카넬리언' },
  { id: 'black_tiger_eye',   category: 'money',   label: '블랙호안석',              color: '검정',            stone: '블랙 호안석' },
  // 액막이
  { id: 'onyx',              category: 'shield',  label: '오닉스',                  color: '검정',            stone: '오닉스' },
  { id: 'hematite',          category: 'shield',  label: '헤마타이트',              color: '다크 그레이',     stone: '헤마타이트' },
  { id: 'black_spinel',      category: 'shield',  label: '블랙스피넬+실버골드',    color: '검정',            stone: '블랙 스피넬' },
  { id: 'goldstone',         category: 'shield',  label: '금요석+동',               color: '검정',            stone: '금요석' },
  // 행운
  { id: 'apatite_spinel',    category: 'luck',    label: '아파타이트+블랙스피넬',  color: '파란',            stone: '아파타이트, 블랙 스피넬' },
  { id: 'turquoise',         category: 'luck',    label: '터키석',                  color: '터키석 청록',     stone: '터키석' },
  { id: 'apatite',           category: 'luck',    label: '아파타이트',              color: '파란',            stone: '아파타이트' },
  { id: 'apatite_red',       category: 'luck',    label: '아파타이트+레드비즈',     color: '파란',            stone: '아파타이트' },
  // 학업
  { id: 'lapis',             category: 'study',   label: '라피스라줄리',            color: '파란 네이비',     stone: '라피스라줄리' },
  // 인간관계
  { id: 'mother_pearl',      category: 'harmony', label: '자개석',                  color: '화이트 크리스탈', stone: '자개석' },
  { id: 'sea_pearl',         category: 'harmony', label: '해수자개',                color: '화이트 크리스탈', stone: '해수자개' },
  { id: 'labradorite',       category: 'harmony', label: '래브라도라이트',          color: '다크 그레이',     stone: '래브라도라이트' },
];

const PRODUCT_CATEGORIES = [
  { id: 'love',    label: '💕 연애운' },
  { id: 'money',   label: '💰 재물운' },
  { id: 'shield',  label: '🧿 액막이' },
  { id: 'luck',    label: '🍀 행운' },
  { id: 'study',   label: '📚 학업운' },
  { id: 'harmony', label: '🤝 인간관계' },
];

function getOutfitForColor(color: string, gender: 'female' | 'male' = 'female'): string {
  const lc = color.toLowerCase();
  if (gender === 'male') {
    if (['빨간', '빨강', '레드', '코랄', '산호', '핑크', '분홍', '주황', '오렌지'].some(w => lc.includes(w)))
      return '크림 아이보리 코튼 셔츠';
    if (['파란', '파랑', '블루', '보라', '퍼플', '네이비', '청록', '터코이즈', '민트'].some(w => lc.includes(w)))
      return '화이트 코튼 셔츠';
    if (['초록', '그린', '카키', '올리브'].some(w => lc.includes(w)))
      return '베이지 린넨 셔츠';
    if (['갈색', '브라운', '베이지'].some(w => lc.includes(w)))
      return '아이보리 코튼 셔츠';
    if (['검정', '블랙', '차콜', '그레이', '회색', '다크'].some(w => lc.includes(w)))
      return '크림 화이트 코튼 셔츠';
    if (['노란', '노랑', '옐로우', '골드', '금색'].some(w => lc.includes(w)))
      return '아이보리 화이트 셔츠';
    if (['흰', '화이트', '투명', '크리스탈'].some(w => lc.includes(w)))
      return '연한 그레이 코튼 셔츠';
    return '크림 아이보리 코튼 셔츠';
  }
  // 여성: 페미닌한 소재
  if (['빨간', '빨강', '레드', '코랄', '산호', '핑크', '분홍', '주황', '오렌지'].some(w => lc.includes(w)))
    return '크림 아이보리 시폰 러플 블라우스';
  if (['파란', '파랑', '블루', '보라', '퍼플', '네이비', '청록', '터코이즈', '민트'].some(w => lc.includes(w)))
    return '화이트 실크 새틴 블라우스';
  if (['초록', '그린', '카키', '올리브'].some(w => lc.includes(w)))
    return '베이지 시폰 블라우스';
  if (['갈색', '브라운', '베이지'].some(w => lc.includes(w)))
    return '아이보리 실크 블라우스';
  if (['검정', '블랙', '차콜', '그레이', '회색', '다크'].some(w => lc.includes(w)))
    return '크림 화이트 시폰 블라우스';
  if (['노란', '노랑', '옐로우', '골드', '금색'].some(w => lc.includes(w)))
    return '아이보리 레이스 트리밍 블라우스';
  if (['흰', '화이트', '투명', '크리스탈'].some(w => lc.includes(w)))
    return '연한 그레이 실크 시폰 블라우스';
  return '크림 아이보리 시폰 블라우스';
}

function getColorScene(color: string): { surface: string; props: string; light: string } {
  const lc = color.toLowerCase();
  if (['빨간', '빨강', '레드', '코랄', '산호', '핑크', '분홍', '주황', '오렌지'].some(w => lc.includes(w)))
    return { surface: '밝은 크림/베이지 트래버틴 스톤 슬랩(모서리가 살짝 보이도록 비스듬히)', props: '프레임 한쪽 구석에 코튼플라워 한 송이만', light: '밝고 부드러운 자연광, 중성 색온도' };
  if (['파란', '파랑', '블루', '보라', '퍼플', '민트', '터코이즈', '청록', '네이비'].some(w => lc.includes(w)))
    return { surface: '밝은 화이트/크림 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 화이트 드라이플라워 한 송이만', light: '밝고 부드러운 자연광, 쿨톤' };
  if (['초록', '그린', '카키', '올리브'].some(w => lc.includes(w)))
    return { surface: '밝은 크림 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 유칼립투스 잎 한두 개만', light: '밝고 부드러운 자연광, 중성 색온도' };
  if (['갈색', '브라운', '베이지'].some(w => lc.includes(w)))
    return { surface: '크림/베이지 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 코튼플라워 한 송이만', light: '따뜻하고 밝은 자연광' };
  if (['검정', '블랙', '차콜', '그레이', '회색', '다크'].some(w => lc.includes(w)))
    return { surface: '라이트 그레이 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 화이트 드라이플라워 한 송이만', light: '밝은 사이드 스튜디오 조명' };
  if (['노란', '노랑', '옐로우', '골드', '금색'].some(w => lc.includes(w)))
    return { surface: '크림/화이트 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 아이보리 드라이플라워 한 송이만', light: '밝고 부드러운 자연광' };
  if (['흰', '화이트', '투명', '크리스탈'].some(w => lc.includes(w)))
    return { surface: '크림/화이트 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 페일 드라이플라워 한 송이만', light: '밝고 소프트한 자연광' };
  return { surface: '밝은 크림/베이지 트래버틴 스톤 슬랩(모서리가 살짝 보이도록 비스듬히)', props: '프레임 한쪽 구석에 코튼플라워 한 송이만', light: '밝고 부드러운 자연광' };
}

function getColorBackground(color: string): string {
  const s = getColorScene(color);
  return `${s.surface}, ${s.props}, ${s.light}`;
}

function getHeavyScene(): { surface: string; props: string; light: string } {
  return {
    surface: '쿨 라이트그레이(#C8C8C8~#D5D5D5) 시멘트 보드 슬랩 — 베이지·웜톤·다크그레이 절대 금지, 정확히 이 쿨그레이 범위 고수. 표면은 매끄럽되 수평 스트라이에이션과 미세 스펙클이 일정하게 분포. 슬랩 두께와 날카로운 모서리가 비스듬히 전면에 보임. 배경은 동일 쿨그레이 계열 플랫 서피스. 광택·반사 전혀 없이 완전 매트',
    props: '프레임 한쪽 구석에 화이트 안개꽃(gypsophila) 또는 실버 팜파스 그라스 드라이플라워 한 줄기만. 목화솜(cotton flower)·코튼플라워·풍성한 흰 솜털 꽃봉오리 절대 금지',
    light: '대형 소프트박스 스튜디오 스트로브 — 한쪽 45도 사이드에서 강하게 조사하여 팔찌와 슬랩에 방향감 있고 선명한 그림자 형성, 입체감 극대화. 쿨 화이트 5500K. 탁하거나 뿌옇거나 노이즈 없이 선명·크리스프·하이콘트라스트. 미디엄 포맷 카메라 + 매크로 렌즈 수준의 핀샤프. 스마트폰·아마추어·셀카봉 느낌 절대 금지. 하이엔드 상업 주얼리 스튜디오 화보',
  };
}

function getNaturalScene(): { surface: string; props: string; light: string } {
  return {
    surface: '결이 섬세한 밝은 오크 원목 슬라이스 오브제 위에 팔찌 배치. 배경은 밝은 크림/아이보리 플랫 서피스. 소품 없이 원목과 팔찌만',
    props: '소품 없음. 그림자 최소화',
    light: '부드럽게 확산된 자연광 — 방향감 없이 균일하게 퍼진 소프트 라이팅. 팔찌·원목 아래 아주 옅은 그림자만, 식물 보케 그림자 없음. 전체적으로 밝고 클린한 톤. 모던 라이프스타일 에디토리얼 무드',
  };
}

function getDarkScene(): { surface: string; props: string; light: string } {
  return {
    surface: '다크 차콜/슬레이트 스톤 타일 — 거칠고 납작한 블랙 슬레이트 석판 위에 팔찌 배치. 슬레이트 표면의 층리(layering) 결과 불규칙한 질감이 실제처럼 리얼하게 보임. 타일 주변 바닥에 크림/아이보리 린넨 패브릭이 자연스럽게 드레이프됨. 배경은 다크 차콜 그레이 플랫 서피스. 광택 없이 완전 매트',
    props: '매끄럽게 다듬어진 블랙 리버 스톤(강돌) 2–3개를 슬레이트 주변에 자연스럽게 배치. 목화솜(cotton flower)·코튼플라워·안개꽃·팜파스·드라이플라워·꽃 종류 일체 절대 금지',
    light: '드라마틱한 사이드 자연광. 팔찌와 돌에 부드러운 하이라이트, 슬레이트 위에 얕은 그림자. 전체적으로 어둡고 무게감 있는 톤 — 차콜·블랙·딥그레이 팔레트. 고급 주얼리 무드 화보',
  };
}

function getWearingBg(outfit: string): string {
  const lc = outfit.toLowerCase();
  const base = '전문 사진 스튜디오 배경지. 소프트박스 조명의 자연스러운 명암 그라데이션(중앙 밝고 가장자리 살짝 어두운)으로 깊이감 있게 표현. 하이엔드 주얼리 브랜드 스튜디오 촬영 느낌.';
  if (['블랙', '버건디', '네이비'].some(w => lc.includes(w)))
    return `밝은 크림 아이보리 배경지 — 의상과 밝기 대비로 선명하게. ${base}`;
  if (['라벤더', '퍼플'].some(w => lc.includes(w)))
    return `소프트 라벤더 화이트 배경지 (연한 라벤더 빛이 살짝 감도는 크림). ${base}`;
  if (['피치', '핑크', '파우더', '더스티 로즈', '로즈 골드'].some(w => lc.includes(w)))
    return `따뜻한 블러쉬 크림 배경지 (연한 핑크 빛이 감도는 아이보리). ${base}`;
  if (['민트', '세이지', '올리브'].some(w => lc.includes(w)))
    return `소프트 그린 크림 배경지 (연한 세이지 빛이 감도는 아이보리). ${base}`;
  if (['하늘', '라이트 블루', '연한 하늘'].some(w => lc.includes(w)))
    return `소프트 스카이 화이트 배경지 (연한 하늘빛이 감도는 크림). ${base}`;
  if (['머스터드', '옐로우', '소프트 옐로우'].some(w => lc.includes(w)))
    return `따뜻한 버터 크림 배경지 (연한 골든 빛이 감도는 아이보리). ${base}`;
  if (['테라코타', '코랄'].some(w => lc.includes(w)))
    return `따뜻한 샌드 베이지 배경지 (연한 오렌지 빛이 감도는 크림). ${base}`;
  if (['카멜', '브라운'].some(w => lc.includes(w)))
    return `따뜻한 카멜 크림 배경지 (연한 브라운 빛이 감도는 베이지). ${base}`;
  return `소프트 크림 아이보리 배경지. ${base}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const FEMALE_LOOKS = [
  '한국 20대 여성 전문 주얼리 모델. 밝고 균일한 아이보리 피부, 매끄러운 단발 흑발, 또렷한 이목구비, 냉기 있는 단정한 표정',
  '한국 20대 여성 패션 모델. 웜톤 밝은 피부, 부드럽게 웨이브진 긴 갈색 헤어, 입술이 도드라지는 우아한 이목구비, 세련된 표정',
  '한국 20대 여성 뷰티 모델. 크리미한 밝은 피부, 깔끔하게 묶은 하이 포니테일, 청순하고 선명한 이목구비, 자연스럽고 밝은 표정',
  '한국 20대 여성 럭셔리 주얼리 모델. 골든 베이지 피부, 긴 스트레이트 흑발, 고혹적이고 성숙한 이목구비, 차분한 눈빛',
  '한국 20대 여성 화보 모델. 쿨톤 밝은 피부, 귀 위로 올라오는 짧은 보브컷, 모던하고 강인한 이목구비, 도시적인 표정',
  '한국 20대 여성 주얼리 화보 모델. 밝은 자연 피부, 어깨 길이의 레이어드 컷, 부드럽고 로맨틱한 이목구비, 따뜻한 미소',
];
const MALE_LOOKS = [
  '한국 20대 남성 주얼리 모델. 밝은 피부, 깔끔한 투블럭 헤어, 선명한 이목구비, 신뢰감 있는 표정',
  '한국 20대 남성 패션 모델. 자연 피부톤, 뒤로 넘긴 슬릭백, 날카롭고 지적인 이목구비',
  '한국 20대 남성 화보 모델. 따뜻한 피부톤, 자연스러운 미디엄 헤어, 친근하고 부드러운 이목구비',
];

function getModelAppearance(color: string, gender: 'female' | 'male'): string {
  const key = color.trim().toLowerCase() || 'default';
  const pool = gender === 'female' ? FEMALE_LOOKS : MALE_LOOKS;
  return pool[hashString(key) % pool.length];
}

function buildCutPrompt(cutId: string, color: string, stoneName: string, gender?: 'female' | 'male', pose?: string, subType?: string, outfitOverride?: string, hasStoneRef?: boolean, bgConcept?: BackgroundConcept): string {
  const stone = stoneName.trim();
  const productLabel = [color.trim(), stone ? `${stone} 원석` : ''].filter(Boolean).join(' ');
  // 원석 레퍼런스가 있을 때는 "원본 100% 재현" 대신 비즈·스페이서만 잠금 → stoneGuidePreamble이 원석을 따로 지시
  const fidelityNote = hasStoneRef
    ? '【중요】레퍼런스 이미지의 팔찌 비즈(색상·배열·크기·형태·소재)와 골드 스페이서를 절대 변형하지 말 것. 구도와 배경만 변경할 것. 팔찌의 원석/펜던트 디자인은 별도 원석 상세 레퍼런스 기준으로 교체. 【촬영 기준】한국 고급 주얼리 브랜드 스튜디오 화보. 소프트박스 스튜디오 조명, 미디엄 포맷 카메라. 선명한 핀포커스, 완벽한 노출. 저렴하거나 아마추어 느낌 절대 금지. '
    : '【중요】레퍼런스 이미지의 팔찌 디자인(비즈 색상·배열·크기·형태·소재)을 절대 변형하지 말 것. 팔찌 원본을 100% 그대로 재현하고 구도와 배경만 변경할 것. 【촬영 기준】한국 고급 주얼리 브랜드 스튜디오 화보. 소프트박스 스튜디오 조명, 미디엄 포맷 카메라. 선명한 핀포커스, 완벽한 노출. 저렴하거나 아마추어 느낌 절대 금지. ';
  const prefix = fidelityNote + (productLabel ? `${productLabel} ` : '');
  const scene = bgConcept === 'heavy'
    ? getHeavyScene()
    : bgConcept === 'natural'
      ? getNaturalScene()
      : bgConcept === 'dark'
        ? getDarkScene()
        : (color.trim() ? getColorScene(color) : { surface: '크림/베이지 트래버틴 스톤 슬랩', props: '프레임 한쪽 구석에 코튼플라워 한 송이', light: '밝고 부드러운 자연광' });

  switch (cutId) {
    case 'product': {
      if (subType === 'holder')
        return `${prefix}팔찌 홀더 제품 사진. 화이트 또는 크림 원통형 주얼리 디스플레이 롤에 팔찌 한 개가 끼워진 상태. ${scene.surface} 위에 롤을 비스듬히 놓고 위에서 살짝 내려다보는 앵글. 롤 옆에 ${scene.props}. 탁하거나 흐릿한 느낌 없이 선명하고 밝게. ${scene.light}. 한국 고급 주얼리 브랜드 상업 사진.`;
      if (subType === 'props')
        return `${prefix}팔찌 소품 연출 제품 사진. ${scene.surface} 위에 팔찌를 원형으로 놓고, 배경 상단에 ${scene.props}가 아웃포커스로 흐릿하게 보이는 라이프스타일 구도. 살짝 위에서 내려다보는 앵글. ${scene.light}. 럭셔리 주얼리 라이프스타일 사진.`;
      if (subType === 'slab')
        return `${prefix}팔찌 슬랩 앵글 제품 사진. ${scene.surface} 위에 팔찌를 원형으로 놓고, 슬랩의 모서리와 두께감이 전면에 보이도록 비스듬한 앵글로 촬영. 배경에 ${scene.props}가 아웃포커스로 흐릿하게 보임. ${scene.light}. 럭셔리 주얼리 상업 사진.`;
      // flatlay (default)
      return `${prefix}팔찌 플랫레이 제품 사진. ${scene.surface} 위에 팔찌를 완전한 정원형으로 올려놓고 정수리 방향에서 수직으로 내려다보는 오버헤드 앵글. 소품 없이 팔찌만, 미니멀하고 깔끔한 구도. ${scene.light}. 럭셔리 주얼리 상업 사진.`;
    }
    case 'wearing': {
      const g = gender ?? 'female';
      const outfit = outfitOverride || (color.trim() ? getOutfitForColor(color, g) : (g === 'male' ? '크림 아이보리 코튼 셔츠' : '크림 아이보리 시폰 블라우스'));
      const wearingBg = getWearingBg(outfit);
      const modelLook = getModelAppearance(color + (stoneName || ''), g);
      const genderLabel = g === 'male' ? '남성' : '여성';
      const wristDesc = g === 'male' ? '단정한 남성 손목' : '가느다랗고 매끄러운 여성 손목';
      const noFace = '【카메라 크롭 강제】프레임을 반드시 쇄골~어깨 높이로 자를 것. 턱·입술·코·눈·이마·두발 모두 프레임 밖. 인물의 목 위는 단 1픽셀도 프레임 안에 들어오지 않는다. ';
      const modelLock = `【모델 외형 고정 — 헤어 길이·색상·스타일·피부톤·이목구비·체형 변형 절대 금지】슬림한 전문 주얼리 화보 모델 체형(마른 체형, 가늘고 긴 팔·손목). ${modelLook}`;
      const outfitLock = `【의상 스펙 완전 고정 — 아래 항목 변형 절대 금지】①커프스 형태(밴드 유무·플리츠 개수 정확히 일치·버튼 위치) ②넥라인 형태 ③소재·소매 형태 ④핏. 하이엔드 럭셔리 주얼리 화보 스타일링, 스튜디오 전 완벽히 스팀·다림질된 상태, 럭셔리 패션지(보그·엘르) 화보 품격. 【의상 상세 스펙】${outfit}`;
      if (pose === 'adjust')
        return `${prefix}${noFace}한국 고급 주얼리 브랜드 화보. 모델: ${modelLock}. 【구도】상반신 미디엄샷 — 가슴·어깨·상체가 프레임 상단을 자연스럽게 채우고, 양손이 프레임 하단 중앙에 위치. 팔찌를 착용한 손목을 정면 아래쪽으로 살짝 내밀고, 반대 손 손가락 두세 개가 팔찌를 살며시 고쳐끼는 동작. 상체는 아웃포커스 배경처럼 부드럽게 블러. 얼굴은 완전히 프레임 밖. 의상: ${outfitLock}. 배경: ${wearingBg}. 소프트 디퓨즈드 조명. 팔찌에 핀포커스.`;
      if (pose === 'face_casual')
        return `${prefix}한국 고급 주얼리 브랜드 화보. 모델: ${modelLock}. 팔찌를 착용한 손을 볼 옆에 자연스럽게 가져다 댄 포즈. 【하관 크롭】프레임 상단에 모델의 턱·입술·코까지만 보이고 눈·이마는 반드시 프레임 밖 위쪽으로 잘릴 것. 목선·쇄골이 아래에 보임. 부드럽고 자연스러운 분위기. 의상: ${outfitLock}. 배경: ${wearingBg}. 소프트박스 조명. 팔찌에 핀포커스.`;
      if (pose === 'face_elegant')
        return `${prefix}${noFace}한국 고급 주얼리 브랜드 화보. 모델: ${modelLock}. 주얼리 화보 모델 자유 포즈 — 아래 중 하나: (1) 양 손목을 교차해 앞으로 내민 포즈, (2) 팔찌 착용 손을 반대 손이 살며시 받치며 손목을 위로 세운 포즈, (3) 손목을 어깨 높이로 들어 팔찌를 강조하는 사이드 포즈, (4) 손목을 쇄골 앞에 가볍게 올린 포즈. 얼굴은 완전히 프레임 밖. 손·손목·팔·쇄골·상체만. 의상: ${outfitLock}. 배경: ${wearingBg}. 소프트박스 조명. 팔찌에 핀포커스.`;
      // wrist (default)
      return `${prefix}한국 고급 주얼리 브랜드 화보. 모델: ${modelLock}. 【크롭 강제 — 손목 타이트 클로즈업】프레임에 손·손목·손목 위 팔뚝 아래 1/3만 담을 것. 어깨·쇄골·상체·얼굴은 프레임에 단 1픽셀도 들어오지 않음. 이것은 전신샷이나 상반신샷이 절대 아님. 【구도】${wristDesc}을 카메라 정면으로 수직에 가깝게 세워 뻗은 상태, 손가락은 자연스럽게 아래로 살짝 꺾여 이완. 팔찌가 손목 중앙에 수평으로 위치. 소매 끝이 프레임 하단 가장자리에 살짝 걸쳐 보임. 손목이 프레임 세로 길이의 70% 이상을 차지하는 익스트림 클로즈업. 아이레벨 또는 살짝 로우 앵글. 의상: ${outfitLock}. 배경: ${wearingBg}. 소프트박스 조명. 팔찌에 핀포커스.`;
    }
    case 'detail':
      return `${prefix}팔찌 클로즈업 디테일 사진. ${scene.surface} 위에 팔찌를 일직선으로 뻗게 놓고 카메라를 낮춰 수평에 가까운 낮은 앵글(eye-level)로 촬영. 팔찌가 프레임을 가득 채우도록 가까이. 배경 상단에 ${scene.props}가 아웃포커스로 흐릿하게 보임. ${stone ? `${stone} 원석의` : '비즈의'} 색감·질감이 선명하게 보이도록. 팔찌의 비즈 배열·색상·형태를 절대 변형하지 말 것. ${scene.light}. 럭셔리 주얼리 상업 사진.`;
    case 'white': {
      if (subType === 'diagonal')
        return `${prefix}팔찌 흰 배경 사선 앵글 제품 사진. 배경은 완전한 순수 흰색(RGB 255,255,255). 【앵글 강제】카메라를 팔찌 측면 30~40도 높이에 위치 — 팔찌가 타원형(ellipse)으로 보이며 앞쪽 비즈가 크고 뒤쪽 비즈가 작아지는 뚜렷한 원근감. 위에서 바라보는 오버헤드(flat-lay, 정원형) 절대 금지. 팔찌의 두께와 비즈의 3D 형태가 측면에서 보일 것. 팔찌 아래 자연스럽고 부드러운 그림자(opacity 15~25%). 스튜디오 소프트박스 조명, 중성 색온도. 소품 없이 팔찌만. 스마트스토어 상업 사진.`;
      // circle (default)
      return `${prefix}팔찌 흰 배경 정면 제품 사진. 배경은 완전한 순수 흰색(RGB 255,255,255)으로 회색·베이지·크림 절대 금지. 팔찌를 완전한 정원형(perfect circle)으로 펼쳐 이미지 정중앙에 배치, 찌그러지거나 타원형이 되지 않도록. 팔찌 바로 아래에 매우 옅고 부드러운 그림자(opacity 10~15% 수준)만 살짝 표현. 스튜디오 소프트박스 조명, 중성 색온도. 소품 없이 팔찌만. 스마트스토어 대표 이미지용 상업 사진.`;
    }
    default:
      return '';
  }
}

const FILE_FORMATS = [
  { id: 'png', label: 'PNG', desc: '고화질·투명 배경' },
  { id: 'jpg', label: 'JPG', desc: '작은 용량' },
  { id: 'webp', label: 'WebP', desc: '웹 최적화' },
] as const;

// 흰 여백 자동 채우기용: 레퍼런스를 선택된 비율에 맞춰 흰 padding으로 감싼 base64를 반환.
// 이렇게 하면 모델이 "어디를 채워야 하는지" 픽셀 레벨로 보게 되어 outpaint 정확도가 크게 올라감.
async function padReferenceForOutpaint(rawBase64: string, targetW: number, targetH: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetAspect = targetW / targetH;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      // 비율이 거의 같으면 padding 불필요
      if (Math.abs(targetAspect - imgAspect) < 0.01) {
        resolve(rawBase64);
        return;
      }
      let canvasW: number, canvasH: number;
      if (imgAspect > targetAspect) {
        // 레퍼런스가 더 가로로 길다 → 위/아래에 흰 padding (캔버스 폭은 그대로, 높이만 늘림)
        canvasW = img.naturalWidth;
        canvasH = Math.round(img.naturalWidth / targetAspect);
      } else {
        // 레퍼런스가 더 세로로 길다 → 좌/우에 흰 padding
        canvasH = img.naturalHeight;
        canvasW = Math.round(img.naturalHeight * targetAspect);
      }
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      const x = Math.round((canvasW - img.naturalWidth) / 2);
      const y = Math.round((canvasH - img.naturalHeight) / 2);
      ctx.drawImage(img, x, y);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl.split(',')[1] || rawBase64);
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = `data:image/png;base64,${rawBase64}`;
  });
}

// 멀티 생성(생성 개수 ≥ 2)에서 매 호출이 동일 prompt+레퍼런스라 결과가 너무 비슷하게 나오는 문제를 해결하기 위해,
// 호출별로 카메라/프레이밍/조명/표정/동작/시간대를 다르게 지정하는 directive를 백엔드 최상위 블록으로 주입한다.
// 카메라 차원만 흔들면 모델이 큰 차이를 못 만드므로, 콘텐츠 레벨(표정·동작·시간대)까지 같이 분기해야 사람 눈에 "다르다"고 느껴진다.
// 컷별로 순환할 앵글 후보. angleVariation 슬라이더가 0이면 directive에 포함하지 않음.
const ANGLE_PRESETS = [
  '정면 아이레벨 — 평범하고 자연스러운 시점',
  '로우 앵글 — 살짝 올려다보는 시점',
  '하이 앵글 — 살짝 내려다보는 시점',
  '사이드/오버더숄더 — 비스듬한 시점',
] as const;

// 슬라이더(0~100) → 앵글 강조 어조
function angleAdjective(v: number): string {
  if (v < 41) return '아주 살짝';
  if (v < 71) return '뚜렷하게';
  return '강하게';
}

// 사용자가 보는 helper 텍스트 (Slider 아래 보조 설명)
export function angleHelperText(v: number): string {
  if (v < 15) return '앵글 변화 없음 — 모든 컷이 같은 시점';
  if (v < 41) return '약한 앵글 변화 — 정면 위주, 미세한 시점 차이';
  if (v < 71) return '다양한 앵글 — 로우·하이·사이드 시점이 뚜렷하게 섞임';
  return '강한 앵글 변주 — 익스트림 시점까지 적극 활용';
}

export function imageHelperText(v: number): string {
  if (v < 15) return '거의 동일한 결과 — 컷 간 차이 최소';
  if (v < 41) return '비슷한 결과, 미세 변주만 — 같은 시리즈의 연속 컷 느낌';
  if (v < 71) return '프롬프트를 다양한 방향으로 해석 — 명확한 변주';
  return '자유로운 해석 — 결과 분기 폭이 큼';
}

// 슬라이더(0~100) → Gemini temperature (비선형 매핑)
export function imageVariationToTemperature(v: number): number {
  if (v <= 20) return 0.5 + (v / 20) * 0.15;          // 0~20 → 0.50~0.65
  if (v <= 50) return 0.65 + ((v - 20) / 30) * 0.15;  // 20~50 → 0.65~0.80
  if (v <= 80) return 0.80 + ((v - 50) / 30) * 0.20;  // 50~80 → 0.80~1.00
  return 1.0 + ((v - 80) / 20) * 0.20;                // 80~100 → 1.00~1.20
}

type VariationInfo = { index: number; total: number; directive: string };

function buildVariationInfo(
  index: number,
  total: number,
  angleVariation: number,
  imageVariation: number,
): VariationInfo | null {
  if (total <= 1) return null;
  // 두 슬라이더 모두 매우 낮으면 directive 자체를 생략 (seed 차이로만 자연 변주)
  if (angleVariation < 10 && imageVariation < 10) return null;

  const includeAngle = angleVariation >= 15;
  // 슬라이더 강도에 따라 사용할 앵글 프리셋 풀의 크기를 제한.
  // 낮은 값에서는 모든 컷이 같은(또는 비슷한) 앵글 → 컨셉 흔들림 최소화.
  const presetPoolSize = angleVariation < 41 ? 1 : angleVariation < 71 ? 2 : ANGLE_PRESETS.length;
  const angleClause = includeAngle
    ? `• 카메라 앵글: ${angleAdjective(angleVariation)} ${ANGLE_PRESETS[index % presetPoolSize]} (인물·캐릭터가 등장하는 이미지에 한해 자연스럽게 적용. 텍스트·플랫 일러스트·풍경 등 앵글이 어색한 경우 무시)\n`
    : '';

  const intensityNote = imageVariation < 41
    ? '"같은 시리즈의 연속 컷" 수준의 미세 변주만. 강한 차이 금지.'
    : imageVariation < 71
      ? '같은 시리즈처럼 일관성을 유지하되, 프롬프트 해석의 방향성은 컷마다 분명히 다르게.'
      : '프롬프트의 다양한 해석을 적극적으로 시도. 같은 화풍·색감·캐릭터는 유지.';

  // 앵글 다양성이 임계값 미만이면 "앵글 고정"이 directive 본문 전체에서 일관되게 유지되도록
  // 핵심 원칙·LOCK 목록·변주 차원 문구를 분기한다. (예전엔 angleClause만 빠지고 본문엔 "다른 각도"가 그대로 남아 모순)
  const sceneDescription = includeAngle
    ? '같은 씬을 다른 각도/순간에서 본 한 장면'
    : '같은 씬을 같은 카메라 앵글에서 본, 거의 동일한 한 장면';
  const angleLockLine = includeAngle ? '' : '\n• 카메라 앵글·시점 (모든 컷 동일 — 앵글 변화 없음)';
  const variationDimensionLine = includeAngle
    ? '• 변주는 카메라 시점·구도·포즈·순간 차원에서만 일어남.'
    : '• 변주는 구도·포즈·순간·미세한 디테일 차원에서만 일어남. 카메라 앵글·시점은 모든 컷 동일하게 고정.';

  const directive = `이 컷은 ${total}장 시리즈 중 ${index + 1}번째.

핵심 원칙: 시리즈의 모든 컷은 "${sceneDescription}"임. 새로운 씬·새로운 상황·새로운 디자인 컨셉으로 바꾸지 않음. 1번째 컷과 N번째 컷이 같은 영화의 연속된 다른 프레임처럼 보여야 함.

[일관성 LOCK — 레퍼런스 이미지 기반으로 절대 동일하게 유지]
• 그림체·일러스트 화풍 (medium·line work·rendering 기법)
• 질감·텍스처 (붓터치·러프함·픽셀감·필터·후처리 정도)
• 색감·팔레트·톤·전체 분위기
• 캐릭터/오브젝트 외형 (의상·헤어·얼굴 형태·디테일)
• 씬·상황·컨셉 (같은 장소, 같은 상황, 같은 서사적 순간 — 시리즈 전 컷 동일)
• 디자인 컨셉 (전체 구성·아트디렉션·씬 해석 — 1번째 컷의 컨셉을 N번째 컷도 그대로)
• 조명 무드와 시간대${angleLockLine}

레퍼런스 이미지가 있는 경우, 위 항목은 모두 레퍼런스에서 추출된 시각 정체성을 그대로 따름. 이 LOCK은 어떤 변주보다도 우선.

[이 컷의 변주 — 같은 씬 안에서, 컷마다 약간만 다른 디자인 표현]
${angleClause}• ${intensityNote}
${variationDimensionLine}
• 절대 다른 씬, 다른 상황, 다른 컨셉으로 바꾸지 않음. 새로운 디자인 아이디어를 추가하지 않음.
• 1번째 컷이 ${total}컷 중 컨셉의 기준선이며, 모든 컷이 그 기준선 위에서 디자인 변형만 있어야 함.`;

  return { index, total, directive };
}

// ── 영역 지정 수정(인페인팅) 유틸 ──

type NormRect = { x: number; y: number; w: number; h: number }; // 0~1 정규화 좌표

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

// 원본 이미지 위에 선택 영역들을 가는 테두리 선으로 표시 → base64(png, 헤더 제외) 반환.
// 모델이 "이 박스 안쪽만 바꿔라"를 픽셀 레벨로 인식하게 하는 마커. (채움색을 넣으면 결과에 그 색이 번지므로 선만.)
async function buildRegionMarkedImage(src: string, rects: NormRect[]): Promise<string> {
  const img = await loadImageEl(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(img, 0, 0, W, H);
  ctx.strokeStyle = 'rgba(255, 0, 80, 0.95)';
  ctx.lineWidth = Math.max(3, Math.round(Math.min(W, H) * 0.006));
  const inset = ctx.lineWidth;
  for (const rect of rects) {
    const rx = Math.round(rect.x * W), ry = Math.round(rect.y * H);
    const rw = Math.round(rect.w * W), rh = Math.round(rect.h * H);
    ctx.strokeRect(rx + inset, ry + inset, Math.max(1, rw - inset * 2), Math.max(1, rh - inset * 2));
  }
  return canvas.toDataURL('image/png').split(',')[1] || '';
}

// 원석 교체 전용: 선택 영역을 중성 회색으로 완전히 지워서 AI가 "빈칸 채우기"(진짜 인페인팅)로 처리하게 함.
// "바꿔줘"가 아닌 "여기 빈 공간에 이 원석을 그려줘" 방식 → AI가 주변 맥락(비즈·배경)을 보고
// 기존 원석 이미지의 영향 없이 지정한 원석만 생성.
async function buildRegionMaskedImage(src: string, rects: NormRect[]): Promise<string> {
  const img = await loadImageEl(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(img, 0, 0, W, H);
  for (const rect of rects) {
    const rx = Math.round(rect.x * W), ry = Math.round(rect.y * H);
    const rw = Math.round(rect.w * W), rh = Math.round(rect.h * H);
    // 선택 영역을 중성 회색(#c8c8c8)으로 채워 원본 원석 픽셀을 완전히 제거
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(rx, ry, rw, rh);
  }
  return canvas.toDataURL('image/png').split(',')[1] || '';
}

// AI 결과에서 선택 영역들만 잘라 원본 위에 페더 합성 → dataURL(png) 반환. 박스 바깥은 원본 픽셀 그대로.
async function compositeRegionResult(originalSrc: string, resultSrc: string, rects: NormRect[]): Promise<string> {
  const [orig, result] = await Promise.all([loadImageEl(originalSrc), loadImageEl(resultSrc)]);
  const W = orig.naturalWidth, H = orig.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(orig, 0, 0, W, H);
  const rW = result.naturalWidth, rH = result.naturalHeight;

  for (const rect of rects) {
    const dstX = rect.x * W, dstY = rect.y * H, dstW = rect.w * W, dstH = rect.h * H;
    const srcX = rect.x * rW, srcY = rect.y * rH, srcW = rect.w * rW, srcH = rect.h * rH;
    const pw = Math.max(1, Math.round(dstW));
    const ph = Math.max(1, Math.round(dstH));
    const patch = document.createElement('canvas');
    patch.width = pw; patch.height = ph;
    const pctx = patch.getContext('2d');
    if (!pctx) throw new Error('canvas context unavailable');
    pctx.drawImage(result, srcX, srcY, srcW, srcH, 0, 0, pw, ph);

    // 가장자리 페더 마스크 — 가로/세로 그라데이션을 destination-in으로 두 번 적용해 4변을 부드럽게.
    // (페더 폭이 넉넉해야 경계의 빨간 마커 선 잔상까지 원본으로 덮인다.)
    const feather = Math.max(2, Math.round(Math.min(pw, ph) * 0.1));
    pctx.globalCompositeOperation = 'destination-in';
    const fx = Math.min(0.49, feather / pw);
    let g = pctx.createLinearGradient(0, 0, pw, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(fx, 'rgba(0,0,0,1)');
    g.addColorStop(1 - fx, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    const fy = Math.min(0.49, feather / ph);
    g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(fy, 'rgba(0,0,0,1)');
    g.addColorStop(1 - fy, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    pctx.globalCompositeOperation = 'source-over';

    ctx.drawImage(patch, dstX, dstY);
  }
  return canvas.toDataURL('image/png');
}

// saju-consult + 여백 채우기 전용: 레퍼런스를 16:9 캔버스에 최대한 크게(75%) 배치.
// 다운로드 시 20:9 크롭(위 15%·아래 5% 제거)을 고려해 수직 위치를 계산하므로 머리·발이 잘리지 않음.
// 좌우 소폭 여백(~12%)을 Gemini가 채워 자연스럽게 와이드 구도 완성.
async function padReferenceForSajuConsultOutpaint(rawBase64: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 16:9 캔버스 기준
      const canvasW = img.naturalWidth;
      const canvasH = Math.round(img.naturalWidth * (9 / 16));

      // 20:9 크롭 시 실제로 잘리는 영역 (drawImageToCanvas bias=0.75 기준):
      // 총 제거 = canvasH × 0.20, topCrop = 0.75 × 그것 = 0.15×canvasH, bottomCrop = 0.05×canvasH
      const topCrop = Math.round(canvasH * 0.15);
      const bottomCrop = Math.round(canvasH * 0.05);

      // 인물이 크롭 후에도 보이는 안전 영역 (topCrop ~ canvasH-bottomCrop)
      // 인물을 안전 영역 내 상단 10% 안쪽(머리 위 여백)에서 시작
      const safeTop = topCrop + Math.round(canvasH * 0.08);   // 크롭 경계 + 8% 여유
      const safeBottom = canvasH - bottomCrop - Math.round(canvasH * 0.02); // 하단 경계 - 2% 여유
      const maxH = safeBottom - safeTop; // 인물이 차지할 수 있는 최대 높이

      const imgAspect = img.naturalWidth / img.naturalHeight;

      // 최대 높이 기준으로 스케일 계산 (캔버스 너비를 넘지 않도록 클램프)
      let scaledH = Math.min(maxH, Math.round(canvasH * 0.75));
      let scaledW = Math.round(scaledH * imgAspect);
      if (scaledW > canvasW) {
        scaledW = canvasW;
        scaledH = Math.round(scaledW / imgAspect);
      }

      // 수평 중앙, 수직은 safeTop 기준
      const x = Math.round((canvasW - scaledW) / 2);
      const y = safeTop;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, x, y, scaledW, scaledH);

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl.split(',')[1] || rawBase64);
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = `data:image/png;base64,${rawBase64}`;
  });
}

// ── AI 업스케일러 (upscaler.js + Real-ESRGAN) ──
// 다운로드 시 브라우저에서 4× AI 업스케일 후 타겟 해상도로 다운스케일 → 고화질 결과.
// 모델은 첫 사용 시 CDN에서 로드(~4MB), 이후 재사용.

interface UpscalerInstance {
  upscale(input: HTMLImageElement | HTMLCanvasElement | string): Promise<string>;
}

let _upscalerInstance: UpscalerInstance | null = null;
let _upscalerLoading: Promise<UpscalerInstance> | null = null;

async function getUpscaler(): Promise<UpscalerInstance> {
  if (_upscalerInstance) return _upscalerInstance;
  if (_upscalerLoading) return _upscalerLoading;
  _upscalerLoading = (async () => {
    const [{ default: Upscaler }, { default: model }] = await Promise.all([
      import('upscaler'),
      import('@upscalerjs/esrgan-slim/4x'),
    ]);
    const instance = new (Upscaler as new (opts: unknown) => UpscalerInstance)({ model });
    _upscalerInstance = instance;
    return instance;
  })();
  return _upscalerLoading;
}

// 이미지를 AI 4× 업스케일 후 HTMLImageElement 반환. 실패 시 원본 반환.
async function aiUpscaleToImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
  try {
    const upscaler = await getUpscaler();
    const upscaledUrl = await upscaler.upscale(img);
    const upscaledImg = new Image();
    await new Promise<void>((resolve, reject) => {
      upscaledImg.onload = () => resolve();
      upscaledImg.onerror = reject;
      upscaledImg.src = upscaledUrl;
    });
    return upscaledImg;
  } catch (e) {
    console.warn('[upscaler] AI 업스케일 실패, 원본 사용:', e);
    return img;
  }
}

// 다운로드 시 ASPECT_RATIOS에 정의된 타겟 해상도로 업스케일.
// Gemini 출력은 비율은 맞지만 해상도가 낮으므로(예: 9:16 → ~832×1472) 캔버스에서 리사이즈해 저장.
// saju-consult는 16:9로 생성 후 크롭도 병행.
function drawImageToCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement, targetRatioId: string): void {
  const ratio = ASPECT_RATIOS.find(r => r.id === targetRatioId);
  const targetW = ratio?.width ?? img.naturalWidth;
  const targetH = ratio?.height ?? img.naturalHeight;

  if (targetRatioId === 'saju-consult') {
    const targetAspect = targetW / targetH;
    const srcAspect = img.naturalWidth / img.naturalHeight;
    let cropW: number, cropH: number, offsetX: number, offsetY: number;
    if (srcAspect >= targetAspect) {
      cropH = img.naturalHeight;
      cropW = Math.round(img.naturalHeight * targetAspect);
      offsetX = Math.round((img.naturalWidth - cropW) / 2);
      offsetY = 0;
    } else {
      cropW = img.naturalWidth;
      cropH = Math.round(img.naturalWidth / targetAspect);
      offsetX = 0;
      // 0.75: 위쪽(하늘/배경) 75%를 잘라내고 아래(발/지면)를 보존
      offsetY = Math.round((img.naturalHeight - cropH) * 0.75);
    }
    canvas.width = targetW;
    canvas.height = targetH;
    const ctxS = canvas.getContext('2d')!;
    ctxS.imageSmoothingEnabled = true;
    ctxS.imageSmoothingQuality = 'high';
    ctxS.drawImage(img, offsetX, offsetY, cropW, cropH, 0, 0, targetW, targetH);
  } else {
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }
}

// ── Component ──

export default function ThumbnailPage() {
  const navigate = useNavigate();

  // Step
  const [step, setStep] = useState<Step>('input');
  const [panelHidden, setPanelHidden] = useState(false);

  // Provider
  const [provider, setProvider] = useState<'gemini' | 'gpt'>('gemini');

  // 컷 프리셋
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productColor, setProductColor] = useState('');
  const [stoneName, setStoneName] = useState('');
  const [activeCutPreset, setActiveCutPreset] = useState<string | null>(null);
  const [wearingGender, setWearingGender] = useState<'female' | 'male'>('female');
  const [wearingPose, setWearingPose] = useState<string>('wrist');
  const [wearingOutfitId, setWearingOutfitId] = useState<string>('');
  const [productCut, setProductCut] = useState<string>('flatlay');
  const [whiteType, setWhiteType] = useState<string>('circle');
  const [bgConcept, setBgConcept] = useState<BackgroundConcept>('pure');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['cut']));
  const toggleSection = (id: string) => setOpenSections(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  // Input
  const [prompt, setPrompt] = useState('');
  const [persistentPrompt, setPersistentPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('thumbnail-fixed-prompt') || '';
  });
  const [ratioId, setRatioId] = useState<string>('1:1');
  const [referenceMode, setReferenceMode] = useState<string>('faithful');
  // 여백 채우기 모드는 referenceMode에서 파생 (별도 체크박스 제거)
  const autoFillBackground = referenceMode === 'outpaint';
  const [imageCount, setImageCount] = useState<number>(2);
  const [customCountActive, setCustomCountActive] = useState(false);
  const [customCountText, setCustomCountText] = useState('');
  const [fileFormat, setFileFormat] = useState<string>('png');
  // 변주 강도 슬라이더 (생성 개수 ≥ 2일 때만 의미 있음)
  const [angleVariation, setAngleVariation] = useState<number>(33);
  const [imageVariation, setImageVariation] = useState<number>(33);
  const [allSame, setAllSame] = useState(false);
  const [savedVariation, setSavedVariation] = useState({ angle: 33, image: 33 });
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [referenceBase64s, setReferenceBase64s] = useState<string[]>([]);
  // 구도 참고: 화풍은 무시하고 오로지 구도/프레이밍/카메라 앵글/배치만 참고할 이미지
  const [compositionPreviews, setCompositionPreviews] = useState<string[]>([]);
  const [compositionBase64s, setCompositionBase64s] = useState<string[]>([]);
  // 의상 레퍼런스: 착용컷 전용 — 커프스·넥라인·소매 형태만 참고
  const [outfitRefPreview, setOutfitRefPreview] = useState<string>('');
  const [outfitRefBase64, setOutfitRefBase64] = useState<string>('');
  // 원석 상세 레퍼런스: 원석 색상·컷·형태·마감을 이 이미지 기준으로 생성
  const [stoneRefPreview, setStoneRefPreview] = useState<string>('');
  const [stoneRefBase64, setStoneRefBase64] = useState<string>('');

  // Result
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isMainHover, setIsMainHover] = useState(false);
  const [hoverThumbId, setHoverThumbId] = useState<number | null>(null);

  // Edit (이미지 디벨롭)
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);

  // 영역 지정 수정 (인페인팅) — 결과 이미지 위에서 사각형 드래그 → 그 영역만 수정. 여러 개 선택 가능.
  const [regionMode, setRegionMode] = useState(false);
  const [stoneChangeMode, setStoneChangeMode] = useState(false); // 원석/장식 교체 전용 모드
  const [selRects, setSelRects] = useState<NormRect[]>([]);
  const [draftRect, setDraftRect] = useState<NormRect | null>(null); // 드래그 중인 임시 박스
  const draftRectRef = useRef<NormRect | null>(null); // pointerup 시 최신 draft를 안전하게 읽기 위함
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // ── Handlers ──

  const MAX_REFERENCES = 8;
  const MAX_COMPOSITIONS = 4;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processReferenceFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remaining = MAX_REFERENCES - referencePreviews.length;
    if (remaining <= 0) {
      setError(`레퍼런스 이미지는 최대 ${MAX_REFERENCES}장까지 업로드 가능해요`);
      return;
    }
    const valid: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지는 10MB 이하만 업로드 가능해요');
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    const dataUrls = await Promise.all(valid.map(readFileAsDataUrl));
    setReferencePreviews(prev => [...prev, ...dataUrls]);
    setReferenceBase64s(prev => [...prev, ...dataUrls.map(u => u.split(',')[1])]);
    if (files.length > remaining) {
      setError(`최대 ${MAX_REFERENCES}장까지만 업로드돼요`);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processReferenceFiles(files);
    e.target.value = '';
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    processReferenceFiles(files);
  };

  const removeReferenceAt = (index: number) => {
    setReferencePreviews(prev => prev.filter((_, i) => i !== index));
    setReferenceBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const hasReferences = referencePreviews.length > 0;

  // ── 구도 참고 핸들러 ──
  const processCompositionFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remaining = MAX_COMPOSITIONS - compositionPreviews.length;
    if (remaining <= 0) {
      setError(`구도 참고 이미지는 최대 ${MAX_COMPOSITIONS}장까지 업로드 가능해요`);
      return;
    }
    const valid: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지는 10MB 이하만 업로드 가능해요');
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    const dataUrls = await Promise.all(valid.map(readFileAsDataUrl));
    setCompositionPreviews(prev => [...prev, ...dataUrls]);
    setCompositionBase64s(prev => [...prev, ...dataUrls.map(u => u.split(',')[1])]);
    if (files.length > remaining) {
      setError(`구도 참고는 최대 ${MAX_COMPOSITIONS}장까지만 업로드돼요`);
    }
  };

  const handleCompositionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processCompositionFiles(files);
    e.target.value = '';
  };

  const [isCompDragging, setIsCompDragging] = useState(false);
  const [isStoneDragging, setIsStoneDragging] = useState(false);

  const handleCompDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompDragging(true);
  };

  const handleCompDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompDragging(false);
  };

  const handleCompDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    processCompositionFiles(files);
  };

  const handleStoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStoneDragging(true);
  };

  const handleStoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStoneDragging(false);
  };

  const handleStoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStoneDragging(false);
    const file = Array.from(e.dataTransfer.files ?? []).find(f => f.type.startsWith('image/'));
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setStoneRefPreview(dataUrl);
    setStoneRefBase64(dataUrl.split(',')[1]);
  };

  const removeCompositionAt = (index: number) => {
    setCompositionPreviews(prev => prev.filter((_, i) => i !== index));
    setCompositionBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const hasCompositions = compositionPreviews.length > 0;

  const callGenerateApi = async (
    promptOverride?: string,
    seedOverride?: number,
    variationInfo?: VariationInfo | null,
  ): Promise<{ image: string; mimeType: string }> => {
    const userPrompt = (promptOverride || prompt).trim();
    const fixedPrompt = persistentPrompt.trim();
    const combinedPrompt = [userPrompt, fixedPrompt].filter(Boolean).join('\n\n');
    // 원석 상세 레퍼런스가 있으면 프롬프트 최상단에 원석 잠금 지시문 주입.
    // 백엔드의 "레퍼런스 전체 보존" 규칙보다 명시적 USER INSTRUCTION이 우선되므로
    // 별첨 원석 이미지 기준으로 원석만 교체하도록 모델에 직접 지시한다.
    const stoneLockPrefix = stoneRefBase64
      ? `【PENDANT / STONE LOCK — 최우선 규칙】\n이 요청에는 원석 상세 레퍼런스 이미지가 별첨되어 있음. 팔찌의 펜던트·원석·챰(pendant/stone/charm)은 반드시 별첨 원석 이미지의 색상·컷·형태·마감을 100% 그대로 재현할 것. 팔찌 비즈·배열·골드 스페이서·배경 등 나머지 모든 요소는 메인 레퍼런스 이미지를 따름. 원석 디자인 자의적 해석·변형·창작 절대 금지.\n\n`
      : '';
    const effectivePrompt = stoneLockPrefix + combinedPrompt;
    // 미지원 비율은 가장 가까운 Gemini 지원 비율로 매핑, 다운로드 시 크롭 (GPT는 자체 매핑)
    const geminiRatio = ratioId === 'saju-consult' ? '16:9'
      : ratioId === 'smartstore-detail' ? '2:3'
      : ratioId;
    const body: Record<string, unknown> = {
      prompt: effectivePrompt,
      aspect_ratio: provider === 'gpt' ? ratioId : geminiRatio,
      image_variation: imageVariation,
      provider,
    };
    // 사주GPT: 여백 채우기(outpaint) + 레퍼런스 있으면 → 원본 보존+배경 확장 모드 (framing_directive 불필요)
    //          그 외엔 → 새 와이드 구도 생성 (framing_directive로 줌아웃 강제)
    const sajuOutpaintMode = ratioId === 'saju-consult' && autoFillBackground && referenceBase64s.length > 0;
    if (ratioId === 'saju-consult' && !sajuOutpaintMode) {
      body.framing_directive = 'ULTRA-WIDE CINEMATIC SHOT. Pull the camera far back — this is an establishing shot, not a portrait. The subject (person/character) must be fully visible head-to-toe with generous empty space above the head (at least 35% of frame height above head) and clear ground/floor visible below feet. Subject height should be ≤45% of the total frame height, positioned in the lower-center of the frame. Left and right sides are mostly background/environment. Do NOT crop the subject. Do NOT zoom in. Do NOT match the reference zoom level — always pull back significantly more.';
    }
    if (typeof seedOverride === 'number' && Number.isFinite(seedOverride)) {
      body.seed = seedOverride;
    }
    // variation hint는 prompt에 섞지 않고 별도 필드로 보내 백엔드에서 STYLE/CHARACTER LOCK과 동등한 최상위 블록으로 끌어올린다.
    if (variationInfo) {
      body.variation_directive = variationInfo.directive;
      body.variation_index = variationInfo.index;
      body.variation_total = variationInfo.total;
    }
    if (referenceBase64s.length > 0) {
      let refsToSend = referenceBase64s;
      if (autoFillBackground) {
        try {
          if (sajuOutpaintMode) {
            // 사주GPT 원본 보존 확장: 레퍼런스를 16:9 캔버스 65% 크기로 배치 → 좌우·상하 배경을 Gemini가 채움
            refsToSend = await Promise.all(
              referenceBase64s.map(b64 => padReferenceForSajuConsultOutpaint(b64))
            );
          } else {
            // 일반 여백 채우기: 선택 비율에 맞게 흰 padding 추가
            const targetRatio = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];
            refsToSend = await Promise.all(
              referenceBase64s.map(b64 => padReferenceForOutpaint(b64, targetRatio.width, targetRatio.height))
            );
          }
        } catch (e) {
          console.warn('[ThumbnailPage] outpaint padding failed, falling back to raw:', e);
        }
      }
      body.reference_images = refsToSend;
      body.reference_mode = referenceMode;
      if (autoFillBackground) body.auto_fill_background = true;
    }
    if (compositionBase64s.length > 0) {
      body.composition_reference_images = compositionBase64s;
    }
    if (outfitRefBase64) {
      body.outfit_reference_image = outfitRefBase64;
    }
    if (stoneRefBase64) {
      body.stone_reference_image = stoneRefBase64;
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '이미지 생성 실패');
    return data as { image: string; mimeType: string };
  };

  const effectiveCount = imageCount;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setImages([]);
    setGeneratedCount(0);
    setSelectedImageId(null);
    setStep('result');

    const BATCH_SIZE = 4;
    const results: GeneratedImage[] = [];
    const totalCount = imageCount;

    // 생성 개수 ≥ 2일 때만 variation directive를 주입해 같은 prompt+레퍼런스에서도 결과를 분기.
    // outpaint(여백 채우기)는 레퍼런스를 픽셀 단위로 보존해야 하므로 variation directive를 부착하지 않는다.
    const shouldVary = totalCount > 1 && !autoFillBackground;
    const tasks: { id: number; label?: string; itemPrompt?: string; seed: number; variation: VariationInfo | null }[] = [];
    for (let i = 0; i < totalCount; i++) {
      tasks.push({
        id: i + 1,
        seed: Math.floor(Math.random() * 2_147_483_647),
        variation: shouldVary ? buildVariationInfo(i, totalCount, angleVariation, imageVariation) : null,
      });
    }

    let firstFailureMessage: string | null = null;
    for (let batchStart = 0; batchStart < tasks.length; batchStart += BATCH_SIZE) {
      const batch = tasks.slice(batchStart, batchStart + BATCH_SIZE);

      const settled = await Promise.allSettled(
        batch.map(async (task) => {
          const data = await callGenerateApi(task.itemPrompt, task.seed, task.variation);
          return {
            id: task.id,
            src: `data:${data.mimeType};base64,${data.image}`,
            label: task.label,
            itemPrompt: task.itemPrompt,
          } as GeneratedImage;
        })
      );

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Image generation failed:', result.reason);
          if (!firstFailureMessage) {
            firstFailureMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
          }
        }
      }

      results.sort((a, b) => a.id - b.id);
      setImages([...results]);
      setGeneratedCount(results.length);
    }

    if (results.length === 0) {
      setError(firstFailureMessage || '이미지 생성에 실패했어요');
    }

    setGenerating(false);
  }, [prompt, ratioId, referenceBase64s, referenceMode, autoFillBackground, imageCount, angleVariation, imageVariation, compositionBase64s]);

  const handleRegenerate = useCallback(async (targetId: number) => {
    setError(null);
    // 해당 이미지의 개별 프롬프트 찾기
    const targetImg = images.find(img => img.id === targetId);
    const regenPrompt = targetImg?.itemPrompt;
    setImages(prev => prev.map(img =>
      img.id === targetId ? { ...img, src: '' } : img
    ));
    try {
      // 재생성은 같은 슬롯이라도 매번 다른 결과가 나와야 하므로 fresh seed 사용.
      // 단, 그 슬롯의 variation directive(앵글·프레이밍·조명·순간)는 동일하게 유지해 다른 슬롯과의 차별화는 보존한다.
      const slotVariation = images.length > 1 && !autoFillBackground
        ? buildVariationInfo(targetId - 1, images.length, angleVariation, imageVariation)
        : null;
      const data = await callGenerateApi(regenPrompt, Math.floor(Math.random() * 2_147_483_647), slotVariation);
      setImages(prev => prev.map(img =>
        img.id === targetId ? { ...img, src: `data:${data.mimeType};base64,${data.image}` } : img
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '재생성 실패');
    }
  }, [prompt, ratioId, referenceBase64s, referenceMode, autoFillBackground, images, angleVariation, imageVariation, compositionBase64s]);

  const handleEdit = useCallback(async () => {
    const target = (selectedImageId !== null ? images.find(img => img.id === selectedImageId) : undefined) || images[0];
    const editText = editPrompt.trim();
    if (!target?.src || !editText || editing) return;

    setEditing(true);
    setError(null);

    const base64 = target.src.split(',')[1];
    const fixedPrompt = persistentPrompt.trim();
    const combinedPrompt = [editText, fixedPrompt].filter(Boolean).join('\n\n');
    const newId = images.reduce((max, img) => Math.max(max, img.id), 0) + 1;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          aspect_ratio: ratioId,
          reference_images: [base64],
          reference_mode: 'faithful',
          edit_full: true, // 명령한 부분만 수정, 나머지는 원본 그대로 (제미나이 채팅 수정 방식)
          image_variation: 5, // 충실도 우선 → 낮은 temperature
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이미지 수정 실패');

      const newImage: GeneratedImage = {
        id: newId,
        src: `data:${data.mimeType};base64,${data.image}`,
      };
      setImages(prev => [...prev, newImage]);
      setSelectedImageId(newId);
      setEditPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 수정 실패');
    } finally {
      setEditing(false);
    }
  }, [selectedImageId, images, editPrompt, editing, persistentPrompt, ratioId]);

  const handleRegionEdit = useCallback(async () => {
    const target = (selectedImageId !== null ? images.find(img => img.id === selectedImageId) : undefined) || images[0];
    const editText = editPrompt.trim();
    if (!target?.src || !editText || editing) return;
    const rects = selRects.filter(r => r.w >= 0.02 && r.h >= 0.02);
    if (rects.length === 0) {
      setError('수정할 영역을 이미지 위에서 드래그해 선택해주세요');
      return;
    }

    setEditing(true);
    setError(null);

    const fixedPrompt = persistentPrompt.trim();
    // 원석 교체 모드: 비즈·골드 스페이서 등 팔찌 구조를 완전히 잠그는 프리픽스 주입
    const stoneLockPrefix = stoneChangeMode
      ? `【원석/장식 교체 전용 — 절대 규칙】붉은 테두리 박스 안의 원석·펜던트 형태·색상·마감만 아래 지시대로 변경할 것. ①팔찌 비즈의 색상·형태·크기·배열 변형 절대 금지 ②골드 스페이서 비즈 개수·위치·색상 변형 절대 금지 ③박스 밖 영역은 원본 픽셀 100% 그대로 ④원석 교체 외 어떤 창의적 해석도 금지. 교체 지시: `
      : '';
    const combinedPrompt = [stoneLockPrefix + editText, fixedPrompt].filter(Boolean).join('\n\n');
    const newId = images.reduce((max, img) => Math.max(max, img.id), 0) + 1;

    try {
      // 원석 교체: 영역을 회색으로 지워 진짜 인페인팅(빈칸 채우기)으로 처리
      // 일반 수정: 빨간 테두리만 표시해 AI가 "이 영역을 바꿔라"로 인식
      const inputBase64 = stoneChangeMode
        ? await buildRegionMaskedImage(target.src, rects)
        : await buildRegionMarkedImage(target.src, rects);
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          aspect_ratio: ratioId,
          reference_images: [inputBase64],
          reference_mode: stoneChangeMode ? 'faithful' : 'style_and_character',
          edit_region: true,
          edit_region_count: rects.length,
          image_variation: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '영역 수정 실패');

      const resultDataUrl = `data:${data.mimeType};base64,${data.image}`;
      // 박스 바깥은 원본 픽셀 그대로 유지하기 위해, AI 결과에서 선택 영역들만 잘라 원본 위에 합성.
      const composited = await compositeRegionResult(target.src, resultDataUrl, rects);

      const newImage: GeneratedImage = { id: newId, src: composited };
      setImages(prev => [...prev, newImage]);
      setSelectedImageId(newId);
      setEditPrompt('');
      setSelRects([]);
      setDraftRect(null);
      setRegionMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '영역 수정 실패');
    } finally {
      setEditing(false);
    }
  }, [selectedImageId, images, editPrompt, editing, selRects, persistentPrompt, ratioId, stoneChangeMode]);

  const [upscaling, setUpscaling] = useState(false);

  const convertAndDownload = useCallback(async (src: string, filename: string) => {
    if (!src) return;
    setUpscaling(true);
    try {
      const img = await aiUpscaleToImage(src);
      const canvas = document.createElement('canvas');
      drawImageToCanvas(img, canvas, ratioId);

      const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
      const mime = mimeMap[fileFormat] || 'image/png';
      const quality = fileFormat === 'png' ? undefined : 0.92;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${fileFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setUpscaling(false);
    }
  }, [fileFormat, ratioId]);

  const toFileName = (img: GeneratedImage) =>
    img.label ? img.label.replace(/[\\?%*:|"<>]/g, '_') : `${img.id}`;

  const handleDownload = useCallback((img: GeneratedImage) => {
    convertAndDownload(img.src, toFileName(img));
  }, [convertAndDownload]);

  const [zipping, setZipping] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    const validImages = images.filter(img => img.src);
    if (validImages.length === 0) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
      const mime = mimeMap[fileFormat] || 'image/png';
      const quality = fileFormat === 'png' ? undefined : 0.92;

      for (const img of validImages) {
        const image = await aiUpscaleToImage(img.src);
        const canvas = document.createElement('canvas');
        drawImageToCanvas(image, canvas, ratioId);

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));
        if (blob) {
          zip.file(`${toFileName(img)}.${fileFormat}`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'thumbnails.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP 생성 실패:', err);
      setError('ZIP 다운로드에 실패했어요');
    } finally {
      setZipping(false);
    }
  }, [images, fileFormat, ratioId]);

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === ratioId)!;
  const headerTitle = step === 'input' ? 'AI 이미지 제작' : '생성 결과';
  const canGenerate = prompt.trim().length > 0 || persistentPrompt.trim().length > 0 || (autoFillBackground && hasReferences);

  // 고정 명령어 localStorage 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('thumbnail-fixed-prompt', persistentPrompt);
  }, [persistentPrompt]);

  // 새 이미지가 도착하면 첫 번째를 선택, 또는 선택 항목이 사라졌으면 첫 번째로 폴백
  useEffect(() => {
    if (images.length === 0) return;
    if (selectedImageId === null || !images.find(img => img.id === selectedImageId)) {
      setSelectedImageId(images[0].id);
    }
  }, [images, selectedImageId]);

  const currentImage = (selectedImageId !== null
    ? images.find(img => img.id === selectedImageId)
    : undefined) || images[0];

  // 선택 이미지가 바뀌면 영역 선택 초기화 (좌표가 다른 이미지에 맞지 않으므로)
  useEffect(() => { setSelRects([]); setDraftRect(null); }, [selectedImageId]);
  // 결과 화면을 벗어나면 영역 지정 모드 해제
  useEffect(() => { if (step !== 'result') { setRegionMode(false); setStoneChangeMode(false); setSelRects([]); setDraftRect(null); setDragStart(null); } }, [step]);

  // Shift+1 단축키 → 썸네일 생성하기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '!' && step === 'input' && canGenerate && !generating) {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, canGenerate, generating, handleGenerate]);

  // Cmd/Ctrl + \ → 사이드 패널 토글
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setPanelHidden(p => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Render ──

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full relative" style={{ maxWidth: '1200px', fontFamily: font }}>

        {/* NavigationHeader — sticky로 상단 고정 (transform 가진 조상이 있어도 동작, fixed와 달리 스크롤로 안 사라짐) */}
        <div style={{
          position: 'sticky', top: 0,
          width: '100%',
          height: '52px', zIndex: 50,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div className="flex flex-col justify-center size-full">
            <div className="flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => {
                if (step === 'result') { setStep('input'); return; }
                navigate(-1);
              }} />
              <p style={{
                fontFamily: font, fontSize: '16px', fontWeight: 500,
                lineHeight: '24px', letterSpacing: '0.14px',
                color: C.textBlack, textAlign: 'center',
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
                {headerTitle}
              </p>
              <div className="flex items-center" style={{ gap: '8px' }}>
                {/* Gemini / GPT 토글 */}
                <div style={{
                  display: 'flex', border: `1px solid ${C.borderDefault}`,
                  borderRadius: '10px', overflow: 'hidden', height: '30px',
                }}>
                  <button
                    onClick={() => setProvider('gemini')}
                    style={{
                      padding: '0 10px', border: 'none', cursor: 'pointer',
                      backgroundColor: provider === 'gemini' ? '#f0fafa' : 'transparent',
                      fontFamily: font, fontSize: '12px', fontWeight: 500,
                      color: provider === 'gemini' ? C.primary : C.textTertiary,
                      transition: 'all 0.15s ease',
                    }}
                  >Gemini</button>
                  <div style={{ width: '1px', backgroundColor: C.borderDefault, flexShrink: 0 }} />
                  <button
                    onClick={() => setProvider('gpt')}
                    style={{
                      padding: '0 10px', border: 'none', cursor: 'pointer',
                      backgroundColor: provider === 'gpt' ? '#f0f7ff' : 'transparent',
                      fontFamily: font, fontSize: '12px', fontWeight: 500,
                      color: provider === 'gpt' ? '#0066cc' : C.textTertiary,
                      transition: 'all 0.15s ease',
                    }}
                  >GPT</button>
                </div>
                {step === 'result' && images.length > 0 && !generating && (
                  <>
                    <button
                      onClick={() => setStep('input')}
                      style={{
                        height: '32px', padding: '0 24px', borderRadius: '12px',
                        backgroundColor: C.surface,
                        border: `1px solid ${C.borderDefault}`,
                        cursor: 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        color: C.textSecondary, letterSpacing: '-0.26px',
                        transition: 'all 0.15s ease',
                      }}
                    >처음으로</button>
                    <button
                      onClick={handleDownloadAll}
                      disabled={zipping}
                      style={{
                        height: '32px', padding: '0 24px', borderRadius: '12px',
                        backgroundColor: zipping ? C.primaryDark : C.primary, border: 'none',
                        cursor: zipping ? 'default' : 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        color: C.textWhite, letterSpacing: '-0.26px',
                        transition: 'all 0.15s ease',
                      }}
                    >{zipping ? 'ZIP 생성 중...' : 'ZIP 다운로드'}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* sticky 헤더는 흐름에 남아 52px를 차지하므로 별도 스페이서 불필요 */}

        {/* ════════ STEP: INPUT ════════ */}
        {step === 'input' && (
          <div style={{
            padding: '32px 20px 40px',
            display: 'flex', flexDirection: 'row-reverse', gap: '44px', flexWrap: 'nowrap',
            alignItems: 'flex-start', position: 'relative',
            minHeight: 'calc(100vh - 52px)',
          }}>
          {/* 패널 좌측 풀하이트 라인 (패널이 우측에 있을 때 메인과의 구분선) */}
          {!panelHidden && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              right: 'calc(20px + 240px)', width: '1px',
              backgroundColor: '#f0f0f0', pointerEvents: 'none',
            }} />
          )}

          {/* ── 좌측 설정 패널 (Figma 스타일) ── */}
          {!panelHidden && (
          <aside style={{
            width: '240px', flexShrink: 0,
            position: 'sticky', top: '68px',
            display: 'flex', flexDirection: 'column',
            paddingLeft: '28px',
            marginTop: '-32px',
          }}>
            {/* ── 이미지 비율 ── */}
            <div style={{
              borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <button onClick={() => toggleSection('ratio')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>이미지 비율</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{selectedRatio.label}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('ratio') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            {openSections.has('ratio') && <div style={{ padding: '0 20px 12px 28px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'none', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                이미지 비율
              </label>
              <div className="flex" style={{ gap: '4px' }}>
                {ASPECT_RATIOS.filter(r => r.id !== 'saju-consult').map(ratio => {
                  const selected = ratioId === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setRatioId(ratio.id)}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', padding: '0 4px', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const sajuRatio = ASPECT_RATIOS.find(r => r.id === 'saju-consult')!;
                const selected = ratioId === 'saju-consult';
                return (
                  <button
                    onClick={() => setRatioId('saju-consult')}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    style={{
                      width: '100%', height: '26px', padding: '0 4px', borderRadius: '8px',
                      marginTop: '4px',
                      fontFamily: font, fontSize: '11px', fontWeight: 400,
                      letterSpacing: '0.76px',
                      color: selected ? C.textWhite : '#5a5a5a',
                      backgroundColor: selected ? C.primary : '#f5f5f5',
                      border: 'none',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sajuRatio.label}
                  </button>
                );
              })()}
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {selectedRatio.desc} ({selectedRatio.width}×{selectedRatio.height}px)
              </p>
            </div>}
            </div>

            {/* ── 생성 개수 ── */}
            <div style={{
              borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <button onClick={() => toggleSection('count')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>생성 개수</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{imageCount}장</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('count') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            {openSections.has('count') && <div style={{ padding: '0 20px 12px 28px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'none', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                생성 개수
              </label>
              <div className="flex items-center" style={{ gap: '4px' }}>
                {IMAGE_COUNTS.map(count => {
                  const selected = imageCount === count && !customCountActive;
                  return (
                    <button
                      key={count}
                      onClick={() => { setImageCount(count); setCustomCountActive(false); setCustomCountText(''); }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={customCountActive ? customCountText : ''}
                placeholder="직접 입력"
                onFocus={() => setCustomCountActive(true)}
                onChange={e => {
                  const txt = e.target.value;
                  setCustomCountActive(true);
                  setCustomCountText(txt);
                  const v = parseInt(txt, 10);
                  if (!isNaN(v) && v >= 1 && v <= 50) setImageCount(v);
                }}
                className="outline-none"
                style={{
                  width: '100%', height: '28px', borderRadius: '8px',
                  backgroundColor: C.surface,
                  padding: '0 12px', marginTop: '8px',
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  color: customCountActive ? C.primary : '#5a5a5a',
                  textAlign: 'left',
                  border: `1px solid ${customCountActive ? C.primary : C.borderDefault}`,
                  transition: 'all 0.15s ease',
                }}
              />
            </div>}
            </div>

            {/* ── 파일 형식 ── */}
            <div style={{
              borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <button onClick={() => toggleSection('format')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>파일 형식</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{fileFormat.toUpperCase()}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('format') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            {openSections.has('format') && <div style={{ padding: '0 20px 12px 28px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'none', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                파일 형식
              </label>
              <div className="flex" style={{ gap: '4px' }}>
                {FILE_FORMATS.map(fmt => {
                  const selected = fileFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setFileFormat(fmt.id)}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', padding: '0', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {FILE_FORMATS.find(f => f.id === fileFormat)?.desc}
              </p>
            </div>}
            </div>

            {/* ── 참고 방식 ── */}
            <div style={{
              borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <button onClick={() => toggleSection('refmode')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>참고 방식</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{REFERENCE_MODES.find(m => m.id === referenceMode)?.label}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('refmode') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            {openSections.has('refmode') && <div style={{ padding: '0 20px 12px 28px' }}>
                <label style={{
                  display: 'none',
                }}>
                  참고 방식
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {REFERENCE_MODES.map(mode => {
                    const selected = referenceMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setReferenceMode(mode.id)}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        style={{
                          width: '100%', height: '30px', padding: '0', borderRadius: '8px',
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          letterSpacing: '0.76px',
                          color: selected ? C.textWhite : '#5a5a5a',
                          backgroundColor: selected ? C.primary : '#f5f5f5',
                          border: 'none',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {REFERENCE_MODES.find(m => m.id === referenceMode)?.desc}
              </p>
            </div>}
            </div>

            {/* ── 컷 프리셋 ── */}
            <div style={{
              borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              {(() => {
                const cutLabel = activeCutPreset ? CUT_PRESETS.find(c => c.id === activeCutPreset)?.label ?? '—' : '—';
                const subLabel = activeCutPreset === 'wearing'
                  ? ` · ${wearingGender === 'female' ? '여성' : '남성'} · ${WEARING_POSES.find(p => p.id === wearingPose)?.label}`
                  : activeCutPreset === 'product'
                  ? ` · ${PRODUCT_CUTS.find(a => a.id === productCut)?.label}`
                  : activeCutPreset === 'white'
                  ? ` · ${WHITE_TYPES.find(w => w.id === whiteType)?.label}`
                  : '';
                return (
                  <button onClick={() => toggleSection('cut')} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
                  }}>
                    <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>컷 프리셋</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{cutLabel}{subLabel}</span>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('cut') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </button>
                );
              })()}
            {openSections.has('cut') && <div style={{ padding: '0 20px 12px 28px' }}>
              {/* 제품 선택 드롭다운 */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedProductId(id);
                    if (!id) return;
                    const prod = PRODUCTS.find(p => p.id === id);
                    if (!prod) return;
                    setProductColor(prod.color);
                    setStoneName(prod.stone);
                    if (activeCutPreset) {
                      const g = activeCutPreset === 'wearing' ? wearingGender : undefined;
                      const po = activeCutPreset === 'wearing' ? wearingPose : undefined;
                      const sub = activeCutPreset === 'product' ? productCut : activeCutPreset === 'white' ? whiteType : undefined;
                      const outfitPool = wearingGender === 'female' ? WEARING_OUTFITS_FEMALE : WEARING_OUTFITS_MALE;
                      const ov = activeCutPreset === 'wearing' ? (outfitPool.find(o => o.id === wearingOutfitId)?.outfit ?? '') : '';
                      setPrompt(buildCutPrompt(activeCutPreset, prod.color, prod.stone, g, po, sub, ov, !!stoneRefBase64, bgConcept));
                    }
                  }}
                  className="outline-none"
                  style={{
                    width: '100%', height: '30px', borderRadius: '10px',
                    border: `1px solid ${selectedProductId ? C.primary : C.borderDefault}`,
                    padding: '0 28px 0 10px',
                    fontFamily: font, fontSize: '11px', fontWeight: 400,
                    color: selectedProductId ? C.textPrimary : C.textCaption,
                    backgroundColor: selectedProductId ? '#f0fafa' : C.surface,
                    boxSizing: 'border-box' as const,
                    cursor: 'pointer',
                    appearance: 'none' as const,
                  }}
                >
                  <option value="">— 제품 선택 (자동 입력) —</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <optgroup key={cat.id} label={cat.label}>
                      {PRODUCTS.filter(p => p.category === cat.id).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <input
                type="text"
                value={productColor}
                onChange={e => setProductColor(e.target.value)}
                placeholder="제품 색상 (예: 빨간색, 파란색)"
                className="outline-none"
                style={{
                  width: '100%', height: '30px', borderRadius: '10px',
                  border: `1px solid ${C.borderDefault}`,
                  padding: '0 10px', marginBottom: '6px',
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  color: C.textPrimary, backgroundColor: C.surface,
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                value={stoneName}
                onChange={e => setStoneName(e.target.value)}
                placeholder="원석 이름 (예: 산호, 터키석, 자수정)"
                className="outline-none"
                style={{
                  width: '100%', height: '30px', borderRadius: '10px',
                  border: `1px solid ${C.borderDefault}`,
                  padding: '0 10px', marginBottom: '8px',
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  color: C.textPrimary, backgroundColor: C.surface,
                  boxSizing: 'border-box',
                }}
              />
              {/* 메인 프리셋 버튼 (4개) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                {CUT_PRESETS.map(cut => {
                  const active = activeCutPreset === cut.id;
                  return (
                    <button
                      key={cut.id}
                      onClick={() => {
                        const g = cut.id === 'wearing' ? wearingGender : undefined;
                        const p = cut.id === 'wearing' ? wearingPose : undefined;
                        const s = cut.id === 'product' ? productCut : cut.id === 'white' ? whiteType : undefined;
                        const outfitPool = wearingGender === 'female' ? WEARING_OUTFITS_FEMALE : WEARING_OUTFITS_MALE;
                        const ov = cut.id === 'wearing' ? (outfitPool.find(o => o.id === wearingOutfitId)?.outfit ?? '') : '';
                        setPrompt(buildCutPrompt(cut.id, productColor, stoneName, g, p, s, ov, !!stoneRefBase64, bgConcept));
                        setActiveCutPreset(cut.id);
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#ececec'; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                      style={{
                        height: '28px', borderRadius: '8px', border: 'none',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.5px',
                        color: active ? C.textWhite : '#5a5a5a',
                        backgroundColor: active ? C.primary : '#f5f5f5',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >{cut.label}</button>
                  );
                })}
              </div>

              {/* 제품컷 서브 옵션 (2x2 그리드) */}
              {activeCutPreset === 'product' && (
                <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {PRODUCT_CUTS.map(a => {
                    const aActive = productCut === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setProductCut(a.id);
                          setPrompt(buildCutPrompt('product', productColor, stoneName, undefined, undefined, a.id, undefined, !!stoneRefBase64, bgConcept));
                        }}
                        onMouseEnter={(e) => { if (!aActive) e.currentTarget.style.backgroundColor = '#e8f5f5'; }}
                        onMouseLeave={(e) => { if (!aActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        style={{
                          height: '26px', borderRadius: '8px',
                          border: `1px solid ${aActive ? C.primary : C.borderDefault}`,
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          color: aActive ? C.primary : C.textTertiary,
                          backgroundColor: aActive ? '#f0fafa' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >{a.label}</button>
                    );
                  })}
                </div>
              )}

              {/* 배경 컨셉 — 제품컷·디테일컷에서 표시 */}
              {(activeCutPreset === 'product' || activeCutPreset === 'detail') && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontFamily: font, fontSize: '10px', color: C.textTertiary, margin: '0 0 3px', letterSpacing: '0.5px' }}>
                    배경 컨셉
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                    {BG_CONCEPTS.map(c => {
                      const cActive = bgConcept === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setBgConcept(c.id);
                            const sub = activeCutPreset === 'product' ? productCut : undefined;
                            setPrompt(buildCutPrompt(activeCutPreset, productColor, stoneName, undefined, undefined, sub, undefined, !!stoneRefBase64, c.id));
                          }}
                          onMouseEnter={(e) => { if (!cActive) e.currentTarget.style.backgroundColor = '#e8f5f5'; }}
                          onMouseLeave={(e) => { if (!cActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          style={{
                            height: '26px', borderRadius: '8px',
                            border: `1px solid ${cActive ? C.primary : C.borderDefault}`,
                            fontFamily: font, fontSize: '11px', fontWeight: 400,
                            color: cActive ? C.primary : C.textTertiary,
                            backgroundColor: cActive ? '#f0fafa' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >{c.label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 착용컷 서브 옵션 */}
              {activeCutPreset === 'wearing' && (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* 성별 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {(['female', 'male'] as const).map(g => {
                      const gActive = wearingGender === g;
                      return (
                        <button
                          key={g}
                          onClick={() => {
                            setWearingGender(g);
                            const pool = g === 'female' ? WEARING_OUTFITS_FEMALE : WEARING_OUTFITS_MALE;
                            const ov = pool.find(o => o.id === wearingOutfitId)?.outfit ?? '';
                            setPrompt(buildCutPrompt('wearing', productColor, stoneName, g, wearingPose, undefined, ov, !!stoneRefBase64, bgConcept));
                          }}
                          onMouseEnter={(e) => { if (!gActive) e.currentTarget.style.backgroundColor = '#e8f5f5'; }}
                          onMouseLeave={(e) => { if (!gActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          style={{
                            height: '26px', borderRadius: '8px',
                            border: `1px solid ${gActive ? C.primary : C.borderDefault}`,
                            fontFamily: font, fontSize: '11px', fontWeight: 400,
                            color: gActive ? C.primary : C.textTertiary,
                            backgroundColor: gActive ? '#f0fafa' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >{g === 'female' ? '여성' : '남성'}</button>
                      );
                    })}
                  </div>
                  {/* 포즈 (2x2 그리드) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {WEARING_POSES.map(p => {
                      const pActive = wearingPose === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setWearingPose(p.id);
                            const pool2 = wearingGender === 'female' ? WEARING_OUTFITS_FEMALE : WEARING_OUTFITS_MALE;
                            const ov2 = pool2.find(o => o.id === wearingOutfitId)?.outfit ?? '';
                            setPrompt(buildCutPrompt('wearing', productColor, stoneName, wearingGender, p.id, undefined, ov2, !!stoneRefBase64, bgConcept));
                          }}
                          onMouseEnter={(e) => { if (!pActive) e.currentTarget.style.backgroundColor = '#e8f5f5'; }}
                          onMouseLeave={(e) => { if (!pActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          style={{
                            height: '26px', borderRadius: '8px',
                            border: `1px solid ${pActive ? C.primary : C.borderDefault}`,
                            fontFamily: font, fontSize: '11px', fontWeight: 400,
                            color: pActive ? C.primary : C.textTertiary,
                            backgroundColor: pActive ? '#f0fafa' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >{p.label}</button>
                      );
                    })}
                  </div>
                  {/* 의상 선택 */}
                  {(() => {
                    const outfitPool = wearingGender === 'female' ? WEARING_OUTFITS_FEMALE : WEARING_OUTFITS_MALE;
                    return (
                      <div>
                        <p style={{ fontFamily: font, fontSize: '10px', color: C.textTertiary, margin: '4px 0 3px', letterSpacing: '0.5px' }}>
                          의상 고정 {wearingOutfitId ? `· ${outfitPool.find(o => o.id === wearingOutfitId)?.label}` : '(자동)'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', maxHeight: '120px', overflowY: 'auto' }}>
                          {/* 자동 버튼 */}
                          {(() => {
                            const isAuto = wearingOutfitId === '';
                            return (
                              <button
                                onClick={() => {
                                  setWearingOutfitId('');
                                  setPrompt(buildCutPrompt('wearing', productColor, stoneName, wearingGender, wearingPose, undefined, '', !!stoneRefBase64, bgConcept));
                                }}
                                style={{
                                  height: '24px', borderRadius: '6px',
                                  border: `1px solid ${isAuto ? C.primary : C.borderDefault}`,
                                  fontFamily: font, fontSize: '10px',
                                  color: isAuto ? C.primary : C.textTertiary,
                                  backgroundColor: isAuto ? '#f0fafa' : 'transparent',
                                  cursor: 'pointer',
                                }}
                              >자동</button>
                            );
                          })()}
                          {outfitPool.map(o => {
                            const oActive = wearingOutfitId === o.id;
                            return (
                              <button
                                key={o.id}
                                onClick={() => {
                                  setWearingOutfitId(o.id);
                                  setPrompt(buildCutPrompt('wearing', productColor, stoneName, wearingGender, wearingPose, undefined, o.outfit, !!stoneRefBase64, bgConcept));
                                }}
                                style={{
                                  height: '24px', borderRadius: '6px',
                                  border: `1px solid ${oActive ? C.primary : C.borderDefault}`,
                                  fontFamily: font, fontSize: '10px',
                                  color: oActive ? C.primary : C.textTertiary,
                                  backgroundColor: oActive ? '#f0fafa' : 'transparent',
                                  cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}
                              >{o.label}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 착용컷 의상 레퍼런스 */}
              {activeCutPreset === 'wearing' && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: font, fontSize: '10px', color: C.textCaption }}>의상 참고 이미지 (커프스·넥라인 고정용)</span>
                    {outfitRefPreview && (
                      <button
                        onClick={() => { setOutfitRefPreview(''); setOutfitRefBase64(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: font, fontSize: '10px', color: C.textCaption }}
                      >✕ 제거</button>
                    )}
                  </div>
                  {outfitRefPreview ? (
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <img src={outfitRefPreview} alt="의상 참고" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${C.primary}` }} />
                    </div>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px', borderRadius: '10px', border: `1px dashed ${C.borderDefault}`, cursor: 'pointer', fontFamily: font, fontSize: '11px', color: C.textCaption }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke={C.textCaption} strokeWidth="1.4" strokeLinecap="round"/></svg>
                      의상 이미지 업로드
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await new Promise<string>((res, rej) => {
                          const r = new FileReader();
                          r.onload = ev => res(ev.target?.result as string);
                          r.onerror = rej;
                          r.readAsDataURL(file);
                        });
                        setOutfitRefPreview(dataUrl);
                        setOutfitRefBase64(dataUrl.split(',')[1]);
                        e.target.value = '';
                      }} />
                    </label>
                  )}
                </div>
              )}

              {/* 흰배경컷 서브 옵션 */}
              {activeCutPreset === 'white' && (
                <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {WHITE_TYPES.map(w => {
                    const wActive = whiteType === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setWhiteType(w.id);
                          setPrompt(buildCutPrompt('white', productColor, stoneName, undefined, undefined, w.id, undefined, !!stoneRefBase64, bgConcept));
                        }}
                        onMouseEnter={(e) => { if (!wActive) e.currentTarget.style.backgroundColor = '#e8f5f5'; }}
                        onMouseLeave={(e) => { if (!wActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        style={{
                          height: '26px', borderRadius: '8px',
                          border: `1px solid ${wActive ? C.primary : C.borderDefault}`,
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          color: wActive ? C.primary : C.textTertiary,
                          backgroundColor: wActive ? '#f0fafa' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >{w.label}</button>
                    );
                  })}
                </div>
              )}

              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px', paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                클릭하면 명령어가 자동 입력됩니다
              </p>
            </div>}
            </div>

            {/* ── 변주 강도 (생성 개수 ≥ 2일 때만 노출) ── */}
            {imageCount >= 2 && (
              <div style={{
                borderBottom: '1px solid #f0f0f0',
                marginLeft: '-28px', marginRight: '-20px',
              }}>
              <button onClick={() => toggleSection('variation')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 12px 28px', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.textPrimary, letterSpacing: '-0.24px' }}>변주 강도</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', color: C.primary }}>{allSame ? '동일' : `앵글 ${angleVariation} · 이미지 ${imageVariation}`}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: openSections.has('variation') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="#9a9a9a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
              {openSections.has('variation') && <div style={{
                padding: '0 20px 20px 28px',
                display: 'flex', flexDirection: 'column', gap: '20px',
              }}>
                {/* 값:0 체크박스 — 앵글·이미지 다양성 모두 0으로 고정 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    fontFamily: font, fontSize: '11px',
                    color: allSame ? '#48b2af' : '#9a9a9a', letterSpacing: '-0.22px',
                    transition: 'color 0.15s ease',
                  }}>
                    값:0
                  </span>
                  <div
                    onClick={() => {
                      if (!allSame) {
                        setSavedVariation({ angle: angleVariation, image: imageVariation });
                        setAngleVariation(0);
                        setImageVariation(0);
                        setAllSame(true);
                      } else {
                        setAngleVariation(savedVariation.angle || 25);
                        setImageVariation(savedVariation.image || 25);
                        setAllSame(false);
                      }
                    }}
                    style={{
                      width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                      backgroundColor: allSame ? '#48b2af' : 'transparent',
                      border: allSame ? 'none' : '1px solid #dcdcdc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background-color 0.15s ease, border 0.15s ease',
                    }}
                  >
                    {allSame && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <VariationSlider
                  label="앵글 다양성"
                  value={angleVariation}
                  onChange={(v) => { setAngleVariation(v); setAllSame(false); }}
                  endLabels={['거의 동일', '매우 다양']}
                  getHelperText={angleHelperText}
                  disabled={allSame}
                />
                <VariationSlider
                  label="이미지 다양성"
                  value={imageVariation}
                  onChange={(v) => { setImageVariation(v); setAllSame(false); }}
                  endLabels={['일관성', '자유 해석']}
                  getHelperText={imageHelperText}
                  disabled={allSame}
                />
              </div>}
              </div>
            )}

            {/* ── 스펙 요약 ── */}
            <div style={{ padding: '20px 0 0' }}>
              <div style={{
                padding: '13px 16px 10px', borderRadius: '12px',
                backgroundColor: C.surface,
                border: '1px solid #f0f0f0',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: '#6a6a6a', letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {selectedRatio.label} · {selectedRatio.width}×{selectedRatio.height}px
                </p>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: '#6a6a6a', letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {imageCount}장 · {fileFormat.toUpperCase()}
                </p>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: C.primary, letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {REFERENCE_MODES.find(m => m.id === referenceMode)?.label || referenceMode}
                </p>
              </div>
            </div>

          </aside>
          )}

          {/* ── 메인 컬럼 ── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            {/* ── 명령어 입력 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                명령어
              </label>
              <div style={{
                borderRadius: '20px', border: `1px solid ${C.borderDefault}`,
                padding: '14px 16px', backgroundColor: C.surface,
              }}>
                <textarea
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setActiveCutPreset(null); }}
                  placeholder="예: 유튜브 먹방 썸네일, 맛있는 치킨 앞에서 놀란 표정의 남자, 큰 글씨로 '역대급 치킨 먹방' 텍스트"
                  rows={4}
                  className="w-full outline-none bg-transparent resize-y"
                  style={{
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    lineHeight: '21px', letterSpacing: '-0.42px',
                    color: C.textPrimary, border: 'none',
                    minHeight: '88px', display: 'block',
                  }}
                />
              </div>
            </div>

            {/* ── 고정 명령어 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                고정 명령어
              </label>
              <div style={{
                borderRadius: '20px', border: `1px solid ${C.borderDefault}`,
                padding: '14px 16px', backgroundColor: C.surface,
              }}>
                <textarea
                  value={persistentPrompt}
                  onChange={e => setPersistentPrompt(e.target.value)}
                  placeholder="예: 전체적으로 밝고 크린한 톤 유지 / 과포화 금지 / 불필요한 소품 추가 금지 / 팔찌 비즈 색상·배열 절대 변형 금지"
                  rows={3}
                  className="w-full outline-none bg-transparent resize-y"
                  style={{
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    lineHeight: '21px', letterSpacing: '-0.42px',
                    color: C.textPrimary, border: 'none',
                    minHeight: '64px', display: 'block',
                  }}
                />
              </div>
            </div>

            {/* ── 레퍼런스 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                레퍼런스
              </label>

              {hasReferences ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex', flexWrap: 'wrap', gap: '10px',
                    padding: '12px', borderRadius: '20px',
                    border: `1.5px dashed ${isDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {referencePreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={src}
                        alt={`레퍼런스 ${idx + 1}`}
                        style={{
                          width: '80px', height: '80px', objectFit: 'cover',
                          borderRadius: '16px', border: `1px solid ${C.borderDefault}`,
                          display: 'block',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeReferenceAt(idx)}
                        aria-label="이미지 삭제"
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: '#1f1f1f', border: `2px solid ${C.surface}`,
                          color: C.textWhite, fontSize: '13px', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1, padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {referencePreviews.length < MAX_REFERENCES && (
                    <label
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.borderColor = '#cfcfcf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surface;
                        e.currentTarget.style.borderColor = C.borderDefault;
                      }}
                      style={{
                      width: '80px', height: '80px', borderRadius: '16px',
                      border: `1.5px dashed ${C.borderDefault}`,
                      backgroundColor: C.surface,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.textCaption} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReferenceUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onMouseEnter={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.backgroundColor = '#fcfcfc';
                      e.currentTarget.style.borderColor = '#dcdcdc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.backgroundColor = C.surface;
                      e.currentTarget.style.borderColor = C.borderDefault;
                    }
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '120px', borderRadius: '20px',
                    border: `1.5px dashed ${isDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    gap: '12px',
                  }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={isDragging ? C.primary : '#e5e5e5'} xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.58078 19.0112L2.56078 19.0312C2.29078 18.4413 2.12078 17.7713 2.05078 17.0312C2.12078 17.7613 2.31078 18.4212 2.58078 19.0112Z" />
                    <path d="M9.00109 10.3811C10.3155 10.3811 11.3811 9.31553 11.3811 8.00109C11.3811 6.68666 10.3155 5.62109 9.00109 5.62109C7.68666 5.62109 6.62109 6.68666 6.62109 8.00109C6.62109 9.31553 7.68666 10.3811 9.00109 10.3811Z" />
                    <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.19C2 17.28 2.19 18.23 2.56 19.03C3.42 20.93 5.26 22 7.81 22H16.19C19.83 22 22 19.83 22 16.19V13.9V7.81C22 4.17 19.83 2 16.19 2ZM20.37 12.5C19.59 11.83 18.33 11.83 17.55 12.5L13.39 16.07C12.61 16.74 11.35 16.74 10.57 16.07L10.23 15.79C9.52 15.17 8.39 15.11 7.59 15.65L3.85 18.16C3.63 17.6 3.5 16.95 3.5 16.19V7.81C3.5 4.99 4.99 3.5 7.81 3.5H16.19C19.01 3.5 20.5 4.99 20.5 7.81V12.61L20.37 12.5Z" />
                  </svg>
                  <span style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: isDragging ? C.primary : '#c8c8c8',
                    letterSpacing: '0.76px',
                  }}>
                    {isDragging ? '여기에 놓으세요' : `최대 ${MAX_REFERENCES}장 · 장당 10MB 이하`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              <div style={{
                marginTop: '8px', textAlign: 'right',
                fontFamily: font, fontSize: '12px', color: C.textCaption,
                letterSpacing: '-0.24px',
                paddingRight: '2px',
              }}>
                {referencePreviews.length}/{MAX_REFERENCES}
              </div>
            </div>

            {/* ── 원석 상세 레퍼런스 ── */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{
                  fontFamily: font, fontSize: '12px', fontWeight: 400,
                  color: C.textPrimary, paddingLeft: '2px',
                }}>
                  원석 상세
                </label>
                {stoneRefPreview && (
                  <button
                    onClick={() => { setStoneRefPreview(''); setStoneRefBase64(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: font, fontSize: '11px', color: C.textCaption, padding: '0 2px' }}
                  >✕ 제거</button>
                )}
              </div>
              <p style={{ fontFamily: font, fontSize: '11px', color: C.textCaption, marginBottom: '8px', paddingLeft: '2px', letterSpacing: '-0.22px', lineHeight: '15px' }}>
                원석 클로즈업 — 색상·컷·형태·마감을 이 이미지 기준으로 생성
              </p>
              {stoneRefPreview ? (
                <div
                  style={{
                    position: 'relative', width: '80px', height: '80px',
                    borderRadius: '16px',
                    outline: isStoneDragging ? `2px solid ${C.primary}` : 'none',
                    transition: 'outline 0.15s ease',
                  }}
                  onDragOver={handleStoneDragOver}
                  onDragLeave={handleStoneDragLeave}
                  onDrop={handleStoneDrop}
                >
                  <img
                    src={stoneRefPreview}
                    alt="원석 상세"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '16px', border: `1px solid ${C.primary}` }}
                  />
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  height: '44px', borderRadius: '14px',
                  border: isStoneDragging ? `1px dashed ${C.primary}` : `1px dashed ${C.borderDefault}`,
                  cursor: 'pointer', fontFamily: font, fontSize: '11px', color: C.textCaption,
                  backgroundColor: isStoneDragging ? '#f0f4ff' : C.surface, transition: 'all 0.15s ease',
                }}
                  onDragOver={handleStoneDragOver}
                  onDragLeave={handleStoneDragLeave}
                  onDrop={handleStoneDrop}
                  onMouseEnter={e => { if (!isStoneDragging) { e.currentTarget.style.borderColor = '#cfcfcf'; e.currentTarget.style.backgroundColor = '#fafafa'; } }}
                  onMouseLeave={e => { if (!isStoneDragging) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.backgroundColor = C.surface; } }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke={C.textCaption} strokeWidth="1.4" strokeLinecap="round"/></svg>
                  원석 이미지 업로드
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await readFileAsDataUrl(file);
                    setStoneRefPreview(dataUrl);
                    setStoneRefBase64(dataUrl.split(',')[1]);
                    e.target.value = '';
                  }} />
                </label>
              )}
            </div>

            {/* ── 구도 참고 (오로지 구도만, 화풍은 무시) ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '4px',
                paddingLeft: '2px',
              }}>
                구도 참고
              </label>
              <div style={{
                fontFamily: font, fontSize: '11px', fontWeight: 400,
                lineHeight: '15px', letterSpacing: '-0.22px',
                color: C.textCaption, marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                프레이밍·카메라 앵글·배치만 차용 — 화풍·색감·인물·소재는 영향 없음
              </div>

              {hasCompositions ? (
                <div
                  onDragOver={handleCompDragOver}
                  onDragLeave={handleCompDragLeave}
                  onDrop={handleCompDrop}
                  style={{
                    display: 'flex', flexWrap: 'wrap', gap: '10px',
                    padding: '12px', borderRadius: '20px',
                    border: `1.5px dashed ${isCompDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isCompDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {compositionPreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={src}
                        alt={`구도 참고 ${idx + 1}`}
                        style={{
                          width: '80px', height: '80px', objectFit: 'cover',
                          borderRadius: '16px', border: `1px solid ${C.borderDefault}`,
                          display: 'block',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeCompositionAt(idx)}
                        aria-label="이미지 삭제"
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: '#1f1f1f', border: `2px solid ${C.surface}`,
                          color: C.textWhite, fontSize: '13px', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1, padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {compositionPreviews.length < MAX_COMPOSITIONS && (
                    <label
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.borderColor = '#cfcfcf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surface;
                        e.currentTarget.style.borderColor = C.borderDefault;
                      }}
                      style={{
                      width: '80px', height: '80px', borderRadius: '16px',
                      border: `1.5px dashed ${C.borderDefault}`,
                      backgroundColor: C.surface,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.textCaption} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCompositionUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label
                  onDragOver={handleCompDragOver}
                  onDragLeave={handleCompDragLeave}
                  onDrop={handleCompDrop}
                  onMouseEnter={(e) => {
                    if (!isCompDragging) {
                      e.currentTarget.style.backgroundColor = '#fcfcfc';
                      e.currentTarget.style.borderColor = '#dcdcdc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCompDragging) {
                      e.currentTarget.style.backgroundColor = C.surface;
                      e.currentTarget.style.borderColor = C.borderDefault;
                    }
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '120px', borderRadius: '20px',
                    border: `1.5px dashed ${isCompDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isCompDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    gap: '12px',
                  }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isCompDragging ? C.primary : '#d5d5d5'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                  <span style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: isCompDragging ? C.primary : '#c8c8c8',
                    letterSpacing: '0.76px',
                  }}>
                    {isCompDragging ? '여기에 놓으세요' : `최대 ${MAX_COMPOSITIONS}장 · 장당 10MB 이하`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCompositionUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              <div style={{
                marginTop: '8px', textAlign: 'right',
                fontFamily: font, fontSize: '12px', color: C.textCaption,
                letterSpacing: '-0.24px',
                paddingRight: '2px',
              }}>
                {compositionPreviews.length}/{MAX_COMPOSITIONS}
              </div>
            </div>


            {/* ── CTA: 메인 컬럼 끝, 우측 정렬 ── */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              marginTop: '8px',
            }}>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                onPointerDown={e => { if (canGenerate) e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                style={{
                  height: '40px', padding: '0 44px', borderRadius: '12px',
                  backgroundColor: canGenerate ? C.primary : C.surfaceDisabled,
                  border: 'none', cursor: canGenerate ? 'pointer' : 'default',
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  color: canGenerate ? C.textWhite : C.textDisabled,
                  letterSpacing: '0.72px',
                  transition: 'all 0.15s ease',
                }}
              >
                생성하기
              </button>
            </div>

          </div>{/* close main column */}
          </div>
        )}

        {/* ════════ STEP: RESULT ════════ */}
        {step === 'result' && (
          <div style={{ padding: '0 20px 40px', position: 'relative' }}>

            {/* Vertical divider — extends from nav bottom to result content bottom */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', top: '-1px', bottom: 0,
                right: 'calc(20px + 88px + 16px)',
                width: '1px',
                backgroundColor: '#f0f0f0',
                pointerEvents: 'none',
              }} />
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                backgroundColor: '#fff2f0', border: '1px solid #ffccc7',
                marginBottom: '16px', marginTop: generating ? '0' : '8px',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  color: '#cf1322', letterSpacing: '-0.26px',
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Main viewer + thumbnail rail */}
            <div style={{
              display: 'flex', gap: '24px', alignItems: 'flex-start',
              marginTop: '24px',
            }}>
              {/* Main preview column */}
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                {currentImage?.src ? (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                      <div
                        className="transform-gpu"
                        onMouseEnter={() => setIsMainHover(true)}
                        onMouseLeave={() => setIsMainHover(false)}
                        onPointerDown={regionMode ? (e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
                          setDragStart({ x, y });
                          const v = { x, y, w: 0, h: 0 };
                          draftRectRef.current = v;
                          setDraftRect(v);
                          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
                        } : undefined}
                        onPointerMove={regionMode ? (e) => {
                          if (!dragStart) return;
                          const r = e.currentTarget.getBoundingClientRect();
                          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
                          const v = {
                            x: Math.min(dragStart.x, x),
                            y: Math.min(dragStart.y, y),
                            w: Math.abs(x - dragStart.x),
                            h: Math.abs(y - dragStart.y),
                          };
                          draftRectRef.current = v;
                          setDraftRect(v);
                        } : undefined}
                        onPointerUp={regionMode ? (e) => {
                          try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
                          setDragStart(null);
                          const v = draftRectRef.current;
                          if (v && v.w >= 0.02 && v.h >= 0.02) setSelRects(rs => [...rs, v]);
                          draftRectRef.current = null;
                          setDraftRect(null);
                        } : undefined}
                        style={{
                          position: 'relative',
                          aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                          maxHeight: 'min(72vh, 720px)',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          borderRadius: '24px',
                          border: `1px solid ${C.borderDefault}`,
                          overflow: 'hidden',
                          cursor: regionMode ? 'crosshair' : 'default',
                          touchAction: regionMode ? 'none' : 'auto',
                          userSelect: regionMode ? 'none' : 'auto',
                          WebkitUserSelect: regionMode ? 'none' : 'auto',
                        }}
                      >
                        <img
                          src={currentImage.src}
                          alt={`썸네일 ${currentImage.id}`}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                        />
                        {/* 영역 지정 오버레이 — 선택 박스들 + 바깥 디밍 (SVG 마스크로 여러 박스 처리) */}
                        {regionMode && (selRects.length > 0 || draftRect) && (
                          <svg
                            viewBox="0 0 1 1" preserveAspectRatio="none"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                          >
                            <defs>
                              <mask id="thumb-sel-mask">
                                <rect x="0" y="0" width="1" height="1" fill="white" />
                                {selRects.map((rr, i) => <rect key={i} x={rr.x} y={rr.y} width={rr.w} height={rr.h} fill="black" />)}
                                {draftRect && <rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h} fill="black" />}
                              </mask>
                            </defs>
                            <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.34)" mask="url(#thumb-sel-mask)" />
                            {selRects.map((rr, i) => (
                              <rect key={i} x={rr.x} y={rr.y} width={rr.w} height={rr.h} fill="none" stroke="#ff3b30" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                            ))}
                            {draftRect && (
                              <rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h} fill="none" stroke="#ff3b30" strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                            )}
                          </svg>
                        )}
                        {/* 각 선택 박스 삭제 버튼 */}
                        {regionMode && selRects.map((rr, i) => (
                          <button
                            key={i}
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); setSelRects(rs => rs.filter((_, idx) => idx !== i)); }}
                            aria-label="영역 삭제"
                            style={{
                              position: 'absolute',
                              left: `calc(${(rr.x + rr.w) * 100}% - 11px)`,
                              top: `calc(${rr.y * 100}% - 11px)`,
                              width: '22px', height: '22px', borderRadius: '50%',
                              backgroundColor: '#1f1f1f', border: '2px solid #ffffff',
                              color: '#ffffff', fontSize: '12px', fontWeight: 700, lineHeight: 1,
                              cursor: 'pointer', padding: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 3,
                            }}
                          >
                            ×
                          </button>
                        ))}
                        {/* Hover overlay: full-width download button */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          padding: '16px',
                          opacity: (isMainHover && !regionMode) ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                          pointerEvents: (isMainHover && !regionMode) ? 'auto' : 'none',
                        }}>
                          <button
                            onClick={() => { if (!upscaling) handleDownload(currentImage); }}
                            style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: '12px',
                              border: 'none',
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              color: C.textWhite, cursor: upscaling ? 'default' : 'pointer',
                              fontFamily: font, fontSize: '14px', fontWeight: 400,
                              letterSpacing: '-0.28px',
                            }}
                          >
                            {upscaling ? 'AI 업스케일 중...' : '다운로드'}
                          </button>
                        </div>
                      </div>

                      {/* ── 영역 지정 툴바 ── */}
                      <div style={{
                        marginTop: '16px',
                        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                      }}>
                        <button
                          onClick={() => {
                            const next = !regionMode;
                            setRegionMode(next);
                            if (!next) setStoneChangeMode(false);
                            setSelRects([]); setDraftRect(null); setDragStart(null);
                          }}
                          style={{
                            height: '32px', padding: '0 14px', borderRadius: '10px',
                            border: `1px solid ${regionMode && !stoneChangeMode ? C.primary : C.borderDefault}`,
                            backgroundColor: regionMode && !stoneChangeMode ? C.primaryLight : C.surface,
                            color: regionMode && !stoneChangeMode ? C.primaryDark : C.textSecondary,
                            cursor: 'pointer',
                            fontFamily: font, fontSize: '12px', fontWeight: 400,
                            letterSpacing: '-0.24px', transition: 'all 0.15s ease',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3" />
                          </svg>
                          {regionMode && !stoneChangeMode ? '영역 지정 중' : '영역 지정해서 수정'}
                        </button>
                        <button
                          onClick={() => {
                            setStoneChangeMode(true);
                            setRegionMode(true);
                            setSelRects([]); setDraftRect(null); setDragStart(null);
                            setEditPrompt('');
                          }}
                          style={{
                            height: '32px', padding: '0 14px', borderRadius: '10px',
                            border: `1px solid ${stoneChangeMode ? '#e8a020' : C.borderDefault}`,
                            backgroundColor: stoneChangeMode ? '#fff8ee' : C.surface,
                            color: stoneChangeMode ? '#c47a10' : C.textSecondary,
                            cursor: 'pointer',
                            fontFamily: font, fontSize: '12px', fontWeight: 400,
                            letterSpacing: '-0.24px', transition: 'all 0.15s ease',
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                          }}
                        >
                          💎 원석/장식 교체
                        </button>
                        {regionMode && (
                          <span style={{
                            fontFamily: font, fontSize: '12px', color: C.textCaption, letterSpacing: '-0.24px',
                          }}>
                            {selRects.length > 0
                              ? `${selRects.length}개 영역 선택됨 · 드래그로 더 추가, 박스의 × 로 삭제`
                              : '이미지 위에서 드래그해 수정할 영역을 선택하세요 (여러 개 가능)'}
                          </span>
                        )}
                        {regionMode && selRects.length > 0 && (
                          <button
                            onClick={() => setSelRects([])}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                              fontFamily: font, fontSize: '12px', color: C.primary, letterSpacing: '-0.24px',
                            }}
                          >
                            전체 해제
                          </button>
                        )}
                      </div>

                      {/* ── 이미지 수정 입력 ── */}
                      <div style={{
                        marginTop: '10px',
                        display: 'flex', gap: '8px', alignItems: 'stretch',
                      }}>
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={e => setEditPrompt(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing && editPrompt.trim() && !editing) {
                              e.preventDefault();
                              if (regionMode && selRects.length > 0) handleRegionEdit(); else if (!regionMode) handleEdit();
                            }
                          }}
                          placeholder={
                            stoneChangeMode
                              ? (selRects.length > 0 ? '어떤 원석/장식으로 교체할까요? (예: 레드 코랄을 터키석으로)' : '팔찌에서 원석/장식 부분을 드래그해 선택하세요')
                              : regionMode
                                ? (selRects.length > 0 ? '선택한 부분(들)을 어떻게 바꿀까요? (예: 이 별을 더 크게)' : '이미지에서 수정할 영역을 드래그하세요')
                                : '어떻게 수정할까요? (예: 여자 드레스를 흰색으로)'
                          }
                          disabled={editing || (regionMode && selRects.length === 0)}
                          className="outline-none"
                          style={{
                            flex: 1, height: '44px', borderRadius: '12px',
                            padding: '0 16px',
                            fontFamily: font, fontSize: '13px', fontWeight: 400,
                            color: C.textPrimary,
                            backgroundColor: (editing || (regionMode && selRects.length === 0)) ? C.surfaceDisabled : C.surface,
                            border: `1px solid ${C.borderDefault}`,
                            letterSpacing: '-0.26px',
                            transition: 'all 0.15s ease',
                            minWidth: 0,
                          }}
                          onFocus={e => { if (!editing && !(regionMode && selRects.length === 0)) e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = C.borderDefault; }}
                        />
                        <button
                          onClick={() => { if (regionMode && selRects.length > 0) handleRegionEdit(); else if (!regionMode) handleEdit(); }}
                          disabled={!editPrompt.trim() || editing || (regionMode && selRects.length === 0)}
                          style={{
                            height: '44px', padding: '0 24px', borderRadius: '12px',
                            backgroundColor: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? C.primary : C.surfaceDisabled,
                            border: 'none',
                            cursor: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? 'pointer' : 'default',
                            fontFamily: font, fontSize: '13px', fontWeight: 400,
                            color: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? C.textWhite : C.textDisabled,
                            letterSpacing: '-0.26px',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {editing
                            ? (regionMode && selRects.length > 0 ? '영역 수정 중...' : '수정 중...')
                            : (regionMode && selRects.length > 0 ? `선택 영역 수정${selRects.length > 1 ? ` (${selRects.length})` : ''}` : '수정하기')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: 'min(72vh, 720px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div className="flex flex-col items-center" style={{ gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        border: `3px solid ${C.borderDefault}`,
                        borderTopColor: C.primary,
                        animation: 'spin 1s linear infinite',
                      }} />
                      <p style={{
                        fontFamily: font, fontSize: '14px', fontWeight: 400,
                        color: C.textCaption,
                      }}>
                        {generating ? `${effectiveCount}장 생성 중...` : '재생성 중...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right thumbnail rail */}
              {images.length > 1 && (
                <aside style={{
                  width: '88px',
                  flexShrink: 0,
                  position: 'sticky',
                  top: '68px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {images.map((img) => {
                      const isSelected = img.id === selectedImageId;
                      const isHovered = hoverThumbId === img.id;
                      return (
                        <div key={img.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => setSelectedImageId(img.id)}
                            onMouseEnter={() => setHoverThumbId(img.id)}
                            onMouseLeave={() => setHoverThumbId(null)}
                            className="transform-gpu"
                            style={{
                              position: 'relative',
                              width: '100%',
                              minHeight: '52px',
                              aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: isSelected
                                ? `2px solid ${C.primary}`
                                : `1px solid ${C.borderDefault}`,
                              padding: 0,
                              cursor: 'pointer',
                              backgroundColor: C.surfaceSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'border 0.15s ease',
                            }}
                          >
                            {img.src && (
                              <img
                                src={img.src}
                                alt={`썸네일 ${img.id}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </button>
                          {/* 다운로드 버튼 — 선택된 이미지에만 표시 (겹침 방지) */}
                          {isSelected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (!upscaling) handleDownload(img); }}
                              onMouseEnter={(e) => { if (!upscaling) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.11)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              onMouseDown={(e) => { if (!upscaling) { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.16)'; e.currentTarget.style.transform = 'scale(0.97)'; } }}
                              onMouseUp={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.11)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              style={{
                                width: '100%',
                                padding: '5px 4px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0,0,0,0.06)',
                                border: 'none',
                                color: upscaling ? C.textDisabled : C.textSecondary,
                                fontFamily: font, fontSize: '10px', fontWeight: 400,
                                letterSpacing: '-0.2px',
                                textAlign: 'center',
                                cursor: upscaling ? 'default' : 'pointer',
                                transition: 'background-color 0.12s ease, transform 0.1s ease',
                              }}
                            >
                              {upscaling ? '업스케일 중...' : '다운로드'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
