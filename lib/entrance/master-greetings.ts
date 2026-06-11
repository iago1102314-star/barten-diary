/** 初回訪問 — マスター挨拶セリフ */
export const MASTER_GREETINGS_FIRST = [
  "やぁ、いらっしゃい。",
  "……ちょうど、誰もいない時間だ。",
  "今夜は、何を置いていく？",
] as const;

/** 再訪 — マスター挨拶セリフ */
export const MASTER_GREETINGS_RETURNING = ["やぁ、いらっしゃい。"] as const;

/** カウンター着席後 — 気分を尋ねる */
export const MASTER_MOOD_PROMPT = ["……今日はどうしようか？"] as const;
