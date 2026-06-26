"use client";

import type { ReactNode } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import styles from "@/components/settings/app-settings-menu.module.css";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserDiaryCount } from "@/hooks/use-user-diary-count";
import {
  SETTINGS_MENU_PROFILE_GUEST_TUNING,
  SETTINGS_MENU_PROFILE_LOGIN_TUNING,
} from "@/lib/settings/app-settings-menu-tuning";
import { useState } from "react";

const GUEST_AVATAR_SRC = "/guest.webp";

function ProfileAvatar({
  avatarUrl,
  isGuest,
}: {
  avatarUrl: string | null;
  isGuest: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    !isGuest && avatarUrl && !failed ? avatarUrl : GUEST_AVATAR_SRC;

  return (
    <img
      src={src}
      alt=""
      className={styles.profileAvatarImage}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function ProfileCardShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.profileCard} role="group" aria-label="アカウント">
      {children}
    </div>
  );
}

function ProfileMemoRecords({ count }: { count: number | null }) {
  const label = count === null ? "… Memories" : `${count} Memories`;

  return (
    <p className={styles.profileMemoRecords} aria-live="polite">
      {label}
    </p>
  );
}

export function SettingsProfileHeader() {
  const { user, isLoggedIn, isLoading } = useAuthUser();
  const diaryCount = useUserDiaryCount(isLoggedIn && !isLoading);

  if (isLoading) {
    return (
      <div className={styles.profileHeaderWrap} aria-hidden>
        <ProfileCardShell>
          <div className={styles.profileCardStack}>
            <div className={styles.profileAvatarShell} />
            <div className={styles.profileCardBody}>
              <p className={styles.profileName}>…</p>
              <div className={styles.profileDetailsSlot} />
            </div>
          </div>
        </ProfileCardShell>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className={styles.profileHeaderWrap} data-guest="true">
        <ProfileCardShell>
          <div className={styles.profileCardStack}>
            <div className={styles.profileAvatarShell}>
              <ProfileAvatar avatarUrl={null} isGuest />
            </div>
            <div className={styles.profileCardBody}>
              <p className={styles.profileName}>ゲスト</p>
              <div className={styles.profileDetailsSlot}>
                <p className={styles.profileHint}>
                  ログインすると記録を保存できます
                </p>
                <GoogleSignInButton
                  next="/diaries"
                  label="Googleでログイン"
                  googleIconPosition={
                    SETTINGS_MENU_PROFILE_LOGIN_TUNING.googleIconPosition
                  }
                  googleIconSizePx={
                    SETTINGS_MENU_PROFILE_GUEST_TUNING.googleIconSizePx
                  }
                  className={styles.profileGoogleWrap}
                  buttonClassName={styles.profileGoogleButton}
                />
              </div>
            </div>
          </div>
        </ProfileCardShell>
      </div>
    );
  }

  const displayName = user.name || user.email || "ユーザー";

  return (
    <div className={styles.profileHeaderWrap} data-guest="false">
      <ProfileCardShell>
        <div className={styles.profileCardStack}>
          <div className={styles.profileAvatarShell}>
            <ProfileAvatar avatarUrl={user.avatarUrl} isGuest={false} />
          </div>
          <div className={styles.profileCardBody}>
            <p className={styles.profileName}>{displayName}</p>
            <div className={styles.profileDetailsSlot}>
              {user.email ? (
                <p className={styles.profileEmail}>{user.email}</p>
              ) : null}
              <ProfileMemoRecords count={diaryCount} />
            </div>
          </div>
        </div>
      </ProfileCardShell>
    </div>
  );
}
