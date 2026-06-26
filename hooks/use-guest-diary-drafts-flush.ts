"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { markGuestDiaryTransferPending } from "@/lib/memories/guest-diary-transfer-notice";
import {
  guestDraftToSavePayload,
  markGuestDiaryDraftSaved,
  readGuestDiaryDraftsForFlush,
  removeGuestDiaryDraft,
} from "@/lib/night/guest-diary-drafts";
import { runNightSave } from "@/lib/night/run-night-save";
import {
  logRecordingPipeline,
  logRecordingPipelineError,
} from "@/lib/recorder/recording-pipeline-log";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** ログイン直後 — sessionStorage のゲスト日記をすべて Supabase へ保存する。 */
export function useGuestDiaryDraftsFlush() {
  const { isLoggedIn, isLoading } = useAuthUser();
  const router = useRouter();
  const flushInFlightRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isLoggedIn || flushInFlightRef.current) return;

    const drafts = readGuestDiaryDraftsForFlush();
    if (drafts.length === 0) return;

    flushInFlightRef.current = true;
    const flushedClientIds = new Set<string>();
    let savedAny = false;

    void (async () => {
      for (const draft of drafts) {
        if (flushedClientIds.has(draft.clientId) || draft.savedDiaryId) {
          continue;
        }

        flushedClientIds.add(draft.clientId);

        logRecordingPipeline("guest diary draft: flush start", {
          clientId: draft.clientId,
          bottleTag: draft.bottleTag,
        });

        const result = await runNightSave(guestDraftToSavePayload(draft));

        if (result.ok) {
          markGuestDiaryDraftSaved(draft.clientId, result.diaryId);
          removeGuestDiaryDraft(draft.clientId);
          savedAny = true;
          logRecordingPipeline("guest diary draft: flush saved", {
            clientId: draft.clientId,
            diaryId: result.diaryId,
          });
          continue;
        }

        logRecordingPipelineError("guest diary draft: flush failed", {
          clientId: draft.clientId,
          reason: result.reason,
          needsLogin: result.needsLogin ?? false,
        });
      }

      if (savedAny) {
        markGuestDiaryTransferPending();
        router.refresh();
      }

      flushInFlightRef.current = false;
    })();
  }, [isLoading, isLoggedIn, router]);
}
