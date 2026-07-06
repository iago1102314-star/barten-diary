"use client";

import {
  DEBUG_RECORDING_FILENAME,
  downloadDebugRecordingBlob,
  formatFfprobeInspectCommands,
  getDebugRecordingBlob,
  logFfprobeInspectHints,
} from "@/lib/recorder/debug-recording-blob";
import {
  formatRecordingPipelineDiagnostic,
  getRecordingPipelineDiagnostic,
  subscribeRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import {
  isRecordingDiagnosticEnabled,
  recordingDiagnosticEnvLabel,
} from "@/lib/env/recording-diagnostic-env";
import { getAppPortalRoot } from "@/lib/layout/app-portal";
import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function RecordingPipelineDiagnosticPanel() {
  const enabled = isRecordingDiagnosticEnabled();
  const snapshot = useSyncExternalStore(
    subscribeRecordingPipelineDiagnostic,
    getRecordingPipelineDiagnostic,
    getRecordingPipelineDiagnostic,
  );
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const logText = formatRecordingPipelineDiagnostic(snapshot);
  const debugBlob = getDebugRecordingBlob();
  const ffprobeCommands = formatFfprobeInspectCommands().join("\n");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [logText]);

  const handleDownloadRecording = useCallback(() => {
    const entry = getDebugRecordingBlob();
    if (!entry) return;
    downloadDebugRecordingBlob(entry.blob);
    logFfprobeInspectHints();
  }, []);

  if (!enabled || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => {
          setCopyState("idle");
          setOpen(true);
        }}
        className="recording-pipeline-diagnostic-trigger"
        aria-label="診断ログを表示"
      >
        診断ログ ({recordingDiagnosticEnvLabel()})
      </button>

      {open ? (
        <div
          className="recording-pipeline-diagnostic-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="録音パイプライン診断ログ"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="recording-pipeline-diagnostic-panel">
            <div className="recording-pipeline-diagnostic-header">
              <p className="recording-pipeline-diagnostic-title">
                録音パイプライン診断（{recordingDiagnosticEnvLabel()}）
              </p>
              <button
                type="button"
                className="recording-pipeline-diagnostic-close"
                onClick={() => setOpen(false)}
              >
                閉じる
              </button>
            </div>

            <textarea
              readOnly
              value={
                typeof window !== "undefined" &&
                window.__RECORDING_PIPELINE_LAST_ERROR__
                  ? `[last error] ${window.__RECORDING_PIPELINE_LAST_ERROR__}\n\n${logText}`
                  : logText
              }
              className="recording-pipeline-diagnostic-textarea"
              aria-label="診断ログ全文"
            />

            <div className="recording-pipeline-diagnostic-actions">
              <button
                type="button"
                className="recording-pipeline-diagnostic-copy"
                disabled={!debugBlob}
                onClick={handleDownloadRecording}
              >
                録音DL ({DEBUG_RECORDING_FILENAME})
              </button>
              <button
                type="button"
                className="recording-pipeline-diagnostic-copy"
                onClick={() => void handleCopy()}
              >
                コピー
              </button>
              {copyState === "copied" ? (
                <span className="recording-pipeline-diagnostic-copy-status">
                  コピーしました
                </span>
              ) : null}
              {copyState === "failed" ? (
                <span className="recording-pipeline-diagnostic-copy-status recording-pipeline-diagnostic-copy-status--error">
                  コピーに失敗しました（長押しで選択してください）
                </span>
              ) : null}
            </div>

            <div className="recording-pipeline-diagnostic-ffprobe">
              <p className="recording-pipeline-diagnostic-ffprobe-title">
                Mac 確認用（DL 後）
              </p>
              {debugBlob ? (
                <p className="recording-pipeline-diagnostic-ffprobe-meta">
                  直近 Blob: {debugBlob.blob.size} bytes / type=
                  {debugBlob.blob.type || "(empty)"} / mime=
                  {debugBlob.mimeType}
                </p>
              ) : (
                <p className="recording-pipeline-diagnostic-ffprobe-meta">
                  録音完了後に DL できます
                </p>
              )}
              <pre className="recording-pipeline-diagnostic-ffprobe-pre">
                {`open ~/Downloads/${DEBUG_RECORDING_FILENAME}\n${ffprobeCommands}`}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    getAppPortalRoot(),
  );
}
