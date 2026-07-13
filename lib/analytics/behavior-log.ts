import {
  bindVisitRefForNewVisit,
  captureBehaviorAdminRefFromUrl,
  getBoundVisitRef,
  getLegacyBehaviorRefForAdminCheck,
  getStoredAcquisitionRef,
  maybeRecordAcquisitionRef,
  readUrlRef,
} from "@/lib/analytics/behavior-ref";
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

type BehaviorLogContext = {
  ref: string | null;
  acquisition_ref: string | null;
  is_admin: boolean;
  userId: string | null;
};

let adminUserCache: AdminUserCache | null = null;
let visitBootstrapPromise: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCurrentNavigationSearch(): string {
  if (!isBrowser()) return "";
  return window.location.search;
}

/** @deprecated URL ref は captureBehaviorAdminRefFromUrl + resolveBehaviorLogContext を使用 */
export function captureBehaviorRefFromUrl(search?: string): void {
  captureBehaviorAdminRefFromUrl(search);
}

/** @deprecated 今回 visit ref は getBoundVisitRef / resolveBehaviorLogContext を使用 */
export function resolveBehaviorRef(search?: string): string | null {
  const urlRef = readUrlRef(search);
  if (urlRef) return urlRef;
  return getBoundVisitRef();
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

export function clearBehaviorAdminCache(): void {
  adminUserCache = null;
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

  if (getLegacyBehaviorRefForAdminCheck() === "admin") {
    return true;
  }

  const authUser = await resolveAuthUser();
  if (!authUser) {
    return false;
  }

  return resolveRegisteredAdminUser(authUser);
}

async function initializeNewVisitAttribution(
  search: string,
): Promise<void> {
  bindVisitRefForNewVisit(search);
  const isAdmin = await resolveIsAdmin();
  maybeRecordAcquisitionRef(readUrlRef(search), isAdmin);
}

export async function resolveBehaviorLogContext(
  search?: string,
): Promise<BehaviorLogContext> {
  const navigationSearch = search ?? readCurrentNavigationSearch();
  captureBehaviorAdminRefFromUrl(navigationSearch);

  const is_admin = await resolveIsAdmin();
  const authUser = await resolveAuthUser();

  return {
    ref: getBoundVisitRef(),
    acquisition_ref: getStoredAcquisitionRef(),
    is_admin,
    userId: authUser?.id ?? null,
  };
}

function toBehaviorLogIds(identity: BehaviorIdentity): BehaviorLogIds {
  return {
    visitorId: identity.visitorId,
    visitId: identity.visitId,
    sessionId: identity.visitorId,
  };
}

async function ensureVisitReady(
  navigationSearch?: string,
): Promise<{
  identity: BehaviorIdentity;
  ids: BehaviorLogIds;
}> {
  const search = navigationSearch ?? readCurrentNavigationSearch();
  const identity = resolveBehaviorIdentity(Date.now(), search);
  if (!identity.visitorId || !identity.visitId) {
    return { identity, ids: toBehaviorLogIds(identity) };
  }

  if (identity.previousVisit) {
    const context = await resolveBehaviorLogContext(search);
    await sendVisitEndForTarget(identity.previousVisit, {
      ref: context.ref,
      acquisition_ref: context.acquisition_ref,
      is_admin: context.is_admin,
      userId: context.userId,
      reason: identity.previousVisit.endReason,
    });
  }

  if (identity.isNewVisit) {
    await initializeNewVisitAttribution(search);
    await logVisitStartForIdentity(identity, search);
  }

  touchBehaviorActivity();
  return { identity, ids: toBehaviorLogIds(identity) };
}

async function logVisitStartForIdentity(
  identity: BehaviorIdentity,
  search: string,
): Promise<void> {
  if (!identity.visitorId || !identity.visitId) return;

  const context = await resolveBehaviorLogContext(search);
  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: identity.visitorId,
      visitor_id: identity.visitorId,
      visit_id: identity.visitId,
      user_id: context.userId,
      event_name: "visit_start",
      ref: context.ref,
      acquisition_ref: context.acquisition_ref,
      is_admin: context.is_admin,
      metadata: null,
    });
    setLastBehaviorEvent("visit_start");
  } catch {
    // fire-and-forget
  }
}

/** アプリ起動時に visit を初期化（visit_start / 旧 visit の visit_end） */
export async function bootstrapBehaviorVisit(
  navigationSearch?: string,
): Promise<void> {
  if (visitBootstrapPromise) {
    await visitBootstrapPromise;
    return;
  }

  const search = navigationSearch ?? readCurrentNavigationSearch();

  visitBootstrapPromise = (async () => {
    const identity = resolveBehaviorIdentity(Date.now(), search);
    if (!identity.visitorId || !identity.visitId) return;

    await finalizePreviousVisitIfNeeded(identity, () =>
      resolveBehaviorLogContext(search),
    );

    if (identity.isNewVisit) {
      await initializeNewVisitAttribution(search);
      await logVisitStartForIdentity(identity, search);
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
  captureBehaviorAdminRefFromUrl(search);

  const { ids } = await ensureVisitReady(search);
  if (!ids.visitorId || !ids.visitId) return;

  const pageLoadMarker = getPageLoadMarker();
  if (isAccessLoggedForPageLoad(ids.visitId, pageLoadMarker, search)) {
    return;
  }

  const { ref, acquisition_ref, is_admin, userId } =
    await resolveBehaviorLogContext(search);
  const { width, height } = readScreenSize();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("access_logs").insert({
      session_id: ids.sessionId,
      visitor_id: ids.visitorId,
      visit_id: ids.visitId,
      user_id: userId,
      ref,
      acquisition_ref,
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

  const search = readCurrentNavigationSearch();
  const { ids } = await ensureVisitReady(search);
  if (!ids.visitorId || !ids.visitId) return;

  const { ref, acquisition_ref, is_admin, userId } =
    await resolveBehaviorLogContext(search);

  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: ids.sessionId,
      visitor_id: ids.visitorId,
      visit_id: ids.visitId,
      user_id: userId,
      event_name: eventName,
      ref,
      acquisition_ref,
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
