"use client";

import { DialogueBox } from "@/components/entrance/dialogue-box";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { useDialogueAdvance } from "@/hooks/use-dialogue-advance";
import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { MASTER_MOOD_PROMPT } from "@/lib/entrance/master-greetings";
import { useCallback } from "react";

type MasterMoodPromptPanelProps = {
  onComplete: () => void;
};

/** マスター登場後 — 気分選択前の一言 */
export function MasterMoodPromptPanel({ onComplete }: MasterMoodPromptPanelProps) {
  const { index, done, setDone, advance, currentLine } = useDialogueAdvance(
    MASTER_MOOD_PROMPT,
    onComplete,
  );

  const handlePointerDown = useCallback(() => {
    if (!done) return;
    barAudioEngine.playClick();
  }, [done]);

  const handleTap = useCallback(() => {
    if (!done) return;
    advance();
  }, [done, advance]);

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
        />
      </div>
    </button>
  );
}
