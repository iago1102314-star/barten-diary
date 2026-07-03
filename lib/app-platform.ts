export const APP_PLATFORMS = ["PWA", "Browser"] as const;

export type AppPlatform = (typeof APP_PLATFORMS)[number];

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

/** display-mode: standalone または iOS navigator.standalone */
export function detectAppPlatform(): AppPlatform {
  if (typeof window === "undefined") {
    return "Browser";
  }

  const displayModeStandalone = window
    .matchMedia("(display-mode: standalone)")
    .matches;
  const iosStandalone = Boolean(
    (window.navigator as NavigatorWithStandalone).standalone,
  );

  return displayModeStandalone || iosStandalone ? "PWA" : "Browser";
}

export function isAppPlatform(value: string): value is AppPlatform {
  return (APP_PLATFORMS as readonly string[]).includes(value);
}
