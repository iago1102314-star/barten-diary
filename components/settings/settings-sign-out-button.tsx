"use client";

import { LoginIcon } from "@/components/ui/login-icon";
import { showClientSignOutOverlay } from "@/lib/auth/client-sign-out-overlay";
import { performClientSignOut } from "@/lib/auth/perform-client-sign-out";
import { SETTINGS_MENU_LOGOUT_TUNING } from "@/lib/settings/app-settings-menu-tuning";
import { useState } from "react";

type SettingsSignOutButtonProps = {
  className?: string;
  iconClassName?: string;
};

export function SettingsSignOutButton({
  className = "",
  iconClassName = "",
}: SettingsSignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    showClientSignOutOverlay();

    try {
      await performClientSignOut();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className={className}
    >
      <span className={iconClassName}>
        <LoginIcon sizePx={SETTINGS_MENU_LOGOUT_TUNING.iconSizePx} />
      </span>
      {loading ? "…" : "ログアウト"}
    </button>
  );
}
