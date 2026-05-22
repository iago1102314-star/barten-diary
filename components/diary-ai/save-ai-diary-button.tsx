"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import type { GeneratedDiary } from "@/lib/ai/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SaveAiDiaryButtonProps = {
  diary: GeneratedDiary;
  transcript: string;
  disabled?: boolean;
};

type Message = {
  type: "success" | "error";
  text: string;
};

export function SaveAiDiaryButton({
  diary,
  transcript,
  disabled = false,
}: SaveAiDiaryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await saveAiDiary({
        bottleTag: diary.bottleTag,
        diary: diary.diary,
        drinkNote: diary.drinkNote,
        masterComment: diary.masterComment,
        transcript,
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setSaved(true);
      setMessage({
        type: "success",
        text: "日記を保存しました。下の一覧に反映されています。",
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <button
        type="button"
        onClick={handleSave}
        disabled={disabled || isPending || saved}
        className="w-full rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {isPending ? "保存中…" : saved ? "保存済み" : "保存する"}
      </button>

      {isPending && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Supabase に保存しています…
        </p>
      )}

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
