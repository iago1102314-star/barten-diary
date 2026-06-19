import { isRecordingDiagnosticEnabled } from "@/lib/env/recording-diagnostic-env";

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
  }
}

/** local / Vercel dev のみ — production PWA 実機計測を汚さない */
export function logRecordingPipeline(
  message: string,
  detail?: Record<string, unknown>,
) {
  if (!isRecordingDiagnosticEnabled()) return;

  const entry: PipelineLogEntry = { t: Date.now(), message, detail };
  ring.push(entry);
  if (ring.length > MAX_EVENTS) {
    ring.shift();
  }

  if (typeof window !== "undefined") {
    window.__RECORDING_PIPELINE_LOG__ = ring;
  }

  if (detail) {
    console.info(`[RecordingPipeline] ${message}`, detail);
    return;
  }

  console.info(`[RecordingPipeline] ${message}`);
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
