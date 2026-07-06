import { isRecordingDiagnosticEnabled } from "@/lib/env/recording-diagnostic-env";
import {
  isAppleMediaRecorder,
  isSafariMediaRecorder,
} from "@/lib/recorder/recorder-platform";
import { logRecordingPipeline } from "@/lib/recorder/recording-pipeline-log";

/** PC Safari（デスクトップ WebKit）— iOS / iPad 除く */
export function isDesktopSafariUserAgent(): boolean {
  return isSafariMediaRecorder() && !isAppleMediaRecorder();
}

function safeTrackCall<T>(fn: () => T): T | { error: string } {
  try {
    return fn();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function snapshotMediaStreamTrack(
  track: MediaStreamTrack,
): Record<string, unknown> {
  return {
    id: track.id,
    kind: track.kind,
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
    settings: safeTrackCall(() => track.getSettings()),
    constraints: safeTrackCall(() => track.getConstraints()),
    capabilities: safeTrackCall(() => track.getCapabilities?.()),
  };
}

export function snapshotMediaStream(
  stream: MediaStream | null | undefined,
): Record<string, unknown> {
  if (!stream) {
    return { stream: null };
  }

  return {
    streamId: stream.id,
    active: stream.active,
    audioTrackCount: stream.getAudioTracks().length,
    videoTrackCount: stream.getVideoTracks().length,
    audioTracks: stream.getAudioTracks().map(snapshotMediaStreamTrack),
  };
}

export function snapshotMediaRecorder(
  recorder: MediaRecorder | null | undefined,
): Record<string, unknown> {
  if (!recorder) {
    return { recorder: null };
  }

  const recorderStream =
    "stream" in recorder
      ? (recorder as MediaRecorder & { stream?: MediaStream }).stream ?? null
      : null;

  return {
    state: recorder.state,
    mimeType: recorder.mimeType || null,
    audioBitsPerSecond:
      "audioBitsPerSecond" in recorder ? recorder.audioBitsPerSecond : null,
    videoBitsPerSecond:
      "videoBitsPerSecond" in recorder ? recorder.videoBitsPerSecond : null,
    recorderStream: snapshotMediaStream(recorderStream),
  };
}

export function logMicStreamDiagnostic(
  phase: string,
  detail: Record<string, unknown>,
): void {
  if (!isRecordingDiagnosticEnabled()) return;

  logRecordingPipeline(`mic stream: ${phase}`, {
    isDesktopSafari: isDesktopSafariUserAgent(),
    isSafariMediaRecorder: isSafariMediaRecorder(),
    isAppleMediaRecorder: isAppleMediaRecorder(),
    ...detail,
  });
}

export function logMicStreamState(
  phase: string,
  stream: MediaStream | null | undefined,
  recorder?: MediaRecorder | null,
  extra?: Record<string, unknown>,
): void {
  logMicStreamDiagnostic(phase, {
    stream: snapshotMediaStream(stream),
    mediaRecorder: snapshotMediaRecorder(recorder ?? null),
    ...extra,
  });
}

type MicLevelSample = {
  peak: number;
  rms: number;
  sampleCount: number;
  durationMs: number;
};

type MicLevelSampleResult =
  | { ok: true; level: MicLevelSample }
  | { ok: false; error: string };

/**
 * MediaStream から Web Audio で振幅を測る — マイク入力が本当に来ているか。
 * 診断 ON 時のみ。録音開始後（ユーザー発話中）に呼ぶ。
 */
export async function sampleMicStreamLevels(
  stream: MediaStream,
  durationMs = 400,
): Promise<MicLevelSampleResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "window unavailable" };
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return { ok: false, error: "AudioContext unavailable" };
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    return { ok: false, error: "no audio tracks on stream" };
  }

  const ctx = new AudioContextClass();

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    let peak = 0;
    let sumSq = 0;
    let sampleCount = 0;
    const startedAt = performance.now();

    while (performance.now() - startedAt < durationMs) {
      analyser.getFloatTimeDomainData(buffer);
      for (let i = 0; i < buffer.length; i++) {
        const value = buffer[i] ?? 0;
        const abs = Math.abs(value);
        if (abs > peak) peak = abs;
        sumSq += value * value;
        sampleCount += 1;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const rms = sampleCount > 0 ? Math.sqrt(sumSq / sampleCount) : 0;

    return {
      ok: true,
      level: {
        peak,
        rms,
        sampleCount,
        durationMs: Math.round(performance.now() - startedAt),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }
}

export async function logMicStreamLevelSample(
  phase: string,
  stream: MediaStream,
  durationMs = 400,
): Promise<void> {
  if (!isRecordingDiagnosticEnabled()) return;

  const result = await sampleMicStreamLevels(stream, durationMs);
  logMicStreamDiagnostic(phase, {
    stream: snapshotMediaStream(stream),
    levelSample: result.ok ? result.level : { error: result.error },
    likelySilentInput:
      result.ok && result.level.peak < 0.001 && result.level.rms < 0.0005,
  });
}

declare global {
  interface Window {
    __logMicStreamState__?: (
      label?: string,
    ) => ReturnType<typeof snapshotMediaStream> | null;
  }
}

/** コンソール — 現在保持中の stream を手動スナップショット（use-recorder が登録） */
export function registerMicStreamDebugHook(
  getStream: () => MediaStream | null,
): void {
  if (typeof window === "undefined" || !isRecordingDiagnosticEnabled()) return;

  window.__logMicStreamState__ = (label = "manual") => {
    const stream = getStream();
    logMicStreamState(`console ${label}`, stream);
    return snapshotMediaStream(stream);
  };
}

export function clearMicStreamDebugHook(): void {
  if (typeof window === "undefined") return;
  delete window.__logMicStreamState__;
}

export function attachMicTrackDiagnosticListeners(stream: MediaStream): void {
  if (!isRecordingDiagnosticEnabled()) return;

  for (const track of stream.getAudioTracks()) {
    const logEvent = (eventName: string) => {
      logMicStreamState(`track event: ${eventName}`, stream, null, {
        trackId: track.id,
        trackLabel: track.label,
      });
    };

    track.addEventListener("mute", () => logEvent("mute"));
    track.addEventListener("unmute", () => logEvent("unmute"));
    track.addEventListener("ended", () => logEvent("ended"));
  }
}

const POST_START_SAMPLE_DELAYS_MS = [100, 500, 1500] as const;

export function schedulePostStartMicStreamDiagnostics(
  stream: MediaStream,
  recorder: MediaRecorder,
  isStreamCurrent: () => boolean,
): void {
  if (!isRecordingDiagnosticEnabled()) return;

  for (const delayMs of POST_START_SAMPLE_DELAYS_MS) {
    setTimeout(() => {
      if (!isStreamCurrent()) return;

      logMicStreamState(`+${delayMs}ms after MediaRecorder.start`, stream, recorder);

      if (delayMs >= 500) {
        void logMicStreamLevelSample(
          `+${delayMs}ms level sample (speak now)`,
          stream,
          400,
        );
      }
    }, delayMs);
  }
}
