"use client";

import {
  updateDiaryBody,
  type UpdateDiaryBodyState,
} from "@/app/(app)/diaries/actions";
import type { DiaryExportNotice } from "@/hooks/use-diary-paper-export";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

const initialState: UpdateDiaryBodyState = {};

type UseDiaryBodyEditOptions = {
  diaryId: string;
  initialBody: string;
  onSaved?: () => void;
};

export function useDiaryBodyEdit({
  diaryId,
  initialBody,
  onSaved,
}: UseDiaryBodyEditOptions) {
  const router = useRouter();
  const [draftBody, setDraftBody] = useState(initialBody);
  const [saveNotice, setSaveNotice] = useState<DiaryExportNotice | null>(null);
  const [state, formAction] = useActionState(updateDiaryBody, initialState);
  const onSavedRef = useRef(onSaved);
  const handledSuccessStateRef = useRef<UpdateDiaryBodyState | null>(null);

  onSavedRef.current = onSaved;

  useEffect(() => {
    setDraftBody(initialBody);
  }, [initialBody]);

  useEffect(() => {
    if (!state.success) return;
    if (handledSuccessStateRef.current === state) return;

    handledSuccessStateRef.current = state;
    router.refresh();
    setSaveNotice({ type: "success", text: "言葉を整えました" });
    onSavedRef.current?.();
  }, [state, router]);

  const dirty =
    draftBody.replace(/\r\n?/g, "\n").trim() !==
    initialBody.replace(/\r\n?/g, "\n").trim();

  const resetDraft = useCallback(() => {
    setDraftBody(initialBody);
  }, [initialBody]);

  const dismissSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  return {
    draftBody,
    setDraftBody,
    dirty,
    formAction,
    error: state.error,
    saveNotice,
    dismissSaveNotice,
    resetDraft,
  };
}
