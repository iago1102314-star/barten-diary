"use client";

import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { validateTranscriptInput } from "@/lib/ai/security/validate-input";
import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { simulateNight } from "@/lib/dev/simulate-night";
import type { FakeNightId } from "@/lib/dev/fake-nights";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
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
  const registerListenFailureRef = useRef<() => void>(() => {});

  const recorder = useRecorder({
    onFatalError: () => {
      if (
        phaseRef.current !== "recording" &&
        phaseRef.current !== "processing"
      ) {
        return;
      }
      registerListenFailureRef.current();
    },
  });

  const registerListenFailure = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    barAudioEngine.resumeJazzAfterRecording();
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setGenerationFailed(false);
    setListenFailureCount((count) => count + 1);
    setListenFailureVisible(true);
    setPhase("recording");
  }, [recorder, generation]);

  registerListenFailureRef.current = registerListenFailure;

  const resetListenFailure = useCallback(() => {
    setListenFailureCount(0);
    setListenFailureVisible(false);
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

  const startSpeaking = useCallback(async () => {
    if (!selectedCategoryId) return;

    resetListenFailure();
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    setGenerationFailed(false);
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    barAudioEngine.pauseJazzForRecording();
    setPhase("recording");
    await recorder.start();
  }, [recorder, generation, selectedCategoryId, resetListenFailure]);

  const stopSpeaking = useCallback(() => {
    if (recorder.status !== "recording" && recorder.status !== "paused") return;
    setRecordedAt(new Date().toISOString());
    recorder.stop();
  }, [recorder]);

  const pauseSpeaking = useCallback((): boolean => {
    return recorder.pause();
  }, [recorder]);

  const resumeSpeaking = useCallback((): boolean => {
    return recorder.resume();
  }, [recorder]);

  const retrySpeaking = useCallback(async () => {
    setListenFailureVisible(false);
    setGenerationFailed(false);
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    barAudioEngine.pauseJazzForRecording();
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setPhase("recording");
    await recorder.start();
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
      try {
        const { transcript: text } = await transcribeAudio(blob, mimeType);

        const validation = validateTranscriptInput(text);
        if (!validation.ok) {
          registerListenFailure();
          return;
        }

        clearListenFailureUi();
        setTranscript(text);
        setPhase("accepted");
      } catch {
        registerListenFailure();
      } finally {
        pipelineLock.current = false;
      }
    },
    [registerListenFailure, clearListenFailureUi],
  );

  useEffect(() => {
    if (phase !== "recording") return;
    if (recorder.status !== "stopped" || !recorder.blob) return;
    setPhase("processing");
  }, [phase, recorder.status, recorder.blob]);

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

    void generation
      .generate(transcript, selectedCategoryId, endedAt, selectedDrinkId)
      .then((outcome) => {
        if (outcome.ok) {
          barAudioEngine.resumeJazzAfterRecording();
          setPhase("revealed");
          return;
        }
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
