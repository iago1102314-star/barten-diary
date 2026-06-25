"use client";

import { AppSettingsMenu } from "@/components/settings/app-settings-menu";
import { SettingsMenuVisibilityProvider } from "@/lib/settings/settings-menu-visibility";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <SettingsMenuVisibilityProvider>
      {children}
      <AppSettingsMenu />
    </SettingsMenuVisibilityProvider>
  );
}
