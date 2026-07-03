/** 初回訪問 — マスター挨拶セリフ（1行のみ → 明転へ） */
export const MASTER_GREETINGS_FIRST = ["やぁ、いらっしゃい。"] as const;

/** 再訪 — マスター挨拶セリフ */
export const MASTER_GREETINGS_RETURNING = ["やぁ、いらっしゃい。"] as const;

/** カウンター着席後 — 気分を尋ねる */
export const MASTER_MOOD_PROMPT_LINE = "さて、今日はどうしようか？" as const;
/** 明転連打スキップの停止位置（この直後からタイプ・スキップ不可） */
export const MASTER_MOOD_PROMPT_SKIP_STOP = "さて、今日は" as const;
export const MASTER_MOOD_PROMPT = [MASTER_MOOD_PROMPT_LINE] as const;

/** また今度にする — 黒画面での別れ */
export const MASTER_DECLINE_FAREWELL = ["気が向いたらまたきてくれ。"] as const;

/** 録音前 — 提供ドリンクの一言 */
export const MASTER_DRINK_SERVED = ["オールドファッションだ。"] as const;
