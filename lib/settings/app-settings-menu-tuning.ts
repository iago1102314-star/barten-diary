function rgba(rgb: string, opacity: number): string {
  return `rgba(${rgb}, ${opacity})`;
}

/**
 * メニュー画面 — 見た目調整（このファイルだけ触れば OK）
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_FRAME_TUNING — 枠・枠内背景・ぼかし
 * ═══════════════════════════════════════════════════════════
 *  outerBackground       … 枠の外側を塗る色（通常 #000）
 *  outerMaskSpread       … 枠外マスクの広がり（100vmax = 画面全体）
 *  borderRgb / borderOpacity … 枠線の色と透明度（0.28 前後が細い線）
 *  borderWidthPx         … 枠線の太さ
 *  borderRadiusPx        … 枠の角丸
 *  inset*Rem             … 画面端から枠までの余白（safe-area 込み）
 *  backdropBlurPx        … 枠内シーン背景の blur（px）。0 = blur なし
 *  backdropBrightness    … blur なし時も filter: brightness に使用
 *  backdropScale         … blur 時の拡大。blur なしなら 1.0
 *  surfaceTintOpacity    … ぼかし背景の上に載せる暗いトーン（0〜1）
 *                          小さいほど背景が透ける / 1 だと真っ黒に近い
 *  surfaceTintRgb        … トーンの色（RGB カンマ区切り）
 *  surfacePadding*Rem    … 枠内コンテンツの余白
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_FAB_TUNING — 右下ハンバーガーボタン
 * ═══════════════════════════════════════════════════════════
 *  sizeRem / rightRem / bottomRem … 位置と直径
 *  iconSizeRem           … ≡ アイコンサイズ
 *  background / color    … ボタン本体の色
 *  shadowOuter / shadowInset … 影
 *  hoverScale            … ホバー時の拡大（1.03 など）
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_CLOSE_TUNING — 右上 × / 戻る
 * ═══════════════════════════════════════════════════════════
 *  sizeRem               … タップ領域の直径
 *  iconSizeRem           … × アイコンサイズ
 *  background / color    … 丸ボタンの塗りとアイコン色
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_PROFILE_TUNING — プロフィールカード（縦・ガラス板）
 * ═══════════════════════════════════════════════════════════
 *  maxWidthPx            … カード最大幅
 *  paddingXRem             … カード内余白 横
 *  paddingTopRem           … カード内余白 上（アバター上）
 *  paddingBottomRem        … カード内余白 下（records 下）
 *  borderRadiusPx        … 角丸
 *  borderRgb / borderOpacity / borderHoverOpacity … 枠線（通常 / hover）
 *  backdropBlurPx        … カードの backdrop-blur（px）。0 = なし（gradient のみ）
 *  gradientTop/Mid/Bottom … 半透明グラデ（小さいほど背景が透ける）
 *  shadowOuter / shadowHover … 浮き感
 *  stackGapRem           … アバターと文字列の縦間隔
 *  bodyGapRem            … 名前・メール等の縦間隔
 *  zonePaddingTopRem     … カード外・上端の余白
 *  zonePaddingBottomRem  … カード外・下端の余白
 *  profileZoneHeightRem   … プロフィール列の固定高（ゲスト/ログイン共通・メニュー位置の基準）
 *  cardBottomTrimRem       … カード下線だけ上げる（負の値）。UIの translate は触らない
 *  detailsSlotPaddingBottomRem … records 直下の内側余白
 *  avatarSizePx          … アバター直径（64〜72 目安）
 *  avatarBrightness / avatarSaturate … 画像 filter（ログイン共通）
 *  avatarOffsetX/YRem     … アバター translate（rem）
 *  name/email/memoOffsetX/YRem … 見た目の translate のみ（レイアウトは変えない）
 *  memoRecordsFontSizePx  … 「71 records」— 色は nameColor と同じ
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_PROFILE_GUEST_TUNING — ゲスト時の見た目差分のみ
 * ═══════════════════════════════════════════════════════════
 *  （位置は PROFILE_TUNING の name / email / memo と共通）
 *  nameFontSizePx / nameOffsetX/YRem — ゲスト名（ログイン時とは別）
 *  avatarImageScale       … guest.webp の拡大率（枠サイズは avatarSizePx のまま）
 *  avatarImageOffsetX/YRem … 拡大後の画像位置（translate・rem）
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_PROFILE_LOGIN_TUNING — Googleでログイン（共通見た目）
 * ═══════════════════════════════════════════════════════════
 *  googleIconPosition    … "right" でラベル右に G
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_ITEMS_TUNING — メニュー行（サウンド等）
 * ═══════════════════════════════════════════════════════════
 *  maxWidthPx            … リスト最大幅
 *  gapRem                … 行と行の間隔
 *  rowGapRem             … 行内：アイコンと文字の横間隔
 *  minHeightPx           … 行の最小高さ（44 以上推奨）
 *  paddingX/YRem         … 行内余白
 *  iconSizePx            … 左アイコン（20〜24 目安）
 *  chevronSizePx         … 右 shebron（app-settings-menu.tsx で参照）
 *  labelFontSizePx       … メインラベル（サウンド、設定…）
 *  subFontSizePx         … 補足（フィードバック下の説明など）
 *  textGapRem            … ラベルと補足の縦間隔
 *  itemBorderRgb/Opacity … 行下の区切り線（0.025 前後でかなり薄く）
 *  labelColor / labelColorHover … ラベル色（hover はわずかに明るく）
 *  hoverBackground       … 行 hover 背景（transparent 推奨）
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_LAYOUT_TUNING — 全体レイアウト
 * ═══════════════════════════════════════════════════════════
 *  headerMarginBottomRem … 閉じるボタン下の余白
 *  mainColumnPaddingTop/BottomRem … メニュー列の内側余白
 *  menuVerticalBiasRem       … メニュー列の縦オフセット（+ で下）
 *  footerReserveMinHeightRem … ゲスト時も確保するログアウト枠（メニュー位置を揃える）
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_LOGOUT_TUNING — ログアウト（テキストリンク）
 * ═══════════════════════════════════════════════════════════
 *  paddingX/YRem         … タップ領域
 *  iconSizePx / iconGapRem … login.svg アイコン
 *  textColor             … 通常時 stone 系
 *  textColorHover / iconColorHover … hover のみ少し赤
 *  fontSizePx
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_SUBPANEL_TUNING — サウンド / 設定 / 利用規約 等
 * ═══════════════════════════════════════════════════════════
 *  titleFontSizePx / titleLetterSpacingEm / titleColor / titleMarginBottomRem
 *  bodyFontSizePx / bodyLineHeight / bodyColor … 説明文
 *  sliderAccentColor     … レンジスライダーのアクセント色
 *  sliderLabelFontSizePx / sliderValueFontSizePx … BGM/SE ラベル
 *
 * ═══════════════════════════════════════════════════════════
 *  SETTINGS_MENU_SHEET_TUNING — ボトムシート（サウンド / 設定）
 * ═══════════════════════════════════════════════════════════
 *  backdropBlurPx        … sheetRoot の backdrop-blur（px）。0 = なし
 */

