import { isNonProd } from "@/lib/env/app-env";

/** local / Vercel dev のみ — production PWA 実機計測を汚さない */
export function logLoadingGate(message: string, detail?: Record<string, unknown>) {
  if (!isNonProd) return;

  if (detail) {
    console.info(`[LoadingGate] ${message}`, detail);
    return;
  }

  console.info(`[LoadingGate] ${message}`);
}
