import { createClient } from "@/lib/supabase/client";

const SESSION_ID_KEY = "barten-behavior-session-id";
const REF_KEY = "barten-behavior-ref";
const ACCESS_LOGGED_KEY = "barten-behavior-access-logged";

export const BEHAVIOR_EVENTS = [
  "home_open",
  "counter_enter",
  "drink_selected",
  "record_start",
  "record_finish",
  "generate_success",
  "login_success",
  "save_diary",
  "feedback_submit",
] as const;

export type BehaviorEventName = (typeof BEHAVIOR_EVENTS)[number];

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

export function captureBehaviorRefFromUrl(search?: string): void {
  if (!isBrowser()) return;

  const params = new URLSearchParams(
    search ?? window.location.search,
  );
  const ref = params.get("ref")?.trim();
  if (ref) {
    localStorage.setItem(REF_KEY, ref);
  }
}

function getStoredBehaviorRef(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REF_KEY);
}

function isAdminBehaviorRef(ref: string | null): boolean {
  return ref === "admin";
}

function readBehaviorLogContext(): { ref: string | null; is_admin: boolean } {
  const ref = getStoredBehaviorRef();
  return { ref, is_admin: isAdminBehaviorRef(ref) };
}

async function resolveUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
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

/** ブラウザタブあたり1回 — 初回ページ表示のアクセスログ */
export async function logBehaviorAccessOnce(): Promise<void> {
  if (!isBrowser()) return;
  if (sessionStorage.getItem(ACCESS_LOGGED_KEY) === "1") return;

  const sessionId = getOrCreateBehaviorSessionId();
  if (!sessionId) return;

  const userId = await resolveUserId();
  const { width, height } = readScreenSize();
  const { ref, is_admin } = readBehaviorLogContext();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("access_logs").insert({
      session_id: sessionId,
      user_id: userId,
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

  const userId = await resolveUserId();
  const { ref, is_admin } = readBehaviorLogContext();

  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      session_id: sessionId,
      user_id: userId,
      event_name: eventName,
      ref,
      is_admin,
      metadata: metadata ?? null,
    });
  } catch {
    // fire-and-forget
  }
}
