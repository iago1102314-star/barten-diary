"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DURATION_MS = 3 * 60 * 1000;

export type RecorderStatus = "idle" | "recording" | "stopped" | "error";

type UseRecorderState = {
  status: RecorderStatus;
  error: string | null;
  blob: Blob | null;
  audioUrl: string | null;
  elapsedMs: number;
  mimeType: string | null;
};

function getSupportedMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type UseRecorderReturn = ReturnType<typeof useRecorder>;

export function useRecorder() {
  const [state, setState] = useState<UseRecorderState>({
    status: "idle",
    error: null,
    blob: null,
    audioUrl: null,
    elapsedMs: 0,
    mimeType: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    stopMediaTracks();
    chunksRef.current = [];
    revokeAudioUrl();

    setState({
      status: "idle",
      error: null,
      blob: null,
      audioUrl: null,
      elapsedMs: 0,
      mimeType: null,
    });
  }, [clearTimers, revokeAudioUrl, stopMediaTracks]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "このブラウザでは録音がサポートされていません。",
      }));
      return;
    }

    reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearTimers();
        stopMediaTracks();
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "録音中にエラーが発生しました。",
        }));
      };

      recorder.onstop = () => {
        clearTimers();
        stopMediaTracks();

        const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedMimeType });
        chunksRef.current = [];

        revokeAudioUrl();
        const audioUrl = URL.createObjectURL(blob);
        audioUrlRef.current = audioUrl;

        const elapsedMs = Math.min(
          Date.now() - startTimeRef.current,
          MAX_DURATION_MS,
        );

        setState({
          status: "stopped",
          error: null,
          blob,
          audioUrl,
          elapsedMs,
          mimeType: recordedMimeType,
        });

        mediaRecorderRef.current = null;
      };

      startTimeRef.current = Date.now();

      recorder.start(250);

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setState((prev) => ({
          ...prev,
          elapsedMs: Math.min(elapsed, MAX_DURATION_MS),
        }));
      }, 200);

      maxDurationTimerRef.current = setTimeout(() => {
        stop();
      }, MAX_DURATION_MS);

      setState({
        status: "recording",
        error: null,
        blob: null,
        audioUrl: null,
        elapsedMs: 0,
        mimeType: recorder.mimeType || mimeType || null,
      });
    } catch (err) {
      clearTimers();
      stopMediaTracks();

      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "マイクの使用が許可されていません。ブラウザの設定を確認してください。"
          : "録音の開始に失敗しました。マイクが接続されているか確認してください。";

      setState({
        status: "error",
        error: message,
        blob: null,
        audioUrl: null,
        elapsedMs: 0,
        mimeType: null,
      });
    }
  }, [clearTimers, reset, revokeAudioUrl, stop, stopMediaTracks]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      stopMediaTracks();
      revokeAudioUrl();
    };
  }, [clearTimers, revokeAudioUrl, stopMediaTracks]);

  return {
    ...state,
    maxDurationMs: MAX_DURATION_MS,
    formatElapsed,
    start,
    stop,
    reset,
  };
}
