"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import type { GeneratedDiary } from "@/lib/ai/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ShelfReturnButtonProps = {
  record: GeneratedDiary;
  transcript: string;
  onReturned: () => void;
};

export function ShelfReturnButton({
  record,
  transcript,
  onReturned,
}: ShelfReturnButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [returned, setReturned] = useState(false);

  const payload = {
    bottleTag: record.bottleTag,
    diary: record.diary,
    drinkNote: record.drinkNote,
    masterComment: record.masterComment,
    transcript,
  };

  const handleReturn = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await saveAiDiary(payload);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setReturned(true);
      setMessage("棚に戻しました。");
      router.refresh();
      onReturned();
    });
  };

  const handleLeave = () => {
    onReturned();
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleReturn}
        disabled={isPending || returned}
        className="w-full rounded-full border border-amber-800/40 bg-amber-950/40 px-5 py-3 text-sm font-medium text-amber-100/90 transition-colors hover:border-amber-700/60 hover:bg-amber-900/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "戻しています…" : returned ? "棚に戻しました" : "棚へ戻す"}
      </button>
      <button
        type="button"
        onClick={handleLeave}
        disabled={isPending}
        className="w-full py-1 text-[11px] tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-400 disabled:opacity-50"
      >
        帰る
      </button>
      {message && (
        <p role="status" className="text-center text-sm text-amber-200/60">
          {message}
        </p>
      )}
    </div>
  );
}
