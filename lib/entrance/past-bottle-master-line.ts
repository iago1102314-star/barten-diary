const PAST_BOTTLE_MASTER_LINES = [
  "……その夜の続きを飲むのか。",
  "……前と同じでいいな。",
  "その話、まだ残ってるんだな。",
] as const;

export function pickPastBottleMasterLine(bottleTag: string): string {
  let seed = 0;
  for (let i = 0; i < bottleTag.length; i += 1) {
    seed += bottleTag.charCodeAt(i);
  }
  return PAST_BOTTLE_MASTER_LINES[seed % PAST_BOTTLE_MASTER_LINES.length]!;
}