function buildMenuPanelBackdropFilter(
  blurPx: number,
  brightness: number,
): string {
  if (blurPx <= 0) {
    return `brightness(${brightness})`;
  }
  return `blur(${blurPx}px) brightness(${brightness})`;
}

function buildMenuBackdropBlur(blurPx: number): string {
  return blurPx > 0 ? `blur(${blurPx}px)` : "none";
}

/** メニュー画面 — 外側マスク・枠・枠内ぼかし */
export const SETTINGS_MENU_FRAME_TUNING = {
  /** 枠の外側 — 真っ黒（box-shadow で枠外のみ塗る） */
  outerBackground: "#000000",
  /** 枠外マスクの広がり — 大きいほど画面端まで確実に黒 */
  outerMaskSpread: "100vmax",
  /** 枠線の色（RGB カンマ区切り）— メニュー文字と同系 */
  borderRgb: "236, 228, 210",
  /** 枠線の不透明度 0〜1 — 小さいほど薄い */
  borderOpacity: 0.28,
  /** 枠線の太さ（px） */
  borderWidthPx: 1,
  /** 枠の角丸（px） */
  borderRadiusPx: 18,
  /** 画面上端から枠まで（rem）— 大きいほど枠が低くなる */
  insetTopRem: 0.85,
  /** 画面右端から枠まで（rem） */
  insetRightRem: 1.15,
  /** 画面下端から枠まで（rem） */
  insetBottomRem: 1.1,
  /** 画面左端から枠まで（rem） */
  insetLeftRem: 1.15,
  /** 枠内シーン背景 — blur（0 = なし。SE3 向けに OFF） */
  backdropBlurPx: 0,
  /** blur なし時 — 背景 img を少し暗くする */
  backdropBrightness: 0.74,
  /** blur なし — 拡大不要 */
  backdropScale: 1,
  /**
   * ぼかし背景の上に載せる暗いトーン 0〜1
   * blur OFF 時は少し上げてコントラストを維持
   */
  surfaceTintOpacity: 0.22,
  /** 枠内トーンのベース色（RGB カンマ区切り） */
  surfaceTintRgb: "18, 14, 11",
  /** 枠内パディング 横（rem） */
  surfacePaddingXRem: 0.85,
  /** 枠内パディング 上（rem） */
  surfacePaddingTopRem: 0.5,
  /** 枠内パディング 下（rem） */
  surfacePaddingBottomRem: 0.55,
} as const;

