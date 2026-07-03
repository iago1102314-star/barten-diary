"use client";

import styles from "@/components/diary-paper/diary-paper-guest-login-prompt.module.css";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { GUEST_DIARY_PREVIEW_TUNING as T } from "@/lib/memories/guest-diary-preview-tuning";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

type DiaryPaperGuestLoginPromptProps = {
  loginNext?: string;
};

/** ゲスト日記 — フェード直後のログイン導線 */
export function DiaryPaperGuestLoginPrompt({
  loginNext,
}: DiaryPaperGuestLoginPromptProps) {
  const pathname = usePathname();
  const hintStyle = {
    fontSize: `${T.hintFontSizePx}px`,
    lineHeight: T.hintLineHeight,
    letterSpacing: `${T.hintLetterSpacingEm}em`,
    color: T.hintColor,
    opacity: T.hintOpacity,
  } as CSSProperties;

  const dividerStyle = {
    width: `${T.dividerWidthRem}rem`,
    opacity: T.dividerOpacity,
    marginBottom: `${T.dividerMarginBottomRem}rem`,
  } as CSSProperties;

  const loginButtonStyle = {
    "--guest-login-btn-height": `${T.loginButtonHeightPx}px`,
    "--guest-login-btn-bg-opacity": T.loginButtonBgOpacity,
    "--guest-login-btn-border-opacity": T.loginButtonBorderOpacity,
    "--guest-login-btn-text-opacity": T.loginButtonTextOpacity,
    "--guest-login-btn-shadow-opacity": T.loginButtonShadowOpacity,
    paddingTop: `${T.loginButtonGapRem}rem`,
  } as CSSProperties;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.divider}
        style={dividerStyle}
        aria-hidden
      />
      <p className={`${styles.hint} font-serif-jp`} style={hintStyle}>
        ログインすると続きを読めます。
      </p>
      <div className={styles.login} style={loginButtonStyle}>
        <GoogleSignInButton
          next={loginNext ?? pathname}
          label="Googleでログイン"
          googleIconPosition="right"
          className="w-full max-w-none"
          buttonClassName={styles.paperLoginButton}
        />
      </div>
    </div>
  );
}
