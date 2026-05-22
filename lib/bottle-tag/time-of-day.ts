const DEFAULT_TIME_ZONE = "Asia/Tokyo";

export type TimeOfDayLabel =
  | "夜明け前"
  | "朝"
  | "昼下がり"
  | "夕暮れ"
  | "宵"
  | "深夜"
  | "静夜";

function getHourInTimeZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(date);

  return Number(hour);
}

/**
 * 録音終了時刻から時間帯ラベルを決定
 *
 * 4:00–6:59 夜明け前 / 7:00–10:59 朝 / 11:00–14:59 昼下がり
 * 15:00–17:59 夕暮れ / 18:00–21:59 宵 / 22:00–1:59 深夜 / 2:00–3:59 静夜
 */
export function getTimeOfDayLabel(
  date: Date,
  timeZone = DEFAULT_TIME_ZONE,
): TimeOfDayLabel {
  const hour = getHourInTimeZone(date, timeZone);

  if (hour >= 4 && hour <= 6) return "夜明け前";
  if (hour >= 7 && hour <= 10) return "朝";
  if (hour >= 11 && hour <= 14) return "昼下がり";
  if (hour >= 15 && hour <= 17) return "夕暮れ";
  if (hour >= 18 && hour <= 21) return "宵";
  if (hour >= 22 || hour <= 1) return "深夜";
  if (hour >= 2 && hour <= 3) return "静夜";

  return "宵";
}
