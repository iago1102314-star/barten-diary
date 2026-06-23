import { getTimeOfDayLabel } from "@/lib/bottle-tag/time-of-day";

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

/** 一覧サムネ用 — 例: 6 / 21　深夜（年なし） */
export function formatDiaryShelfDateLine(
  createdAt: string | Date,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const timeLabel = getTimeOfDayLabel(date, timeZone);

  return `${month} / ${day}\u3000${timeLabel}`;
}
