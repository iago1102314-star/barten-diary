"use client";

import { logBehaviorEvent } from "@/lib/analytics/behavior-log";
import { checkGenerationReadiness } from "@/lib/ai/check-generation-readiness";
import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { fetchLatestDiaryForDev } from "@/lib/dev/fetch-latest-diary-for-dev";
import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { simulateNight } from "@/lib/dev/simulate-night";
import type { FakeNightId } from "@/lib/dev/fake-nights";
import {
  fallbackDrinkFromName,
  resolveDrinkById,
} from "@/lib/drinks/resolve-drink-from-bottle-tag";
import type { Drink, DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { barAudioEngine, getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import {
  EMPTY_NIGHT_PIPELINE_TIMINGS,
  sumPipelineProcessingMs,
  type NightPipelineTimings,
} from "@/lib/night/night-pipeline-timings";
import type {
  NightPipelineFailurePhase,
  NightSaveStatus,
} from "@/lib/night/night-pipeline-types";
import { runNightGenerationPipeline } from "@/lib/night/run-night-generation-pipeline";
import { runNightSave } from "@/lib/night/run-night-save";
import type { NightSavePayload } from "@/lib/night/night-pipeline-types";
import {
  addGuestDiaryDraft,
  buildGuestDiaryDraftFromNightSave,
  removeGuestDiaryDraftByTranscript,
} from "@/lib/night/guest-diary-drafts";
import { createClient } from "@/lib/supabase/client";
import { validateRecordingForTranscribe } from "@/lib/night/validate-recording-for-transcribe";
import {
  getRecordingPipelineDiagnostic,
  resetRecordingPipelineDiagnostic,
  syncPipelineTimingsToDiagnostic,
  updateRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import { logRecordingPipeline, logRecordingPipelineError } from "@/lib/recorder/recording-pipeline-log";
import { useRouter } from "next/navigation";
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

export type DevSkipToPostRecordResult =
  | { ok: true; drink: Drink; usedFallback: boolean }
  | { ok: false; error: string };

type UseNightSessionOptions = {
  /** 最大録音時間到達 — MediaRecorder.stop() の直前 */
  onMaxDurationReached?: () => void;
};

export function useNightSession(options: UseNightSessionOptions = {}) {
  const router = useRouter();
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
  const [dailyGenerationLimitReached, setDailyGenerationLimitReached] =
    useState(false);
  const [pipelineFailurePhase, setPipelineFailurePhase] =
    useState<NightPipelineFailurePhase | null>(null);
  const [saveStatus, setSaveStatus] = useState<NightSaveStatus>("idle");
  const [savedDiaryId, setSavedDiaryId] = useState<string | null>(null);
  const [pipelineTimings, setPipelineTimings] = useState<NightPipelineTimings>(
    EMPTY_NIGHT_PIPELINE_TIMINGS,
  );
  const pipelineTimingsRef = useRef(pipelineTimings);
  pipelineTimingsRef.current = pipelineTimings;

  const pipelineLock = useRef(false);
  const inflightGenerationKeyRef = useRef<string | null>(null);
  const recordingBlobRef = useRef<{
    blob: Blob;
    mimeType: string;
    endedAt: string;
  } | null>(null);
  const pipelineStartAtRef = useRef<number | null>(null);
  const lastSavedTranscriptRef = useRef<string | null>(null);
  const registerListenFailureRef = useRef<
    (options?: { advanceCount?: boolean; reason?: string }) => void
  >(() => {});
  const onMaxDurationReachedRef = useRef(options.onMaxDurationReached);
  onMaxDurationReachedRef.current = options.onMaxDurationReached;

  const recorder = useRecorder({
    onRecordingStarted: () => {
      barAudioEngine.pauseJazzForRecording();
    },
    onMaxDurationReached: () => {
      onMaxDurationReachedRef.current?.();
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

  const registerPipelineFailure = useCallback(
    (reason: string, phase: NightPipelineFailurePhase) => {
      setGenerationFailed(true);
      setDailyGenerationLimitReached(false);
      setPipelineFailurePhase(phase);
      logRecordingPipelineError("night pipeline: failed after ending", {
        reason,
        phase,
        sessionPhase: phaseRef.current,
      });
      updateRecordingPipelineDiagnostic({ pipelineError: reason });
    },
    [],
  );

  const registerDailyGenerationLimit = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    setGenerationFailed(false);
    setPipelineFailurePhase(null);
    setDailyGenerationLimitReached(true);
    logRecordingPipeline("night pipeline: daily generation limit reached");
    updateRecordingPipelineDiagnostic({
      pipelineError: "daily generation limit reached",
    });
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
    setDailyGenerationLimitReached(false);
    setPipelineFailurePhase(null);
    setSaveStatus("idle");
    setSavedDiaryId(null);
    lastSavedTranscriptRef.current = null;
    recordingBlobRef.current = null;
    pipelineStartAtRef.current = null;
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
    setPipelineFailurePhase(null);
    resetPipelineTimings();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setSaveStatus("idle");
    setSavedDiaryId(null);
    lastSavedTranscriptRef.current = null;
    recordingBlobRef.current = null;
    pipelineStartAtRef.current = null;
    resetRecordingPipelineDiagnostic();
    recorder.reset();
    phaseRef.current = "recording";
    setPhase("recording");
    const started = await recorder.start();
    if (!started) {
      return false;
    }
    void logBehaviorEvent("record_start", {
      categoryId: selectedCategoryId,
      drinkId: selectedDrinkId,
    });
    return true;
  }, [
    recorder,
    generation,
    selectedCategoryId,
    selectedDrinkId,
    resetListenFailure,
    registerListenFailure,
    resetPipelineTimings,
  ]);

  const stopSpeaking = useCallback(() => {
    if (recorder.status === "recording" || recorder.status === "paused") {
      setRecordedAt(new Date().toISOString());
      void logBehaviorEvent("record_finish", {
        categoryId: selectedCategoryId,
        drinkId: selectedDrinkId,
      });
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
  }, [recorder, registerListenFailure, selectedCategoryId, selectedDrinkId]);

  const retrySpeaking = useCallback(async (): Promise<boolean> => {
    setListenFailureVisible(false);
    setGenerationFailed(false);
    setPipelineFailurePhase(null);
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

  /** 聞き取り失敗後 — 録音は始めず、口をつけるからやり直す */
  const prepareRetryFromSip = useCallback(() => {
    setListenFailureVisible(false);
    setGenerationFailed(false);
    setPipelineFailurePhase(null);
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    recordingBlobRef.current = null;
    pipelineStartAtRef.current = null;
    lastSavedTranscriptRef.current = null;
    setSaveStatus("idle");
    setSavedDiaryId(null);
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    resetPipelineTimings();
    updateRecordingPipelineDiagnostic({ pipelineError: undefined });
    recorder.reset();
    barAudioEngine.resumeJazzAfterRecording();
    phaseRef.current = "idle";
    setPhase("idle");
  }, [recorder, generation, resetPipelineTimings]);

  const buildSavePayload = useCallback((): NightSavePayload | null => {
    const record = generation.result;
    if (!record || !transcript) return null;

    return {
      bottleTag: record.bottleTag,
      diary: record.diary,
      drinkNote: record.drinkNote,
      masterComment: record.masterComment,
      transcript,
      continuedFromDiaryId: continuedFrom?.diaryId ?? null,
      continuedFromBottleTag: continuedFrom?.bottleTag ?? null,
    };
  }, [generation.result, transcript, continuedFrom]);

  const deferSaveForLogin = useCallback(() => {
    const payload = buildSavePayload();
    if (payload) {
      addGuestDiaryDraft(buildGuestDiaryDraftFromNightSave(payload));
    }
    setSaveStatus("loginRequired");
  }, [buildSavePayload]);

  const executeSave = useCallback(async (): Promise<boolean> => {
    if (isDevSimulated) return false;

    const payload = buildSavePayload();
    if (!payload) return false;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      deferSaveForLogin();
      logRecordingPipeline("save deferred: login required (client guard)");
      return false;
    }

    setSaveStatus("saving");
    setGenerationFailed(false);
    setPipelineFailurePhase(null);

    const result = await runNightSave(payload);

    if (!result.ok) {
      if (result.needsLogin) {
        deferSaveForLogin();
        logRecordingPipeline("save deferred: login required");
        return false;
      }

      lastSavedTranscriptRef.current = null;
      setSaveStatus("failed");
      setGenerationFailed(true);
      setPipelineFailurePhase("save");
      updateRecordingPipelineDiagnostic({ pipelineError: result.reason });
      applyPipelineTimings((prev) => ({
        ...prev,
        saveMs: result.saveMs,
        totalMs: sumPipelineProcessingMs({ ...prev, saveMs: result.saveMs }),
      }));
      return false;
    }

    if (payload) {
      removeGuestDiaryDraftByTranscript(payload.transcript);
    }
    setSavedDiaryId(result.diaryId);
    setSaveStatus("saved");
    void logBehaviorEvent("save_diary", { diaryId: result.diaryId });
    applyPipelineTimings((prev) => {
      const next = {
        ...prev,
        saveMs: result.saveMs,
        totalMs: sumPipelineProcessingMs({ ...prev, saveMs: result.saveMs }),
      };
      logRecordingPipeline("pipeline timings", { pipelineTimings: next });
      return next;
    });
    router.refresh();
    return true;
  }, [
    isDevSimulated,
    buildSavePayload,
    deferSaveForLogin,
    applyPipelineTimings,
    router,
  ]);

  const runBackgroundGeneration = useCallback(
    async (blob: Blob, mimeType: string, endedAt: string) => {
      if (!selectedCategoryId) return;
      if (pipelineLock.current) return;

      pipelineLock.current = true;
      pipelineStartAtRef.current = performance.now();
      const key = `blob::${endedAt}::${blob.size}`;
      inflightGenerationKeyRef.current = key;
      setGenerationFailed(false);
      setPipelineFailurePhase(null);
      setSaveStatus("pending");
      setSavedDiaryId(null);
      lastSavedTranscriptRef.current = null;

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
          totalMs: sumPipelineProcessingMs({
            recordingCheckMs: prev.recordingCheckMs,
            whisperMs: result.timings.whisperMs,
            readinessMs: result.timings.readinessMs,
            diaryGenerationMs: result.timings.diaryGenerationMs,
            saveMs: prev.saveMs,
          }),
        };
        syncPipelineTimingsToDiagnostic(next);
        return next;
      });

      if (!result.ok) {
        if (result.dailyLimitReached) {
          registerDailyGenerationLimit();
        } else {
          registerPipelineFailure(result.reason, result.phase);
        }
        pipelineLock.current = false;
        return;
      }

      clearListenFailureUi();
      setTranscript(result.transcript);
      updateRecordingPipelineDiagnostic({
        diaryTranscript: result.transcript,
        refinedTranscript: result.transcript,
        whisperRaw: result.whisperRaw,
      });
      inflightGenerationKeyRef.current = generationKey(
        result.transcript,
        endedAt,
      );
      phaseRef.current = "revealed";
      setPhase("revealed");
      pipelineLock.current = false;

      void logBehaviorEvent("generate_success", {
        categoryId: selectedCategoryId,
        drinkId: selectedDrinkId,
      });

      logRecordingPipeline("night pipeline: complete", {
        timings: pipelineTimingsRef.current,
      });
    },
    [
      selectedCategoryId,
      selectedDrinkId,
      generation,
      registerPipelineFailure,
      registerDailyGenerationLimit,
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
      recordingBlobRef.current = { blob, mimeType, endedAt };
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

  const retryGeneration = useCallback(async (): Promise<boolean> => {
    if (!transcript || !selectedCategoryId) return false;

    setGenerationFailed(false);
    setPipelineFailurePhase(null);
    setSaveStatus("pending");
    lastSavedTranscriptRef.current = null;
    const endedAt = recordedAt ?? new Date().toISOString();
    const key = generationKey(transcript, endedAt);
    if (inflightGenerationKeyRef.current === key) return false;

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
      setPipelineFailurePhase("readiness");
      inflightGenerationKeyRef.current = null;
      return false;
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
      totalMs: sumPipelineProcessingMs({
        ...prev,
        readinessMs,
        diaryGenerationMs,
      }),
    }));

    if (!outcome.ok) {
      if (outcome.dailyLimitReached) {
        registerDailyGenerationLimit();
      } else {
        setGenerationFailed(true);
        setPipelineFailurePhase("generation");
        updateRecordingPipelineDiagnostic({
          pipelineError: outcome.ambient.lines.join("\n"),
        });
      }
      inflightGenerationKeyRef.current = null;
      return false;
    }

    phaseRef.current = "revealed";
    setPhase("revealed");
    void logBehaviorEvent("generate_success", {
      categoryId: selectedCategoryId,
      drinkId: selectedDrinkId,
      retry: true,
    });
    logRecordingPipeline("night pipeline: retry generation complete", {
      diaryGenerationMs,
    });
    return true;
  }, [transcript, selectedCategoryId, selectedDrinkId, recordedAt, generation, applyPipelineTimings, registerDailyGenerationLimit]);

  const restartRecordingAfterPipelineFailure =
    useCallback(async (): Promise<boolean> => {
      pipelineLock.current = false;
      inflightGenerationKeyRef.current = null;
      recordingBlobRef.current = null;
      pipelineStartAtRef.current = null;
      lastSavedTranscriptRef.current = null;
      setGenerationFailed(false);
      setPipelineFailurePhase(null);
      setSaveStatus("idle");
      setSavedDiaryId(null);
      setListenFailureVisible(false);
      setListenFailureReason(null);
      generation.reset();
      setTranscript(null);
      setRecordedAt(null);
      resetPipelineTimings();
      updateRecordingPipelineDiagnostic({ pipelineError: undefined });
      recorder.reset();
      phaseRef.current = "recording";
      setPhase("recording");

      logRecordingPipeline("pipeline failure: restart recording from scratch");

      const started = await recorder.start();
      if (!started) {
        registerListenFailure({
          advanceCount: false,
          reason: "restartRecordingAfterPipelineFailure: recorder.start failed",
        });
        return false;
      }

      barAudioEngine.pauseJazzForRecording();
      return true;
    }, [recorder, generation, resetPipelineTimings, registerListenFailure]);

  const notifyStoreEndingComplete = useCallback(() => {
    const generationCompleteAtStoreEnding =
      phaseRef.current === "revealed" && generation.status === "success";
    const waitingInStoreMs = pipelineStartAtRef.current
      ? Math.round(performance.now() - pipelineStartAtRef.current)
      : 0;

    applyPipelineTimings((prev) => {
      const next = {
        ...prev,
        generationCompleteAtStoreEnding,
        waitingInStoreMs,
      };
      logRecordingPipeline("store ending: complete", {
        generationCompleteAtStoreEnding,
        phase: phaseRef.current,
        generationStatus: generation.status,
        pipelineTimings: next,
      });
      return next;
    });
  }, [generation.status, applyPipelineTimings]);

  const recordWaitingInAlleyComplete = useCallback((waitingInAlleyMs: number) => {
    applyPipelineTimings((prev) => {
      const next = {
        ...prev,
        waitingInAlleyMs,
      };
      logRecordingPipeline("alley wait: complete", {
        waitingInAlleyMs,
        pipelineTimings: next,
      });
      return next;
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
    setPipelineFailurePhase(null);
    setSaveStatus("idle");
    setSavedDiaryId(null);
    lastSavedTranscriptRef.current = null;
    recordingBlobRef.current = null;
    pipelineStartAtRef.current = null;
    resetPipelineTimings();
    setPhase("idle");
  }, [recorder, generation, resetPipelineTimings]);

  useEffect(() => {
    if (isDevSimulated) return;
    if (phase !== "revealed" || !generation.result || !transcript) return;
    if (
      saveStatus === "saving" ||
      saveStatus === "saved" ||
      saveStatus === "failed" ||
      saveStatus === "loginRequired"
    ) {
      return;
    }
    if (lastSavedTranscriptRef.current === transcript) return;

    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      lastSavedTranscriptRef.current = transcript;

      if (!user) {
        deferSaveForLogin();
        logRecordingPipeline("save skipped: login required before save");
        return;
      }

      void executeSave();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    phase,
    generation.result,
    transcript,
    isDevSimulated,
    saveStatus,
    executeSave,
    deferSaveForLogin,
  ]);

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
      setGenerationFailed(false);
      setPipelineFailurePhase(null);
      setSaveStatus("idle");
      setSavedDiaryId(null);
      lastSavedTranscriptRef.current = null;
      phaseRef.current = "revealed";
      setPhase("revealed");

      return simulated.drink;
    },
    [recorder, generation, resetListenFailure],
  );

  const prepareDevSkipFromLatestDiary =
    useCallback(async (): Promise<DevSkipToPostRecordResult> => {
      if (!isDevShortcutEnabled()) {
        return { ok: false, error: "開発用ショートカットが無効です。" };
      }

      const applySimulatedNight = (): DevSkipToPostRecordResult => {
        const drink = simulateDevNight("dev");
        if (!drink) {
          return { ok: false, error: "開発用の仮データを読み込めませんでした。" };
        }
        return { ok: true, drink, usedFallback: true };
      };

      const latest = await fetchLatestDiaryForDev();
      if (!latest.ok) {
        const fallback = applySimulatedNight();
        if (fallback.ok) return fallback;
        return { ok: false, error: latest.error };
      }

      const snapshot = latest.snapshot;
      const drink =
        resolveDrinkById(snapshot.drinkId) ??
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
      setPipelineFailurePhase(null);
      setSaveStatus("saved");
      setSavedDiaryId(snapshot.diaryId);
      lastSavedTranscriptRef.current = snapshot.transcript;

      return { ok: true, drink, usedFallback: false };
    }, [recorder, generation, resetListenFailure, simulateDevNight]);

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
    dailyGenerationLimitReached,
    pipelineFailurePhase,
    saveStatus,
    savedDiaryId,
    pipelineTimings,
    selectedCategoryId,
    selectedDrinkId,
    continuedFrom,
    selectCategory,
    selectPastBottle,
    reset,
    startSpeaking,
    stopSpeaking,
    retrySpeaking,
    prepareRetryFromSip,
    retryGeneration,
    restartRecordingAfterPipelineFailure,
    notifyStoreEndingComplete,
    recordWaitingInAlleyComplete,
    abandonNightWithoutRecord,
    simulateDevNight,
    prepareDevSkipFromLatestDiary,
    elapsedMs: recorder.elapsedMs,
    recorderStatus: recorder.status,
    recordedAt,
  };
}
