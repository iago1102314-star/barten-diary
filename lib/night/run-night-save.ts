"use client";

import { saveAiDiary } from "@/app/(app)/diaries/actions";
import { isSaveAiDiaryNeedsLogin } from "@/lib/auth/save-ai-diary-auth";
import type { NightSavePayload } from "@/lib/night/night-pipeline-types";
import {
  logRecordingPipeline,
  logRecordingPipelineError,
} from "@/lib/recorder/recording-pipeline-log";

export type RunNightSaveResult =
  | { ok: true; diaryId: string; saveMs: number }
  | { ok: false; reason: string; saveMs: number; needsLogin?: boolean };

export async function runNightSave(
  payload: NightSavePayload,
): Promise<RunNightSaveResult> {
  logRecordingPipeline("save start");

  const startedAt = performance.now();

  try {
    const result = await saveAiDiary(payload);
    const saveMs = Math.round(performance.now() - startedAt);

    if (result.needsLogin || isSaveAiDiaryNeedsLogin(result.error)) {
      logRecordingPipeline("save deferred: login required", { saveMs });
      return { ok: false, reason: "loginRequired", saveMs, needsLogin: true };
    }

    if (result.error || !result.success || !result.diaryId) {
      const reason = result.error ?? "記録の保存に失敗しました。";
      logRecordingPipelineError("save failed", { saveMs, reason });
      return { ok: false, reason, saveMs };
    }

    logRecordingPipeline("save complete", { saveMs, diaryId: result.diaryId });
    return { ok: true, diaryId: result.diaryId, saveMs };
  } catch (error) {
    const saveMs = Math.round(performance.now() - startedAt);
    const reason =
      error instanceof Error ? error.message : "記録の保存に失敗しました。";
    logRecordingPipelineError("save failed", { saveMs, reason });
    return { ok: false, reason, saveMs };
  }
}
