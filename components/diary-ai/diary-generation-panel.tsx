"use client";

import { GeneratedDiaryCards } from "@/components/diary-ai/generated-diary-cards";
import { SaveAiDiaryButton } from "@/components/diary-ai/save-ai-diary-button";
import type { GenerateDiaryStatus } from "@/hooks/use-generate-diary";
import type { GeneratedDiary } from "@/lib/ai/types";
import { MIN_TRANSCRIPT_LENGTH } from "@/lib/ai/validate-transcript";

type DiaryGenerationPanelProps = {
  transcript: string;
  status: GenerateDiaryStatus;
  result: GeneratedDiary | null;
  error: string | null;
  onGenerate: () => void;
};

export function DiaryGenerationPanel({
  transcript,
  status,
  result,
  error,
  onGenerate,
}: DiaryGenerationPanelProps) {
  const trimmedLength = transcript.trim().length;
  const isTooShort = trimmedLength < MIN_TRANSCRIPT_LENGTH;

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          AI日記を生成
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          文字起こしからタイトル・本文・マスターの一言を作成し、Supabase に保存できます。
        </p>
      </div>

      {isTooShort ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          文字起こしが短すぎます（{MIN_TRANSCRIPT_LENGTH}
          文字以上）。もう少し話してから文字起こしし直してください。
        </p>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={status === "loading"}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {status === "loading" ? "AI日記を生成中…" : "AI日記を生成する"}
        </button>
      )}

      {status === "loading" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          OpenAI で日記を作成しています。しばらくお待ちください…
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

      {status === "success" && result && (
        <div className="space-y-3 pt-1">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            AI日記の生成が完了しました
          </p>
          <GeneratedDiaryCards diary={result} />
          <SaveAiDiaryButton diary={result} transcript={transcript} />
        </div>
      )}
    </div>
  );
}
