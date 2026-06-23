import { Parisienne, Zen_Kurenaido } from "next/font/google";
import localFont from "next/font/local";

export const zenKurenaido = Zen_Kurenaido({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["cursive", "serif"],
});

export const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** @deprecated `parisienne` を使う */
export const parisienneMaster = parisienne;

/** しねきゃぷしょん — 映画字幕風（マスター声などで使用） */
export const cineCaption = localFont({
  src: "../../public/assets/fonts/cinecaption226.ttf",
  display: "swap",
  fallback: ["Hiragino Sans", "Yu Gothic", "sans-serif"],
});
