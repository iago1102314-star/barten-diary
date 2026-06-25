"use client";

import { checkGenerationReadiness } from "@/lib/ai/check-generation-readiness";
import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { fetchLatestDiaryForDev } from "@/lib/dev/fetch-latest-diary-for-dev";
import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { simulateNight } from "@/lib/dev/simulate-night";
import type { FakeNightId } from "@/lib/dev/fake-nights";
import {
  getDrinkById,
  type Drink,
} from "@/lib/drinks/drink-catalog";
import { fallbackDrinkFromName } from "@/lib/drinks/resolve-drink-from-bottle-tag";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { barAudioEngine, getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import {
  EMPTY_NIGHT_PIPELINE_TIMINGS,
  type NightPipelineTimings,
} from "@/lib/night/night-pipeline-timings";
import { runNightGenerationPipeline } from "@/lib/night/run-night-generation-pipeline";
import { validateRecordingForTranscribe } from "@/lib/night/validate-recording-for-transcribe";
import {
  getRecordingPipelineDiagnostic,
  resetRecordingPipelineDiagnostic,
  syncPipelineTimingsToDiagnostic,
  updateRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import { logRecordingPipeline, logRecordingPipelineError } from "@/lib/recorder/recording-pipeline-log";
import { useCallback, useEffect, useRef, useState } from "react";

export type NightPhase =
  | "idle"
  | "recording"
  /** 録音 blob のローカルチェックのみ */
  | "checking"
  /** チェック通過 — 店内エンディング中（生成はバックグラウンド） */
  | "ending"
  /** Whisper + 整形 + 生成完了 */
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
  const [pipelineTimings, setPipelineTimings] = useState<NightPipelineTimings>(
    EMPTY_NIGHT_PIPELINE_TIMINGS,
  );
  const pipelineTimingsRef = useRef(pipelineTimings);
  pipelineTimingsRef.current = pipelineTimings;

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
        phaseRef.current !== "checking"
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

  const resetPipelineTimings = useCallback(() => {
    setPipelineTimings(EMPTY_NIGHT_PIPELINE_TIMINGS);
    syncPipelineTimingsToDiagnostic(EMPTY_NIGHT_PIPELINE_TIMINGS);
  }, []);

  const applyPipelineTimings = useCallback(
    (
      updater:
        | NightPipelineTimings
        | ((prev: NightPipelineTimings) => NightPipelineTimings),
    ) => {
      setPipelineTimings((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        syncPipelineTimingsToDiagnostic(next);
        return next;
      });
    },
    [],
  );

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
      resetPipelineTimings();
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
    [recorder, generation, resetPipelineTimings],
  );

  registerListenFailureRef.current = registerListenFailure;

  const registerPipelineFailure = useCallback((reason: string) => {
    setGenerationFailed(true);
    logRecordingPipelineError("night pipeline: failed after ending", {
      reason,
      phase: phaseRef.current,
    });
    updateRecordingPipelineDiagnostic({ pipelineError: reason });
  }, []);

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
    resetPipelineTimings();
  }, [recorder, generation, resetListenFailure, resetPipelineTimings]);

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
    resetPipelineTimings();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    resetRecordingPipelineDiagnostic();
    recorder.reset();
    phaseRef.current = "recording";
    setPhase("recording");
    const started = await recorder.start();
    if (!started) {
      return false;
    }
    return true;
  }, [
    recorder,
    generation,
    selectedCategoryId,
    resetListenFailure,
    registerListenFailure,
    resetPipelineTimings,
  ]);

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
    resetPipelineTimings();
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
  }, [recorder, generation, resetPipelineTimings]);

  const runBackgroundGeneration = useCallback(
    async (blob: Blob, mimeType: string, endedAt: string) => {
      if (!selectedCategoryId) return;
      if (pipelineLock.current) return;

      pipelineLock.current = true;
      const key = `blob::${endedAt}::${blob.size}`;
      inflightGenerationKeyRef.current = key;
      setGenerationFailed(false);

      logRecordingPipeline("night pipeline: background start", {
        blobSize: blob.size,
        mimeType,
      });

      const result = await runNightGenerationPipeline({
        blob,
        mimeType,
        selectedCategoryId,
        selectedDrinkId,
        recordedAt: endedAt,
        generate: generation.generate,
      });

      setPipelineTimings((prev) => {
        const next = {
          ...prev,
          whisperMs: result.timings.whisperMs,
          readinessMs: result.timings.readinessMs,
          diaryGenerationMs: result.timings.diaryGenerationMs,
          totalMs: prev.recordingCheckMs + result.timings.totalMs,
        };
        syncPipelineTimingsToDiagnostic(next);
        return next;
      });

      if (!result.ok) {
        if (result.phase === "transcribe" || result.phase === "validation") {
          registerPipelineFailure(result.reason);
        } else {
          setGenerationFailed(true);
          updateRecordingPipelineDiagnostic({ pipelineError: result.reason });
          logRecordingPipeline("night pipeline: failed", {
            phase: result.phase,
            reason: result.reason,
            timings: result.timings,
          });
        }
        pipelineLock.current = false;
        return;
      }

      clearListenFailureUi();
      setTranscript(result.transcript);
      updateRecordingPipelineDiagnostic({
        diaryTranscript: result.transcript,
      });
      inflightGenerationKeyRef.current = generationKey(
        result.transcript,
        endedAt,
      );
      phaseRef.current = "revealed";
      setPhase("revealed");
      pipelineLock.current = false;

      logRecordingPipeline("night pipeline: complete", {
        timings: {
          ...pipelineTimingsRef.current,
          whisperMs: result.timings.whisperMs,
          readinessMs: result.timings.readinessMs,
          diaryGenerationMs: result.timings.diaryGenerationMs,
          totalMs: pipelineTimingsRef.current.recordingCheckMs + result.timings.totalMs,
        },
      });
    },
    [
      selectedCategoryId,
      selectedDrinkId,
      generation,
      registerPipelineFailure,
      clearListenFailureUi,
    ],
  );

  const runRecordingCheck = useCallback(
    (blob: Blob, mimeType: string, elapsedMs: number) => {
      if (!selectedCategoryId) return;

      const checkStartedAt = performance.now();
      logRecordingPipeline("recording check: start", {
        blobSize: blob.size,
        mimeType,
        elapsedMs,
      });

      const check = validateRecordingForTranscribe({
        blob,
        mimeType,
        elapsedMs,
      });
      const recordingCheckMs = Math.round(performance.now() - checkStartedAt);

      applyPipelineTimings((prev) => ({
        ...prev,
        recordingCheckMs,
      }));

      if (!check.ok) {
        updateRecordingPipelineDiagnostic({ pipelineError: check.reason });
        logRecordingPipeline("recording check: failed", {
          elapsedMs: recordingCheckMs,
          reason: check.reason,
        });
        registerListenFailure({
          advanceCount: true,
          reason: check.reason,
        });
        return;
      }

      logRecordingPipeline("recording check: ok", {
        elapsedMs: recordingCheckMs,
      });

      const endedAt = recordedAt ?? new Date().toISOString();
      phaseRef.current = "ending";
      setPhase("ending");
      void runBackgroundGeneration(blob, mimeType, endedAt);
    },
    [
      selectedCategoryId,
      recordedAt,
      registerListenFailure,
      runBackgroundGeneration,
      applyPipelineTimings,
    ],
  );

  const retryGeneration = useCallback(async () => {
    if (!transcript || !selectedCategoryId) return;

    setGenerationFailed(false);
    const endedAt = recordedAt ?? new Date().toISOString();
    const key = generationKey(transcript, endedAt);
    if (inflightGenerationKeyRef.current === key) return;

    inflightGenerationKeyRef.current = key;

    logRecordingPipeline("night pipeline: retry generation", {
      transcriptLength: transcript.length,
    });

    const readinessStartedAt = performance.now();
    const readiness = await checkGenerationReadiness();
    const readinessMs = Math.round(performance.now() - readinessStartedAt);

    if (!readiness.ok) {
      logRecordingPipeline("night pipeline: retry readiness failed", {
        elapsedMs: readinessMs,
        error: readiness.error,
      });
      updateRecordingPipelineDiagnostic({ pipelineError: readiness.error });
      setGenerationFailed(true);
      inflightGenerationKeyRef.current = null;
      return;
    }

    const diaryStartedAt = performance.now();
    const outcome = await generation.generate(
      transcript,
      selectedCategoryId,
      endedAt,
      selectedDrinkId,
    );
    const diaryGenerationMs = Math.round(performance.now() - diaryStartedAt);

    applyPipelineTimings((prev) => ({
      ...prev,
      readinessMs,
      diaryGenerationMs,
    }));

    if (!outcome.ok) {
      setGenerationFailed(true);
      inflightGenerationKeyRef.current = null;
      return;
    }

    phaseRef.current = "revealed";
    setPhase("revealed");
    logRecordingPipeline("night pipeline: retry generation complete", {
      diaryGenerationMs,
    });
  }, [transcript, selectedCategoryId, selectedDrinkId, recordedAt, generation, applyPipelineTimings]);

  const notifyStoreEndingComplete = useCallback(() => {
    const generationCompleteAtStoreEnding =
      phaseRef.current === "revealed" && generation.status === "success";

    applyPipelineTimings((prev) => ({
      ...prev,
      generationCompleteAtStoreEnding,
    }));

    logRecordingPipeline("store ending: complete", {
      generationCompleteAtStoreEnding,
      phase: phaseRef.current,
      generationStatus: generation.status,
      pipelineTimings: {
        ...pipelineTimingsRef.current,
        generationCompleteAtStoreEnding,
      },
    });
  }, [generation.status, applyPipelineTimings]);

  const recordAlleyWaitComplete = useCallback((alleyWaitMs: number) => {
    applyPipelineTimings((prev) => ({
      ...prev,
      alleyWaitMs,
    }));
    logRecordingPipeline("alley wait: complete", {
      alleyWaitMs,
      pipelineTimings: {
        ...pipelineTimingsRef.current,
        alleyWaitMs,
      },
    });
  }, [applyPipelineTimings]);

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
    resetPipelineTimings();
    setPhase("idle");
  }, [recorder, generation, resetPipelineTimings]);

  const prepareDevSkipFromLatestDiary = useCallback(async (): Promise<Drink | null> => {
    if (!isDevShortcutEnabled()) return null;

    const snapshot = await fetchLatestDiaryForDev();
    if (!snapshot) return null;

    const drink =
      getDrinkById(snapshot.drinkId) ??
      fallbackDrinkFromName(snapshot.drinkName);
    const endedAt = new Date().toISOString();

    phaseRef.current = "revealed";
    setPhase("revealed");
    pipelineLock.current = false;
    barAudioEngine.resumeJazzAfterRecording();
    recorder.reset();
    generation.reset();
    resetListenFailure();
    generation.injectDevResult(snapshot.record);
    inflightGenerationKeyRef.current = generationKey(
      snapshot.transcript,
      endedAt,
    );
    setSelectedCategoryId(snapshot.categoryId);
    setSelectedDrinkId(snapshot.drinkId);
    setContinuedFrom(null);
    setTranscript(snapshot.transcript);
    setRecordedAt(endedAt);
    setIsDevSimulated(false);
    setGenerationFailed(false);

    return drink;
  }, [recorder, generation, resetListenFailure]);

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
      phaseRef.current = "revealed";
      setPhase("revealed");

      return simulated.drink;
    },
    [recorder, generation, resetListenFailure],
  );

  useEffect(() => {
    if (phase !== "recording") return;
    if (recorder.status !== "stopped" || !recorder.blob) return;
    logRecordingPipeline("recording finished: resume BGM, enter checking", {
      audio: getBarAudioDiagnostics(),
      blobSize: recorder.blob.size,
      mimeType: recorder.mimeType,
      elapsedMs: recorder.elapsedMs,
    });
    barAudioEngine.resumeJazzAfterRecording();
    setPhase("checking");
  }, [phase, recorder.status, recorder.blob, recorder.mimeType, recorder.elapsedMs]);

  useEffect(() => {
    if (phase !== "checking") return;
    if (recorder.status !== "stopped") return;
    if (!recorder.blob || !recorder.mimeType) return;
    if (!selectedCategoryId) return;

    runRecordingCheck(recorder.blob, recorder.mimeType, recorder.elapsedMs);
  }, [
    phase,
    recorder.status,
    recorder.blob,
    recorder.mimeType,
    recorder.elapsedMs,
    selectedCategoryId,
    runRecordingCheck,
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
    pipelineTimings,
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
    notifyStoreEndingComplete,
    recordAlleyWaitComplete,
    abandonNightWithoutRecord,
    simulateDevNight,
    prepareDevSkipFromLatestDiary,
    elapsedMs: recorder.elapsedMs,
    recorderStatus: recorder.status,
  };
}
