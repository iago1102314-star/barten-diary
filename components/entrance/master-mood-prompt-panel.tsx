"use client";

import { DialogueBox } from "@/components/entrance/dialogue-box";
import type { MasterDialogueBodyHandle } from "@/components/entrance/master-dialogue-body";
import { barAudioEngine, unlockBarAudioForUserGesture } from "@/lib/entrance/bar-audio-engine";
import { useDialogueAdvance } from "@/hooks/use-dialogue-advance";
import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { MASTER_MOOD_PROMPT } from "@/lib/entrance/master-greetings";
import { useCallback, useRef } from "react";

type MasterMoodPromptPanelProps = {
  onComplete: () => void;
};

/** マスター登場後 — 気分選択前の一言 */
export function MasterMoodPromptPanel({ onComplete }: MasterMoodPromptPanelProps) {
  const dialogueBodyRef = useRef<MasterDialogueBodyHandle>(null);
  const { index, done, setDone, advance, currentLine } = useDialogueAdvance(
    MASTER_MOOD_PROMPT,
    onComplete,
  );

  const handlePointerDown = useCallback(() => {
    unlockBarAudioForUserGesture();
    if (!done) return;
    barAudioEngine.playClick();
  }, [done]);

  const handleTap = useCallback(() => {
    unlockBarAudioForUserGesture();
    if (!done) return;
    advance();
  }, [advance, done]);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onClick={handleTap}
      className="flex h-full w-full flex-col items-stretch justify-end text-left [-webkit-tap-highlight-color:transparent]"
    >
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
    </button>
  );
}
