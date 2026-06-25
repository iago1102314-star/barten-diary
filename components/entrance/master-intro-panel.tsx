"use client";

import { DialogueBox } from "@/components/entrance/dialogue-box";
import type { MasterDialogueBodyHandle } from "@/components/entrance/master-dialogue-body";
import { barAudioEngine, unlockBarAudioForUserGesture } from "@/lib/entrance/bar-audio-engine";
import { useDialogueAdvance } from "@/hooks/use-dialogue-advance";
import { useRapidTapSkip } from "@/hooks/use-rapid-tap-skip";
import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MASTER_GREETINGS_FIRST,
  MASTER_GREETINGS_RETURNING,
} from "@/lib/entrance/master-greetings";

type MasterIntroPanelProps = {
  returning?: boolean;
  /** 省略時は初回 / 再訪の挨拶 */
  lines?: readonly string[];
  onComplete: () => void;
  /** 扉 SE 後に吹き出しを出すまでの遅延（ms）。省略時は即表示 */
  bubbleDelayMs?: number;
  /** 2タップ連打でセリフを飛ばして完了へ（提供後の口をつける等） */
  onSkipToEnd?: () => void;
};

/**
 * MasterScene 相当 — 吹き出し＋Typewriter＋タップ進行。
 * 背景（CounterScene）は親が担当。
 */
export function MasterIntroPanel({
  returning = false,
  lines,
  onComplete,
  bubbleDelayMs = 0,
  onSkipToEnd,
}: MasterIntroPanelProps) {
  const dialogueLines =
    lines ??
    (returning ? MASTER_GREETINGS_RETURNING : MASTER_GREETINGS_FIRST);
  const [bubbleVisible, setBubbleVisible] = useState(bubbleDelayMs === 0);
  const bubbleDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueBodyRef = useRef<MasterDialogueBodyHandle>(null);
  const { index, done, setDone, advance, currentLine } =
    useDialogueAdvance(dialogueLines, onComplete);

  useEffect(() => {
    if (bubbleDelayMs <= 0) {
      setBubbleVisible(true);
      return;
    }

    setBubbleVisible(false);
    bubbleDelayTimerRef.current = setTimeout(() => {
      bubbleDelayTimerRef.current = null;
      setBubbleVisible(true);
    }, bubbleDelayMs);

    return () => {
      if (bubbleDelayTimerRef.current) {
        clearTimeout(bubbleDelayTimerRef.current);
        bubbleDelayTimerRef.current = null;
      }
    };
  }, [bubbleDelayMs]);

  const bubbleVisibleRef = useRef(bubbleVisible);
  const doneRef = useRef(done);
  bubbleVisibleRef.current = bubbleVisible;
  doneRef.current = done;

  const revealBubbleNow = useCallback(() => {
    if (bubbleVisibleRef.current) return;
    if (bubbleDelayTimerRef.current) {
      clearTimeout(bubbleDelayTimerRef.current);
      bubbleDelayTimerRef.current = null;
    }
    setBubbleVisible(true);
  }, []);

  const { registerTap: registerSkipTap, resetStreak: resetSkipStreak } =
    useRapidTapSkip(() => {
      if (onSkipToEnd) {
        onSkipToEnd();
        return;
      }
      if (!bubbleVisibleRef.current) {
        revealBubbleNow();
        return;
      }
      if (!doneRef.current) {
        dialogueBodyRef.current?.completeTyping();
      }
    });

  useEffect(() => {
    if (bubbleVisible && done) {
      resetSkipStreak();
    }
  }, [bubbleVisible, done, resetSkipStreak]);

  const handlePointerDown = useCallback(() => {
    unlockBarAudioForUserGesture();
    if (!bubbleVisible || !done) return;
    barAudioEngine.playClick();
  }, [bubbleVisible, done]);

  const handleTap = useCallback(() => {
    unlockBarAudioForUserGesture();
    if (!bubbleVisible || !done) {
      registerSkipTap();
      return;
    }
    advance();
  }, [advance, bubbleVisible, done, registerSkipTap]);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onClick={handleTap}
      className="flex h-full w-full flex-col items-stretch justify-end text-left [-webkit-tap-highlight-color:transparent]"
    >
      {bubbleVisible && (
        <div className="w-full self-stretch pb-12">
          <DialogueBox
            lineKey={index}
            showAdvanceCue={done}
            text={currentLine}
            typewriterSpeed={MASTER_DIALOGUE_TYPOGRAPHY.typewriterSpeedMs}
            onTypewriterDone={() => setDone(true)}
            dialogueBodyRef={dialogueBodyRef}
          />
        </div>
      )}
    </button>
  );
}
