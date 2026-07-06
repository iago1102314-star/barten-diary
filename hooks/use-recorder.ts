"use client";

import { getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import {
  extractJazzFromAudioDiagnostics,
  updateRecordingPipelineDiagnostic,
} from "@/lib/recorder/recording-pipeline-diagnostic";
import {
  acquireMicStream,
  formatRecorderStartError,
  getRecorderFinalizeDelayMs,
  getRecorderTimesliceMs,
  getSupportedRecorderMimeType,
  isAppleMediaRecorder,
  isSafariMediaRecorder,
  isRecordingLikelyTooQuiet,
  MIN_RECORDING_BYTES,
  resolveRecordedMimeType,
} from "@/lib/recorder/recorder-platform";
import { captureDebugRecordingBlob } from "@/lib/recorder/debug-recording-blob";
import { logRecordingPipeline, logRecordingPipelineError } from "@/lib/recorder/recording-pipeline-log";
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
  onFatalError?: (context: {
    hadRecordingAttempt: boolean;
    message?: string;
  }) => void;
  /** MediaRecorder.start() と同一ターンで呼ぶ — BGM 停止等 */
  onRecordingStarted?: () => void;
  /** 最大録音時間に達した直前 — stop() の前に呼ぶ */
  onMaxDurationReached?: () => void;
};

