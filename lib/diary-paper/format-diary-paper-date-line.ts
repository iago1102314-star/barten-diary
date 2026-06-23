import { getTimeOfDayLabel } from "@/lib/bottle-tag/time-of-day";

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

/** 例: 2026 / 6 / 21　深夜 — 紙面ヘッダー用 */
export function formatDiaryPaperDateLine(
  createdAt: string | Date,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const timeLabel = getTimeOfDayLabel(date, timeZone);

  return `${year} / ${month} / ${day}\u00A0${timeLabel}`;
}
