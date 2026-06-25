"use client";

import { deleteDiary } from "@/app/(app)/diaries/actions";
import type { DiaryExportNotice } from "@/hooks/use-diary-paper-export";
import { useCallback, useRef, useState, useTransition } from "react";

type UseDiaryDeleteOptions = {
  diaryId: string;
  onDeleted?: () => void | Promise<void>;
};

export function useDiaryDelete({
  diaryId,
  onDeleted,
}: UseDiaryDeleteOptions) {
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

      await onDeletedRef.current?.();
    });
  }, [deleting, diaryId]);

  return {
    deleteDiary: requestDelete,
    deleting,
    notice,
    dismissNotice,
  };
}
