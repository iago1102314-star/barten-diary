import { LOADING_GATE_MESSAGE_COLOR } from "@/lib/entrance/loading-gate-message-tuning";

/** ホーム定常 — 左下 Beta 表記 */
export const HOME_BETA_LABEL_TUNING = {
  /** false で非表示 */
  enabled: true,
  text: "Beta 1.0.0",
  /** 文字色（Loading と同系） */
  color: LOADING_GATE_MESSAGE_COLOR,
  /** 不透明度（0〜1） */
  opacity: 0.3,
  /** フォントサイズ（px）— Loading と同フォント */
  fontSizePx: 25,
  /** 字間（em）— Loading と同じ */
  letterSpacingEm: 0.2,
  /**
   * 画面左下端からの位置（%）
   * leftPercent: 0 = 左端
   * bottomPercent: 0 = 下端
   */
  leftPercent:0,
  bottomPercent: 0.5,
} as const;
