"use client";

import { transcribeAudio } from "@/lib/transcribe/transcribe-audio";
import { useCallback, useState } from "react";

export type TranscribeStatus = "idle" | "loading" | "success" | "error";

export function useTranscribe() {
  const [status, setStatus] = useState<TranscribeStatus>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTranscript(null);
    setError(null);
  }, []);

  const transcribe = useCallback(async (blob: Blob, mimeType: string) => {
    setStatus("loading");
    setError(null);
    setTranscript(null);

    try {
      const result = await transcribeAudio(blob, mimeType);
      setTranscript(result.transcript);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "文字起こしに失敗しました。",
      );
    }
  }, []);

  return {
    status,
    transcript,
    error,
    transcribe,
    reset,
  };
}
