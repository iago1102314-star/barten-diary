import { FetchTimeoutError, fetchWithTimeout } from "@/lib/fetch-with-timeout";

const READINESS_TIMEOUT_MS = 8_000;

export type GenerationReadinessResponse =
  | { ok: true; elapsedMs: number }
  | { ok: false; error: string; elapsedMs: number };

export async function checkGenerationReadiness(): Promise<GenerationReadinessResponse> {
  const startedAt = performance.now();

  try {
    const response = await fetchWithTimeout(
      "/api/generation/readiness",
      { method: "GET" },
      READINESS_TIMEOUT_MS,
    );

    const data = (await response.json()) as { ok?: boolean; error?: string };
    const elapsedMs = Math.round(performance.now() - startedAt);

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? "日記生成の準備が整いませんでした。",
        elapsedMs,
      };
    }

    return { ok: true, elapsedMs };
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt);

    if (error instanceof FetchTimeoutError) {
      return {
        ok: false,
        error: "生成準備の確認がタイムアウトしました。",
        elapsedMs,
      };
    }

    return {
      ok: false,
      error: "生成準備の確認に失敗しました。",
      elapsedMs,
    };
  }
}
