import { APP_ENV } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API / 診断データ収集。
 *
 * - local dev（npm run dev）ではデフォルト ON
 * - 明示的に OFF にする: NEXT_PUBLIC_RECORDING_DIAGNOSTIC=false
 * - 本番でも ON にする: NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true
 */
export function isRecordingDiagnosticEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_RECORDING_DIAGNOSTIC;

  if (flag === "false") return false;
  if (flag === "true") return true;

  return process.env.NODE_ENV === "development";
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
