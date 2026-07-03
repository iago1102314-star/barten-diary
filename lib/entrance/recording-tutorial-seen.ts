/**
 * 調整用 — true の間は毎回チュートリアルを表示する。
 * 本番仕様（初回のみ）に戻すときは false にする。
 */
export const RECORDING_TUTORIAL_ALWAYS_SHOW = true;

const STORAGE_KEY = "bartenderDiary.recordingTutorialSeen";

export function hasSeenRecordingTutorial(): boolean {
  if (RECORDING_TUTORIAL_ALWAYS_SHOW) return false;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function markRecordingTutorialSeen(): void {
  if (RECORDING_TUTORIAL_ALWAYS_SHOW) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "true");
}