/** 右下 — メニューを開く FAB（ハンバーガー） */
export const SETTINGS_MENU_FAB_TUNING = {
  /** ボタン直径（rem） */
  sizeRem: 3.15,
  /** 右端からの余白（rem）— safe-area 込み */
  rightRem: 1,
  /** 下端からの余白（rem）— safe-area 込み */
  bottomRem: 1.1,
  /** ≡ アイコンサイズ（rem） */
  iconSizeRem: 1.35,
  /** ボタン背景色 */
  background: "rgba(12, 10, 8, 0.92)",
  /** アイコン色 */
  color: "rgba(245, 245, 244, 0.94)",
  /** 外側の影 */
  shadowOuter: "0 10px 28px rgba(8, 6, 4, 0.34)",
  /** 内側のハイライト */
  shadowInset: "inset 0 1px 0 rgba(255, 248, 235, 0.06)",
  /** ホバー時 scale — 1 = 拡大なし */
  hoverScale: 1.03,
} as const;

/** 右上 — 閉じる / 戻るボタン */
export const SETTINGS_MENU_CLOSE_TUNING = {
  /** タップ領域の直径（rem） */
  sizeRem: 2.5,
  /** × アイコンサイズ（rem） */
  iconSizeRem: 1.2,
  /** 丸ボタン背景 */
  background: "rgba(255, 248, 235, 0.08)",
  /** アイコン色 */
  color: "rgba(245, 245, 244, 0.92)",
} as const;

