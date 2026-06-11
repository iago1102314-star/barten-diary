"use client";

import { MasterIntroPanel } from "@/components/entrance/master-intro-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";

type MasterOnBlackScreenProps = {
  returning?: boolean;
  onComplete: () => void;
};

/** 真っ暗な画面の上にマスター吹き出しだけ */
export function MasterOnBlackScreen({
  returning = false,
  onComplete,
}: MasterOnBlackScreenProps) {
  return (
    <div className="stage-viewport">
      <SceneFrame className="bg-black" atmosphere={false}>
        <div className="absolute inset-0 z-30">
          <MasterIntroPanel
            returning={returning}
            onComplete={onComplete}
            bubbleDelayMs={BAR_AUDIO_TIMING.masterBubbleDelayAfterDoorMs}
          />
        </div>
      </SceneFrame>
    </div>
  );
}
