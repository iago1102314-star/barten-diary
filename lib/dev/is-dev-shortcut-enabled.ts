/**
 * DEV 専用ショートカットの表示可否。
 * production build では NODE_ENV が production のため常に false。
 */
export function isDevShortcutEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_SHORTCUT === "true"
  );
}
