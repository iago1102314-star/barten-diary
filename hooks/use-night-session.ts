"use client";

import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { validateTranscriptInput } from "@/lib/ai/security/validate-input";
import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { simulateNight } from "@/lib/dev/simulate-night";
import type { FakeNightId } from "@/lib/dev/fake-nights";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { barAudioEngine, getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import { MIN_RECORDING_BYTES } from "@/lib/recorder/recorder-platform";
import {
  getRecordingPipelineDiagnostic,
  resetRecordingPipelineDiagnostic,
  updateRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import { logRecordingPipeline, logRecordingPipelineError } from "@/lib/recorder/recording-pipeline-log";
import { transcribeAudio } from "@/lib/transcribe/transcribe-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export type NightPhase =
  | "idle"
  | "recording"
  | "processing"
  | "accepted"
  | "revealed";

export type ContinuedFromBottle = {
  diaryId: string;
  bottleTag: string;
};

function generationKey(transcript: string, recordedAt: string | null): string {
  return `${transcript}::${recordedAt ?? ""}`;
}

export function useNightSession() {
  const [phase, setPhase] = useState<NightPhase>("idle");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const generation = useGenerateDiary();
  const [listenFailureCount, setListenFailureCount] = useState(0);
  const [listenFailureVisible, setListenFailureVisible] = useState(false);
  const [listenFailureReason, setListenFailureReason] = useState<string | null>(
    null,
  );
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<DrinkCategoryId | null>(null);
  const [selectedDrinkId, setSelectedDrinkId] = useState<DrinkId | null>(null);
  const [continuedFrom, setContinuedFrom] = useState<ContinuedFromBottle | null>(
    null,
  );
  const [isDevSimulated, setIsDevSimulated] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const pipelineLock = useRef(false);
  const inflightGenerationKeyRef = useRef<string | null>(null);
  const registerListenFailureRef = useRef<
    (options?: { advanceCount?: boolean; reason?: string }) => void
  >(() => {});

  const recorder = useRecorder({
    onRecordingStarted: () => {
      barAudioEngine.pauseJazzForRecording();
    },
    onFatalError: ({ hadRecordingAttempt, message }) => {
      if (
        phaseRef.current !== "recording" &&
        phaseRef.current !== "processing"
      ) {
        return;
      }
      registerListenFailureRef.current({
        advanceCount: hadRecordingAttempt,
        reason:
          message ??
          (hadRecordingAttempt
            ? "recorder fatal error after recording started"
            : "recorder fatal error before recording completed"),
      });
    },
  });

  const registerListenFailure = useCallback(
    (options?: { advanceCount?: boolean; reason?: string }) => {
      pipelineLock.current = false;
      inflightGenerationKeyRef.current = null;
      barAudioEngine.resumeJazzAfterRecording();
      recorder.reset();
      generation.reset();
      setTranscript(null);
      setRecordedAt(null);
      setGenerationFailed(false);
      const reason =
        options?.reason ?? "listen failure (no detail recorded)";
      logRecordingPipelineError("listen failure", {
        reason,
        advanceCount: options?.advanceCount !== false,
      });
      const current = getRecordingPipelineDiagnostic();
      if (!current.pipelineError) {
        updateRecordingPipelineDiagnostic({ pipelineError: reason });
      }
      if (options?.advanceCount !== false) {
        setListenFailureCount((count) => count + 1);
      }
      setListenFailureReason(reason);
      setListenFailureVisible(true);
      phaseRef.current = "recording";
      setPhase("recording");
    },
    [recorder, generation],
  );

  registerListenFailureRef.current = registerListenFailure;

  const resetListenFailure = useCallback(() => {
    setListenFailureCount(0);
    setListenFailureVisible(false);
    setListenFailureReason(null);
  }, []);

  const clearListenFailureUi = useCallback(() => {
    setListenFailureVisible(false);
  }, []);

  const reset = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    recorder.reset();
    generation.reset();
    setPhase("idle");
    resetListenFailure();
    setTranscript(null);
    setRecordedAt(null);
    setSelectedCategoryId(null);
    setSelectedDrinkId(null);
    setContinuedFrom(null);
    setIsDevSimulated(false);
    setGenerationFailed(false);
  }, [recorder, generation, resetListenFailure]);

  const selectCategory = useCallback(
    (categoryId: DrinkCategoryId, drinkId?: DrinkId) => {
      setSelectedCategoryId(categoryId);
      setSelectedDrinkId(drinkId ?? null);
      setContinuedFrom(null);
      resetListenFailure();
    },
    [resetListenFailure],
  );

  const selectPastBottle = useCallback(
    (
      categoryId: DrinkCategoryId,
      drinkId: DrinkId,
      source: ContinuedFromBottle,
    ) => {
      setSelectedCategoryId(categoryId);
      setSelectedDrinkId(drinkId);
      setContinuedFrom(source);
      resetListenFailure();
    },
    [resetListenFailure],
  );

  const startSpeaking = useCallback(async (): Promise<boolean> => {
    if (!selectedCategoryId) {
      registerListenFailure({
        advanceCount: false,
        reason: "startSpeaking: category not selected",
      });
      return false;
    }

    resetListenFailure();
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    setGenerationFailed(false);
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    resetRecordingPipelineDiagnostic();
    recorder.reset();
    phaseRef.current = "recording";
    setPhase("recording");
    const started = await recorder.start();
    if (!started) {
      // phaseRef を先に更新していれば onFatalError 経由で UI 化済み
      return false;
    }
    return true;
  }, [recorder, generation, selectedCategoryId, resetListenFailure, registerListenFailure]);

  const stopSpeaking = useCallback(() => {
    if (recorder.status === "recording" || recorder.status === "paused") {
      setRecordedAt(new Date().toISOString());
      recorder.stop();
      return;
    }

    if (phaseRef.current !== "recording") return;

    updateRecordingPipelineDiagnostic({
      pipelineError: "stopSpeaking called while recorder was not active",
    });
    registerListenFailure({
      advanceCount: true,
      reason: "stopSpeaking called while recorder was not active",
    });
  }, [recorder, registerListenFailure]);

  const pauseSpeaking = useCallback((): boolean => {
    return recorder.pause();
  }, [recorder]);

  const resumeSpeaking = useCallback((): boolean => {
    return recorder.resume();
  }, [recorder]);

  const retrySpeaking = useCallback(async (): Promise<boolean> => {
    setListenFailureVisible(false);
    setGenerationFailed(false);
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    resetRecordingPipelineDiagnostic();
    phaseRef.current = "recording";
    setPhase("recording");
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    const started = await recorder.start();
    if (!started) {
      return false;
    }
    return true;
  }, [recorder, generation]);

  const retryGeneration = useCallback(() => {
    if (!transcript || !selectedCategoryId) return;
    setGenerationFailed(false);
    inflightGenerationKeyRef.current = null;
    setPhase("accepted");
  }, [transcript, selectedCategoryId]);

  const abandonNightWithoutRecord = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    barAudioEngine.resumeJazzAfterRecording();
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setListenFailureVisible(false);
    setGenerationFailed(false);
    setIsDevSimulated(false);
    setPhase("idle");
  }, [recorder, generation]);

  const simulateDevNight = useCallback(
    (patternId?: FakeNightId): Drink | null => {
      if (!isDevShortcutEnabled()) return null;

      const simulated = simulateNight({ patternId });

      pipelineLock.current = false;
      inflightGenerationKeyRef.current = generationKey(
        simulated.transcript,
        simulated.recordedAt,
      );
      recorder.reset();
      generation.injectDevResult(simulated.record);

      setSelectedCategoryId(simulated.fake.categoryId);
      setSelectedDrinkId(simulated.fake.drinkId);
      setContinuedFrom(null);
      resetListenFailure();
      setTranscript(simulated.transcript);
      setRecordedAt(simulated.recordedAt);
      setIsDevSimulated(true);
      setPhase("accepted");

      queueMicrotask(() => {
        setPhase("revealed");
      });

      return simulated.drink;
    },
    [recorder, generation, resetListenFailure],
  );

  const runTranscribePipeline = useCallback(
    async (blob: Blob, mimeType: string) => {
      logRecordingPipeline("transcribe pipeline: start", {
        blobSize: blob.size,
        blobType: blob.type || mimeType,
        mimeType,
        minRecordingBytes: MIN_RECORDING_BYTES,
      });

      try {
        const { transcript: text, debug } = await transcribeAudio(blob, mimeType);

        updateRecordingPipelineDiagnostic({
          whisperRaw: debug?.whisperRaw,
          refinedTranscript: text,
        });

        logRecordingPipeline("transcribe pipeline: response", {
          transcriptLength: text.length,
          transcript: text,
        });

        const validation = validateTranscriptInput(text);
        if (!validation.ok) {
          const reason = `validation:${validation.code} — ${validation.message}`;
          updateRecordingPipelineDiagnostic({
            pipelineError: reason,
          });
          logRecordingPipeline("transcribe pipeline: validation failed", {
            code: validation.code,
            message: validation.message,
            transcriptLength: text.length,
            transcript: text,
          });
          registerListenFailure({
            advanceCount: true,
            reason,
          });
          return;
        }

        clearListenFailureUi();
        setTranscript(text);
        setPhase("accepted");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        updateRecordingPipelineDiagnostic({
          pipelineError: message,
        });
        logRecordingPipeline("transcribe pipeline: error", {
          error: message,
        });
        registerListenFailure({
          advanceCount: true,
          reason: `transcribe: ${message}`,
        });
      } finally {
        pipelineLock.current = false;
      }
    },
    [registerListenFailure, clearListenFailureUi],
  );

  useEffect(() => {
    if (phase !== "recording") return;
    if (recorder.status !== "stopped" || !recorder.blob) return;
    logRecordingPipeline("recording finished: resume BGM, enter processing", {
      audio: getBarAudioDiagnostics(),
      blobSize: recorder.blob.size,
      mimeType: recorder.mimeType,
      elapsedMs: recorder.elapsedMs,
    });
    barAudioEngine.resumeJazzAfterRecording();
    setPhase("processing");
  }, [phase, recorder.status, recorder.blob, recorder.mimeType, recorder.elapsedMs]);

  useEffect(() => {
    if (phase !== "processing") return;
    if (recorder.status !== "stopped") return;
    if (!recorder.blob || !recorder.mimeType) return;
    if (!selectedCategoryId) return;
    if (pipelineLock.current) return;

    pipelineLock.current = true;
    void runTranscribePipeline(recorder.blob, recorder.mimeType);
  }, [
    phase,
    recorder.status,
    recorder.blob,
    recorder.mimeType,
    selectedCategoryId,
    runTranscribePipeline,
  ]);

  useEffect(() => {
    if (phase !== "accepted") return;
    if (isDevSimulated) return;
    if (!transcript || !selectedCategoryId) return;

    const endedAt = recordedAt ?? new Date().toISOString();
    const key = generationKey(transcript, endedAt);
    if (inflightGenerationKeyRef.current === key) return;
    inflightGenerationKeyRef.current = key;

    logRecordingPipeline("diary generation: start", {
      transcriptLength: transcript.length,
      transcript,
      selectedCategoryId,
      selectedDrinkId,
    });

    updateRecordingPipelineDiagnostic({
      diaryTranscript: transcript,
    });

    void generation
      .generate(transcript, selectedCategoryId, endedAt, selectedDrinkId)
      .then((outcome) => {
        if (outcome.ok) {
          logRecordingPipeline("diary generation: success", {
            transcriptLength: transcript.length,
            transcript,
            bottleTag: outcome.diary.bottleTag,
            diaryPreview: outcome.diary.diary.slice(0, 120),
          });
          barAudioEngine.resumeJazzAfterRecording();
          setPhase("revealed");
          return;
        }
        logRecordingPipeline("diary generation: failed", {
          transcriptLength: transcript.length,
          transcript,
        });
        inflightGenerationKeyRef.current = null;
        setGenerationFailed(true);
        console.error("Background diary generation failed");
      });
  }, [
    phase,
    isDevSimulated,
    transcript,
    selectedCategoryId,
    selectedDrinkId,
    recordedAt,
    generation.generate,
  ]);

  return {
    phase,
    isDevSimulated,
    listenFailureCount,
    listenFailureVisible,
    listenFailureReason,
    transcript,
    record: generation.result,
    generationStatus: generation.status,
    generationFailed,
    selectedCategoryId,
    selectedDrinkId,
    continuedFrom,
    selectCategory,
    selectPastBottle,
    reset,
    startSpeaking,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    retrySpeaking,
    retryGeneration,
    abandonNightWithoutRecord,
    simulateDevNight,
    elapsedMs: recorder.elapsedMs,
    recorderStatus: recorder.status,
  };
}
