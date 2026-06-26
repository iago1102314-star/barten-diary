"use client";

import { AppSettingsMenu } from "@/components/settings/app-settings-menu";
import { useBarAudio } from "@/hooks/use-bar-audio";
import { useGuestDiaryDraftsFlush } from "@/hooks/use-guest-diary-drafts-flush";
import { SettingsMenuBackdropProvider } from "@/lib/settings/settings-menu-backdrop-context";
import { SettingsMenuVisibilityProvider } from "@/lib/settings/settings-menu-visibility";

function GuestDiaryDraftsFlush() {
  useGuestDiaryDraftsFlush();
  return null;
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  useBarAudio();

  return (
    <SettingsMenuVisibilityProvider>
      <SettingsMenuBackdropProvider>
        <GuestDiaryDraftsFlush />
        {children}
        <AppSettingsMenu />
      </SettingsMenuBackdropProvider>
    </SettingsMenuVisibilityProvider>
  );
}
