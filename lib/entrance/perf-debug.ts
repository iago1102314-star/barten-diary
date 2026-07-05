"use client";

/**
 * console / Performance API 計測の ON/OFF。
 * - `NEXT_PUBLIC_PERF_DEBUG=true` で明示 ON
 * - `NEXT_PUBLIC_PERF_DEBUG=false` で明示 OFF
 * - 未設定時は Vercel Dev（`NEXT_PUBLIC_APP_ENV=dev`）のみ ON
 */
export function isPerfDebugEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_PERF_DEBUG === "true") return true;
  if (process.env.NEXT_PUBLIC_PERF_DEBUG === "false") return false;
  return process.env.NEXT_PUBLIC_APP_ENV === "dev";
}

export function perfRenderCount(componentName: string): void {
  if (!isPerfDebugEnabled()) return;
  console.count(`[perf:render] ${componentName}`);
}

export function perfLog(label: string, detail?: unknown): void {
  if (!isPerfDebugEnabled()) return;
  if (detail === undefined) {
    console.log(`[perf] ${label}`);
    return;
  }
  console.log(`[perf] ${label}`, detail);
}

export function perfMark(name: string): void {
  if (!isPerfDebugEnabled() || typeof performance === "undefined") return;
  try {
    performance.mark(name);
  } catch {
    // duplicate mark 等は無視
  }
}

export function perfMeasure(name: string, startMark: string, endMark: string): void {
  if (!isPerfDebugEnabled() || typeof performance === "undefined") return;
  try {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, "measure");
    const last = entries.at(-1);
    if (last) {
      perfLog(`${name}: ${last.duration.toFixed(1)}ms`);
    }
  } catch (error) {
    console.warn(`[perf] measure failed: ${name}`, error);
  }
}

/** 遷移計測 — endMark 直後に呼ぶ */
export function perfMeasurePair(
  measureName: string,
  startMark: string,
  endMark: string,
): void {
  perfMark(endMark);
  perfMeasure(measureName, startMark, endMark);
}
