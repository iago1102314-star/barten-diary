import { APP_ENV, isProd } from "@/lib/env/app-env";

/** dev / local のみ — production では常に false */
export function isRecordingDiagnosticEnabled(): boolean {
  return !isProd;
}

export function recordingDiagnosticEnvLabel(): string {
  return APP_ENV;
}