/** プロフィールカード（ガラス板・縦レイアウト） */
export const SETTINGS_MENU_PROFILE_TUNING = {
  maxWidthPx: 280,
  paddingXRem: 1,
  /** カード内 — アバター上の余白 */
  paddingTopRem: 0.5,
  paddingBottomRem: 0.2,
  borderRadiusPx: 16,
  borderRgb: "245, 245, 244",
  borderOpacity: 0.12,
  borderHoverOpacity: 0.2,
  backdropBlurPx: 0,
  gradientTop: "rgba(10, 10, 10, 0.58)",
  gradientMid: "rgba(10, 10, 10, 0.54)",
  gradientBottom: "rgba(10, 10, 10, 0.5)",
  shadowOuter: "0 8px 24px rgba(8, 6, 4, 0.14)",
  shadowHover: "0 10px 28px rgba(8, 6, 4, 0.18)",
  stackGapRem: 0.55,
  bodyGapRem: 0.24,
  /** カード外 — 上端余白 */
  zonePaddingTopRem: 0.05,
  /** カード外 — 下端余白 */
  zonePaddingBottomRem: 0,
  /** 固定高 — ゲスト/ログインでメニュー開始エリアを揃える */
  profileZoneHeightRem: 11,
  /** カード下線を上げる（負の値）— アイコン・名前・records の見た目はそのまま */
  cardBottomTrimRem: -3.5,
  detailsSlotPaddingBottomRem: 0,
  /** アバター直径（px）— 64〜72 目安 */
  avatarSizePx: 70,
  /** アバター画像 — brightness / saturate（ログイン状態共通） */
  avatarBrightness: 0.9,
  avatarSaturate: 0.65,
  /** アバター位置 — translate（rem）。正で右・下 */
  avatarOffsetXRem: -5,
  avatarOffsetYRem: 0,
  /** 名前の位置 — translate（rem） */
  nameOffsetXRem: 2.5,
  nameOffsetYRem: -4,
  /** メールアドレスの位置 — translate（rem） */
  emailOffsetXRem: 2.5,
  emailOffsetYRem: -4,
  avatarBorderRgb: "245, 245, 244",
  avatarBorderOpacity: 0.18,
  avatarInsetGlow: "rgba(201, 166, 107, 0.05)",
  nameFontSizePx: 17,
  nameColor: "rgba(245, 245, 244, 0.94)",
  hintFontSizePx: 11.2,
  hintColor: "rgba(214, 211, 209, 0.62)",
  emailFontSizePx: 13,
  emailColor: "rgba(214, 211, 209, 0.65)",
  /** records 行 — ログイン時のみ（色は nameColor と同じ） */
  memoOffsetXRem: 0,
  memoOffsetYRem: -3.8,
  memoMarginTopRem: 0.4,
  memoRecordsFontSizePx: 20,
  memoGapRem: 0.35,
} as const;

/** ゲスト時 — ヒント・ログインボタン（位置はログイン時の email / memo と別） */
export const SETTINGS_MENU_PROFILE_GUEST_TUNING = {
  nameFontSizePx: 17,
  nameOffsetXRem: 2.5,
  nameOffsetYRem: -3.5,
  hintOffsetXRem: 0,
  hintOffsetYRem: -2,
  loginMarginTopRem: 0.5,
  loginOffsetXRem: 0,
  loginOffsetYRem: -2.5,
  /** ゲストカード下線を上げる（負の値） */
  guestCardBottomTrimRem: -2,
  /** guest.webp — 枠内で拡大（1 = 100%、枠直径は変えない） */
  avatarImageScale: 1.27,
  avatarImageOffsetXRem: 0,
  avatarImageOffsetYRem: 0,
  googleIconSizePx: 16,
  googleIconGapRem: 0.4,
} as const;

/** プロフィール内 — Googleでログイン（ゲスト時） */
export const SETTINGS_MENU_PROFILE_LOGIN_TUNING = {
  minHeightPx: 44,
  paddingXRem: 1,
  paddingYRem: 0.55,
  borderRadiusPx: 9999,
  borderRgb: "245, 245, 244",
  borderOpacity: 0.12,
  background: "rgba(255, 248, 235, 0.04)",
  fontSizePx: 12.8,
  textColor: "rgba(228, 218, 200, 0.92)",
  borderHoverRgb: "214, 196, 168",
  borderHoverOpacity: 0.22,
  backgroundHover: "rgba(255, 248, 235, 0.07)",
  textColorHover: "rgba(240, 230, 212, 0.98)",
  /** カラフル G — ラベルの右 */
  googleIconPosition: "right" as const,
} as const;

