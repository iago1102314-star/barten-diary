"use client";

import type { CSSProperties } from "react";
import {
  signInWithGoogleAction,
  type SignInWithGoogleState,
} from "@/app/login/actions";
import { LoginIcon } from "@/components/ui/login-icon";
import { useAuthUser } from "@/hooks/use-auth-user";
import { HOME_AUTH_BUTTON_TUNING } from "@/lib/entrance/home-entry-tuning";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type HomeAuthButtonProps = {
  disabled?: boolean;
};

const T = HOME_AUTH_BUTTON_TUNING;
const initialState: SignInWithGoogleState = { error: null };

/** ホーム右上 — 未ログイン時のみ Google ログイン */
export function HomeAuthButton({ disabled = false }: HomeAuthButtonProps) {
  const { isLoggedIn, isLoading } = useAuthUser();
  const [state, formAction] = useActionState(
    signInWithGoogleAction,
    initialState,
  );

  if (isLoading || isLoggedIn) return null;

  return (
    <div className="relative">
      <form action={formAction}>
        <input type="hidden" name="next" value="/diaries" />
        <HomeAuthSubmitButton disabled={disabled} />
      </form>
      {state.error ? (
        <p
          role="alert"
          className="absolute right-0 top-[calc(100%+0.35rem)] max-w-[14rem] whitespace-pre-wrap text-right text-[10px] leading-relaxed text-red-300/80"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function HomeAuthSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-label="ログイン"
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
          letterSpacing: `${T.loginLetterSpacingEm}em`,
        }}
      >
        <span className="whitespace-nowrap leading-none">
          {pending ? "…" : "ログイン"}
        </span>
        <LoginIcon className="shrink-0 opacity-90" sizePx={T.iconSizePx} />
      </span>
    </button>
  );
}
