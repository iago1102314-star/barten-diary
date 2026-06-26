const STORAGE_KEY = "barten-counter-launch-from-shelf";

/** 記録棚の空状態からカウンター入店へ — 暗転後に /diaries で消費 */
export function markCounterLaunchFromShelf(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "1");
}

export function takeCounterLaunchFromShelf(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  if (sessionStorage.getItem(STORAGE_KEY) !== "1") return false;
  sessionStorage.removeItem(STORAGE_KEY);
  return true;
}
