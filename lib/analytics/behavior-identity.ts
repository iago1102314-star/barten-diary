import { shouldRotateVisitForRefChange } from "@/lib/analytics/behavior-ref";

/** visitor_id / visit_id の生成・解決（localStorage + sessionStorage） */

const LEGACY_SESSION_ID_KEY = "barten-behavior-session-id";
const VISITOR_ID_KEY = "barten-behavior-visitor-id";
const VISIT_ID_KEY = "barten-behavior-visit-id";
const VISIT_STARTED_AT_KEY = "barten-behavior-visit-started-at";
const LAST_ACTIVITY_AT_KEY = "barten-behavior-last-activity-at";
const LAST_EVENT_KEY = "barten-behavior-last-event";
const VISIT_END_SENT_KEY = "barten-behavior-visit-end-sent";
const ACCESS_LOGGED_PREFIX = "barten-behavior-access-logged:";

/** 30分無操作で新 visit（GA 標準セッションと同程度） */
export const VISIT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export type BehaviorIdentity = {
  visitorId: string;
  visitId: string;
  visitStartedAt: number;
  isNewVisit: boolean;
  /** timeout / ref 変更で旧 visit を終了する必要がある */
  previousVisit?: {
    visitorId: string;
    visitId: string;
    visitStartedAt: number;
    endReason: "inactivity_timeout" | "ref_change";
  };
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLastActivityAt(): number | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(LAST_ACTIVITY_AT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeLastActivityAt(timestamp: number): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(timestamp));
}

/** 同一ブラウザ・端末の匿名 ID。既存 localStorage session_id を引き継ぐ */
export function getOrCreateVisitorId(): string {
  if (!isBrowser()) return "";

  const existingVisitor = localStorage.getItem(VISITOR_ID_KEY);
  if (existingVisitor) return existingVisitor;

  const legacySession = localStorage.getItem(LEGACY_SESSION_ID_KEY);
  if (legacySession) {
    localStorage.setItem(VISITOR_ID_KEY, legacySession);
    return legacySession;
  }

  const next = createId();
  localStorage.setItem(VISITOR_ID_KEY, next);
  localStorage.setItem(LEGACY_SESSION_ID_KEY, next);
  return next;
}

/** @deprecated visitor_id のエイリアス（既存呼び出し互換） */
export function getOrCreateBehaviorSessionId(): string {
  return getOrCreateVisitorId();
}

export function getLastBehaviorEvent(): string | null {
  if (!isBrowser()) return null;
  return sessionStorage.getItem(LAST_EVENT_KEY);
}

export function setLastBehaviorEvent(eventName: string): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(LAST_EVENT_KEY, eventName);
}

/** 同一ドキュメントロード内で不変（リロードで変わる） */
export function getPageLoadMarker(): string {
  if (!isBrowser()) return "";
  return String(performance.timeOrigin);
}

function accessLoggedStorageKey(
  visitId: string,
  pageLoadMarker: string,
  navigationSearch: string,
): string {
  return `${ACCESS_LOGGED_PREFIX}${visitId}:${pageLoadMarker}:${navigationSearch}`;
}

export function isAccessLoggedForPageLoad(
  visitId: string,
  pageLoadMarker: string,
  navigationSearch: string,
): boolean {
  if (!isBrowser()) return false;
  return (
    sessionStorage.getItem(
      accessLoggedStorageKey(visitId, pageLoadMarker, navigationSearch),
    ) === "1"
  );
}

export function markAccessLoggedForPageLoad(
  visitId: string,
  pageLoadMarker: string,
  navigationSearch: string,
): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(
    accessLoggedStorageKey(visitId, pageLoadMarker, navigationSearch),
    "1",
  );
}

export function isVisitEndAlreadySent(visitId: string): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(VISIT_END_SENT_KEY) === visitId;
}

export function markVisitEndSent(visitId: string): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(VISIT_END_SENT_KEY, visitId);
}

export function touchBehaviorActivity(at = Date.now()): void {
  writeLastActivityAt(at);
}

/**
 * 現在の visit を解決する。
 * - visit_id は sessionStorage（タブ単位）
 * - 30分超の無操作、初回タブ表示、または URL ref 変更で新 visit
 * - SPA 内の画面遷移では visit_id を再発行しない
 */
export function resolveBehaviorIdentity(
  now = Date.now(),
  navigationSearch?: string,
): BehaviorIdentity {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) {
    return {
      visitorId: "",
      visitId: "",
      visitStartedAt: now,
      isNewVisit: false,
    };
  }

  if (!isBrowser()) {
    return {
      visitorId,
      visitId: "",
      visitStartedAt: now,
      isNewVisit: false,
    };
  }

  const existingVisitId = sessionStorage.getItem(VISIT_ID_KEY);
  const existingStartedRaw = sessionStorage.getItem(VISIT_STARTED_AT_KEY);
  const existingStartedAt = existingStartedRaw
    ? Number(existingStartedRaw)
    : null;
  const lastActivityAt = readLastActivityAt();
  const refChangeRequiresNewVisit =
    shouldRotateVisitForRefChange(navigationSearch);

  const hasActiveVisit =
    existingVisitId !== null
    && existingStartedAt !== null
    && Number.isFinite(existingStartedAt)
    && lastActivityAt !== null
    && now - lastActivityAt < VISIT_INACTIVITY_TIMEOUT_MS
    && !refChangeRequiresNewVisit;

  if (hasActiveVisit && existingVisitId && existingStartedAt !== null) {
    writeLastActivityAt(now);
    return {
      visitorId,
      visitId: existingVisitId,
      visitStartedAt: existingStartedAt,
      isNewVisit: false,
    };
  }

  const previousVisit =
    existingVisitId && existingStartedAt !== null && Number.isFinite(existingStartedAt)
      ? {
          visitorId,
          visitId: existingVisitId,
          visitStartedAt: existingStartedAt,
          endReason: refChangeRequiresNewVisit
            ? ("ref_change" as const)
            : ("inactivity_timeout" as const),
        }
      : undefined;

  const visitId = createId();
  sessionStorage.setItem(VISIT_ID_KEY, visitId);
  sessionStorage.setItem(VISIT_STARTED_AT_KEY, String(now));
  sessionStorage.removeItem(VISIT_END_SENT_KEY);
  writeLastActivityAt(now);

  return {
    visitorId,
    visitId,
    visitStartedAt: now,
    isNewVisit: true,
    previousVisit,
  };
}

export function readCurrentVisitSnapshot(): {
  visitorId: string;
  visitId: string;
  visitStartedAt: number;
} | null {
  if (!isBrowser()) return null;

  const visitorId = getOrCreateVisitorId();
  const visitId = sessionStorage.getItem(VISIT_ID_KEY);
  const visitStartedRaw = sessionStorage.getItem(VISIT_STARTED_AT_KEY);
  if (!visitorId || !visitId || !visitStartedRaw) return null;

  const visitStartedAt = Number(visitStartedRaw);
  if (!Number.isFinite(visitStartedAt)) return null;

  return { visitorId, visitId, visitStartedAt };
}
