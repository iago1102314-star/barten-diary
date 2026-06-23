import type { CSSProperties } from "react";

/**
 * 夜のメモ一覧 — 見た目調整（このファイルだけ触れば OK）
 *
 * ═══════════════════════════════════════════════════════════
 *  ポラロイド（白枠＋写真＋日付）— 1ページ4枚・2行向け
 * ═══════════════════════════════════════════════════════════
 *  polaroidWidthPercent      … カード全体の大きさ。100 = セルいっぱい
 *  polaroidPaddingBottomPercent … 白枠の下余白（%）。大きいほど日付エリアが広い
 *
 * ═══════════════════════════════════════════════════════════
 *  グリッド間隔（2列×2行）
 * ═══════════════════════════════════════════════════════════
 *  gridRowGapRem         … 上下2行の間（rem）
 *  gridColumnGapRem      … 左右2列の間（rem）
 *  gridCellPaddingBlockRem … 各セル内の上下余白（傾き・影用）
 */
export const MEMO_SHELF_TUNING = {
  polaroidWidthPercent: 152,
  polaroidPaddingBottomPercent: 40,

  gridRowGapRem: 2.85,
  gridColumnGapRem: 1.4,
  gridCellPaddingBlockRem: 0.55,

  /** 1行目の写真 — ヘッダー下の余白（rem） */
  gridPaddingTopRem: 1.35,

  /**
   * ═══════════════════════════════════════════════════════════
   *  紙背景（一覧画面全体）
   * ═══════════════════════════════════════════════════════════
   *  paperTextureOpacity … paper.webp の濃さ。大きいほど繊維がはっきり（0.18 = 日記詳細）
   *  paperTextureSizePx  … テクスチャ1タイルの幅。小さいほど細かく見える
   *  paperEdgeShadow       … 端の古び・ビネット（0〜1）
   *  paperDarkenPercent    … 背景全体を暗くする（10 = 約10%暗く）
   */
  paperTextureOpacity: 0.36,
  paperTextureSizePx: 260,
  paperEdgeShadow: 0.14,
  paperDarkenPercent: 10,

  /** ポラロイドの下影 — 1 = 標準 / 1.4 = やや濃い / 1.8 = かなり濃い */
  polaroidShadowStrength: 1.45,

  /**
   * ヘッダー（夜のメモ）— 暗い帯の高さ
   * safe-area 上端は別途加算
   */
  /** 上帯（旧・下帯サイズ）— 帯の縦 padding */
  topBarPaddingBlockRem: 0.3,
  topBarPaddingInlineRem: 0.95,
  /** 下帯（旧・上帯サイズ） */
  bottomBarPaddingBlockRem: 0.3,

  /**
   * 一覧1ページ目（最新4件）の傾き再抽選 — 数字を上げると角度が変わる
   * 候補は diary-drink-tape.ts の DIARY_DRINK_PHOTO_TILTS
   */
  shelfLatestSixTiltResampleSalt: "1",
} as const;

export function memoShelfPaperStyle(): CSSProperties {
  const {
    paperTextureOpacity,
    paperTextureSizePx,
    paperEdgeShadow,
    paperDarkenPercent,
    topBarPaddingBlockRem,
    topBarPaddingInlineRem,
    bottomBarPaddingBlockRem,
  } = MEMO_SHELF_TUNING;

  return {
    "--memo-shelf-paper-texture-opacity": String(paperTextureOpacity),
    "--memo-shelf-paper-texture-size": `${paperTextureSizePx}px auto`,
    "--memo-shelf-paper-texture-size-px": String(paperTextureSizePx),
    "--memo-shelf-paper-edge-shadow": String(paperEdgeShadow),
    "--memo-shelf-paper-darken": String(paperDarkenPercent / 100),
    "--memo-shelf-topbar-padding-block": `${topBarPaddingBlockRem}rem`,
    "--memo-shelf-topbar-padding-inline": `${topBarPaddingInlineRem}rem`,
    "--memo-shelf-bottombar-padding-block": `${bottomBarPaddingBlockRem}rem`,
  } as CSSProperties;
}

export function memoShelfGridStyle(): CSSProperties {
  const {
    polaroidWidthPercent,
    polaroidPaddingBottomPercent,
    gridRowGapRem,
    gridColumnGapRem,
    gridCellPaddingBlockRem,
    polaroidShadowStrength,
    gridPaddingTopRem,
  } = MEMO_SHELF_TUNING;

  return {
    "--memo-shelf-polaroid-width": `${polaroidWidthPercent}%`,
    "--memo-shelf-polaroid-padding-bottom": `${polaroidPaddingBottomPercent}%`,
    "--memo-shelf-grid-row-gap": `${gridRowGapRem}rem`,
    "--memo-shelf-grid-column-gap": `${gridColumnGapRem}rem`,
    "--memo-shelf-grid-cell-padding-block": `${gridCellPaddingBlockRem}rem`,
    "--memo-shelf-grid-padding-top": `${gridPaddingTopRem}rem`,
    "--memo-shelf-polaroid-shadow-strength": String(polaroidShadowStrength),
  } as CSSProperties;
}
