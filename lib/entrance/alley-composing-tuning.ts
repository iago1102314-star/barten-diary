import { AFTER_NIGHT_BACKDROP_TUNING } from "@/lib/entrance/after-night-backdrop-tuning";

/**
 * 帰り道 — 生成中 Writing...
 *
 * writingZIndex — 路地背景より上・退出暗幕より下
 * entranceCurtainZIndex — Writing より上（明転前に文字を隠す）
 * entranceCurtainFadeOutSec — 暗幕が晴れる時間（背景明転と揃える）
 */
export const ALLEY_COMPOSING_TUNING = {
  writingZIndex: 15,
  writingOpacity: 0.88,
  entranceCurtainZIndex: 22,
  entranceCurtainColor: "#000000",
  entranceCurtainFadeOutSec: AFTER_NIGHT_BACKDROP_TUNING.opacityDurationSec,
} as const;

type AwaitingAlleyComposingParams = {
  saveExpected: boolean;
  isDevSimulated: boolean;
  generationFailed: boolean;
  dailyGenerationLimitReached: boolean;
  saveStatus: string;
  generationStatus: string;
};

/** 帰り道で Writing... を出すか（saved / needsLogin 確定前） */
export function isAwaitingAlleyComposing({
  saveExpected,
  isDevSimulated,
  generationFailed,
  dailyGenerationLimitReached,
  saveStatus,
  generationStatus,
}: AwaitingAlleyComposingParams): boolean {
  if (!saveExpected || isDevSimulated || generationFailed) return false;
  if (dailyGenerationLimitReached) return false;
  if (saveStatus === "saved" || saveStatus === "failed") return false;
  if (saveStatus === "loginRequired" && generationStatus === "success") {
    return false;
  }
  return true;
}
