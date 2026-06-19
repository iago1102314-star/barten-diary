"use client";

import {
  formatRecordingPipelineDiagnostic,
  getRecordingPipelineDiagnostic,
  hasRecordingPipelineDiagnosticData,
  subscribeRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import {
  isRecordingDiagnosticEnabled,
  recordingDiagnosticEnvLabel,
} from "@/lib/env/recording-diagnostic-env";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type RecordingPipelineDiagnosticPanelProps = {
  /** listen failure 画面など — 常にこのインスタンスを表示 */
  forceVisible?: boolean;
  /** インライン配置（録音 UI 内） */
  inline?: boolean;
};

export function RecordingPipelineDiagnosticPanel({
  forceVisible = false,
  inline = false,
}: RecordingPipelineDiagnosticPanelProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(getRecordingPipelineDiagnostic);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isRecordingDiagnosticEnabled()) return;
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

  if (!mounted || !isRecordingDiagnosticEnabled()) {
    return null;
  }

  const hasData = hasRecordingPipelineDiagnosticData(snapshot);
  if (!forceVisible && !hasData) {
    return null;
  }

  const triggerLabel = inline
    ? "診断ログ"
    : `診断ログ (${recordingDiagnosticEnvLabel()})`;

  const trigger = (
    <button
      type="button"
      onClick={() => {
        setCopyState("idle");
        setOpen(true);
      }}
      className={
        inline
          ? "recording-pipeline-diagnostic-trigger-inline"
          : "recording-pipeline-diagnostic-trigger"
      }
      aria-label="診断ログを表示"
    >
      {triggerLabel}
    </button>
  );

  const overlay =
    open && mounted
      ? createPortal(
          <div
            className="recording-pipeline-diagnostic-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="録音パイプライン診断ログ"
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
          </div>,
          document.body,
        )
      : null;

  if (inline) {
    return (
      <>
        {trigger}
        {overlay}
      </>
    );
  }

  return (
    <>
      {createPortal(trigger, document.body)}
      {overlay}
    </>
  );
}
