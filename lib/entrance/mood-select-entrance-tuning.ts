import { isProd } from "@/lib/env/app-env";

/**
 * 気分選択入場 —「今日はどうしようか？」確定後〜定常表示までの全体倍率。
 *
 * local / dev では 4（調整・確認用）、production のみ 1（本番速度）。
 */
export const MOOD_SELECT_ENTRANCE_DURATION_SCALE = isProd ? 1 : 4;

/**
 * パララックス + 黒ビネット — 同時開始・同時完了（秒 @ scale=1）。
 */
export const MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC = 0.25;

/** T=0 から UI 入場開始まで（= カメラ・ビネット完了時刻） */
export const MOOD_SELECT_UI_ENTRANCE_DELAY_SEC =
  MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC * MOOD_SELECT_ENTRANCE_DURATION_SCALE;

// ── 感情選択ボタン（5つ）入場 ───────────────────────────────────────────────
/** スライド・ストagger の速度倍率（1.6 = 1.6倍速 → 時間は ÷1.6） */
export const MOOD_OPTION_ENTRANCE_SPEED_FACTOR = 1.6;
/**
 * 気分選択 UI — 入場・退場共通の速度倍率（1.5 = 1.5倍速 → 時間 ÷1.5）。
 * 感情ボタン退場と同じテンポに揃える。
 */
export const MOOD_SELECT_UI_ANIM_SPEED_FACTOR = 1.5;
/** 感情ボタン入場 — MOOD_OPTION × UI 共通（= 2.4） */
export const MOOD_SELECT_UI_ENTRANCE_SPEED_FACTOR =
  MOOD_OPTION_ENTRANCE_SPEED_FACTOR * MOOD_SELECT_UI_ANIM_SPEED_FACTOR;

/** scale 前の秒数を気分選択 UI アニメ速度で変換 */
export function moodSelectUiAnimSec(baseSec: number): number {
  return baseSec / MOOD_SELECT_UI_ANIM_SPEED_FACTOR;
}

/** MOOD_SELECT_ENTRANCE_DURATION_SCALE 込み */
export function moodSelectUiAnimScaledSec(baseSec: number): number {
  return moodSelectUiAnimSec(baseSec) * MOOD_SELECT_ENTRANCE_DURATION_SCALE;
}
/** 入場開始を早める（秒 @ scale=1）— 感情ボタンのみ */
export const MOOD_OPTION_ENTRANCE_START_EARLY_SEC = 0.2;

export const MOOD_OPTION_ENTRANCE_BASE_DELAY_SEC = Math.max(
  0,
  MOOD_SELECT_UI_ENTRANCE_DELAY_SEC -
    MOOD_OPTION_ENTRANCE_START_EARLY_SEC * MOOD_SELECT_ENTRANCE_DURATION_SCALE,
);

// ── 選択肢タイミング ──────────────────────────────────────────────────────────
// bar-seat-mood-picker.tsx の TIMING.optionStagger × TIMING.optionStaggerFactor
const OPTION_STAGGER_BASE_SEC = 0.18 * 0.5; // = 0.09s (scale 前)
const OPTION_COUNT = 5;

const OPTION_STAGGER_SEC =
  (OPTION_STAGGER_BASE_SEC * MOOD_SELECT_ENTRANCE_DURATION_SCALE) /
  MOOD_SELECT_UI_ENTRANCE_SPEED_FACTOR;

// ── また今度にする ─────────────────────────────────────────────────────────────
/** UI 入場後 — 選択肢⑤の 1 ストール後 */
export const DECLINE_LINK_ENTRANCE_DELAY_SEC =
  MOOD_OPTION_ENTRANCE_BASE_DELAY_SEC + OPTION_COUNT * OPTION_STAGGER_SEC;

/** @deprecated decline-night-link-tuning.ts の entrance.totalAfterStartSec を使用 */
export const DECLINE_ENTRANCE_BASE_SEC = 0.63;

/** 過去ボトルリンク — 封蝋出現開始（秒 @ scale=1） */
export const PAST_BOTTLE_ENTRANCE_BASE_SEC = 0.15;

export const PAST_BOTTLE_ENTRANCE_DELAY_SEC = moodSelectUiAnimScaledSec(
  PAST_BOTTLE_ENTRANCE_BASE_SEC,
);
