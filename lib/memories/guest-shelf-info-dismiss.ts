const STORAGE_KEY = "barten-guest-shelf-info-dismissed";

export function isGuestShelfInfoDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissGuestShelfInfo(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}
