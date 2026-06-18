import { isProd } from "@/lib/env/app-env";

/**
 * DEV 専用ショートカットの表示可否。
 * production 環境（APP_ENV=production）では常に false。
 */
export function isDevShortcutEnabled(): boolean {
  return (
    !isProd &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_SHORTCUT === "true"
  );
}
