import {
  isRecordingDiagnosticEnabled,
  recordingDiagnosticEnvLabel,
} from "@/lib/env/recording-diagnostic-env";
import {
  EMPTY_NIGHT_PIPELINE_TIMINGS,
  type NightPipelineTimings,
} from "@/lib/night/night-pipeline-timings";

export type RecordingPipelineJazzSnapshot = {
  currentVolume: number | null;
  targetVolume: number | null;
  paused: boolean | null;
};

export type RecordingPipelineDiagnosticSnapshot = {
  updatedAt: number;
  blobSize?: number;
  chunkCount?: number;
  durationSec?: number;
  blobType?: string;
  whisperRaw?: string;
  refinedTranscript?: string;
  diaryTranscript?: string;
  pipelineError?: string;
  jazz?: RecordingPipelineJazzSnapshot;
  pipelineTimings?: NightPipelineTimings;
};

declare global {
  interface Window {
    __RECORDING_PIPELINE_DIAGNOSTIC__?: RecordingPipelineDiagnosticSnapshot;
    __RECORDING_PIPELINE_DIAGNOSTIC_LISTENERS__?: Set<() => void>;
    __RECORDING_PIPELINE_LOG__?: Array<{
      t: number;
      message: string;
      detail?: Record<string, unknown>;
    }>;
  }
}

function getListenerSet(): Set<() => void> {
  if (typeof window === "undefined") {
    return new Set();
  }
  if (!window.__RECORDING_PIPELINE_DIAGNOSTIC_LISTENERS__) {
    window.__RECORDING_PIPELINE_DIAGNOSTIC_LISTENERS__ = new Set();
  }
  return window.__RECORDING_PIPELINE_DIAGNOSTIC_LISTENERS__;
}

/** Turbopack HMR でモジュールが複製されても window を単一の真実源にする */
function readSnapshot(): RecordingPipelineDiagnosticSnapshot {
  if (typeof window === "undefined") {
    return { updatedAt: 0 };
  }
  if (!window.__RECORDING_PIPELINE_DIAGNOSTIC__) {
    window.__RECORDING_PIPELINE_DIAGNOSTIC__ = { updatedAt: 0 };
  }
  return window.__RECORDING_PIPELINE_DIAGNOSTIC__;
}

function notifyDiagnosticListeners(): void {
  if (!isRecordingDiagnosticEnabled()) return;

  const notify = () => {
    for (const listener of getListenerSet()) {
      listener();
    }
  };

  if (typeof queueMicrotask === "function") {
    queueMicrotask(notify);
    return;
  }

  setTimeout(notify, 0);
}

function writeSnapshot(next: RecordingPipelineDiagnosticSnapshot): void {
  if (typeof window !== "undefined") {
    window.__RECORDING_PIPELINE_DIAGNOSTIC__ = next;
  }
  notifyDiagnosticListeners();
}

export function getRecordingPipelineDiagnostic(): RecordingPipelineDiagnosticSnapshot {
  return readSnapshot();
}

