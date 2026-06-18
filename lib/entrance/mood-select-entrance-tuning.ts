import { isLocal } from "@/lib/env/app-env";

/**
 * 気分選択入場 —「今日はどうしようか？」確定後〜定常表示までの全体倍率。
 * 封蝋・ビネット・選択肢・パララックス（pondering）など共通。
 *
 * local 環境では 4（確認用スロー）、dev / production では 1（本番速度）。
 * 手動で弄りたい場合は右辺を直接書き換える（コミット前に戻すこと）。
 *
 * 時系列（T=0 = 気分選択画面へ遷移した瞬間）
 *   T=0               : パララックス開始・ビネット開始・選択肢①・封蝋 同時スタート
 *   T=0 〜 …          : 選択肢が OPTION_STAGGER ずつ遅れながら出現
 *   T=DECLINE_DELAY   : 「また今度にする」入場開始（選択肢⑤の1ストール後）
 *   T=PAST_BOTTLE_DELAY: 「過去のボトルから」入場開始（また今度にする完了後）
 */
export const MOOD_SELECT_ENTRANCE_DURATION_SCALE = isLocal ? 4 : 1;

// ── 選択肢タイミング ──────────────────────────────────────────────────────────
// bar-seat-mood-picker.tsx の TIMING.optionStagger × TIMING.optionStaggerFactor
// ← TIMING 定数を変えたらここも合わせること
const OPTION_STAGGER_BASE_SEC = 0.18 * 0.5; // = 0.09s (scale 前)
const OPTION_COUNT = 5; // buildMoodPickerOptions() の件数

// ── また今度にする ─────────────────────────────────────────────────────────────
/**
 * T=0 から「また今度にする」入場開始まで（実効秒・scale 込み）。
 * 選択肢⑤（index=4）スタートの 1 ストール後 = OPTION_COUNT ストール分。
 */
export const DECLINE_LINK_ENTRANCE_DELAY_SEC =
  OPTION_COUNT * OPTION_STAGGER_BASE_SEC * MOOD_SELECT_ENTRANCE_DURATION_SCALE;
// 5 × 0.09 × 4 = 1.80s

/**
 * 「また今度にする」入場アニメーションの基本時間（scale 前）。
 * 星0.15s 出現 → 線0.10s 後スタート / 0.50s 伸長 — 文字は 0.18s 後フェードイン / 0.45s。
 * 最終フレーム = textDelay + textDuration = 0.18 + 0.45 = 0.63s
 */
export const DECLINE_ENTRANCE_BASE_SEC = 0.63;

// ── 過去のボトルから ───────────────────────────────────────────────────────────
/**
 * T=0 から「過去のボトルから」入場開始まで（実効秒・scale 込み）。
 * また今度にする の入場完了後すぐ始まる。
 */
export const PAST_BOTTLE_ENTRANCE_DELAY_SEC =
  DECLINE_LINK_ENTRANCE_DELAY_SEC +
  DECLINE_ENTRANCE_BASE_SEC * MOOD_SELECT_ENTRANCE_DURATION_SCALE;
// 1.80 + 0.63 × 4 = 1.80 + 2.52 = 4.32s
