import {
  micBlockReasonFromPipelineError,
  micBlockedMasterLines,
} from "@/lib/recorder/mic-availability";

export function listenFailureMasterLines(count: number): string[] {
  if (count >= 2) {
    return ["……今日は言葉がまとまらない夜みたいだな。"];
  }

  return [
    "……悪い。",
    "少し聞き取りづらかった。",
    "もう少しだけ聞かせてくれないか。",
  ];
}

export function canLeaveWithoutRecord(count: number): boolean {
  return count >= 2;
}

/** 失敗理由に応じたマスター台詞（マイク不可 ≠ 聞き取りづらかった） */
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

  return listenFailureMasterLines(Math.max(count, 1));
}

export function shouldOfferRetryAfterListenFailure(
  reason: string | null | undefined,
): boolean {
  return micBlockReasonFromPipelineError(reason) !== "insecure_context";
}
