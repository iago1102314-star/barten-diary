import { isRecordingDiagnosticEnabled } from "@/lib/env/recording-diagnostic-env";
import { bumpRecordingPipelineDiagnostic } from "@/lib/recorder/recording-pipeline-diagnostic";
import { logRecordingPipeline } from "@/lib/recorder/recording-pipeline-log";

export const DEBUG_RECORDING_FILENAME = "safari-recording.m4a";

export type DebugRecordingBlobEntry = {
  blob: Blob;
  mimeType: string;
  capturedAt: number;
};

declare global {
  interface Window {
    __DEBUG_RECORDING_BLOB__?: DebugRecordingBlobEntry;
    __downloadLastRecordingDebug__?: () => boolean;
  }
}

let lastDebugBlob: DebugRecordingBlobEntry | null = null;

export function getDebugRecordingBlob(): DebugRecordingBlobEntry | null {
  if (typeof window !== "undefined" && window.__DEBUG_RECORDING_BLOB__) {
    return window.__DEBUG_RECORDING_BLOB__;
  }
  return lastDebugBlob;
}

export function formatFfprobeInspectCommands(
  filePath = `~/Downloads/${DEBUG_RECORDING_FILENAME}`,
): string[] {
  return [
    `ffprobe -hide_banner -show_streams -show_format "${filePath}"`,
    `ffmpeg -hide_banner -i "${filePath}" -af volumedetect -f null -`,
  ];
}

export function logFfprobeInspectHints(
  filePath = `~/Downloads/${DEBUG_RECORDING_FILENAME}`,
): void {
  const commands = formatFfprobeInspectCommands(filePath);
  console.info("[RecordingDebug] ダウンロード後に Mac で再生し、次で解析してください:", {
    play: `open "${filePath}"`,
    commands,
  });
  for (const command of commands) {
    console.info(`[RecordingDebug] ${command}`);
  }
  logRecordingPipeline("debug: ffprobe / volumedetect commands", {
    filePath,
    open: `open "${filePath}"`,
    commands,
  });
}

export function logDebugRecordingBlob(
  label: string,
  blob: Blob,
  mimeType: string,
  extra?: Record<string, unknown>,
): void {
  const detail = {
    label,
    blobSize: blob.size,
    blobType: blob.type,
    mimeType,
    blobTypeMatchesMime:
      !blob.type || blob.type === mimeType || blob.type === "",
    ...extra,
  };
  console.info(`[RecordingDebug] ${label}`, detail);
  logRecordingPipeline(`debug: ${label}`, detail);
}

export function downloadDebugRecordingBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = DEBUG_RECORDING_FILENAME;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  logFfprobeInspectHints();
}

/** 録音 Blob 組み立て直後 — 診断 ON 時のみ保持・ログ */
export function captureDebugRecordingBlob(blob: Blob, mimeType: string): void {
  if (!isRecordingDiagnosticEnabled()) return;

  const entry: DebugRecordingBlobEntry = {
    blob,
    mimeType,
    capturedAt: Date.now(),
  };
  lastDebugBlob = entry;

  if (typeof window !== "undefined") {
    window.__DEBUG_RECORDING_BLOB__ = entry;
    window.__downloadLastRecordingDebug__ = () => {
      const current = getDebugRecordingBlob();
      if (!current) {
        console.warn("[RecordingDebug] 保存済み Blob がありません");
        return false;
      }
      downloadDebugRecordingBlob(current.blob);
      return true;
    };
  }

  logDebugRecordingBlob("recorder blob captured", blob, mimeType, {
    downloadFileName: DEBUG_RECORDING_FILENAME,
    consoleDownload: "__downloadLastRecordingDebug__()",
  });
  bumpRecordingPipelineDiagnostic();
}
