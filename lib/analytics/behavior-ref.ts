/** visit ref / acquisition_ref の解決（localStorage / sessionStorage） */

const LEGACY_BEHAVIOR_REF_KEY = "barten-behavior-ref";
const ACQUISITION_REF_KEY = "barten-acquisition-ref";
const VISIT_REF_KEY = "barten-behavior-visit-ref";

const ADMIN_REF = "admin";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readUrlRef(search?: string): string | null {
  if (!isBrowser()) return null;

  const ref = new URLSearchParams(search ?? window.location.search)
    .get("ref")
    ?.trim();
  return ref || null;
}

export function isTrackableAcquisitionRef(ref: string | null): boolean {
  return ref !== null && ref !== ADMIN_REF;
}

export function getStoredAcquisitionRef(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACQUISITION_REF_KEY);
}

/** 初回のみ記録。admin ref と既存値は上書きしない */
export function maybeRecordAcquisitionRef(
  urlRef: string | null,
  isAdmin: boolean,
): string | null {
  if (!isBrowser()) return null;

  const existing = getStoredAcquisitionRef();
  if (existing) return existing;
  if (isAdmin) return null;
  if (!isTrackableAcquisitionRef(urlRef)) return null;

  localStorage.setItem(ACQUISITION_REF_KEY, urlRef!);
  return urlRef;
}

/** 新 visit 開始時に URL から visit ref を固定（sessionStorage） */
export function bindVisitRefForNewVisit(search: string): string | null {
  if (!isBrowser()) return null;

  const visitRef = readUrlRef(search);
  sessionStorage.setItem(VISIT_REF_KEY, visitRef ?? "");
  return visitRef;
}

/**
 * 明示的な URL ref が現在 visit ref と異なる場合は新 visit を開始する。
 * 現在 visit が direct（null）でも URL ref があれば切り替える。
 * URL ref なし / 同一 ref は現 visit を維持。
 */
export function shouldRotateVisitForRefChange(search?: string): boolean {
  const urlRef = readUrlRef(search);
  if (!urlRef) return false;
  return urlRef !== getBoundVisitRef();
}

/** 今回 visit の流入元。SPA 内で URL から ref が消えても維持 */
export function getBoundVisitRef(): string | null {
  if (!isBrowser()) return null;

  const raw = sessionStorage.getItem(VISIT_REF_KEY);
  if (raw === null) return null;
  if (raw === "") return null;
  return raw;
}

export function clearBoundVisitRef(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(VISIT_REF_KEY);
}

/** 旧仕様互換: admin 判定用のみ（非 admin ref は保存しない） */
export function captureBehaviorAdminRefFromUrl(search?: string): void {
  if (!isBrowser()) return;

  const params = new URLSearchParams(search ?? window.location.search);
  const adminParam = params.get("admin")?.trim().toLowerCase();
  const ref = params.get("ref")?.trim();

  if (adminParam === "off" || ref === "clear-admin") {
    localStorage.removeItem("barten-is-admin");
    if (ref === "clear-admin") return;
  }

  if (ref === ADMIN_REF) {
    localStorage.setItem("barten-is-admin", "true");
    localStorage.setItem(LEGACY_BEHAVIOR_REF_KEY, ADMIN_REF);
  }
}

export function getLegacyBehaviorRefForAdminCheck(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LEGACY_BEHAVIOR_REF_KEY);
}
