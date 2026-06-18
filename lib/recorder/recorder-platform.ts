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

/**
 * WebKit は timeslice < 1s で空 Blob を出しやすい。
 * Apple では timeslice なし start() にする。
 */
export function getRecorderTimesliceMs(): number | undefined {
  return isAppleMediaRecorder() ? undefined : 250;
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
