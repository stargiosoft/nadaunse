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
  // Scene background image (Level 2)
  backgroundImageUrl?: string;
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
