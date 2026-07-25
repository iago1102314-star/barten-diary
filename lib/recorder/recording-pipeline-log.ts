import {
  isRecordingConsoleLogEnabled,
  isRecordingDiagnosticEnabled,
} from "@/lib/env/recording-diagnostic-env";
import { bumpRecordingPipelineDiagnostic } from "@/lib/recorder/recording-pipeline-diagnostic";

const MAX_EVENTS = 40;

type PipelineLogEntry = {
  t: number;
  message: string;
  detail?: Record<string, unknown>;
};

const ring: PipelineLogEntry[] = [];

declare global {
  interface Window {
    __RECORDING_PIPELINE_LOG__?: PipelineLogEntry[];
    __RECORDING_PIPELINE_LAST_ERROR__?: string;
  }
}

/** local / dev — production PWA 実機計測を汚さない。エラーは常に console へ */
export function logRecordingPipeline(
  message: string,
  detail?: Record<string, unknown>,
) {
  if (isRecordingConsoleLogEnabled()) {
    if (detail) {
      console.info(`[RecordingPipeline] ${message}`, detail);
    } else {
      console.info(`[RecordingPipeline] ${message}`);
    }
  }

  if (!isRecordingDiagnosticEnabled()) return;

  const entry: PipelineLogEntry = { t: Date.now(), message, detail };
  ring.push(entry);
  if (ring.length > MAX_EVENTS) {
    ring.shift();
  }

  if (typeof window !== "undefined") {
    window.__RECORDING_PIPELINE_LOG__ = ring;
  }

  bumpRecordingPipelineDiagnostic();
}

/** 失敗時 — 診断 OFF でも console.error と lastError を残す */
export function logRecordingPipelineError(
  message: string,
  detail?: Record<string, unknown>,
) {
  const detailText =
    detail && Object.keys(detail).length > 0
      ? ` ${JSON.stringify(detail)}`
      : "";
  console.error(`[RecordingPipeline] ${message}${detailText}`, detail ?? "");

  if (typeof window !== "undefined") {
    window.__RECORDING_PIPELINE_LAST_ERROR__ = `${message}${detailText}`.trim();
  }

  logRecordingPipeline(message, detail);
}

export function logRecordingPipelineServer(
  message: string,
  detail?: Record<string, unknown>,
) {
  if (!isRecordingDiagnosticEnabled()) return;

  if (detail) {
    console.info(`[RecordingPipeline] ${message}`, detail);
    return;
  }

  console.info(`[RecordingPipeline] ${message}`);
}

export function getRecordingPipelineEventLog(): PipelineLogEntry[] {
  if (typeof window !== "undefined" && window.__RECORDING_PIPELINE_LOG__) {
    return window.__RECORDING_PIPELINE_LOG__;
  }
  return ring;
}

export function formatRecordingPipelineEventLog(): string {
  const entries = getRecordingPipelineEventLog();
  if (entries.length === 0) {
    return "(イベントなし)";
  }

  return entries
    .map((entry) => {
      const time = new Date(entry.t).toISOString().slice(11, 23);
      const detail =
        entry.detail && Object.keys(entry.detail).length > 0
          ? ` ${JSON.stringify(entry.detail)}`
          : "";
      return `${time} ${entry.message}${detail}`;
    })
    .join("\n");
}