export function useRecorder(options: UseRecorderOptions = {}) {
  const onFatalErrorRef = useRef(options.onFatalError);
  onFatalErrorRef.current = options.onFatalError;
  const onRecordingStartedRef = useRef(options.onRecordingStarted);
  onRecordingStartedRef.current = options.onRecordingStarted;
  const onMaxDurationReachedRef = useRef(options.onMaxDurationReached);
  onMaxDurationReachedRef.current = options.onMaxDurationReached;
  const sessionGenerationRef = useRef(0);

  const notifyFatalError = useCallback(
    (hadRecordingAttempt: boolean, message?: string) => {
      queueMicrotask(() => {
        onFatalErrorRef.current?.({ hadRecordingAttempt, message });
      });
    },
    [],
  );
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
  const stopRequestedRef = useRef(false);
  const finalizeStartedRef = useRef(false);
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackMimeTypeRef = useRef<string | undefined>(undefined);
  const stopRecordingRef = useRef<() => void>(() => {});

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

  const clearPendingFinalize = useCallback(() => {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearElapsedTimer();
    clearMaxDurationTimer();
    clearPendingFinalize();
  }, [clearElapsedTimer, clearMaxDurationTimer, clearPendingFinalize]);

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
      onMaxDurationReachedRef.current?.();
      stopRecordingRef.current();
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
    sessionGenerationRef.current += 1;
    clearTimers();
    stopRequestedRef.current = false;
    finalizeStartedRef.current = false;

    const staleRecorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (staleRecorder && staleRecorder.state !== "inactive") {
      staleRecorder.stop();
    }

    stopMediaTracks();
    chunksRef.current = [];
    revokeAudioUrl();
    totalPausedMsRef.current = 0;
    pauseStartedAtRef.current = null;
    remainingMaxDurationMsRef.current = MAX_DURATION_MS;
    fallbackMimeTypeRef.current = undefined;

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
    stopRecordingRef.current();
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

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      logRecordingPipelineError("recorder.start: SSR context");
      notifyFatalError(false, "recorder.start called outside browser");
      return false;
    }

    if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
      const reason = window.isSecureContext
        ? "browser does not support getUserMedia"
        : "getUserMedia requires HTTPS or localhost (LAN の http:// では使えません)";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: window.isSecureContext
          ? "このブラウザでは録音がサポートされていません。"
          : "録音には HTTPS または localhost が必要です。LAN IP の http:// ではマイクが使えません。",
      }));
      updateRecordingPipelineDiagnostic({
        pipelineError: reason,
      });
      logRecordingPipelineError("recorder.start: getUserMedia unavailable", {
        reason,
        isSecureContext: window.isSecureContext,
        hostname: window.location.hostname,
      });
      notifyFatalError(false, reason);
      return false;
    }

    reset();

    const sessionGeneration = sessionGenerationRef.current;

    try {
      const timesliceMs = getRecorderTimesliceMs();
      logRecordingPipeline("recorder.start: before getUserMedia", {
        audio: getBarAudioDiagnostics(),
        isApple: isAppleMediaRecorder(),
        isSafariMediaRecorder: isSafariMediaRecorder(),
        supportedMimeType: getSupportedRecorderMimeType(),
        timesliceMs,
        finalizeDelayMs: getRecorderFinalizeDelayMs(),
      });
      const stream = await acquireMicStream();
      mediaStreamRef.current = stream;

      logRecordingPipeline("recorder.start: after getUserMedia", {
        audio: getBarAudioDiagnostics(),
        tracks: stream.getAudioTracks().map((track) => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings?.() ?? null,
        })),
      });

      updateRecordingPipelineDiagnostic({
        jazz: extractJazzFromAudioDiagnostics(getBarAudioDiagnostics()),
      });

      const mimeType = getSupportedRecorderMimeType();
      fallbackMimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      stopRequestedRef.current = false;
      finalizeStartedRef.current = false;
      totalPausedMsRef.current = 0;
      pauseStartedAtRef.current = null;
      remainingMaxDurationMsRef.current = MAX_DURATION_MS;

      const supportsPause = canPauseRecorder(recorder);

      const finalizeRecording = () => {
        if (finalizeStartedRef.current) return;
        finalizeStartedRef.current = true;
        clearPendingFinalize();
        clearTimers();
        stopMediaTracks();

        const recordedMimeType = resolveRecordedMimeType(
          recorder.mimeType,
          fallbackMimeTypeRef.current,
        );
        const chunkSizes = chunksRef.current.map((chunk) => chunk.size);
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
        stopRequestedRef.current = false;

        logRecordingPipeline("recorder.onstop: blob assembled", {
          audio: getBarAudioDiagnostics(),
          blobSize: blob.size,
          blobType: blob.type,
          recordedMimeType,
          recorderMimeType: recorder.mimeType,
          elapsedMs,
          durationSec: Math.round(elapsedMs / 1000),
          chunkCount: chunkSizes.length,
          chunkSizes,
          chunkTotalBytes: chunkSizes.reduce((sum, size) => sum + size, 0),
          minRecordingBytes: MIN_RECORDING_BYTES,
          belowMinBytes: blob.size < MIN_RECORDING_BYTES,
        });

        const durationSec = Math.max(1, Math.round(elapsedMs / 1000));

        updateRecordingPipelineDiagnostic({
          blobSize: blob.size,
          chunkCount: chunkSizes.length,
          durationSec,
          blobType: blob.type || recordedMimeType,
        });

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
          notifyFatalError(true, "recording blob below minimum bytes");
          return;
        }

        if (
          isRecordingLikelyTooQuiet(blob.size, durationSec, recordedMimeType)
        ) {
          revokeAudioUrl();
          setState({
            status: "error",
            error:
              "声が小さすぎるか、マイクが拾えていません。もう少し大きな声で、マイクに近づいてお試しください。",
            blob: null,
            audioUrl: null,
            elapsedMs,
            mimeType: recordedMimeType,
            canPauseRecording: false,
          });
          notifyFatalError(
            true,
            `recording too quiet: ${blob.size} bytes / ${durationSec}s`,
          );
          return;
        }

        captureDebugRecordingBlob(blob, recordedMimeType);

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

      const scheduleFinalize = (reason: string) => {
        if (!stopRequestedRef.current || finalizeStartedRef.current) return;

        clearPendingFinalize();
        const delayMs = getRecorderFinalizeDelayMs();

        logRecordingPipeline("recorder.finalize: scheduled", {
          reason,
          delayMs,
          recorderState: recorder.state,
          chunkCount: chunksRef.current.length,
        });

        finalizeTimerRef.current = setTimeout(() => {
          finalizeTimerRef.current = null;

          if (!stopRequestedRef.current || finalizeStartedRef.current) {
            return;
          }

          if (recorder.state !== "inactive") {
            scheduleFinalize("wait-inactive");
            return;
          }

          finalizeRecording();
        }, delayMs);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
        logRecordingPipeline("recorder.ondataavailable", {
          chunkSize: event.data.size,
          chunkType: event.data.type,
          chunkCount: chunksRef.current.length,
          stopRequested: stopRequestedRef.current,
          recorderState: recorder.state,
        });

        if (stopRequestedRef.current) {
          scheduleFinalize("dataavailable");
        }
      };

      recorder.onerror = () => {
        if (
          sessionGeneration !== sessionGenerationRef.current ||
          mediaRecorderRef.current !== recorder
        ) {
          logRecordingPipeline("recorder.onerror: stale instance ignored");
          return;
        }

        clearTimers();
        stopRequestedRef.current = false;
        stopMediaTracks();
        pauseStartedAtRef.current = null;
        mediaRecorderRef.current = null;

        updateRecordingPipelineDiagnostic({
          pipelineError: "MediaRecorder.onerror fired during recording",
        });

        setState((prev) => ({
          ...prev,
          status: "error",
          error: "録音中にエラーが発生しました。",
        }));
        notifyFatalError(true, "MediaRecorder.onerror fired during recording");
      };

      recorder.onstop = () => {
        if (
          sessionGeneration !== sessionGenerationRef.current ||
          mediaRecorderRef.current !== recorder
        ) {
          logRecordingPipeline("recorder.onstop: stale instance ignored", {
            recorderState: recorder.state,
          });
          return;
        }

        if (!stopRequestedRef.current) {
          clearPendingFinalize();
          clearTimers();
          stopMediaTracks();
          pauseStartedAtRef.current = null;
          mediaRecorderRef.current = null;

          const errorMessage =
            "MediaRecorder stopped unexpectedly before user finished";

          logRecordingPipeline("recorder.onstop: unexpected (not user-initiated)", {
            chunkCount: chunksRef.current.length,
            recorderState: recorder.state,
            audio: getBarAudioDiagnostics(),
          });

          updateRecordingPipelineDiagnostic({
            chunkCount: chunksRef.current.length,
            pipelineError: errorMessage,
          });

          setState({
            status: "error",
            error: "録音が途中で中断されました。もう一度お試しください。",
            blob: null,
            audioUrl: null,
            elapsedMs: getActiveElapsedMs(),
            mimeType: null,
            canPauseRecording: false,
          });
          notifyFatalError(true, errorMessage);
          return;
        }

        logRecordingPipeline("recorder.onstop", {
          chunkCount: chunksRef.current.length,
          recorderState: recorder.state,
        });

        scheduleFinalize("onstop");
      };

      stopRecordingRef.current = () => {
        const activeRecorder = mediaRecorderRef.current;
        if (!activeRecorder) return;

        if (
          activeRecorder.state !== "recording" &&
          activeRecorder.state !== "paused"
        ) {
          return;
        }

        stopRequestedRef.current = true;

        if (
          isSafariMediaRecorder() &&
          typeof activeRecorder.requestData === "function"
        ) {
          try {
            activeRecorder.requestData();
          } catch {
            // requestData 非対応時は stop のみ
          }
        }

        activeRecorder.stop();
      };

      startTimeRef.current = Date.now();
      recorder.start(timesliceMs);
      onRecordingStartedRef.current?.();

      logRecordingPipeline("recorder.start: MediaRecorder started", {
        state: recorder.state,
        mimeType: recorder.mimeType || mimeType || null,
        timesliceMs,
        finalizeDelayMs: getRecorderFinalizeDelayMs(),
        canPause: supportsPause,
      });

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
      return true;
    } catch (err) {
      clearTimers();
      stopMediaTracks();
      pauseStartedAtRef.current = null;
      stopRequestedRef.current = false;

      const message = formatRecorderStartError(err);

      setState({
        status: "error",
        error:
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "マイクの使用が許可されていません。ブラウザの設定を確認してください。"
            : "録音の開始に失敗しました。マイクが接続されているか確認してください。",
        blob: null,
        audioUrl: null,
        elapsedMs: 0,
        mimeType: null,
        canPauseRecording: false,
      });
      updateRecordingPipelineDiagnostic({
        pipelineError: message,
      });
      logRecordingPipelineError("recorder.start: failed", { message });
      notifyFatalError(false, message);
      return false;
    }
  }, [
    clearPendingFinalize,
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
      stopRequestedRef.current = false;
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
