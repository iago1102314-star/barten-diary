import {
  logMicStreamDiagnostic,
  logMicStreamState,
} from "@/lib/recorder/mic-stream-diagnostic";

/** iOS / iPadOS — モバイル WebKit */
export function isAppleMediaRecorder(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Safari（iOS + PC）— MediaRecorder の timeslice / finalize / requestData */
function isSafariUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  return (
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(ua)
  );
}

export function isSafariMediaRecorder(): boolean {
  return isAppleMediaRecorder() || isSafariUserAgent();
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
 * 録音中の timeslice。Safari（iOS / PC）は >= 1s、Chrome 等は 250ms。
 */
export function getRecorderTimesliceMs(): number {
  return isSafariMediaRecorder()
    ? APPLE_RECORDER_TIMESLICE_MS
    : DEFAULT_RECORDER_TIMESLICE_MS;
}

/** stop 後 Blob 組み立てまでの待ち */
export function getRecorderFinalizeDelayMs(): number {
  return isSafariMediaRecorder() ? APPLE_RECORDER_FINALIZE_DELAY_MS : 0;
}

export function resolveRecordedMimeType(
  recorderMimeType: string,
  fallbackMimeType: string | undefined,
): string {
  if (recorderMimeType) return recorderMimeType;
  if (fallbackMimeType) return fallbackMimeType;
  return isAppleMediaRecorder() ? "audio/mp4" : "audio/webm";
}

export const MIN_RECORDING_BYTES = 2048;

/** 正常な音声なら概ね 2KB/s 以上（46s で ~34KB は無音に近い）— WebM/Opus 向け */
export const MIN_RECORDING_BYTES_PER_SEC = 2000;

/** Safari MediaRecorder の AAC/mp4 — bytes/sec では音量を判定できない */
export function isSafariAudioMp4(mimeType: string): boolean {
  if (!/audio\/(mp4|x-m4a)/i.test(mimeType)) return false;
  return isSafariUserAgent() || isAppleMediaRecorder();
}

export function isRecordingLikelyTooQuiet(
  blobSize: number,
  durationSec: number,
  mimeType?: string,
): boolean {
  if (durationSec <= 0) return true;
  if (mimeType && isSafariAudioMp4(mimeType)) return false;
  return blobSize / durationSec < MIN_RECORDING_BYTES_PER_SEC;
}

/** WebKit — 前回の MediaStream 解放後に getUserMedia する待ち（ms） */
export const MIC_RELEASE_DELAY_MS = 300;

export async function waitForMicRelease(): Promise<void> {
  if (!isAppleMediaRecorder()) return;
  await new Promise((resolve) => setTimeout(resolve, MIC_RELEASE_DELAY_MS));
}

function isMicReleaseRetryError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "NotReadableError" ||
    error.name === "AbortError" ||
    error.name === "TrackStartError"
  );
}

async function requestMicStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia not supported");
  }

  const withProcessing: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };

  try {
    logMicStreamDiagnostic("getUserMedia: requesting", {
      constraints: withProcessing,
    });
    const stream = await navigator.mediaDevices.getUserMedia(withProcessing);
    logMicStreamState("getUserMedia: acquired (with processing)", stream, null, {
      constraintsUsed: withProcessing,
    });
    return stream;
  } catch (error) {
    if (error instanceof DOMException && error.name === "OverconstrainedError") {
      const fallbackConstraints: MediaStreamConstraints = { audio: true };
      logMicStreamDiagnostic("getUserMedia: OverconstrainedError, retry plain audio", {
        firstError: error.message,
        fallbackConstraints,
      });
      const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      logMicStreamState("getUserMedia: acquired (plain audio fallback)", stream, null, {
        constraintsUsed: fallbackConstraints,
      });
      return stream;
    }
    throw error;
  }
}

/**
 * ユーザー操作の直後に getUserMedia する。WebKit では先に待つと gesture が切れて失敗しやすい。
 * デバイス解放待ちが必要な場合のみ、失敗後に 1 回だけリトライする。
 */
export async function acquireMicStream(): Promise<MediaStream> {
  try {
    return await requestMicStream();
  } catch (firstError) {
    if (!isAppleMediaRecorder() || !isMicReleaseRetryError(firstError)) {
      throw firstError;
    }

    await waitForMicRelease();
    return await requestMicStream();
  }
}

export function formatRecorderStartError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "NotAllowedError: マイクの使用が許可されていません。ブラウザの設定を確認してください。";
    }
    if (error.name === "NotFoundError") {
      return "NotFoundError: マイクが見つかりません。";
    }
    return `${error.name}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
