"use client";

import { CounterScene } from "@/components/entrance/counter-scene";
import { EnteringReveal } from "@/components/entrance/entering-reveal";
import { MasterIntroPanel } from "@/components/entrance/master-intro-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";
import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";

type PostRecordThanksSceneProps = {
  onComplete: () => void;
};

/** 入店直後と同じ counter-back / front + master-idle — 明転後にマスター別れ */
export function PostRecordThanksScene({ onComplete }: PostRecordThanksSceneProps) {
  const bubbleDelayMs =
    BAR_AUDIO_TIMING.counterRevealFadeDelayMs +
    BAR_AUDIO_TIMING.counterRevealFadeMs;

  return (
    <SceneFrame atmosphere>
      <CounterScene
        priority
        settle={false}
        masterMode="idle"
        showLampGlowLight
      />
      <EnteringReveal backdropColor={POST_RECORD_EXIT_TUNING.softBlackColor} />
      <div className="pointer-events-auto absolute inset-0 z-30">
        <MasterIntroPanel
          lines={POST_RECORD_EXIT_TUNING.masterThanksLines}
          onComplete={onComplete}
          bubbleDelayMs={bubbleDelayMs}
        />
      </div>
    </SceneFrame>
  );
}