export function subscribeRecordingPipelineDiagnostic(listener: () => void): () => void {
  const listeners = getListenerSet();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetRecordingPipelineDiagnostic(): void {
  if (!isRecordingDiagnosticEnabled()) return;
  writeSnapshot({ updatedAt: Date.now() });
}

export function updateRecordingPipelineDiagnostic(
  patch: Partial<Omit<RecordingPipelineDiagnosticSnapshot, "updatedAt">>,
): void {
  if (!isRecordingDiagnosticEnabled()) return;
  writeSnapshot({ ...readSnapshot(), ...patch, updatedAt: Date.now() });
}

export function syncPipelineTimingsToDiagnostic(
  timings: NightPipelineTimings,
): void {
  if (!isRecordingDiagnosticEnabled()) return;
  updateRecordingPipelineDiagnostic({ pipelineTimings: timings });
}

/** イベントログ追記時にパネルへ反映するため updatedAt のみ更新 */
export function bumpRecordingPipelineDiagnostic(): void {
  if (!isRecordingDiagnosticEnabled()) return;
  writeSnapshot({ ...readSnapshot(), updatedAt: Date.now() });
}

export function extractJazzFromAudioDiagnostics(
  diagnostics: Record<string, unknown>,
): RecordingPipelineJazzSnapshot {
  const jazz = diagnostics.jazz as Record<string, unknown> | null | undefined;

  if (!jazz) {
    return { currentVolume: null, targetVolume: null, paused: null };
  }

  return {
    currentVolume:
      typeof jazz.currentVolume === "number" ? jazz.currentVolume : null,
    targetVolume:
      typeof jazz.targetVolume === "number" ? jazz.targetVolume : null,
    paused: typeof jazz.paused === "boolean" ? jazz.paused : null,
  };
}

function formatValue(value: unknown): string {
  if (value === undefined) return "(未記録)";
  if (value === null) return "null";
  if (typeof value === "string") return value.length > 0 ? value : "(空)";
  return String(value);
}

function formatMs(value: number | undefined): string {
  if (value === undefined) return "(未記録)";
  return `${value} ms`;
}

function formatGenerationCompleteAtStoreEnding(
  value: boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "(未記録)";
  return value
    ? "はい（店内エンディング終了時に生成完了）"
    : "いいえ（路地で待機あり）";
}

function formatRecordingPipelineEventLog(): string {
  const entries =
    typeof window !== "undefined" ? window.__RECORDING_PIPELINE_LOG__ ?? [] : [];

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

function formatPipelineTimings(
  timings: NightPipelineTimings = EMPTY_NIGHT_PIPELINE_TIMINGS,
): string[] {
  return [
    "--- pipeline timings ---",
    `recordingCheckMs: ${formatMs(timings.recordingCheckMs)}`,
    `whisperMs: ${formatMs(timings.whisperMs)}`,
    `readinessMs: ${formatMs(timings.readinessMs)}`,
    `diaryGenerationMs: ${formatMs(timings.diaryGenerationMs)}`,
    `saveMs: ${formatMs(timings.saveMs)}`,
    `totalMs: ${formatMs(timings.totalMs)}`,
    `generationCompleteAtStoreEnding: ${formatGenerationCompleteAtStoreEnding(timings.generationCompleteAtStoreEnding)}`,
    `waitingInStoreMs: ${formatMs(timings.waitingInStoreMs)}`,
    `waitingInAlleyMs: ${formatMs(timings.waitingInAlleyMs)}`,
  ];
}

export function formatRecordingPipelineDiagnostic(
  data: RecordingPipelineDiagnosticSnapshot = readSnapshot(),
): string {
  const timings = data.pipelineTimings ?? EMPTY_NIGHT_PIPELINE_TIMINGS;

  const lines = [
    "=== Recording Pipeline Diagnostic ===",
    `env: ${recordingDiagnosticEnvLabel()}`,
    `updatedAt: ${new Date(data.updatedAt).toISOString()}`,
    "",
    ...formatPipelineTimings(timings),
    "",
    `blobSize: ${formatValue(data.blobSize)}`,
    `chunkCount: ${formatValue(data.chunkCount)}`,
    `durationSec: ${formatValue(data.durationSec)}`,
    `blobType: ${formatValue(data.blobType)}`,
    "",
    "--- whisper raw ---",
    formatValue(data.whisperRaw),
    "",
    "--- refined transcript ---",
    formatValue(data.refinedTranscript),
    "",
    "--- diary generation transcript ---",
    formatValue(data.diaryTranscript),
    "",
    "--- pipeline error ---",
    formatValue(data.pipelineError),
    "",
    "--- jazz (mic ON) ---",
    `currentVolume: ${formatValue(data.jazz?.currentVolume)}`,
    `targetVolume: ${formatValue(data.jazz?.targetVolume)}`,
    `paused: ${formatValue(data.jazz?.paused)}`,
    "",
    "--- event log ---",
    formatRecordingPipelineEventLog(),
  ];

  return lines.join("\n");
}

export function hasRecordingPipelineDiagnosticData(
  data: RecordingPipelineDiagnosticSnapshot = readSnapshot(),
): boolean {
  return (
    data.blobSize !== undefined ||
    data.whisperRaw !== undefined ||
    data.refinedTranscript !== undefined ||
    data.diaryTranscript !== undefined ||
    data.pipelineError !== undefined ||
    data.jazz !== undefined ||
    data.pipelineTimings !== undefined
  );
}
