"use client";

import {
  getRecorderTimesliceMs,
  getSupportedRecorderMimeType,
  isAppleMediaRecorder,
  MIN_RECORDING_BYTES,
  resolveRecordedMimeType,
} from "@/lib/recorder/recorder-platform";
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

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type UseRecorderReturn = ReturnType<typeof useRecorder>;

type UseRecorderOptions = {
  onFatalError?: () => void;
};

export function useRecorder(options: UseRecorderOptions = {}) {
  const onFatalErrorRef = useRef(options.onFatalError);
  onFatalErrorRef.current = options.onFatalError;

  const notifyFatalError = useCallback(() => {
    queueMicrotask(() => {
      onFatalErrorRef.current?.();
    });
  }, []);
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

    if (recorder.state !== "recording" && recorder.state !== "paused") {
      return;
    }

    if (isAppleMediaRecorder() && typeof recorder.requestData === "function") {
      try {
        recorder.requestData();
      } catch {
        // requestData 非対応時は stop のみ
      }
    }

    recorder.stop();
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
      notifyFatalError();
      return;
    }

    reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedRecorderMimeType();
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
        notifyFatalError();
      };

      recorder.onstop = () => {
        const finalizeRecording = () => {
          clearTimers();
          stopMediaTracks();

          const recordedMimeType = resolveRecordedMimeType(
            recorder.mimeType,
            mimeType,
          );
          const blob = new Blob(chunksRef.current, { type: recordedMimeType });
          chunksRef.current = [];

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
          mediaRecorderRef.current = null;

          if (blob.size < MIN_RECORDING_BYTES) {
            revokeAudioUrl();
            setState({
              status: "error",
              error:
                "録音データを取得できませんでした。Safari の場合はブラウザタブから開き直すか、もう一度お試しください。",
              blob: null,
              audioUrl: null,
              elapsedMs,
              mimeType: recordedMimeType,
              canPauseRecording: false,
            });
            notifyFatalError();
            return;
          }

          revokeAudioUrl();
          const audioUrl = URL.createObjectURL(blob);
          audioUrlRef.current = audioUrl;

          setState({
            status: "stopped",
            error: null,
            blob,
            audioUrl,
            elapsedMs,
            mimeType: recordedMimeType,
            canPauseRecording: false,
          });
        };

        // WebKit: 最終 dataavailable の処理後に Blob を組み立てる
        queueMicrotask(finalizeRecording);
      };

      startTimeRef.current = Date.now();
      const timesliceMs = getRecorderTimesliceMs();
      if (timesliceMs != null) {
        recorder.start(timesliceMs);
      } else {
        recorder.start();
      }
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
      notifyFatalError();
    }
  }, [
    clearTimers,
    getActiveElapsedMs,
    notifyFatalError,
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
