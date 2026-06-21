import { APP_ENV, isProd } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API / 診断データ収集。
 *
 * - local / dev ではデフォルト ON（local の npm run dev と Vercel dev を揃える）
 * - 明示的に OFF にする: NEXT_PUBLIC_RECORDING_DIAGNOSTIC=false
 * - 本番でも ON にする: NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true
 */
export function isRecordingDiagnosticEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_RECORDING_DIAGNOSTIC;

  if (flag === "false") return false;
  if (flag === "true") return true;

  return !isProd;
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
