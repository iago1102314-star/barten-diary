/**
 * 入店フロー — 下端トースト（過去ボトル β 通知など）
 *
 * widthRem — 指定時はピル幅を固定（null なら文字幅ベース）
 * minWidthRem — widthRem が null のときの最小幅
 * maxWidthRem — 上限（これより広くならない）
 * maxWidthViewportInsetRem — 画面端からの最小余白（max-width の vw 計算用）
 *
 * bottomMinRem — safe-area と比較する下端の最小余白
 * bottomExtraRem — 上記に加える追加オフセット
 * leftPercent — 横位置（50 = 中央）
 * translateXPercent — 中央揃え用（通常 -50）
 */
export const ENTRANCE_BOTTOM_TOAST_TUNING = {
  /** 表示時間（ms） */
  durationMs: 3200,

  /** 横位置（%）— 50 で中央 */
  leftPercent: 50,
  /** transform: translateX — 中央揃えは -50 */
  translateXPercent: -50,

  /** 下端: max(bottomMinRem, safe-area) + bottomExtraRem */
  bottomMinRem: 38.15,
  bottomExtraRem: 0.55,

  /** サイズ — widthRem を入れると横長を直接指定できる */
  widthRem: null as number | null,
  minWidthRem: 30,
  maxWidthRem: 37.5,
  maxWidthViewportInsetRem: 0,
  paddingXRem: 0.9,
  paddingYRem: 0.48,
  borderRadiusPx: 999,

  /** "nowrap" で1行固定（minWidth / width と併用しやすい） */
  whiteSpace: "normal" as "normal" | "nowrap",

  /** 文字 */
  fontSizeRem: 1.1,
  fontWeight: 400,
  lineHeight: 1.55,
  letterSpacingEm: 0.06,

  /** 見た目 */
  textColor: "rgba(236, 228, 210, 0.96)",
  backgroundColor: "rgba(34, 28, 22, 0.94)",
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.32)",

  zIndex: 2147483001,
} as const;
