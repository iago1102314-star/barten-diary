import { APP_ENV, isNonProd } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API / 診断データ収集。
 * 明示的に `NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true` のときだけ ON。
 */
export function isRecordingDiagnosticEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RECORDING_DIAGNOSTIC === "true";
}

/**
 * 録音パイプラインの console.info を出すか。
 * 本番の実機計測を汚さないため、非 production か診断 ON のときだけ出力する。
 * console.error は本番でも常に出す（logRecordingPipelineError 側）。
 */
export function isRecordingConsoleLogEnabled(): boolean {
  return isNonProd || isRecordingDiagnosticEnabled();
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
