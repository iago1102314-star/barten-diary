import {
  isRecordingQualityFailureReason,
} from "@/lib/night/validate-recording-for-transcribe";
import {
  micBlockReasonFromPipelineError,
  micBlockedMasterLines,
} from "@/lib/recorder/mic-availability";

/** 録音品質エラー時のマスター台詞（仕様固定） */
export const RECORDING_QUALITY_MASTER_LINES = [
  "……悪い。",
  "もう少しだけ聞かせてくれないか。",
] as const;

export function listenFailureMasterLines(count: number): string[] {
  if (count >= 2) {
    return ["……今日は言葉がまとまらない夜みたいだな。"];
  }

  return [...RECORDING_QUALITY_MASTER_LINES];
}

export function canLeaveWithoutRecord(count: number): boolean {
  return count >= 2;
}

/** 失敗理由に応じたマスター台詞 */
export function resolveListenFailureLines(
  count: number,
  reason: string | null | undefined,
): string[] {
  const micBlock = micBlockReasonFromPipelineError(reason);
  if (micBlock) {
    return micBlockedMasterLines(micBlock);
  }

  if (reason?.includes("NotAllowedError")) {
    return [
      "……すまない。",
      "マイクの許可が必要だ。",
      "設定から許可してくれ。",
    ];
  }

  if (isRecordingQualityFailureReason(reason)) {
    return [...RECORDING_QUALITY_MASTER_LINES];
  }

  return listenFailureMasterLines(Math.max(count, 1));
}

export function shouldOfferRetryAfterListenFailure(
  reason: string | null | undefined,
): boolean {
  return micBlockReasonFromPipelineError(reason) !== "insecure_context";
}
