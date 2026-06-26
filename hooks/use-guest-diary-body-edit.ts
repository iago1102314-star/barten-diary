"use client";

import type { DiaryExportNotice } from "@/hooks/use-diary-paper-export";
import { updateGuestDiaryDraftBody } from "@/lib/night/guest-diary-drafts";
import { useCallback, useEffect, useState } from "react";

type UseGuestDiaryBodyEditOptions = {
  clientId: string;
  initialBody: string;
  onSaved?: () => void;
};

export function useGuestDiaryBodyEdit({
  clientId,
  initialBody,
  onSaved,
}: UseGuestDiaryBodyEditOptions) {
  const [draftBody, setDraftBody] = useState(initialBody);
  const [saveNotice, setSaveNotice] = useState<DiaryExportNotice | null>(null);

  useEffect(() => {
    setDraftBody(initialBody);
  }, [initialBody]);

  const dirty =
    draftBody.replace(/\r\n?/g, "\n").trim() !==
    initialBody.replace(/\r\n?/g, "\n").trim();

  const resetDraft = useCallback(() => {
    setDraftBody(initialBody);
  }, [initialBody]);

  const dismissSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  const formAction = useCallback((_payload: FormData) => {
    if (!clientId) return;

    updateGuestDiaryDraftBody(clientId, draftBody);
    setSaveNotice({ type: "success", text: "言葉を整えました" });
    onSaved?.();
  }, [clientId, draftBody, onSaved]);

  return {
    draftBody,
    setDraftBody,
    dirty,
    formAction,
    error: undefined as string | undefined,
    saveNotice,
    dismissSaveNotice,
    resetDraft,
  };
}
