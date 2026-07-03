"use client";

import { DialogueBox } from "@/components/entrance/dialogue-box";
import type { MasterDialogueBodyHandle } from "@/components/entrance/master-dialogue-body";
import { barAudioEngine, unlockBarAudioForUserGesture } from "@/lib/entrance/bar-audio-engine";
import { useDialogueAdvance } from "@/hooks/use-dialogue-advance";
import {
  masterDialoguePanelWrapperStyle,
  resolveMasterDialogueTypewriterSpeedMs,
} from "@/lib/entrance/master-dialogue-typography";
import {
  MASTER_MOOD_PROMPT,
  MASTER_MOOD_PROMPT_SKIP_STOP,
} from "@/lib/entrance/master-greetings";
import { useCallback, useRef } from "react";

type MasterMoodPromptPanelProps = {
  onComplete: () => void;
  /** 明転連打スキップ後 —「さて、今日は」まで表示済み、後半のみタイプ */
  skippedToPrefix?: boolean;
};

/** マスター登場後 — 気分選択前の一言 */
export function MasterMoodPromptPanel({
  onComplete,
  skippedToPrefix = false,
}: MasterMoodPromptPanelProps) {
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
      <div className="w-full self-stretch" style={masterDialoguePanelWrapperStyle()}>
        <DialogueBox
          lineKey={index}
          showAdvanceCue={done}
          text={currentLine}
          typewriterSpeed={resolveMasterDialogueTypewriterSpeedMs()}
          onTypewriterDone={() => setDone(true)}
          dialogueBodyRef={dialogueBodyRef}
          initialShown={skippedToPrefix ? MASTER_MOOD_PROMPT_SKIP_STOP : undefined}
        />
      </div>
    </button>
  );
}
