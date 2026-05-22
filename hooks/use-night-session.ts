"use client";

import { useGenerateDiary } from "@/hooks/use-generate-diary";
import { useRecorder } from "@/hooks/use-recorder";
import { validateTranscriptInput } from "@/lib/ai/security/validate-input";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
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
  const recorder = useRecorder();
  const generation = useGenerateDiary();
  const [phase, setPhase] = useState<NightPhase>("idle");
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
  const pipelineLock = useRef(false);
  const inflightGenerationKeyRef = useRef<string | null>(null);

  const registerListenFailure = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setListenFailureCount((count) => count + 1);
    setListenFailureVisible(true);
    setPhase("recording");
  }, [recorder, generation]);

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
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setPhase("recording");
    await recorder.start();
  }, [recorder, generation, selectedCategoryId, resetListenFailure]);

  const stopSpeaking = useCallback(() => {
    if (recorder.status !== "recording" && recorder.status !== "paused") return;
    setRecordedAt(new Date().toISOString());
    setPhase("processing");
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
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setPhase("recording");
    await recorder.start();
  }, [recorder, generation]);

  const abandonNightWithoutRecord = useCallback(() => {
    pipelineLock.current = false;
    inflightGenerationKeyRef.current = null;
    recorder.reset();
    generation.reset();
    setTranscript(null);
    setRecordedAt(null);
    setListenFailureVisible(false);
    setPhase("idle");
  }, [recorder, generation]);

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
    if (!transcript || !selectedCategoryId) return;

    const endedAt = recordedAt ?? new Date().toISOString();
    const key = generationKey(transcript, endedAt);
    if (inflightGenerationKeyRef.current === key) return;
    inflightGenerationKeyRef.current = key;

    void generation
      .generate(transcript, selectedCategoryId, endedAt, selectedDrinkId)
      .then((outcome) => {
        if (outcome.ok) {
          setPhase("revealed");
          return;
        }
        inflightGenerationKeyRef.current = null;
        console.error("Background diary generation failed");
      });
  }, [
    phase,
    transcript,
    selectedCategoryId,
    selectedDrinkId,
    recordedAt,
    generation.generate,
  ]);

  useEffect(() => {
    if (recorder.status === "error" && phase === "recording") {
      registerListenFailure();
    }
  }, [recorder.status, recorder.error, phase, registerListenFailure]);

  return {
    phase,
    listenFailureCount,
    listenFailureVisible,
    transcript,
    record: generation.result,
    generationStatus: generation.status,
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
    abandonNightWithoutRecord,
    elapsedMs: recorder.elapsedMs,
    recorderStatus: recorder.status,
  };
}
