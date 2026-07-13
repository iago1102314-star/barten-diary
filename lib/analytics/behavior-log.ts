import {
  finalizePreviousVisitIfNeeded,
  sendVisitEndForTarget,
} from "@/lib/analytics/visit-lifecycle";
import {
  getOrCreateBehaviorSessionId,
  getOrCreateVisitorId,
  getPageLoadMarker,
  isAccessLoggedForPageLoad,
  markAccessLoggedForPageLoad,
  resolveBehaviorIdentity,
  setLastBehaviorEvent,
  touchBehaviorActivity,
  type BehaviorIdentity,
} from "@/lib/analytics/behavior-identity";
import { createClient } from "@/lib/supabase/client";

const REF_KEY = "barten-behavior-ref";
const IS_ADMIN_KEY = "barten-is-admin";

export const BEHAVIOR_EVENTS = [
  "visit_start",
  "visit_end",
  "home_open",
  "counter_enter",
  "drink_selected",
  "record_start",
  "record_finish",
  "generate_success",
  "generate_failed",
  "login_success",
  "save_diary",
  "feedback_submit",
] as const;

export type BehaviorEventName = (typeof BEHAVIOR_EVENTS)[number];

type AuthUserSnapshot = {
  id: string;
  email: string | null;
};

type AdminUserCache = {
  userKey: string;
  isAdmin: boolean;
};

type BehaviorLogIds = {
  visitorId: string;
  visitId: string;
  sessionId: string;
};

let adminUserCache: AdminUserCache | null = null;
let visitBootstrapPromise: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function setStoredBehaviorAdminFlag(): void {
  if (!isBrowser()) return;
  localStorage.setItem(IS_ADMIN_KEY, "true");
}

function clearStoredBehaviorAdminFlag(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(IS_ADMIN_KEY);
}

function isStoredBehaviorAdminFlag(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(IS_ADMIN_KEY) === "true";
}

function readUrlBehaviorRef(search?: string): string | null {
  if (!isBrowser()) return null;

  const ref = new URLSearchParams(search ?? window.location.search)
    .get("ref")
    ?.trim();
  return ref || null;
}

function readCurrentNavigationSearch(): string {
  if (!isBrowser()) return "";
  return window.location.search;
}

/** URL の ?ref= を localStorage に同期（admin フラグ処理込み） */
export function captureBehaviorRefFromUrl(search?: string): void {
  if (!isBrowser()) return;

  const params = new URLSearchParams(
    search ?? window.location.search,
  );
  const adminParam = params.get("admin")?.trim().toLowerCase();
  const ref = params.get("ref")?.trim();

  if (adminParam === "off" || ref === "clear-admin") {
    clearStoredBehaviorAdminFlag();
    if (ref === "clear-admin") {
      return;
    }
  }

  if (ref === "admin") {
    setStoredBehaviorAdminFlag();
    localStorage.setItem(REF_KEY, ref);
    return;
  }

  if (ref) {
    localStorage.setItem(REF_KEY, ref);
  }
}

/**
 * ログ記録用 ref — URL に ?ref= があれば常にそれを優先。
 * なければ localStorage の保存済み ref。
 */
export function resolveBehaviorRef(search?: string): string | null {
  const urlRef = readUrlBehaviorRef(search);
  if (urlRef) return urlRef;
  return getStoredBehaviorRef();
}

export function clearBehaviorAdminCache(): void {
  adminUserCache = null;
}

function getStoredBehaviorRef(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REF_KEY);
}

function isAdminBehaviorRef(ref: string | null): boolean {
  return ref === "admin";
}

async function resolveAuthUser(): Promise<AuthUserSnapshot | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

