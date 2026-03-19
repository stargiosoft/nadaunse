import type { MotionStyle } from '../../types';
import type { MotionComponentProps } from './types';
import KeywordPopMotion from './KeywordPopMotion';
import TypewriterMotion from './TypewriterMotion';
import SlideStackMotion from './SlideStackMotion';
import CounterMotion from './CounterMotion';
import SplitCompareMotion from './SplitCompareMotion';
import RadialBurstMotion from './RadialBurstMotion';
import ListRevealMotion from './ListRevealMotion';
import ZoomImpactMotion from './ZoomImpactMotion';
import GlitchMotion from './GlitchMotion';
import WaveMotion from './WaveMotion';

export const MOTION_REGISTRY: Record<MotionStyle, React.FC<MotionComponentProps>> = {
  keyword_pop: KeywordPopMotion,
  typewriter: TypewriterMotion,
  slide_stack: SlideStackMotion,
  counter: CounterMotion,
  split_compare: SplitCompareMotion,
  radial_burst: RadialBurstMotion,
  list_reveal: ListRevealMotion,
  zoom_impact: ZoomImpactMotion,
  glitch: GlitchMotion,
  wave: WaveMotion,
};

export type { MotionComponentProps } from './types';
