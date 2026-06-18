/**
 * アプリ実行環境の判別。
 *
 * NEXT_PUBLIC_APP_ENV で3段階を区別する:
 *   local       → Mac で npm run dev（LAN 実機テスト含む）
 *   dev         → Vercel Dev プロジェクト（HTTPS・本番に近い実機確認）
 *   production  → Vercel 本番（公開用）
 *
 * サーバー・クライアント両方で使用可。
 */
export type AppEnv = "local" | "dev" | "production";

export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined) ?? "local";

/** Mac での npm run dev（LAN 実機アクセス含む） */
export const isLocal = APP_ENV === "local";

/** Vercel Dev プロジェクト */
export const isDev = APP_ENV === "dev";

/** Vercel 本番 */
export const isProd = APP_ENV === "production";

/** 本番以外（local + dev）— デバッグ機能・ショートカットの出し分けに使う */
export const isNonProd = !isProd;
