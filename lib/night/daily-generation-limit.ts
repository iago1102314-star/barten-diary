import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export const DAILY_GENERATION_LIMIT_MAX = 3;

export const DAILY_GENERATION_LIMIT_STORAGE_KEY =
  "barten-daily-generation-count";

export const DAILY_GENERATION_LIMIT_CODE = "daily_generation_limit";

export const DAILY_GENERATION_LIMIT_TITLE = "今日の記録はここまでです。";

export const DAILY_GENERATION_LIMIT_BODY =
  "β版では、1日に作成できる日記は3件までです。";

export const JST_TIMEZONE = "Asia/Tokyo";

type GuestDailyGenerationStorage = {
  dateKey: string;
  count: number;
};

export class DailyGenerationLimitError extends Error {
  readonly code = DAILY_GENERATION_LIMIT_CODE;

  constructor() {
    super(DAILY_GENERATION_LIMIT_TITLE);
    this.name = "DailyGenerationLimitError";
  }
}

export function isDailyGenerationLimitError(
  error: unknown,
): error is DailyGenerationLimitError {
  return (
    error instanceof DailyGenerationLimitError ||
    (error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === DAILY_GENERATION_LIMIT_CODE)
  );
}

export function isDailyGenerationLimitResponse(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const record = data as { code?: unknown; error?: unknown };
  return (
    record.code === DAILY_GENERATION_LIMIT_CODE ||
    record.error === DAILY_GENERATION_LIMIT_TITLE
  );
}

/** JST 基準の日付キー（YYYY-MM-DD） */
export function getJstDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** JST 当日 00:00:00.000 〜 23:59:59.999 を UTC ISO で返す */
export function getJstDayBoundsUtc(now = new Date()): {
  startIso: string;
  endIso: string;
} {
  const dateKey = getJstDateKey(now);
  const startIso = new Date(`${dateKey}T00:00:00+09:00`).toISOString();
  const endIso = new Date(`${dateKey}T23:59:59.999+09:00`).toISOString();
  return { startIso, endIso };
}

function readGuestDailyGenerationStorage(): GuestDailyGenerationStorage {
  const todayKey = getJstDateKey();
  if (typeof window === "undefined") {
    return { dateKey: todayKey, count: 0 };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_GENERATION_LIMIT_STORAGE_KEY);
    if (!raw) {
      return { dateKey: todayKey, count: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<GuestDailyGenerationStorage>;
    if (
      typeof parsed.dateKey !== "string" ||
      typeof parsed.count !== "number" ||
      !Number.isFinite(parsed.count)
    ) {
      return { dateKey: todayKey, count: 0 };
    }

    if (parsed.dateKey !== todayKey) {
      return { dateKey: todayKey, count: 0 };
    }

    return {
      dateKey: parsed.dateKey,
      count: Math.max(0, Math.floor(parsed.count)),
    };
  } catch {
    return { dateKey: todayKey, count: 0 };
  }
}

function writeGuestDailyGenerationStorage(
  storage: GuestDailyGenerationStorage,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DAILY_GENERATION_LIMIT_STORAGE_KEY,
      JSON.stringify(storage),
    );
  } catch {
    // private mode 等
  }
}

export function getGuestDailyGenerationCount(): number {
  return readGuestDailyGenerationStorage().count;
}

export function isGuestDailyGenerationLimitReached(): boolean {
  return getGuestDailyGenerationCount() >= DAILY_GENERATION_LIMIT_MAX;
}

export function assertGuestCanGenerateDiary(): void {
  if (isGuestDailyGenerationLimitReached()) {
    throw new DailyGenerationLimitError();
  }
}

export function incrementGuestDailyGenerationCount(): void {
  const todayKey = getJstDateKey();
  const current = readGuestDailyGenerationStorage();
  const nextCount =
    current.dateKey === todayKey ? current.count + 1 : 1;

  writeGuestDailyGenerationStorage({
    dateKey: todayKey,
    count: nextCount,
  });
}

export async function countTodaysDiariesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { startIso, endIso } = getJstDayBoundsUtc();

  const { count, error } = await supabase
    .from("diaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error) {
    console.error("Failed to count today's diaries:", error.message);
    throw error;
  }

  return count ?? 0;
}

export async function isLoggedInUserDailyGenerationLimitReached(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const count = await countTodaysDiariesForUser(supabase, userId);
  return count >= DAILY_GENERATION_LIMIT_MAX;
}

export const DAILY_GENERATION_LIMIT_AMBIENT = {
  kind: "daily_limit" as const,
  lines: [DAILY_GENERATION_LIMIT_TITLE, DAILY_GENERATION_LIMIT_BODY],
};

export type DailyGenerationGateResult =
  | { allowed: true }
  | { allowed: false; reason: "daily_limit" };

/** カウンター入店前 — ゲストは localStorage、ログインは diaries 当日件数 */
export async function checkDailyGenerationGate(): Promise<DailyGenerationGateResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isGuestDailyGenerationLimitReached()) {
      return { allowed: false, reason: "daily_limit" };
    }
    return { allowed: true };
  }

  try {
    const limitReached = await isLoggedInUserDailyGenerationLimitReached(
      supabase,
      user.id,
    );
    return limitReached
      ? { allowed: false, reason: "daily_limit" }
      : { allowed: true };
  } catch (error) {
    console.error("Failed to check daily generation gate:", error);
    return { allowed: true };
  }
}
