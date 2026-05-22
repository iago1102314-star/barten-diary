import { getTimeOfDayLabel } from "@/lib/bottle-tag/time-of-day";

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

/**
 * 「5月18日 深夜 / Old Fashioned」形式の Bottle Tag を生成
 */
export function buildBottleTag(
  at: Date,
  drinkName: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    month: "numeric",
    day: "numeric",
  }).formatToParts(at);

  const month = parts.find((p) => p.type === "month")?.value ?? "1";
  const day = parts.find((p) => p.type === "day")?.value ?? "1";
  const timeLabel = getTimeOfDayLabel(at, timeZone);

  return `${month}月${day}日 ${timeLabel} / ${drinkName}`;
}
