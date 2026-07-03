/**
 * ゲスト — 日記本文プレビュー（紙デザインはそのまま・本文のみマスク）
 *
 * bodyVisibleLineCount — フェードに使う行数（1行目＝くっきり / 2行目＝少し薄い / 3行目＝もっと薄い）
 * bodyMaskLine* — 各行のマスク境界・不透明度
 *
 * fadeToLoginGapRem — フェード終端〜区切り線の間
 * divider* — 区切り線
 * hint* — 案内文
 * loginButton* — 紙向け Google ボタン
 */
export const GUEST_DIARY_PREVIEW_TUNING = {
  bodyVisibleLineCount: 3,
  /** 1行目の終わり（%） */
  bodyMaskLine1EndPercent: 33.33,
  /** 2行目の終わり（%） */
  bodyMaskLine2EndPercent: 66.66,
  /** 2行目中盤（%）・少し薄く */
  bodyMaskLine2MidPercent: 48,
  bodyMaskLine2MidOpacity: 0.48,
  /** 2行目末のマスク不透明度 */
  bodyMaskLine2Opacity: 0.28,
  /** 3行目中盤（%）・さらに薄く */
  bodyMaskLine3MidPercent: 82,
  bodyMaskLine3MidOpacity: 0.07,

  /** フェード下の空白領域 — 最小の高さ（行数） */
  blankZoneMinRows: 5,
  /** フェード終端〜区切り線（rem） */
  fadeToLoginGapRem: 0.2,

  dividerWidthRem: 5.5,
  dividerOpacity: 0.26,
  dividerMarginBottomRem: 0.6,

  hintFontSizePx: 14,
  hintLineHeight: 1.65,
  hintLetterSpacingEm: 0.05,
  hintColor: "rgb(90 67 51)",
  hintOpacity: 0.72,

  loginButtonGapRem: 0.65,
  loginButtonHeightPx: 40,
  loginButtonBgOpacity: 0.1,
  loginButtonBorderOpacity: 0.26,
  loginButtonTextOpacity: 0.8,
  loginButtonShadowOpacity: 0.045,
} as const;
