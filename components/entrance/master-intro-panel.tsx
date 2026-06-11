"use client";

import { DialogueBox } from "@/components/entrance/dialogue-box";
import { Typewriter } from "@/components/motion/typewriter";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { useDialogueAdvance } from "@/hooks/use-dialogue-advance";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";
import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { useCallback, useEffect, useState } from "react";
import {
  MASTER_GREETINGS_FIRST,
  MASTER_GREETINGS_RETURNING,
} from "@/lib/entrance/master-greetings";

type MasterIntroPanelProps = {
  returning?: boolean;
  onComplete: () => void;
  /** 扉 SE 後に吹き出しを出すまでの遅延（ms）。省略時は即表示 */
  bubbleDelayMs?: number;
};

/**
 * MasterScene 相当 — 吹き出し＋Typewriter＋タップ進行。
 * 背景（CounterScene）は親が担当。
 */
export function MasterIntroPanel({
  returning = false,
  onComplete,
  bubbleDelayMs = 0,
}: MasterIntroPanelProps) {
  const lines = returning ? MASTER_GREETINGS_RETURNING : MASTER_GREETINGS_FIRST;
  const [bubbleVisible, setBubbleVisible] = useState(bubbleDelayMs === 0);
  const { index, done, setDone, advance, currentLine } =
    useDialogueAdvance(lines, onComplete);

  useEffect(() => {
    if (bubbleDelayMs <= 0) {
      setBubbleVisible(true);
      return;
    }

    setBubbleVisible(false);
    const timer = setTimeout(() => {
      setBubbleVisible(true);
    }, bubbleDelayMs);

    return () => clearTimeout(timer);
  }, [bubbleDelayMs]);

  const handleTap = useCallback(() => {
    if (!bubbleVisible || !done) return;
    barAudioEngine.playClick();
    advance();
  }, [bubbleVisible, done, advance]);

  return (
    <button
      type="button"
      onClick={handleTap}
      className="flex h-full w-full flex-col justify-end text-left [-webkit-tap-highlight-color:transparent]"
    >
      {bubbleVisible && (
        <div className="px-7 pb-12">
          <DialogueBox lineKey={index} showAdvanceCue={done}>
            <Typewriter
              key={index}
              text={currentLine}
              speed={MASTER_DIALOGUE_TYPOGRAPHY.typewriterSpeedMs}
              onDone={() => setDone(true)}
            />
          </DialogueBox>
        </div>
      )}
    </button>
  );
}
