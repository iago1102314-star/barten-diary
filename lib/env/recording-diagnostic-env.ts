import { APP_ENV } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API / 診断データ収集。
 *
 * - デフォルト OFF
 * - 明示的に ON: NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true
 */
export function isRecordingDiagnosticEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RECORDING_DIAGNOSTIC === "true";
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
