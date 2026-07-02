"use client";

import {
  APP_PORTAL_ROOT_ID,
  APP_SHELL_ID,
} from "@/lib/layout/app-portal";
import {
  isLayoutAppShellEnabled,
  isLayoutPortalRootEnabled,
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
  window.addEventListener("barten-perf-flags-change", refresh);

  return () => {
    window.removeEventListener("storage", refresh);
    window.removeEventListener("popstate", refresh);
    window.removeEventListener("barten-layout-flags-change", refresh);
    window.removeEventListener("barten-perf-flags-change", refresh);
  };
}

function getClientAppShellEnabled(): boolean {
  return isLayoutAppShellEnabled();
}

function getServerAppShellSnapshot(serverEnabled: boolean): boolean {
  return serverEnabled;
}

function getClientPortalRootEnabled(): boolean {
  return isLayoutPortalRootEnabled();
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

  const portalRootEnabled = useSyncExternalStore(
    subscribeLayoutFlags,
    getClientPortalRootEnabled,
    () => true,
  );

  if (!appShellEnabled) {
    return <>{children}</>;
  }

  return (
    <div id={APP_SHELL_ID} className="app-shell" suppressHydrationWarning>
      {children}
      {portalRootEnabled ? (
        <div
          id={APP_PORTAL_ROOT_ID}
          className="app-portal-root"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
