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
