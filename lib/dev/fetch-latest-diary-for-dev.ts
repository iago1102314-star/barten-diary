import type { DevLatestDiarySnapshot } from "@/lib/dev/map-latest-diary-for-skip";

type LatestDiaryApiResponse =
  | { snapshot: DevLatestDiarySnapshot }
  | { error: string };

export async function fetchLatestDiaryForDev(): Promise<DevLatestDiarySnapshot | null> {
  const response = await fetch("/api/dev/latest-diary", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("DEV skip: failed to fetch latest diary", response.status);
    return null;
  }

  const payload = (await response.json()) as LatestDiaryApiResponse;
  if ("error" in payload) {
    console.error("DEV skip:", payload.error);
    return null;
  }

  return payload.snapshot;
}
