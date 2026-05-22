import { getDrinkImagePathByName } from "@/lib/entrance/drink-image-path";
import Image from "next/image";

type DrinkIllustrationProps = {
  drinkName: string;
};

/**
 * 棚・記録カード用 — 銘柄画像があれば表示、なければプレースホルダー
 */
export function DrinkIllustration({ drinkName }: DrinkIllustrationProps) {
  const src = getDrinkImagePathByName(drinkName);

  if (src) {
    return (
      <div
        className="relative h-24 w-16 overflow-hidden rounded-sm"
        aria-hidden
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="64px"
          className="object-cover object-bottom"
          draggable={false}
          unoptimized
        />
      </div>
    );
  }

  const initial = drinkName.trim().charAt(0).toUpperCase() || "·";

  return (
    <div
      className="relative flex h-20 w-14 items-end justify-center"
      aria-hidden
    >
      <div className="absolute bottom-0 h-16 w-10 rounded-t-sm border border-stone-700/50 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-800/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />
      <div className="absolute bottom-14 h-3 w-4 rounded-sm border border-stone-700/40 bg-stone-800/60" />
      <span className="relative z-10 pb-1 font-mono text-[10px] tracking-widest text-stone-600/70">
        {initial}
      </span>
    </div>
  );
}
