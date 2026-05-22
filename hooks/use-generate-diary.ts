"use client";

import { generateDiaryFromTranscript } from "@/lib/ai/generate-diary-client";
import type { GeneratedDiary } from "@/lib/ai/types";
import {
  ambientMessageFromTranscriptError,
  ambientMessageFromUnknownFailure,
  type AmbientMessage,
} from "@/lib/night/ambient-messages";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { useCallback, useState } from "react";

export type GenerateDiaryStatus = "idle" | "loading" | "success" | "error";

export type GenerateDiaryOutcome =
  | { ok: true; diary: GeneratedDiary }
  | { ok: false; ambient: AmbientMessage };

export function useGenerateDiary() {
  const [status, setStatus] = useState<GenerateDiaryStatus>("idle");
  const [result, setResult] = useState<GeneratedDiary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (
      transcript: string,
      selectedCategoryId: DrinkCategoryId,
      recordedAt?: string,
      selectedDrinkId?: DrinkId | null,
    ): Promise<GenerateDiaryOutcome> => {
      setStatus("loading");
      setResult(null);
      setError(null);

      try {
        const generated = await generateDiaryFromTranscript(transcript, {
          recordedAt,
          selectedCategoryId,
          selectedDrinkId,
        });
        setResult(generated);
        setStatus("success");
        return { ok: true, diary: generated };
      } catch (err) {
        setStatus("error");
        const message = err instanceof Error ? err.message : null;
        const ambient =
          message != null
            ? ambientMessageFromTranscriptError(message)
            : ambientMessageFromUnknownFailure();
        setError(ambient.lines.join("\n"));
        return { ok: false, ambient };
      }
    },
    [],
  );

  return {
    status,
    result,
    error,
    generate,
    reset,
  };
}
