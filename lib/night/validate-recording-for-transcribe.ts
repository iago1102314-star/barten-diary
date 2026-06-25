import {
  isRecordingLikelyTooQuiet,
  MIN_RECORDING_BYTES,
} from "@/lib/recorder/recorder-platform";
import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";

const MAX_TRANSCRIBE_BYTES = 25 * 1024 * 1024;

export type RecordingCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * 録音終了直後のローカルチェックのみ（Whisper は呼ばない）。
 * 送信可能な形式・サイズ・長さかを確認する。
 */
export function validateRecordingForTranscribe(params: {
  blob: Blob;
  mimeType: string;
  elapsedMs: number;
}): RecordingCheckResult {
  const { blob, mimeType, elapsedMs } = params;
  const durationSec = Math.max(1, Math.round(elapsedMs / 1000));

  if (!blob || blob.size === 0) {
    return { ok: false, reason: "recording check: empty blob" };
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

  if (isRecordingLikelyTooQuiet(blob.size, durationSec)) {
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
