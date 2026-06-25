import { Shippori_Mincho, Zen_Old_Mincho } from "next/font/google";

/** 画面タイトル — Zen Old Mincho Bold */
export const zenOldMinchoBold = Zen_Old_Mincho({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-old-mincho-bold",
  adjustFontFallback: true,
});

/** マスター台詞・記録本文など — Shippori Mincho */
export const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori-mincho",
  adjustFontFallback: true,
});
