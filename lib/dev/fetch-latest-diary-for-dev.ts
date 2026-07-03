import type { DevLatestDiarySnapshot } from "@/lib/dev/map-latest-diary-for-skip";

type LatestDiaryApiResponse =
  | { snapshot: DevLatestDiarySnapshot }
  | { error: string };

export type FetchLatestDiaryForDevResult =
  | { ok: true; snapshot: DevLatestDiarySnapshot }
  | { ok: false; error: string };

export async function fetchLatestDiaryForDev(): Promise<FetchLatestDiaryForDevResult> {
  try {
    const response = await fetch("/api/dev/latest-diary", {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json()) as LatestDiaryApiResponse;

    if (!response.ok) {
      const message =
        "error" in payload
          ? payload.error
          : `最新日記の取得に失敗しました（${response.status}）`;
      console.error("DEV skip:", message);
      return { ok: false, error: message };
    }

    if ("error" in payload) {
      console.error("DEV skip:", payload.error);
      return { ok: false, error: payload.error };
    }

    return { ok: true, snapshot: payload.snapshot };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "最新日記の取得に失敗しました。";
    console.error("DEV skip:", message);
    return { ok: false, error: message };
  }
}
