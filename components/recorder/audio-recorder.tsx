"use client";

import { type RecorderStatus, type UseRecorderReturn } from "@/hooks/use-recorder";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AudioRecorderProps = {
  recorder: UseRecorderReturn;
  onReset?: () => void;
};

export function AudioRecorder({ recorder, onReset }: AudioRecorderProps) {
  const {
    status,
    error,
    blob,
    audioUrl,
    elapsedMs,
    mimeType,
    maxDurationMs,
    formatElapsed,
    start,
    stop,
    reset,
  } = recorder;

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      reset();
    }
  };

  const maxLabel = formatElapsed(maxDurationMs);
  const remainingMs = Math.max(0, maxDurationMs - elapsedMs);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <RecorderStatusBanner status={status} error={error} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status === "idle" && (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            録音開始
          </button>
        )}

        {status === "recording" && (
          <>
            <button
              type="button"
              onClick={stop}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              停止
            </button>
            <RecordingIndicator
              elapsed={formatElapsed(elapsedMs)}
              remaining={formatElapsed(remainingMs)}
            />
          </>
        )}

        {(status === "stopped" || status === "error") && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            もう一度録音
          </button>
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            再試行
          </button>
        )}
      </div>

      {status === "recording" && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          最大 {maxLabel} まで録音できます。時間になると自動で停止します。
        </p>
      )}

      {status === "stopped" && blob && audioUrl && (
        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              録音完了
            </p>
            <p>
              時間: {formatElapsed(elapsedMs)} / サイズ:{" "}
              {formatFileSize(blob.size)}
            </p>
            {mimeType && (
              <p className="text-xs text-zinc-500">形式: {mimeType}</p>
            )}
          </div>
          <audio controls src={audioUrl} className="w-full" preload="metadata">
            お使いのブラウザは音声再生に対応していません。
          </audio>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            再生して内容を確認してから、下の「文字起こしする」を押してください。
          </p>
        </div>
      )}
    </div>
  );
}

function RecorderStatusBanner({
  status,
  error,
}: {
  status: RecorderStatus;
  error: string | null;
}) {
  if (status === "idle") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        マイクで音声を録音し、停止後に文字起こしできます。
      </p>
    );
  }

  if (status === "recording") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
        録音中
      </div>
    );
  }

  if (status === "paused") {
    return (
      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
        一時停止中
      </p>
    );
  }

  if (status === "stopped") {
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        停止済み — 音声データ（Blob）を生成しました
      </p>
    );
  }

  if (status === "error" && error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        {error}
      </p>
    );
  }

  return null;
}

function RecordingIndicator({
  elapsed,
  remaining,
}: {
  elapsed: string;
  remaining: string;
}) {
  return (
    <div className="flex items-center gap-4 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
      <span>
        経過 <strong className="font-semibold">{elapsed}</strong>
      </span>
      <span className="text-zinc-400">/</span>
      <span>
        残り <strong className="font-semibold">{remaining}</strong>
      </span>
    </div>
  );
}
