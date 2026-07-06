import {
  isRecordingLikelyTooQuiet,
  MIN_RECORDING_BYTES,
} from "@/lib/recorder/recorder-platform";
import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";

const MAX_TRANSCRIBE_BYTES = 25 * 1024 * 1024;
export const MIN_RECORDING_MS = 2000;

export type RecordingCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * 録音終了直後のローカルチェックのみ（Whisper は呼ばない）。
 * 録音品質エラーの判定に使う。
 */
export function validateRecordingForTranscribe(params: {
  blob: Blob;
  mimeType: string;
  elapsedMs: number;
}): RecordingCheckResult {
  const { blob, mimeType, elapsedMs } = params;

  if (!blob || blob.size === 0) {
    return { ok: false, reason: "recording check: empty blob" };
  }

  if (elapsedMs < MIN_RECORDING_MS) {
    return {
      ok: false,
      reason: `recording check: too short (${elapsedMs}ms < ${MIN_RECORDING_MS}ms)`,
    };
  }

  if (blob.size < MIN_RECORDING_BYTES) {
    return {
      ok: false,
      reason: `recording check: blob below minimum (${blob.size} < ${MIN_RECORDING_BYTES})`,
    };
  }

  if (blob.size > MAX_TRANSCRIBE_BYTES) {
    return {
      ok: false,
      reason: `recording check: blob too large (${blob.size} bytes)`,
    };
  }

  const durationSec = Math.max(1, Math.round(elapsedMs / 1000));
  if (isRecordingLikelyTooQuiet(blob.size, durationSec, mimeType || blob.type)) {
    return {
      ok: false,
      reason: `recording check: too quiet (${blob.size} bytes / ${durationSec}s)`,
    };
  }

  const extension = getAudioExtension(mimeType || blob.type);
  if (!extension) {
    return {
      ok: false,
      reason: `recording check: unsupported mime (${mimeType || blob.type})`,
    };
  }

  return { ok: true };
}

export function isRecordingQualityFailureReason(
  reason: string | null | undefined,
): boolean {
  return reason?.startsWith("recording check:") ?? false;
}
