import {
  getLastBehaviorEvent,
  isVisitEndAlreadySent,
  markVisitEndSent,
  readCurrentVisitSnapshot,
  type BehaviorIdentity,
} from "@/lib/analytics/behavior-identity";

export type VisitEndPayload = {
  session_id: string;
  visitor_id: string;
  visit_id: string;
  user_id: string | null;
  event_name: "visit_end";
  ref: string | null;
  is_admin: boolean;
  metadata: {
    durationSec: number;
    lastEvent: string | null;
    reason?: string;
  };
};

type VisitEndTarget = {
  visitorId: string;
  visitId: string;
  visitStartedAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function computeVisitDurationSec(
  visitStartedAt: number,
  endedAt = Date.now(),
): number {
  const raw = (endedAt - visitStartedAt) / 1000;
  return Math.max(0, Math.round(raw));
}

function buildVisitEndPayload(
  target: VisitEndTarget,
  context: {
    ref: string | null;
    is_admin: boolean;
    userId: string | null;
    reason?: string;
  },
  endedAt = Date.now(),
): VisitEndPayload {
  return {
    session_id: target.visitorId,
    visitor_id: target.visitorId,
    visit_id: target.visitId,
    user_id: context.userId,
    event_name: "visit_end",
    ref: context.ref,
    is_admin: context.is_admin,
    metadata: {
      durationSec: computeVisitDurationSec(target.visitStartedAt, endedAt),
      lastEvent: getLastBehaviorEvent(),
      ...(context.reason ? { reason: context.reason } : {}),
    },
  };
}

/** pagehide / visibilitychange 向け keepalive insert */
export function insertEventLogKeepalive(row: VisitEndPayload): void {
  if (!isBrowser()) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  void fetch(`${url}/rest/v1/event_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    keepalive: true,
  }).catch(() => {
    // fire-and-forget
  });
}

export async function sendVisitEndForTarget(
  target: VisitEndTarget,
  context: {
    ref: string | null;
    is_admin: boolean;
    userId: string | null;
    reason?: string;
    preferKeepalive?: boolean;
  },
): Promise<boolean> {
  if (!isBrowser()) return false;
  if (isVisitEndAlreadySent(target.visitId)) return false;

  markVisitEndSent(target.visitId);
  const payload = buildVisitEndPayload(target, context);

  if (context.preferKeepalive) {
    insertEventLogKeepalive(payload);
    return true;
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.from("event_logs").insert(payload);
    return !error;
  } catch {
    insertEventLogKeepalive(payload);
    return true;
  }
}

export async function sendVisitEnd(options?: {
  reason?: string;
  preferKeepalive?: boolean;
  resolveContext: () => Promise<{
    ref: string | null;
    is_admin: boolean;
    userId: string | null;
  }>;
}): Promise<boolean> {
  const snapshot = readCurrentVisitSnapshot();
  if (!snapshot) return false;

  const context = await options?.resolveContext();
  if (!context) return false;

  return sendVisitEndForTarget(snapshot, {
    ...context,
    reason: options?.reason,
    preferKeepalive: options?.preferKeepalive,
  });
}

export async function finalizePreviousVisitIfNeeded(
  identity: BehaviorIdentity,
  resolveContext: () => Promise<{
    ref: string | null;
    is_admin: boolean;
    userId: string | null;
  }>,
): Promise<void> {
  if (!identity.previousVisit) return;

  const context = await resolveContext();
  await sendVisitEndForTarget(identity.previousVisit, {
    ...context,
    reason: "inactivity_timeout",
  });
}

type LifecycleOptions = {
  resolveContext: () => Promise<{
    ref: string | null;
    is_admin: boolean;
    userId: string | null;
  }>;
};

/** 離脱検知リスナーを登録。cleanup 関数を返す */
export function setupVisitLifecycle(options: LifecycleOptions): () => void {
  if (!isBrowser()) return () => {};

  let pageHideSent = false;

  const emitVisitEnd = (reason: string) => {
    if (pageHideSent) return;
    pageHideSent = true;
    void sendVisitEnd({
      reason,
      preferKeepalive: true,
      resolveContext: options.resolveContext,
    });
  };

  const onPageHide = () => {
    emitVisitEnd("pagehide");
  };

  // visibilitychange(hidden) はモバイルの一時バックグラウンドでも発火するため
  // visit 終了には使わない。実離脱は pagehide に任せる。
  window.addEventListener("pagehide", onPageHide);

  return () => {
    window.removeEventListener("pagehide", onPageHide);
  };
}
