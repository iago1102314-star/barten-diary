/**
 * public/ 静的アセット — URL パスの単一参照点
 *
 * ```
 * public/assets/
 *   alley/          路地
 *   bar/            店内・録音背景
 *   start/          入店前
 *   master/         マスター
 *   diary/          日記紙 UI（paper, tape）
 *   drinks/{id}/    ドリンク画像（record + diary/）
 *   fonts/          ローカルフォント
 * sounds/           効果音・BGM
 * icons/            PWA
 * ```
 */

export const DIARY_PAPER_ASSETS = {
  paperTexture: "/assets/diary/paper.webp",
} as const;

export const DIARY_DRINK_TAPE_ASSETS = {
  white: "/assets/diary/tape/masking.webp",
  brown: "/assets/diary/tape/masking-brown.webp?v=2",
} as const;

export const FONT_ASSETS = {
  cineCaption: "/assets/fonts/cinecaption226.ttf",
} as const;
