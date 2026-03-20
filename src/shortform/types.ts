export type MotionStyle =
  | 'keyword_pop'      // 키워드 스프링 팝인 (기본)
  | 'typewriter'       // 타이핑 효과
  | 'slide_stack'      // 좌우 슬라이드 스택
  | 'counter'          // 숫자 카운트업
  | 'split_compare'    // 좌우 비교 분할
  | 'radial_burst'     // 중앙 방사형 버스트
  | 'list_reveal'      // 리스트 순차 등장
  | 'zoom_impact'      // 줌인 임팩트
  | 'glitch'           // 글리치/디스토션
  | 'wave'             // 웨이브 텍스트
  | 'spotlight'        // 스포트라이트 원형 reveal
  | 'card_flip'        // 3D 카드 뒤집기
  | 'progress_bar'     // 가로 프로그레스 바
  | 'emoji_rain'       // 이모지 비
  | 'parallax_layers'  // 패럴랙스 레이어
  ;

export type SceneLayout = 'center' | 'top_heavy' | 'bottom_heavy' | 'split_left' | 'split_right';

export type Scene = {
  scene_number: number;
  duration: number;
  type: string;
  narration: string;
  subtitle: string;
  visual: string;
  transition: string;
  // AI-driven motion style (Level 1-B)
  motion_style?: MotionStyle;
  layout?: SceneLayout;
  icon?: string;
  // Dynamic color palette (Gemini-generated)
  accent_color?: string;
  glow_color?: string;
  // Scene background image (Level 2)
  backgroundImageUrl?: string;
  // Scene background video (Level 3 — fal.ai Image-to-Video)
  backgroundVideoUrl?: string;
};

export type ScriptResult = {
  title: string;
  hook: string;
  total_duration: number;
  scenes: Scene[];
  hashtags: string[];
  bgm_mood: string;
  thumbnail_text: string;
};

export type TtsAudio = {
  sceneNumber: number;
  dataUrl: string;
  durationInSeconds: number;
};

export type BgmAudio = {
  dataUrl: string;
  durationInSeconds: number;
  track: {
    id: string;
    name: string;
    artist: string;
    duration: number;
    license: string;
    url: string;
  };
};

// ── Motion Theme (visual style for motion graphics) ──

export type MotionTheme = 'dark_neon' | 'bold_impact' | 'black_vivid' | 'light_clean' | 'warm_gradient';

export const MOTION_THEMES = [
  { id: 'dark_neon' as const, label: '다크 네온', desc: '어두운 배경 + 글로우', preview: ['#1a0a2e', '#FF6B6B'] },
  { id: 'bold_impact' as const, label: '볼드 임팩트', desc: '딥네이비 + 강렬 타이포', preview: ['#1a2744', '#FF4D6A'] },
  { id: 'black_vivid' as const, label: '블랙 비비드', desc: '블랙 + 네온 컬러', preview: ['#0a0a0a', '#00FF88'] },
  { id: 'light_clean' as const, label: '라이트 클린', desc: '밝은 배경 + 선명 컬러', preview: ['#f0f0f5', '#4A90D9'] },
  { id: 'warm_gradient' as const, label: '웜 그라디언트', desc: '따뜻한 그라디언트', preview: ['#2d1a0a', '#FF8C42'] },
] as const;

// Theme rendering config (used by SceneRenderer + renderVideo)
export type ThemeConfig = {
  bgMode: 'gradient' | 'solid' | 'light';
  baseBg: [string, string, string]; // fallback bg when no accent_color
  bgBrightness: number; // 0~1, multiplier for deriveBackground
  grid: boolean;
  grain: boolean;
  bokehCount: number;
  sparkleCount: number;
  shapeCount: number;
  dotPattern: boolean;
  textColor: string; // for light themes
};

export const THEME_CONFIGS: Record<MotionTheme, ThemeConfig> = {
  dark_neon: {
    bgMode: 'gradient', baseBg: ['#1a0a2e', '#2d1b69', '#16213e'],
    bgBrightness: 0.08, grid: true, grain: true,
    bokehCount: 8, sparkleCount: 7, shapeCount: 10,
    dotPattern: false, textColor: '#ffffff',
  },
  bold_impact: {
    bgMode: 'solid', baseBg: ['#1a2744', '#1e2d4f', '#162040'],
    bgBrightness: 0.15, grid: false, grain: false,
    bokehCount: 0, sparkleCount: 3, shapeCount: 0,
    dotPattern: true, textColor: '#ffffff',
  },
  black_vivid: {
    bgMode: 'solid', baseBg: ['#080808', '#0d0d0d', '#050505'],
    bgBrightness: 0.04, grid: false, grain: false,
    bokehCount: 3, sparkleCount: 5, shapeCount: 0,
    dotPattern: false, textColor: '#ffffff',
  },
  light_clean: {
    bgMode: 'light', baseBg: ['#f0f0f5', '#e8e8f0', '#f5f5fa'],
    bgBrightness: 0.92, grid: false, grain: false,
    bokehCount: 0, sparkleCount: 3, shapeCount: 0,
    dotPattern: false, textColor: '#1a1a2e',
  },
  warm_gradient: {
    bgMode: 'gradient', baseBg: ['#2d1a0a', '#3d2010', '#1a1008'],
    bgBrightness: 0.10, grid: false, grain: true,
    bokehCount: 4, sparkleCount: 5, shapeCount: 3,
    dotPattern: false, textColor: '#ffffff',
  },
};

export type BgmMood = typeof BGM_MOODS[number]['id'];

export const BGM_MOODS = [
  { id: 'none', label: 'BGM 없음' },
  { id: '밝고 경쾌한', label: '밝고 경쾌한' },
  { id: '차분하고 편안한', label: '차분하고 편안한' },
  { id: '긴장감 있는', label: '긴장감 있는' },
  { id: '감성적인', label: '감성적인' },
  { id: '힙한/트렌디', label: '힙한/트렌디' },
  { id: '신나는', label: '신나는' },
  { id: '동기부여', label: '동기부여' },
  { id: '미스터리', label: '미스터리' },
] as const;
