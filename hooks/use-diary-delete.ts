"use client";

import { deleteDiary } from "@/app/(app)/diaries/actions";
import type { DiaryExportNotice } from "@/hooks/use-diary-paper-export";
import { clearAllMemoShelfPageCaches } from "@/lib/memories/memo-shelf-page-cache";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

type UseDiaryDeleteOptions = {
  diaryId: string;
  onDeleted?: () => void | Promise<void>;
};

export function useDiaryDelete({
  diaryId,
  onDeleted,
}: UseDiaryDeleteOptions) {
  const router = useRouter();
  const [deleting, startDeleting] = useTransition();
  const [notice, setNotice] = useState<DiaryExportNotice | null>(null);
  const onDeletedRef = useRef(onDeleted);

  onDeletedRef.current = onDeleted;

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const requestDelete = useCallback(() => {
    if (!diaryId || deleting) return;

    setNotice(null);
    startDeleting(async () => {
      const result = await deleteDiary(diaryId);

      if (!result.success) {
        setNotice({
          type: "error",
          text: result.error ?? "削除できませんでした。\nもう一度お試しください。",
        });
        return;
      }

      clearAllMemoShelfPageCaches();
      router.refresh();
      await onDeletedRef.current?.();
    });
  }, [deleting, diaryId, router]);

  return {
    deleteDiary: requestDelete,
    deleting,
    notice,
    dismissNotice,
  };
}
