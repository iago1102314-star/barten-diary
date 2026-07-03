/**
 * 帰り道 — 日記完成 UI（このファイルだけ触れば OK）
 *
 * ═══════════════════════════════════════════════════════════
 *  画面全体（night-alley-screen）
 * ═══════════════════════════════════════════════════════════
 *  screenPaddingXRem / screenPaddingYRem   左右・上下余白
 *  panelMaxWidthRem                       パネル最大幅
 *
 * ═══════════════════════════════════════════════════════════
 *  パネル内レイアウト
 * ═══════════════════════════════════════════════════════════
 *  panelGapRem              見出し・カード・CTA 間の縦 gap
 *
 * ═══════════════════════════════════════════════════════════
 *  日記カード プレビュー
 * ═══════════════════════════════════════════════════════════
 *  previewPaperMaxWidthRem  紙面幅
 *  previewClipMaxHeight     切り取り高さ（CSS clamp 文字列）
 *  previewFadeHeightRem     下端の黒グラデ帯の高さ
 *  previewFade*             グラデ各 stop（% / opacity）
 *
 * ═══════════════════════════════════════════════════════════
 *  「今夜を記録に残しました」
 * ═══════════════════════════════════════════════════════════
 *  messageFontSizePx / messageLineHeight / messageLetterSpacingEm
 *  messageColor / messageOpacity
 *
 * ═══════════════════════════════════════════════════════════
 *  「ログインすると…」（needsLogin のみ）
 * ═══════════════════════════════════════════════════════════
 *  loginHintFontSizePx / loginHintLineHeight / loginHintLetterSpacingEm
 *  loginHintColor / loginHintOpacity / loginHintPaddingXRem
 *
 * ═══════════════════════════════════════════════════════════
 *  CTA ブロック（ログイン文〜ボタン / 日記を読む）
 * ═══════════════════════════════════════════════════════════
 *  ctaBlockGapRem / ctaBlockPaddingTopRem
 *
 * ═══════════════════════════════════════════════════════════
 *  「また今度読む」
 * ═══════════════════════════════════════════════════════════
 *  dismissFontSizePx / dismissLetterSpacingEm
 *  dismissColor / dismissOpacity / dismissPaddingTopRem
 *
 * ═══════════════════════════════════════════════════════════
 *  保存済み — 「記録を読む」＋「また今度読む」
 * ═══════════════════════════════════════════════════════════
 *  savedActionsOffsetTopRem   カード下のボタン群を下へ（rem）
 */

/** 帰り道 — 日記完成 UI の段階フェード */
export const ALLEY_DIARY_COMPLETE_TUNING = {
  messageDelaySec: 0,
  messageDurationSec: 0.85,
  cardDelaySec: 0.42,
  cardDurationSec: 0.95,
  cardYOffsetPx: 12,
  ctaDelaySec: 0.72,
  ctaDurationSec: 0.85,
  subCtaDelaySec: 0.92,
  subCtaDurationSec: 0.75,

  /** 画面 — 左右余白（rem） */
  screenPaddingXRem: 1,
  /** 画面 — 上下余白（rem） */
  screenPaddingYRem: 1.75,
  /** パネル最大幅（rem） */
  panelMaxWidthRem: 28.35,

  /** 見出し・カード・CTA 間の縦 gap（rem） */
  panelGapRem: 0.75,

  /** 日記紙面幅（rem）— 基準 26.5rem を約 7% 拡大 */
  previewPaperMaxWidthRem: 28.35,
  /** プレビュー切り取り高さ */
  previewClipMaxHeight: "clamp(24rem, 54dvh, 26.2rem)",
  /** 下端黒グラデ帯の高さ（rem） */
  previewFadeHeightRem: 6.75,
  /** 黒グラデ — 透明が続く stop（%） */
  previewFadeTransparentStopPercent: 42,
  /** 黒グラデ — 中間 stop（%） */
  previewFadeMidStopPercent: 68,
  /** 黒グラデ — 中間 stop の不透明度（0〜1） */
  previewFadeMidOpacity: 0.58,
  /** 黒グラデ — 後半 stop（%） */
  previewFadeLateStopPercent: 88,
  /** 黒グラデ — 後半 stop の不透明度（0〜1） */
  previewFadeLateOpacity: 0.88,
  /** 黒グラデ — 下端の不透明度（0〜1） */
  previewFadeBottomOpacity: 0.98,

  /** 「今夜を記録に残しました」— フォントサイズ（px） */
  messageFontSizePx: 19,
  /** 行間（倍率） */
  messageLineHeight: 1.85,
  /** 字間（em） */
  messageLetterSpacingEm: 0,
  /** 文字色 */
  messageColor: "rgb(231 229 228)",
  /** 不透明度（0〜1） */
  messageOpacity: 0.88,

  /** ログイン補足 — フォントサイズ（px） */
  loginHintFontSizePx: 15,
  loginHintLineHeight: 6.75,
  loginHintLetterSpacingEm: 0.05,
  loginHintColor: "rgb(231 229 228)",
  loginHintOpacity: 0.7,
  /** 左右 padding（rem） */
  loginHintPaddingXRem: 0.25,

  /** CTA ブロック内 gap（rem）— 補足文とボタン間など */
  ctaBlockGapRem: 0.35,
  /** CTA ブロック上 padding（rem） */
  ctaBlockPaddingTopRem: 0.125,

  /** 「また今度読む」— フォントサイズ（px） */
  dismissFontSizePx: 13,
  dismissLetterSpacingEm: 0.14,
  dismissColor: "rgb(231 229 228)",
  dismissOpacity: 0.92,
  dismissPaddingTopRem: 0.125,

  /** 保存済み — 「記録を読む」と「また今度読む」を下へ（rem）。カード位置は変えない */
  savedActionsOffsetTopRem: 1.75,
} as const;
