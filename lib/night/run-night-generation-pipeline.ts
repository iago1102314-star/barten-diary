import { checkGenerationReadiness } from "@/lib/ai/check-generation-readiness";
import type { GenerateDiaryOutcome } from "@/hooks/use-generate-diary";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import type { NightPipelineTimings } from "@/lib/night/night-pipeline-timings";
import { logRecordingPipeline } from "@/lib/recorder/recording-pipeline-log";
import { transcribeAudio } from "@/lib/transcribe/transcribe-audio";

export type NightGenerationPipelineSuccess = {
  ok: true;
  transcript: string;
  whisperRaw?: string;
  generation: Extract<GenerateDiaryOutcome, { ok: true }>;
  timings: Pick<
    NightPipelineTimings,
    "whisperMs" | "readinessMs" | "diaryGenerationMs" | "totalMs"
  >;
};

export type NightGenerationPipelineFailure = {
  ok: false;
  reason: string;
  phase: "transcribe" | "readiness" | "generation";
  timings: Pick<
    NightPipelineTimings,
    "whisperMs" | "readinessMs" | "diaryGenerationMs" | "totalMs"
  >;
};

export type NightGenerationPipelineResult =
  | NightGenerationPipelineSuccess
  | NightGenerationPipelineFailure;

type RunNightGenerationPipelineParams = {
  blob: Blob;
  mimeType: string;
  selectedCategoryId: DrinkCategoryId;
  selectedDrinkId: DrinkId | null;
  recordedAt: string;
  generate: (
    transcript: string,
    selectedCategoryId: DrinkCategoryId,
    recordedAt?: string,
    selectedDrinkId?: DrinkId | null,
  ) => Promise<GenerateDiaryOutcome>;
};

export async function runNightGenerationPipeline(
  params: RunNightGenerationPipelineParams,
): Promise<NightGenerationPipelineResult> {
  const pipelineStartedAt = performance.now();
  const timings = {
    whisperMs: 0,
    readinessMs: 0,
    diaryGenerationMs: 0,
    totalMs: 0,
  };

  let transcript: string;
  let whisperRaw: string | undefined;

  try {
    const whisperStartedAt = performance.now();
    const { transcript: text, debug } = await transcribeAudio(
      params.blob,
      params.mimeType,
    );
    timings.whisperMs = Math.round(performance.now() - whisperStartedAt);
    transcript = text;
    whisperRaw = debug?.whisperRaw;

    logRecordingPipeline("night pipeline: whisper complete", {
      elapsedMs: timings.whisperMs,
      transcriptLength: text.length,
      whisperRaw: debug?.whisperRaw,
    });
  } catch (error) {
    timings.totalMs = Math.round(performance.now() - pipelineStartedAt);
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: message,
      phase: "transcribe",
      timings,
    };
  }

  if (!transcript.trim()) {
    timings.totalMs = Math.round(performance.now() - pipelineStartedAt);
    return {
      ok: false,
      reason: "文字起こし結果が空でした。",
      phase: "transcribe",
      timings,
    };
  }

  logRecordingPipeline("night pipeline: readiness start");
  const readinessStartedAt = performance.now();
  const readiness = await checkGenerationReadiness();
  timings.readinessMs = Math.round(performance.now() - readinessStartedAt);

  if (!readiness.ok) {
    timings.totalMs = Math.round(performance.now() - pipelineStartedAt);
    logRecordingPipeline("night pipeline: readiness failed", {
      elapsedMs: timings.readinessMs,
      error: readiness.error,
    });
    return {
      ok: false,
      reason: readiness.error,
      phase: "readiness",
      timings,
    };
  }

  logRecordingPipeline("night pipeline: readiness ok", {
    elapsedMs: timings.readinessMs,
  });

  logRecordingPipeline("night pipeline: diary generation start", {
    transcriptLength: transcript.length,
  });

  const diaryStartedAt = performance.now();
  const generation = await params.generate(
    transcript,
    params.selectedCategoryId,
    params.recordedAt,
    params.selectedDrinkId,
  );
  timings.diaryGenerationMs = Math.round(performance.now() - diaryStartedAt);
  timings.totalMs = Math.round(performance.now() - pipelineStartedAt);

  if (!generation.ok) {
    return {
      ok: false,
      reason: generation.ambient.lines.join("\n"),
      phase: "generation",
      timings,
    };
  }

  logRecordingPipeline("night pipeline: diary generation complete", {
    elapsedMs: timings.diaryGenerationMs,
    totalMs: timings.totalMs,
    bottleTag: generation.diary.bottleTag,
  });

  return {
    ok: true,
    transcript,
    whisperRaw,
    generation,
    timings,
  };
}
