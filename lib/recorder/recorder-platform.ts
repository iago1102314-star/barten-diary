/** iOS / iPadOS Safari — MediaRecorder の挙動が Chrome と異なる */
export function isAppleMediaRecorder(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

const MIME_CANDIDATES_APPLE = [
  "audio/mp4",
  "audio/mp4;codecs=mp4a",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

const MIME_CANDIDATES_DEFAULT = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

export function getSupportedRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidates = isAppleMediaRecorder()
    ? MIME_CANDIDATES_APPLE
    : MIME_CANDIDATES_DEFAULT;

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/** WebKit — timeslice < 1s で空 chunk を出しやすい */
export const APPLE_RECORDER_TIMESLICE_MS = 1000;

/** Chrome 等 — 短い間隔で chunk を溜める */
export const DEFAULT_RECORDER_TIMESLICE_MS = 250;

/** WebKit — stop 後の final dataavailable を待つ（ms） */
export const APPLE_RECORDER_FINALIZE_DELAY_MS = 300;

/**
 * 録音中の timeslice。Apple は >= 1s、それ以外は 250ms。
 */
export function getRecorderTimesliceMs(): number {
  return isAppleMediaRecorder()
    ? APPLE_RECORDER_TIMESLICE_MS
    : DEFAULT_RECORDER_TIMESLICE_MS;
}

/** stop 後 Blob 組み立てまでの待ち */
export function getRecorderFinalizeDelayMs(): number {
  return isAppleMediaRecorder() ? APPLE_RECORDER_FINALIZE_DELAY_MS : 0;
}

export function resolveRecordedMimeType(
  recorderMimeType: string,
  fallbackMimeType: string | undefined,
): string {
  if (recorderMimeType) return recorderMimeType;
  if (fallbackMimeType) return fallbackMimeType;
  return isAppleMediaRecorder() ? "audio/mp4" : "audio/webm";
}

/** コンテナだけで中身が無い mp4 等を弾く目安（バイト） */
export const MIN_RECORDING_BYTES = 2048;

/** WebKit — 前回の MediaStream 解放後に getUserMedia する待ち（ms） */
export const MIC_RELEASE_DELAY_MS = 300;

export async function waitForMicRelease(): Promise<void> {
  if (!isAppleMediaRecorder()) return;
  await new Promise((resolve) => setTimeout(resolve, MIC_RELEASE_DELAY_MS));
}
