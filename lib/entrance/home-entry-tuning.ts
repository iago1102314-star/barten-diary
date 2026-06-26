/** ホームの「日記デザイン（仮）」ボタン — 再び使うとき true */
export const SHOW_HOME_DIARY_DESIGN_BUTTON = false;

/** 「バーテン」「日記」タイトル — 位置・サイズ */
export const HOME_ENTRY_TITLE_TUNING = {
  /** 画面上端からの位置（%） */
  topPercent: 11,
  /** 右方向へのずらし（rem）。正で右へ */
  translateXRem: 0.6,
  /** 文字サイズ（px） */
  fontSizePx: 39.3,
  /** 字間（em） */
  letterSpacingEm: 0.16,
  /** 「バーテン」と「日記」の縦間隔（px）— 日記側 margin-top。負値で詰める */
  lineGapPx: 7,
  /** 「日記」下の線 — 太さ（px） */
  underlineHeightPx: 0.8,
  /** 「日記」と下線の間隔（px） */
  underlineGapPx: 3,
} as const;

/** ホームのガラス枠ボタン — カウンターへ / 記録を開く */
export const HOME_ENTRY_BUTTON_TUNING = {
  /** 枠の角丸（px） */
  borderRadiusPx: 4,
  /** 枠の内側余白 横（rem） */
  paddingXRem: 2,
  /** 枠の内側余白 縦（rem） */
  paddingYRem: 0.9,
  /** 枠線の太さ（px） */
  borderWidthPx: 1,
  /**
   * 枠線色 — stone 寄り（ランタン暖色を主役に）
   */
  borderColor: "rgba(245, 245, 244, 0.26)",
  /** hover 時の枠線色 — 暖色は hover のみ */
  borderColorHover: "rgba(255, 236, 190, 0.40)",
  /** 文字サイズ（px） */
  fontSizePx: 17,
  /** 右側シェブロン — サイズ（px） */
  iconSizePx: 16,
  /**
   * シェブロン用の横スロット（px）— ラベル中央寄せから除外する幅
   */
  iconSlotPx: 28,
  /**
   * シェブロンを右端寄りにするオフセット（rem）
   * 大きいほど右へ（スロット内でさらに右にはみ出す）
   */
  iconExtraRightRem: 0.45,
  /**
   * 枠内ぼかし — Tailwind クラス
   * 例: backdrop-blur-sm / backdrop-blur-md / backdrop-blur-lg
   */
  backdropBlurClass: "backdrop-blur-md",
  /** 枠内背景の暗さ 0〜1（ガラス感） */
  fillOpacity: 0.15,
  /** 2ボタン間の縦間隔（rem） */
  stackGapRem: 1.5,
  /** ボタン列の最大幅（px） */
  maxWidthPx: 260,
  /** 画面下端からの位置（%） */
  bottomPercent: 13,
} as const;

/** ホーム右上 — ログイン / ログアウト（プレースホルダー） */
export const HOME_AUTH_BUTTON_TUNING = {
  /** 画面上端からの位置（%）— タイトルより上 */
  topPercent: 1.1,
  /** 右端からの余白（rem） */
  rightRem: 0.5,
  /** カプセル形 — 左右丸 */
  borderRadiusPx: 9999,
  /** 枠の内側余白 横（rem）— 文字をパンパン一歩手前 */
  paddingXRem: 0.72,
  /** 枠の内側余白 縦（rem） */
  paddingYRem: 0.24,
  /** 文字サイズ（px） */
  fontSizePx: 12.5,
  /** login アイコン — サイズ（px） */
  iconSizePx: 17,
  /** ラベルとアイコンの間隔（rem） */
  iconGapRem: 0.3,
  /** 「ログイン」の字間（em）— グローバル Shippori と別に調整可 */
  loginLetterSpacingEm: 0.06,
  /** 「ログアウト」の字間（em）— 4文字で広く見えやすいので詰め気味に */
  logoutLetterSpacingEm: 0.04,
  /** 枠線の太さ（px） */
  borderWidthPx: 1,
  /**
   * 枠線色 — 補助 UI。メインボタンより控えめ
   */
  borderColor: "rgba(245, 245, 244, 0.16)",
  /** hover 時の枠線色 */
  borderColorHover: "rgba(255, 236, 190, 0.25)",
} as const;
