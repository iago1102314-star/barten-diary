"use client";

import type { CSSProperties } from "react";
import { ShebronIcon } from "@/components/ui/shebron-icon";
import { HOME_ENTRY_BUTTON_TUNING } from "@/lib/entrance/home-entry-tuning";

type HomeEntryButtonProps = {
  children: string;
  onClick?: () => void;
  onPointerDown?: () => void;
  disabled?: boolean;
};

const T = HOME_ENTRY_BUTTON_TUNING;

/** ホーム — ガラス枠 + 右向きシェブロン */
export function HomeEntryButton({
  children,
  onClick,
  onPointerDown,
  disabled = false,
}: HomeEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className="group relative z-10 w-full touch-manipulation font-serif-jp text-stone-300/85 transition-colors duration-350 hover:text-amber-50/95 disabled:cursor-not-allowed disabled:opacity-40"
      style={
        {
          "--home-btn-border": T.borderColor,
          "--home-btn-border-hover": T.borderColorHover,
        } as CSSProperties
      }
    >
      <span
        className={`pointer-events-none flex w-full items-center border border-solid border-[color:var(--home-btn-border)] transition-[color,border-color] duration-350 group-hover:border-[color:var(--home-btn-border-hover)] group-hover:text-amber-50/95 ${T.backdropBlurClass}`}
        style={{
          borderRadius: T.borderRadiusPx,
          borderWidth: T.borderWidthPx,
          padding: `${T.paddingYRem}rem ${T.paddingXRem}rem`,
          backgroundColor: `rgba(12, 10, 8, ${T.fillOpacity})`,
          fontSize: T.fontSizePx,
          letterSpacing: `var(--font-serif-jp-tracking)`,
        }}
      >
        <span className="min-w-0 flex-1 text-center">{children}</span>
        <span
          className="flex shrink-0 items-center justify-end"
          style={{
            width: T.iconSlotPx,
            transform: `translateX(${T.iconExtraRightRem}rem)`,
          }}
          aria-hidden
        >
          <ShebronIcon
            className="rotate-180 opacity-90"
            sizePx={T.iconSizePx}
          />
        </span>
      </span>
    </button>
  );
}
