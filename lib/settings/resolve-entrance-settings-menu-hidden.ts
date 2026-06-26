/** entrance-flow 上の EntranceState — 循環 import を避けるためミラー */
export type EntranceMenuState =
  | "entry"
  | "memories"
  | "masterOnBlack"
  | "counterReveal"
  | "moodPrompt"
  | "moodSelect"
  | "pastBottleSelect"
  | "decliningNight"
  | "declineFarewellOnBlack"
  | "unheldNight"
  | "drinkServed"
  | "recording"
  | "postRecordBlackout"
  | "postRecordThanks"
  | "postRecordExitBlack"
  | "leaving"
  | "alley";

export type EntryHomeMenuPhase = "bokeh" | "revealing" | "normal";

export type EntryHomeMenuTransition =
  | "idle"
  | "doorExit"
  | "toMemories"
  | "steadyFadeIn";

export type NightAlleyMenuOutcomeKind =
  | "composing"
  | "saved"
  | "devSaved"
  | "needsLogin"
  | "saveFailed"
  | "unsaved";

/** 酒紹介〜保存完了前まで FAB 非表示 */
const NIGHT_PIPELINE_STATES = new Set<EntranceMenuState>([
  "drinkServed",
  "recording",
  "postRecordBlackout",
  "postRecordThanks",
  "postRecordExitBlack",
  "leaving",
  "alley",
]);

export type ResolveEntranceSettingsMenuHiddenOptions = {
  /** entry 時 — 「カウンターへ」と同じく normal で表示 */
  entryPhase?: EntryHomeMenuPhase;
  entryTransition?: EntryHomeMenuTransition;
  /** 録音〜生成・保存パイプライン */
  nightPipeline?: {
    generationComplete: boolean;
    saveInProgress: boolean;
    alleyOutcomeKind?: NightAlleyMenuOutcomeKind | null;
  };
};

/**
 * メニュー FAB を隠すか（entrance-flow）
 *
 * 表示: ホーム（UI出現後）・日記一覧・カウンター以降（録音前）・生成完了後（保存中を除く）
 * 非表示: ホーム導入中・感情ラベル退場〜酒紹介・録音〜生成中・保存中・路地で待機中
 */
export function resolveEntranceSettingsMenuHidden(
  entranceState: EntranceMenuState,
  moodSelectExitActive: boolean,
  options: ResolveEntranceSettingsMenuHiddenOptions = {},
): boolean {
  if (entranceState === "entry") {
    const { entryPhase = "normal", entryTransition = "idle" } = options;
    if (entryPhase !== "normal") return true;
    if (entryTransition === "doorExit" || entryTransition === "toMemories") {
      return true;
    }
    return false;
  }

  if (moodSelectExitActive) return true;

  if (!NIGHT_PIPELINE_STATES.has(entranceState)) {
    return false;
  }

  const pipeline = options.nightPipeline;
  if (!pipeline) {
    return true;
  }

  if (entranceState === "alley") {
    return pipeline.alleyOutcomeKind === "composing";
  }

  if (!pipeline.generationComplete) return true;
  if (pipeline.saveInProgress) return true;
  return false;
}