/** メニュー項目リスト — サウンド / フィードバック / 設定 等 */
export const SETTINGS_MENU_ITEMS_TUNING = {
  maxWidthPx: 384,
  gapRem: 0.12,
  rowGapRem: 0.85,
  minHeightPx: 52,
  paddingXRem: 0.35,
  paddingYRem: 0.85,
  iconSizePx: 22,
  chevronSizePx: 15,
  labelFontSizePx: 16,
  subFontSizePx: 11.2,
  textGapRem: 0.2,
  itemBorderRgb: "255, 248, 235",
  itemBorderOpacity: 0.025,
  itemBackground: "rgba(0, 0, 0, 0.15)",
  itemBackgroundHover: "rgba(0, 0, 0, 0.24)",
  labelColor: "rgba(245, 245, 244, 0.92)",
  labelColorHover: "rgba(245, 245, 244, 0.97)",
  subColor: "rgba(214, 211, 209, 0.62)",
  iconColor: "rgba(231, 229, 228, 0.84)",
  chevronColor: "rgba(214, 211, 209, 0.5)",
  hoverBackground: "rgba(0, 0, 0, 0.15)",
} as const;

/** メイン列 — プロフィール下の余白・中央寄せ */
export const SETTINGS_MENU_LAYOUT_TUNING = {
  headerMarginBottomRem: 0.2,
  mainColumnPaddingTopRem: 0,
  mainColumnPaddingBottomRem: 0,
  /** プロフィール下の残り領域でメニューを縦中央寄せ — 微調整用 */
  menuVerticalBiasRem: 0,
  /** ゲスト時もログアウト枠と同じ高さを確保 */
  footerReserveMinHeightRem: 3.75,
  footerPaddingTopRem: 1.5,
  footerPaddingBottomRem: 0.3,
} as const;

/** ログアウト — テキストリンク（ログイン時のみ最下部） */
export const SETTINGS_MENU_LOGOUT_TUNING = {
  paddingXRem: 0.75,
  paddingYRem: 0.5,
  iconSizePx: 15,
  iconGapRem: 0.35,
  textColor: "rgba(168, 158, 142, 0.72)",
  textColorHover: "rgba(196, 118, 98, 0.88)",
  iconColorHover: "rgba(196, 118, 98, 0.88)",
  fontSizePx: 12.8,
} as const;

/** ボトムシート — サウンド / 設定 */
export const SETTINGS_MENU_SHEET_TUNING = {
  /** sheetRoot backdrop-blur（0 = なし。gradient + scrim で代替） */
  backdropBlurPx: 0,
} as const;

/** サブパネル — サウンド / 設定 / 利用規約 / このアプリについて */
export const SETTINGS_MENU_SUBPANEL_TUNING = {
  titleFontSizePx: 16.8,
  titleLetterSpacingEm: 0.14,
  titleColor: "rgba(245, 245, 244, 0.94)",
  titleMarginBottomRem: 1.4,
  bodyFontSizePx: 14.08,
  bodyLineHeight: 1.9,
  bodyColor: "rgba(231, 229, 228, 0.82)",
  sliderAccentColor: "rgba(214, 196, 168, 0.92)",
  sliderLabelFontSizePx: 14.08,
  sliderValueFontSizePx: 12.48,
} as const;

