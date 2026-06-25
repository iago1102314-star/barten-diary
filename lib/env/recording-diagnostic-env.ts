import { APP_ENV, isNonProd, isProd } from "@/lib/env/app-env";

/**
 * 録音パイプライン診断 UI / debug API / 診断データ収集。
 *
 * - production: デフォルト OFF（明示的 true のみ ON）
 * - local / dev: デフォルト ON（明示的 false で OFF）
 */
export function isRecordingDiagnosticEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_RECORDING_DIAGNOSTIC;

  if (isProd) {
    return flag === "true";
  }

  if (flag === "false") {
    return false;
  }

  return isNonProd;
}

export function recordingDiagnosticEnvLabel(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? APP_ENV;
}
