"use client";

import {
  signInWithGoogleAction,
  type SignInWithGoogleState,
} from "@/app/login/actions";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import {
  dismissGuestShelfInfo,
  isGuestShelfInfoDismissed,
} from "@/lib/memories/guest-shelf-info-dismiss";
import { GUEST_SHELF_INFO_TUNING } from "@/lib/memories/guest-shelf-info-tuning";
import { usePathname } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

type GuestShelfInfoBarProps = {
  visible: boolean;
};

const initialSignInState: SignInWithGoogleState = { error: null };

function GuestShelfLoginSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.guestShelfInfoLoginButton}
      disabled={pending}
    >
      {pending ? "…" : "ログイン"}
    </button>
  );
}

export function GuestShelfInfoBar({ visible }: GuestShelfInfoBarProps) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(() => isGuestShelfInfoDismissed());
  const [signInState, signInAction] = useActionState(
    signInWithGoogleAction,
    initialSignInState,
  );

  const handleDismiss = useCallback(() => {
    dismissGuestShelfInfo();
    setDismissed(true);
  }, []);

  if (!visible || dismissed) {
    return null;
  }

  const tuning = GUEST_SHELF_INFO_TUNING;

  return (
    <div className={styles.guestShelfInfoBar} role="status">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={styles.guestShelfInfoIcon}
        style={{
          width: tuning.iconSizePx,
          height: tuning.iconSizePx,
          color: tuning.iconColor,
        }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div
        className={styles.guestShelfInfoText}
        style={{
          fontSize: tuning.fontSizePx,
          lineHeight: tuning.lineHeight,
          letterSpacing: `${tuning.letterSpacingEm}em`,
          color: tuning.textColor,
        }}
      >
        <p className={styles.guestShelfInfoLine}>一時的にメモを預かっています。</p>
        <div className={styles.guestShelfInfoLine}>
          <form action={signInAction} className={styles.guestShelfInfoLoginForm}>
            <input type="hidden" name="next" value={pathname || "/diaries"} />
            <GuestShelfLoginSubmit />
          </form>
          して記録を保存しませんか？
        </div>
        {signInState.error ? (
          <p className={styles.guestShelfInfoError} role="alert">
            {signInState.error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className={styles.guestShelfInfoClose}
        aria-label="案内を閉じる"
        onClick={handleDismiss}
        style={{
          width: tuning.closeSizePx,
          height: tuning.closeSizePx,
          fontSize: tuning.closeFontSizePx,
        }}
      >
        ×
      </button>
    </div>
  );
}
