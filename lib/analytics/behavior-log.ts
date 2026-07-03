import { createClient } from "@/lib/supabase/client";

const SESSION_ID_KEY = "barten-behavior-session-id";
const REF_KEY = "barten-behavior-ref";
const IS_ADMIN_KEY = "barten-is-admin";
const ACCESS_LOGGED_KEY = "barten-behavior-access-logged";

export const BEHAVIOR_EVENTS = [
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

let adminUserCache: AdminUserCache | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateBehaviorSessionId(): string {
  if (!isBrowser()) return "";

  const existing = localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const next = createSessionId();
  localStorage.setItem(SESSION_ID_KEY, next);
  return next;
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

async function resolveBehaviorLogContext(): Promise<{
  ref: string | null;
  is_admin: boolean;
}> {
  const ref = getStoredBehaviorRef();
  const is_admin = await resolveIsAdmin();
  return { ref, is_admin };
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

/** ブラウザタブあたり1回 — 初回ページ表示のアクセスログ */
export async function logBehaviorAccessOnce(): Promise<void> {
  if (!isBrowser()) return;
  if (sessionStorage.getItem(ACCESS_LOGGED_KEY) === "1") return;

  const sessionId = getOrCreateBehaviorSessionId();
  if (!sessionId) return;

  const authUser = await resolveAuthUser();
  const { width, height } = readScreenSize();
  const { ref, is_admin } = await resolveBehaviorLogContext();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("access_logs").insert({
      session_id: sessionId,
      user_id: authUser?.id ?? null,
      ref,
      is_admin,
      path: window.location.pathname,
      screen_width: width,
      screen_height: height,
      user_agent: navigator.userAgent,
    });

    if (!error) {
      sessionStorage.setItem(ACCESS_LOGGED_KEY, "1");
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

  const sessionId = getOrCreateBehaviorSessionId();
  if (!sessionId) return;

  const authUser = await resolveAuthUser();
  const { ref, is_admin } = await resolveBehaviorLogContext();

  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: sessionId,
      user_id: authUser?.id ?? null,
      event_name: eventName,
      ref,
      is_admin,
      metadata: metadata ?? null,
    });
  } catch {
    // fire-and-forget
  }
}
