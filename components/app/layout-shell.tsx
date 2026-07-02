"use client";

import {
  APP_PORTAL_ROOT_ID,
  APP_SHELL_ID,
} from "@/lib/layout/app-portal";
import {
  isLayoutAppShellEnabled,
  readLayoutFeatureFlagsServer,
} from "@/lib/layout/layout-feature-flags";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

type LayoutShellProps = {
  children: ReactNode;
  serverAppShellEnabled: boolean;
};

function subscribeLayoutFlags(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const refresh = () => {
    onStoreChange();
  };

  window.addEventListener("storage", refresh);
  window.addEventListener("popstate", refresh);
  window.addEventListener("barten-layout-flags-change", refresh);

  return () => {
    window.removeEventListener("storage", refresh);
    window.removeEventListener("popstate", refresh);
    window.removeEventListener("barten-layout-flags-change", refresh);
  };
}

function getClientAppShellEnabled(): boolean {
  return isLayoutAppShellEnabled();
}

function getServerAppShellSnapshot(serverEnabled: boolean): boolean {
  return serverEnabled;
}

/** app-shell / portal-root — OFF 時は children を body 直下相当で描画 */
export function LayoutShell({
  children,
  serverAppShellEnabled,
}: LayoutShellProps) {
  const appShellEnabled = useSyncExternalStore(
    subscribeLayoutFlags,
    getClientAppShellEnabled,
    () => getServerAppShellSnapshot(serverAppShellEnabled),
  );

  if (!appShellEnabled) {
    return <>{children}</>;
  }

  return (
    <div id={APP_SHELL_ID} className="app-shell" suppressHydrationWarning>
      {children}
      <div
        id={APP_PORTAL_ROOT_ID}
        className="app-portal-root"
        aria-hidden
      />
    </div>
  );
}

export function readServerLayoutShellEnabled(): boolean {
  return readLayoutFeatureFlagsServer().appShell;
}