async function resolveRegisteredAdminUser(
  authUser: AuthUserSnapshot,
): Promise<boolean> {
  if (adminUserCache?.userKey === authUser.id) {
    return adminUserCache.isAdmin;
  }

  try {
    const supabase = createClient();
    const filters = [`user_id.eq.${authUser.id}`];
    if (authUser.email) {
      filters.push(`email.eq.${authUser.email}`);
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .or(filters.join(","))
      .maybeSingle();

    const isAdmin = !error && data !== null;
    adminUserCache = { userKey: authUser.id, isAdmin };
    return isAdmin;
  } catch {
    return false;
  }
}

export async function resolveIsAdmin(): Promise<boolean> {
  if (isStoredBehaviorAdminFlag()) {
    return true;
  }

  if (isAdminBehaviorRef(getStoredBehaviorRef())) {
    return true;
  }

  const authUser = await resolveAuthUser();
  if (!authUser) {
    return false;
  }

  return resolveRegisteredAdminUser(authUser);
}

export async function resolveBehaviorLogContext(
  search?: string,
): Promise<{
  ref: string | null;
  is_admin: boolean;
  userId: string | null;
}> {
  const navigationSearch = search ?? readCurrentNavigationSearch();
  captureBehaviorRefFromUrl(navigationSearch);
  const ref = resolveBehaviorRef(navigationSearch);
  const is_admin = await resolveIsAdmin();
  const authUser = await resolveAuthUser();
  return { ref, is_admin, userId: authUser?.id ?? null };
}

function toBehaviorLogIds(identity: BehaviorIdentity): BehaviorLogIds {
  return {
    visitorId: identity.visitorId,
    visitId: identity.visitId,
    sessionId: identity.visitorId,
  };
}

async function ensureVisitReady(): Promise<{
  identity: BehaviorIdentity;
  ids: BehaviorLogIds;
}> {
  const identity = resolveBehaviorIdentity();
  if (!identity.visitorId || !identity.visitId) {
    return { identity, ids: toBehaviorLogIds(identity) };
  }

  if (identity.previousVisit) {
    const context = await resolveBehaviorLogContext(readCurrentNavigationSearch());
    await sendVisitEndForTarget(identity.previousVisit, {
      ref: context.ref,
      is_admin: context.is_admin,
      userId: context.userId,
      reason: "inactivity_timeout",
    });
  }

  if (identity.isNewVisit) {
    await logVisitStartForIdentity(identity);
  }

  touchBehaviorActivity();
  return { identity, ids: toBehaviorLogIds(identity) };
}

async function logVisitStartForIdentity(
  identity: BehaviorIdentity,
): Promise<void> {
  if (!identity.visitorId || !identity.visitId) return;

  const context = await resolveBehaviorLogContext(readCurrentNavigationSearch());
  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: identity.visitorId,
      visitor_id: identity.visitorId,
      visit_id: identity.visitId,
      user_id: context.userId,
      event_name: "visit_start",
      ref: context.ref,
      is_admin: context.is_admin,
      metadata: null,
    });
    setLastBehaviorEvent("visit_start");
  } catch {
    // fire-and-forget
  }
}

/** アプリ起動時に visit を初期化（visit_start / 旧 visit の visit_end） */
export async function bootstrapBehaviorVisit(): Promise<void> {
  if (visitBootstrapPromise) {
    await visitBootstrapPromise;
    return;
  }

  visitBootstrapPromise = (async () => {
    const identity = resolveBehaviorIdentity();
    if (!identity.visitorId || !identity.visitId) return;

    await finalizePreviousVisitIfNeeded(identity, resolveBehaviorLogContext);

    if (identity.isNewVisit) {
      await logVisitStartForIdentity(identity);
    }

    touchBehaviorActivity();
  })();

  try {
    await visitBootstrapPromise;
  } finally {
    visitBootstrapPromise = null;
  }
}

function readScreenSize(): { width: number | null; height: number | null } {
  if (!isBrowser()) {
    return { width: null, height: null };
  }
  return {
    width: window.screen?.width ?? null,
    height: window.screen?.height ?? null,
  };
}

/** ページロード / URL 遷移あたり1回 — アクセスログ */
export async function logBehaviorAccessOnce(
  navigationSearch?: string,
): Promise<void> {
  if (!isBrowser()) return;

  const search = navigationSearch ?? readCurrentNavigationSearch();
  captureBehaviorRefFromUrl(search);

  const { ids } = await ensureVisitReady();
  if (!ids.visitorId || !ids.visitId) return;

  const pageLoadMarker = getPageLoadMarker();
  if (isAccessLoggedForPageLoad(ids.visitId, pageLoadMarker, search)) {
    return;
  }

  const { ref, is_admin, userId } = await resolveBehaviorLogContext(search);
  const { width, height } = readScreenSize();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("access_logs").insert({
      session_id: ids.sessionId,
      visitor_id: ids.visitorId,
      visit_id: ids.visitId,
      user_id: userId,
      ref,
      is_admin,
      path: window.location.pathname,
      screen_width: width,
      screen_height: height,
      user_agent: navigator.userAgent,
    });

    if (!error) {
      markAccessLoggedForPageLoad(ids.visitId, pageLoadMarker, search);
    }
  } catch {
    // fire-and-forget
  }
}

export async function logBehaviorEvent(
  eventName: BehaviorEventName,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!isBrowser()) return;
  if (eventName === "visit_start" || eventName === "visit_end") return;

  const { ids } = await ensureVisitReady();
  if (!ids.visitorId || !ids.visitId) return;

  const { ref, is_admin, userId } = await resolveBehaviorLogContext(
    readCurrentNavigationSearch(),
  );

  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: ids.sessionId,
      visitor_id: ids.visitorId,
      visit_id: ids.visitId,
      user_id: userId,
      event_name: eventName,
      ref,
      is_admin,
      metadata: metadata ?? null,
    });
    setLastBehaviorEvent(eventName);
    touchBehaviorActivity();
  } catch {
    // fire-and-forget
  }
}

export { getOrCreateBehaviorSessionId, getOrCreateVisitorId };
