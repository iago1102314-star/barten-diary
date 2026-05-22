/** 本番生成の温度（低め＝創作・教訓が出にくい） */
export const GENERATION_TEMPERATURE = 0.64;

/** ラボ比較用：同じ prompt で温度だけ変える */
export const LAB_TEMPERATURES = [0.62, 0.64, 0.74] as const;

export const LAB_MAX_VARIANTS = 3;

/** 夜の記録 — 静けさ調整の目安 */
export const DIARY_WARN_CHARS = 360;
export const DIARY_MAX_CHARS = 420;
export const MASTER_MAX_CHARS = 55;

/** 棚の酒メモ（masterComment） */
export const SHELF_WINE_NOTE_MIN_CHARS = 20;
export const SHELF_WINE_NOTE_MAX_CHARS = 60;
