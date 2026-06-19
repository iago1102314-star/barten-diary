"use client";

import {
  formatRecordingPipelineDiagnostic,
  getRecordingPipelineDiagnostic,
  hasRecordingPipelineDiagnosticData,
  subscribeRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import { isProd } from "@/lib/env/app-env";
import { useCallback, useEffect, useState } from "react";

export function RecordingPipelineDiagnosticPanel() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(getRecordingPipelineDiagnostic);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    if (isProd) return;
    return subscribeRecordingPipelineDiagnostic(() => {
      setSnapshot(getRecordingPipelineDiagnostic());
    });
  }, []);

  const logText = formatRecordingPipelineDiagnostic(snapshot);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [logText]);

  if (isProd || !hasRecordingPipelineDiagnosticData(snapshot)) {
    return null;
  }

  return (
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
        診断ログを表示
      </button>

      {open ? (
        <div
          className="recording-pipeline-diagnostic-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="録音パイプライン診断ログ"
        >
          <div className="recording-pipeline-diagnostic-panel">
            <div className="recording-pipeline-diagnostic-header">
              <p className="recording-pipeline-diagnostic-title">
                録音パイプライン診断（dev のみ）
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
              value={logText}
              className="recording-pipeline-diagnostic-textarea"
              aria-label="診断ログ全文"
            />

            <div className="recording-pipeline-diagnostic-actions">
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
          </div>
        </div>
      ) : null}
    </>
  );
}
