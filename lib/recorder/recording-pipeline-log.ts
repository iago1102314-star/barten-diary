import { isNonProd } from "@/lib/env/app-env";

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

/** local / Vercel dev のみ — 実機 Safari で `copy(window.__RECORDING_PIPELINE_LOG__)` も可 */
export function logRecordingPipeline(
  message: string,
  detail?: Record<string, unknown>,
) {
  if (!isNonProd) return;

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
  if (!isNonProd) return;

  if (detail) {
    console.info(`[RecordingPipeline] ${message}`, detail);
    return;
  }

  console.info(`[RecordingPipeline] ${message}`);
}