/** メニュー開閉時に overlay へ渡す CSS 変数 */
export function buildSettingsMenuCssVars(): Record<string, string> {
  const frame = SETTINGS_MENU_FRAME_TUNING;
  const fab = SETTINGS_MENU_FAB_TUNING;
  const close = SETTINGS_MENU_CLOSE_TUNING;
  const profile = SETTINGS_MENU_PROFILE_TUNING;
  const profileGuest = SETTINGS_MENU_PROFILE_GUEST_TUNING;
  const profileLogin = SETTINGS_MENU_PROFILE_LOGIN_TUNING;
  const items = SETTINGS_MENU_ITEMS_TUNING;
  const layout = SETTINGS_MENU_LAYOUT_TUNING;
  const logout = SETTINGS_MENU_LOGOUT_TUNING;
  const sub = SETTINGS_MENU_SUBPANEL_TUNING;
  const sheet = SETTINGS_MENU_SHEET_TUNING;

  return {
    "--menu-outer-bg": frame.outerBackground,
    "--menu-outer-mask-spread": frame.outerMaskSpread,
    "--menu-frame-border": rgba(frame.borderRgb, frame.borderOpacity),
    "--menu-frame-radius": `${frame.borderRadiusPx}px`,
    "--menu-frame-border-width": `${frame.borderWidthPx}px`,
    "--menu-backdrop-filter": buildMenuPanelBackdropFilter(
      frame.backdropBlurPx,
      frame.backdropBrightness,
    ),
    "--menu-backdrop-scale": String(frame.backdropScale),
    "--menu-surface-bg": rgba(frame.surfaceTintRgb, frame.surfaceTintOpacity),
    "--menu-surface-px": `${frame.surfacePaddingXRem}rem`,
    "--menu-surface-pt": `${frame.surfacePaddingTopRem}rem`,
    "--menu-surface-pb": `${frame.surfacePaddingBottomRem}rem`,
    "--menu-inset-top": `max(${frame.insetTopRem}rem, env(safe-area-inset-top))`,
    "--menu-inset-right": `max(${frame.insetRightRem}rem, env(safe-area-inset-right))`,
    "--menu-inset-bottom": `max(${frame.insetBottomRem}rem, env(safe-area-inset-bottom))`,
    "--menu-inset-left": `max(${frame.insetLeftRem}rem, env(safe-area-inset-left))`,
    "--menu-fab-size": `${fab.sizeRem}rem`,
    "--menu-fab-right": `max(${fab.rightRem}rem, env(safe-area-inset-right))`,
    "--menu-fab-bottom": `max(${fab.bottomRem}rem, env(safe-area-inset-bottom))`,
    "--menu-fab-icon-size": `${fab.iconSizeRem}rem`,
    "--menu-fab-bg": fab.background,
    "--menu-fab-color": fab.color,
    "--menu-fab-shadow": `${fab.shadowOuter}, ${fab.shadowInset}`,
    "--menu-fab-hover-scale": `${fab.hoverScale}`,
    "--menu-close-size": `${close.sizeRem}rem`,
    "--menu-close-icon-size": `${close.iconSizeRem}rem`,
    "--menu-close-bg": close.background,
    "--menu-close-color": close.color,
    "--menu-layout-header-mb": `${layout.headerMarginBottomRem}rem`,
    "--menu-layout-main-pt": `${layout.mainColumnPaddingTopRem}rem`,
    "--menu-layout-main-pb": `${layout.mainColumnPaddingBottomRem}rem`,
    "--menu-layout-menu-bias-y": `${layout.menuVerticalBiasRem}rem`,
    "--menu-layout-footer-min-h": `${layout.footerReserveMinHeightRem}rem`,
    "--menu-layout-footer-pt": `${layout.footerPaddingTopRem}rem`,
    "--menu-layout-footer-pb": `${layout.footerPaddingBottomRem}rem`,
    "--menu-inner-max": `${items.maxWidthPx}px`,
    "--menu-profile-max": `${profile.maxWidthPx}px`,
    "--menu-profile-px": `${profile.paddingXRem}rem`,
    "--menu-profile-pt": `${profile.paddingTopRem}rem`,
    "--menu-profile-pb": `${profile.paddingBottomRem}rem`,
    "--menu-profile-radius": `${profile.borderRadiusPx}px`,
    "--menu-profile-border": rgba(profile.borderRgb, profile.borderOpacity),
    "--menu-profile-border-hover": rgba(
      profile.borderRgb,
      profile.borderHoverOpacity,
    ),
    "--menu-profile-blur": buildMenuBackdropBlur(profile.backdropBlurPx),
    "--menu-profile-gradient-top": profile.gradientTop,
    "--menu-profile-gradient-mid": profile.gradientMid,
    "--menu-profile-gradient-bottom": profile.gradientBottom,
    "--menu-profile-shadow": profile.shadowOuter,
    "--menu-profile-shadow-hover": profile.shadowHover,
    "--menu-profile-stack-gap": `${profile.stackGapRem}rem`,
    "--menu-profile-zone-pt": `${profile.zonePaddingTopRem}rem`,
    "--menu-profile-zone-pb": `${profile.zonePaddingBottomRem}rem`,
    "--menu-profile-zone-height": `${profile.profileZoneHeightRem}rem`,
    "--menu-profile-card-bottom-trim": `${profile.cardBottomTrimRem}rem`,
    "--menu-profile-details-pb": `${profile.detailsSlotPaddingBottomRem}rem`,
    "--menu-profile-body-gap": `${profile.bodyGapRem}rem`,
    "--menu-profile-avatar-size": `${profile.avatarSizePx}px`,
    "--menu-profile-avatar-brightness": String(profile.avatarBrightness),
    "--menu-profile-avatar-saturate": String(profile.avatarSaturate),
    "--menu-profile-avatar-x": `${profile.avatarOffsetXRem}rem`,
    "--menu-profile-avatar-y": `${profile.avatarOffsetYRem}rem`,
    "--menu-profile-name-x": `${profile.nameOffsetXRem}rem`,
    "--menu-profile-name-y": `${profile.nameOffsetYRem}rem`,
    "--menu-profile-email-x": `${profile.emailOffsetXRem}rem`,
    "--menu-profile-email-y": `${profile.emailOffsetYRem}rem`,
    "--menu-profile-avatar-border": rgba(
      profile.avatarBorderRgb,
      profile.avatarBorderOpacity,
    ),
    "--menu-profile-avatar-glow": profile.avatarInsetGlow,
    "--menu-profile-name-size": `${profile.nameFontSizePx}px`,
    "--menu-profile-name-color": profile.nameColor,
    "--menu-profile-hint-size": `${profile.hintFontSizePx}px`,
    "--menu-profile-hint-color": profile.hintColor,
    "--menu-profile-email-size": `${profile.emailFontSizePx}px`,
    "--menu-profile-email-color": profile.emailColor,
    "--menu-profile-memo-x": `${profile.memoOffsetXRem}rem`,
    "--menu-profile-memo-y": `${profile.memoOffsetYRem}rem`,
    "--menu-profile-memo-mt": `${profile.memoMarginTopRem}rem`,
    "--menu-profile-memo-records-size": `${profile.memoRecordsFontSizePx}px`,
    "--menu-profile-guest-name-size": `${profileGuest.nameFontSizePx}px`,
    "--menu-profile-guest-name-x": `${profileGuest.nameOffsetXRem}rem`,
    "--menu-profile-guest-name-y": `${profileGuest.nameOffsetYRem}rem`,
    "--menu-profile-guest-hint-x": `${profileGuest.hintOffsetXRem}rem`,
    "--menu-profile-guest-hint-y": `${profileGuest.hintOffsetYRem}rem`,
    "--menu-profile-guest-login-mt": `${profileGuest.loginMarginTopRem}rem`,
    "--menu-profile-guest-login-x": `${profileGuest.loginOffsetXRem}rem`,
    "--menu-profile-guest-login-y": `${profileGuest.loginOffsetYRem}rem`,
    "--menu-profile-guest-card-bottom-trim": `${profileGuest.guestCardBottomTrimRem}rem`,
    "--menu-profile-guest-avatar-scale": String(profileGuest.avatarImageScale),
    "--menu-profile-guest-avatar-img-x": `${profileGuest.avatarImageOffsetXRem}rem`,
    "--menu-profile-guest-avatar-img-y": `${profileGuest.avatarImageOffsetYRem}rem`,
    "--menu-profile-guest-google-icon-size": `${profileGuest.googleIconSizePx}px`,
    "--menu-profile-guest-google-icon-gap": `${profileGuest.googleIconGapRem}rem`,
    "--menu-profile-login-min-h": `${profileLogin.minHeightPx}px`,
    "--menu-profile-login-px": `${profileLogin.paddingXRem}rem`,
    "--menu-profile-login-py": `${profileLogin.paddingYRem}rem`,
    "--menu-profile-login-radius": `${profileLogin.borderRadiusPx}px`,
    "--menu-profile-login-border": rgba(
      profileLogin.borderRgb,
      profileLogin.borderOpacity,
    ),
    "--menu-profile-login-bg": profileLogin.background,
    "--menu-profile-login-font-size": `${profileLogin.fontSizePx}px`,
    "--menu-profile-login-text": profileLogin.textColor,
    "--menu-profile-login-border-hover": rgba(
      profileLogin.borderHoverRgb,
      profileLogin.borderHoverOpacity,
    ),
    "--menu-profile-login-bg-hover": profileLogin.backgroundHover,
    "--menu-profile-login-text-hover": profileLogin.textColorHover,
    "--menu-items-gap": `${items.gapRem}rem`,
    "--menu-items-row-gap": `${items.rowGapRem}rem`,
    "--menu-items-min-h": `${items.minHeightPx}px`,
    "--menu-items-px": `${items.paddingXRem}rem`,
    "--menu-items-py": `${items.paddingYRem}rem`,
    "--menu-items-icon-size": `${items.iconSizePx}px`,
    "--menu-items-text-gap": `${items.textGapRem}rem`,
    "--menu-items-chevron-color": items.chevronColor,
    "--menu-items-border": rgba(items.itemBorderRgb, items.itemBorderOpacity),
    "--menu-items-bg": items.itemBackground,
    "--menu-items-bg-hover": items.itemBackgroundHover,
    "--menu-items-label-color": items.labelColor,
    "--menu-items-label-color-hover": items.labelColorHover,
    "--menu-items-sub-color": items.subColor,
    "--menu-items-icon-color": items.iconColor,
    "--menu-items-label-size": `${items.labelFontSizePx}px`,
    "--menu-items-sub-size": `${items.subFontSizePx}px`,
    "--menu-items-hover-bg": items.hoverBackground,
    "--menu-logout-px": `${logout.paddingXRem}rem`,
    "--menu-logout-py": `${logout.paddingYRem}rem`,
    "--menu-logout-icon-size": `${logout.iconSizePx}px`,
    "--menu-logout-icon-gap": `${logout.iconGapRem}rem`,
    "--menu-logout-text": logout.textColor,
    "--menu-logout-text-hover": logout.textColorHover,
    "--menu-logout-icon-hover": logout.iconColorHover,
    "--menu-logout-font-size": `${logout.fontSizePx}px`,
    "--menu-sub-title-size": `${sub.titleFontSizePx}px`,
    "--menu-sub-title-tracking": `${sub.titleLetterSpacingEm}em`,
    "--menu-sub-title-color": sub.titleColor,
    "--menu-sub-title-mb": `${sub.titleMarginBottomRem}rem`,
    "--menu-sub-body-size": `${sub.bodyFontSizePx}px`,
    "--menu-sub-body-lh": `${sub.bodyLineHeight}`,
    "--menu-sub-body-color": sub.bodyColor,
    "--menu-sub-slider-accent": sub.sliderAccentColor,
    "--menu-sub-slider-label-size": `${sub.sliderLabelFontSizePx}px`,
    "--menu-sub-slider-value-size": `${sub.sliderValueFontSizePx}px`,
    "--menu-sheet-blur": buildMenuBackdropBlur(sheet.backdropBlurPx),
  };
}
