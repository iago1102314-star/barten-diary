"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DURATION_MS = 3 * 60 * 1000;

export type RecorderStatus =
  | "idle"
  | "recording"
  | "paused"
  | "stopped"
  | "error";

type UseRecorderState = {
  status: RecorderStatus;
  error: string | null;
  blob: Blob | null;
  audioUrl: string | null;
  elapsedMs: number;
  mimeType: string | null;
  canPauseRecording: boolean;
};

export function canPauseRecorder(recorder: MediaRecorder): boolean {
  return (
    typeof recorder.pause === "function" &&
    typeof recorder.resume === "function"
  );
}

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
    canPauseRecording: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalPausedMsRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const remainingMaxDurationMsRef = useRef<number>(MAX_DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getActiveElapsedMs = useCallback(() => {
    return Math.min(
      Date.now() - startTimeRef.current - totalPausedMsRef.current,
      MAX_DURATION_MS,
    );
  }, []);

  const clearElapsedTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearElapsedTimer();
    clearMaxDurationTimer();
  }, [clearElapsedTimer, clearMaxDurationTimer]);

  const startElapsedTimer = useCallback(() => {
    clearElapsedTimer();
    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedMs: getActiveElapsedMs(),
      }));
    }, 200);
  }, [clearElapsedTimer, getActiveElapsedMs]);

  const startMaxDurationTimer = useCallback(() => {
    clearMaxDurationTimer();
    maxDurationTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === "paused") {
        try {
          mediaRecorderRef.current.resume();
        } catch {
          // resume failure is handled by stop attempt below
        }
      }
      if (
        mediaRecorderRef.current?.state === "recording" ||
        mediaRecorderRef.current?.state === "paused"
      ) {
        mediaRecorderRef.current.stop();
      }
    }, remainingMaxDurationMsRef.current);
  }, [clearMaxDurationTimer]);

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
    totalPausedMsRef.current = 0;
    pauseStartedAtRef.current = null;
    remainingMaxDurationMsRef.current = MAX_DURATION_MS;

    setState({
      status: "idle",
      error: null,
      blob: null,
      audioUrl: null,
      elapsedMs: 0,
      mimeType: null,
      canPauseRecording: false,
    });
  }, [clearTimers, revokeAudioUrl, stopMediaTracks]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording" || recorder.state === "paused") {
      recorder.stop();
    }
  }, []);

  const pause = useCallback((): boolean => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return false;
    }

    if (!canPauseRecorder(recorder)) {
      return false;
    }

    try {
      const elapsed = getActiveElapsedMs();
      remainingMaxDurationMsRef.current = Math.max(
        0,
        MAX_DURATION_MS - elapsed,
      );
      pauseStartedAtRef.current = Date.now();
      clearTimers();
      recorder.pause();
      setState((prev) => ({
        ...prev,
        status: "paused",
        elapsedMs: elapsed,
      }));
      return true;
    } catch {
      pauseStartedAtRef.current = null;
      return false;
    }
  }, [clearTimers, getActiveElapsedMs]);

  const resume = useCallback((): boolean => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") {
      return false;
    }

    if (!canPauseRecorder(recorder)) {
      return false;
    }

    try {
      if (pauseStartedAtRef.current !== null) {
        totalPausedMsRef.current +=
          Date.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }

      recorder.resume();
      startElapsedTimer();
      startMaxDurationTimer();
      setState((prev) => ({
        ...prev,
        status: "recording",
      }));
      return true;
    } catch {
      return false;
    }
  }, [startElapsedTimer, startMaxDurationTimer]);

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
      totalPausedMsRef.current = 0;
      pauseStartedAtRef.current = null;
      remainingMaxDurationMsRef.current = MAX_DURATION_MS;

      const supportsPause = canPauseRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearTimers();
        stopMediaTracks();
        pauseStartedAtRef.current = null;
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

        const elapsedMs =
          pauseStartedAtRef.current !== null
            ? Math.min(
                pauseStartedAtRef.current -
                  startTimeRef.current -
                  totalPausedMsRef.current,
                MAX_DURATION_MS,
              )
            : getActiveElapsedMs();

        pauseStartedAtRef.current = null;

        setState({
          status: "stopped",
          error: null,
          blob,
          audioUrl,
          elapsedMs,
          mimeType: recordedMimeType,
          canPauseRecording: false,
        });

        mediaRecorderRef.current = null;
      };

      startTimeRef.current = Date.now();
      recorder.start(250);
      startElapsedTimer();
      startMaxDurationTimer();

      setState({
        status: "recording",
        error: null,
        blob: null,
        audioUrl: null,
        elapsedMs: 0,
        mimeType: recorder.mimeType || mimeType || null,
        canPauseRecording: supportsPause,
      });
    } catch (err) {
      clearTimers();
      stopMediaTracks();
      pauseStartedAtRef.current = null;

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
        canPauseRecording: false,
      });
    }
  }, [
    clearTimers,
    getActiveElapsedMs,
    reset,
    revokeAudioUrl,
    startElapsedTimer,
    startMaxDurationTimer,
    stopMediaTracks,
  ]);

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
    pause,
    resume,
    reset,
  };
}
