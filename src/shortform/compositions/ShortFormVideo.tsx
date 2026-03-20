import { AbsoluteFill, Sequence, Audio } from 'remotion';
import type { Scene, TtsAudio, BgmAudio, MotionTheme } from '../types';
import { VIDEO_FPS } from '../constants';
import SceneRenderer from './SceneRenderer';
import SubtitleOverlay from './SubtitleOverlay';

export type ShortFormVideoProps = {
  scenes: Scene[];
  ttsAudios: TtsAudio[];
  bgmAudio?: BgmAudio | null;
  motionTheme?: MotionTheme;
};

export function computeSceneFrames(scenes: Scene[], ttsAudios: TtsAudio[]): number[] {
  return scenes.map((scene) => {
    const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);
    const durationSec = tts ? tts.durationInSeconds : scene.duration;
    return Math.round(durationSec * VIDEO_FPS);
  });
}

export function computeTotalFrames(scenes: Scene[], ttsAudios: TtsAudio[]): number {
  return computeSceneFrames(scenes, ttsAudios).reduce((a, b) => a + b, 0);
}

// 트랜지션 오버랩 반영 버전 (staging에서 확장 예정, 현재는 동일)
export const computeTotalFramesWithTransitions = computeTotalFrames;

export default function ShortFormVideo({ scenes, ttsAudios, bgmAudio, motionTheme }: ShortFormVideoProps) {
  const sceneFrames = computeSceneFrames(scenes, ttsAudios);
  const totalFrames = sceneFrames.reduce((a, b) => a + b, 0);
  let frameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* BGM 트랙 (전체 영상 길이, 볼륨 25%) */}
      {bgmAudio && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={bgmAudio.dataUrl} volume={0.25} />
        </Sequence>
      )}

      {scenes.map((scene, idx) => {
        const from = frameOffset;
        const dur = sceneFrames[idx];
        frameOffset += dur;
        const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);

        return (
          <Sequence key={scene.scene_number} from={from} durationInFrames={dur} premountFor={VIDEO_FPS}>
            <SceneRenderer scene={scene} prevScene={idx > 0 ? scenes[idx - 1] : undefined} motionTheme={motionTheme} />
            <SubtitleOverlay subtitle={scene.subtitle} />
            {tts && <Audio src={tts.dataUrl} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
