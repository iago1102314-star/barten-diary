/** 日記紙レイアウト — 罫線何行分か（`--diary-line-stride` の倍数） */
export const DIARY_PAPER_LAYOUT = {
  /** 日付ブロック */
  dateRows: 1,
  /** 写真＋グラス名（合計） */
  drinkBlockRows: 9,
  /** 本文とキャラクター声欄の間 */
  characterGapRows: 1,
} as const;

export type DiaryPaperLayout = typeof DIARY_PAPER_LAYOUT;
