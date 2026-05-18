"use client";

import type { TranscribeStatus } from "@/hooks/use-transcribe";

type TranscriptPanelProps = {
  blob: Blob | null;
  mimeType: string | null;
  canTranscribe: boolean;
  status: TranscribeStatus;
  transcript: string | null;
  error: string | null;
  onTranscribe: () => void;
};

export function TranscriptPanel({
  blob,
  mimeType,
  canTranscribe,
  status,
  transcript,
  error,
  onTranscribe,
}: TranscriptPanelProps) {
  if (!canTranscribe || !blob || !mimeType) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          文字起こし
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          録音音声を OpenAI でテキスト化します（まだ日記には保存されません）。
        </p>
      </div>

      <button
        type="button"
        onClick={onTranscribe}
        disabled={status === "loading"}
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "loading" ? "文字起こし中…" : "文字起こしする"}
      </button>

      {status === "loading" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          音声を送信して文字起こししています。しばらくお待ちください…
        </p>
      )}

      {status === "error" && error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {status === "success" && transcript && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            文字起こし完了
          </p>
          <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
}
