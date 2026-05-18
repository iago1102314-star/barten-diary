"use client";

import { generateDiaryFromTranscript } from "@/lib/ai/generate-diary-client";
import type { GeneratedDiary } from "@/lib/ai/types";
import { useCallback, useState } from "react";

export type GenerateDiaryStatus = "idle" | "loading" | "success" | "error";

export function useGenerateDiary() {
  const [status, setStatus] = useState<GenerateDiaryStatus>("idle");
  const [result, setResult] = useState<GeneratedDiary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const generate = useCallback(async (transcript: string) => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const generated = await generateDiaryFromTranscript(transcript);
      setResult(generated);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "AI日記の生成に失敗しました。",
      );
    }
  }, []);

  return {
    status,
    result,
    error,
    generate,
    reset,
  };
}
