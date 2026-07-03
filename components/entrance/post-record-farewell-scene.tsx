"use client";

import { CounterScene } from "@/components/entrance/counter-scene";
import { EnteringReveal } from "@/components/entrance/entering-reveal";
import { MasterIntroPanel } from "@/components/entrance/master-intro-panel";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type PostRecordFarewellPhase = "thanks" | "exiting";

type PostRecordFarewellSceneProps = {
  /** 最後のセリフ確定 — jazz 停止など（画面はそのまま） */
  onThanksComplete: () => void;
  /** 引き演出完了 — 扉 SE は親が鳴らす */
  onDarkened: () => void;
  /** 扉 SE 後のホールド完了 — 路地へ */
  onComplete: () => void;
};

/**
 * マスター別れ〜店内を引いていく退店 — CounterScene を切り替えず一本の演出。
 */
export function PostRecordFarewellScene({
  onThanksComplete,
  onDarkened,
  onComplete,
}: PostRecordFarewellSceneProps) {
  const [phase, setPhase] = useState<PostRecordFarewellPhase>("thanks");
  const onDarkenedRef = useRef(onDarkened);
  const onCompleteRef = useRef(onComplete);
  onDarkenedRef.current = onDarkened;
  onCompleteRef.current = onComplete;

  const darkenedRef = useRef(false);
  const bubbleDelayMs =
    BAR_AUDIO_TIMING.counterRevealFadeDelayMs +
    BAR_AUDIO_TIMING.counterRevealFadeMs;

  const handleThanksComplete = useCallback(() => {
    onThanksComplete();
    setPhase("exiting");
  }, [onThanksComplete]);

  const handlePullBackComplete = () => {
    if (phase !== "exiting" || darkenedRef.current) return;
    darkenedRef.current = true;
    onDarkenedRef.current();

    window.setTimeout(() => {
      onCompleteRef.current();
    }, POST_RECORD_EXIT_TUNING.afterDoorHoldMs);
  };

  const exiting = phase === "exiting";

  return (
    <SceneFrame className={exiting ? "bg-black" : undefined} atmosphere>
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          exiting
            ? {
                scale: POST_RECORD_EXIT_TUNING.storeExitPullBackScale,
                opacity: 0,
              }
            : { scale: 1, opacity: 1 }
        }
        style={{ transformOrigin: POST_RECORD_EXIT_TUNING.storeExitOrigin }}
        transition={{
          duration: POST_RECORD_EXIT_TUNING.storeExitDurationSec,
          ease: EASE_DRIFT,
        }}
        onAnimationComplete={() => {
          if (exiting) handlePullBackComplete();
        }}
      >
        <CounterScene
          priority
          settle={false}
          masterMode="idle"
          showLampGlowLight
        />
      </motion.div>

      <EnteringReveal />

      <motion.div
        className="absolute inset-0 z-30"
        initial={false}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.28, ease: EASE_DRIFT }}
        style={{ pointerEvents: exiting ? "none" : "auto" }}
      >
        <MasterIntroPanel
          lines={POST_RECORD_EXIT_TUNING.masterThanksLines}
          onComplete={handleThanksComplete}
          bubbleDelayMs={bubbleDelayMs}
        />
      </motion.div>
    </SceneFrame>
  );
}
