const STORAGE_KEY = "barten-guest-diary-transfer-pending";

export function markGuestDiaryTransferPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeGuestDiaryTransferPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) !== "1") {
      return false;
    }
    window.sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
