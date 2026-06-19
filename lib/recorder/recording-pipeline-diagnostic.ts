import {
  isRecordingDiagnosticEnabled,
  recordingDiagnosticEnvLabel,
} from "@/lib/env/recording-diagnostic-env";

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
};

let snapshot: RecordingPipelineDiagnosticSnapshot = { updatedAt: 0 };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getRecordingPipelineDiagnostic(): RecordingPipelineDiagnosticSnapshot {
  return snapshot;
}

export function subscribeRecordingPipelineDiagnostic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetRecordingPipelineDiagnostic(): void {
  if (!isRecordingDiagnosticEnabled()) return;
  snapshot = { updatedAt: Date.now() };
  notify();
}

export function updateRecordingPipelineDiagnostic(
  patch: Partial<Omit<RecordingPipelineDiagnosticSnapshot, "updatedAt">>,
): void {
  if (!isRecordingDiagnosticEnabled()) return;
  snapshot = { ...snapshot, ...patch, updatedAt: Date.now() };
  notify();
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

export function formatRecordingPipelineDiagnostic(
  data: RecordingPipelineDiagnosticSnapshot = snapshot,
): string {
  const lines = [
    "=== Recording Pipeline Diagnostic ===",
    `env: ${recordingDiagnosticEnvLabel()}`,
    `updatedAt: ${new Date(data.updatedAt).toISOString()}`,
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
  ];

  return lines.join("\n");
}

export function hasRecordingPipelineDiagnosticData(
  data: RecordingPipelineDiagnosticSnapshot = snapshot,
): boolean {
  return (
    data.blobSize !== undefined ||
    data.whisperRaw !== undefined ||
    data.refinedTranscript !== undefined ||
    data.diaryTranscript !== undefined ||
    data.pipelineError !== undefined ||
    data.jazz !== undefined
  );
}
