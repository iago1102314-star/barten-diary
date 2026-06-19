import { APP_ENV } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API の有効化。
 * production のみ OFF — local / dev / 未設定は ON。
 */
export function isRecordingDiagnosticEnabled(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
  return env !== "production";
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
