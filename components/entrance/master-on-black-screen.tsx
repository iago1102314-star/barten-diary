"use client";

import { MasterIntroPanel } from "@/components/entrance/master-intro-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";
import { DECLINE_NIGHT_TUNING } from "@/lib/entrance/decline-night-tuning";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";

type MasterOnBlackScreenProps = {
  returning?: boolean;
  lines?: readonly string[];
  onComplete: () => void;
  bubbleDelayMs?: number;
  /** セリフ完了後 — 黒で覆い尽くしてから onExitComplete */
  exiting?: boolean;
  onExitComplete?: () => void;
  exitFadeSec?: number;
};

/** 真っ暗な画面の上にマスター吹き出しだけ */
export function MasterOnBlackScreen({
  returning = false,
  lines,
  onComplete,
  bubbleDelayMs = BAR_AUDIO_TIMING.masterBubbleDelayAfterDoorMs,
  exiting = false,
  onExitComplete,
  exitFadeSec = DECLINE_NIGHT_TUNING.returnFadeOutSec,
}: MasterOnBlackScreenProps) {
  return (
    <div className="stage-viewport">
      <SceneFrame className="bg-black" atmosphere={false}>
        <div
          className={`absolute inset-0 z-30 ${exiting ? "pointer-events-none" : ""}`}
        >
          <MasterIntroPanel
            returning={returning}
            lines={lines}
            onComplete={onComplete}
            bubbleDelayMs={bubbleDelayMs}
          />
        </div>
        {exiting && (
          <motion.div
            className="absolute inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: exitFadeSec, ease: EASE_DRIFT }}
            onAnimationComplete={onExitComplete}
          />
        )}
      </SceneFrame>
    </div>
  );
}
