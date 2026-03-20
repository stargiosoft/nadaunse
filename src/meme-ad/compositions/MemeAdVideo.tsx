import { AbsoluteFill, Sequence, Audio, Video } from 'remotion';
import type { Scene, TtsAudio, BgmAudio } from '../types';
import { VIDEO_FPS } from '../constants';
import SceneRenderer from '../../shortform/compositions/SceneRenderer';
import SubtitleOverlay from '../../shortform/compositions/SubtitleOverlay';
import TransitionOverlay from './TransitionOverlay';
import type { TransitionType } from './TransitionOverlay';

export type MemeAdVideoProps = {
  hookVideoUrl: string;
  hookDurationInSeconds: number;
  scenes: Scene[];
  ttsAudios: TtsAudio[];
  bgmAudio?: BgmAudio | null;
  transitionType?: TransitionType;
};

export function computeAdSceneFrames(scenes: Scene[], ttsAudios: TtsAudio[]): number[] {
  return scenes.map((scene) => {
    const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);
    const durationSec = tts ? tts.durationInSeconds : scene.duration;
    return Math.round(durationSec * VIDEO_FPS);
  });
}

export function computeTotalMemeAdFrames(
  hookDurationInSeconds: number,
  scenes: Scene[],
  ttsAudios: TtsAudio[],
): number {
  const hookFrames = Math.round(hookDurationInSeconds * VIDEO_FPS);
  const adFrames = computeAdSceneFrames(scenes, ttsAudios).reduce((a, b) => a + b, 0);
  return hookFrames + adFrames;
}

export default function MemeAdVideo({
  hookVideoUrl,
  hookDurationInSeconds,
  scenes,
  ttsAudios,
  bgmAudio,
  transitionType = 'fade',
}: MemeAdVideoProps) {
  const hookFrames = Math.round(hookDurationInSeconds * VIDEO_FPS);
  const adSceneFrames = computeAdSceneFrames(scenes, ttsAudios);
  const adTotalFrames = adSceneFrames.reduce((a, b) => a + b, 0);
  const totalFrames = hookFrames + adTotalFrames;
  const transitionFrames = Math.round(0.5 * VIDEO_FPS); // 0.5초 전환

  let adFrameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* ── Hook Video ── */}
      <Sequence from={0} durationInFrames={hookFrames}>
        <AbsoluteFill>
          <Video
            src={hookVideoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* ── Transition ── */}
      <Sequence
        from={Math.max(0, hookFrames - transitionFrames)}
        durationInFrames={transitionFrames * 2}
      >
        <TransitionOverlay type={transitionType} durationInFrames={transitionFrames * 2} />
      </Sequence>

      {/* ── Ad Scenes ── */}
      {scenes.map((scene, idx) => {
        const from = hookFrames + adFrameOffset;
        const dur = adSceneFrames[idx];
        adFrameOffset += dur;
        const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);

        return (
          <Sequence key={scene.scene_number} from={from} durationInFrames={dur}>
            <SceneRenderer scene={scene} />
            <SubtitleOverlay subtitle={scene.subtitle} />
            {tts && <Audio src={tts.dataUrl} />}
          </Sequence>
        );
      })}

      {/* ── BGM (전체) ── */}
      {bgmAudio && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={bgmAudio.dataUrl} volume={0.25} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
}
