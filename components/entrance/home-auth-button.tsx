"use client";

import type { CSSProperties } from "react";
import { LoginIcon } from "@/components/ui/login-icon";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  HOME_AUTH_BUTTON_TUNING,
} from "@/lib/entrance/home-entry-tuning";

type HomeAuthButtonProps = {
  disabled?: boolean;
  /** 将来の認証フロー用。未指定なら no-op */
  onClick?: () => void;
};

const T = HOME_AUTH_BUTTON_TUNING;

/** ホーム右上 — ログイン / ログアウト（現状プレースホルダー） */
export function HomeAuthButton({
  disabled = false,
  onClick,
}: HomeAuthButtonProps) {
  const { isLoggedIn, isLoading } = useAuthUser();
  const label = isLoggedIn ? "ログアウト" : "ログイン";
  const letterSpacingEm = isLoggedIn
    ? T.logoutLetterSpacingEm
    : T.loginLetterSpacingEm;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={label}
      className="group relative z-10 touch-manipulation font-serif-jp text-stone-300/88 transition-colors duration-350 hover:text-amber-50/95 disabled:cursor-not-allowed disabled:opacity-40"
      style={
        {
          "--home-auth-border": T.borderColor,
          "--home-auth-border-hover": T.borderColorHover,
        } as CSSProperties
      }
    >
      <span
        className="pointer-events-none inline-flex items-center border border-solid border-[color:var(--home-auth-border)] bg-transparent transition-[color,border-color] duration-350 group-hover:border-[color:var(--home-auth-border-hover)] group-hover:text-amber-50/95"
        style={{
          borderRadius: T.borderRadiusPx,
          borderWidth: T.borderWidthPx,
          padding: `${T.paddingYRem}rem ${T.paddingXRem}rem`,
          gap: `${T.iconGapRem}rem`,
          fontSize: T.fontSizePx,
          letterSpacing: `${letterSpacingEm}em`,
        }}
      >
        <span className="whitespace-nowrap leading-none">{label}</span>
        <LoginIcon className="shrink-0 opacity-90" sizePx={T.iconSizePx} />
      </span>
    </button>
  );
}
