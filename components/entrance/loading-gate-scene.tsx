"use client";

import { LoadingGateMessage } from "@/components/entrance/loading-gate-message";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { StartEntryAlleyLayer } from "@/components/entrance/start-entry-alley-layer";
import {
  getLoadingGateBackgroundOpacity,
  getLoadingGateLightAppear,
  getLoadingGateOverlayOpacity,
  isLoadingGateLightSequenceComplete,
  LOADING_GATE_LIGHT_SEQUENCE_MS,
  SHOW_LOADING_GATE_LIGHT_ORDER_MARKERS,
} from "@/lib/entrance/loading-gate-light-sequence";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type LoadingGateSceneProps = {
  onSequenceComplete: () => void;
};

const alleyKenBurns = {
  initial: false as const,
  animate: { scale: 1.12, x: -10 },
};

/** 真っ黒＋光 → 中盤から路地露出 → ホーム bokeh へ */
export function LoadingGateScene({ onSequenceComplete }: LoadingGateSceneProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const completedRef = useRef(false);
  const startRef = useRef(0);

  useLayoutEffect(() => {
    startRef.current = performance.now();
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      setElapsedMs(elapsed);

      if (
        !completedRef.current &&
        isLoadingGateLightSequenceComplete(elapsed)
      ) {
        completedRef.current = true;
        onSequenceComplete();
      }

      if (elapsed < LOADING_GATE_LIGHT_SEQUENCE_MS + 120) {
        raf = requestAnimationFrame(tick);
      }
    };

    tick(performance.now());
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onSequenceComplete]);

  const backgroundOpacity = getLoadingGateBackgroundOpacity(elapsedMs);
  const overlayOpacity = getLoadingGateOverlayOpacity(elapsedMs);
  const resolveLightAppear = (lightId: string) =>
    getLoadingGateLightAppear(lightId, elapsedMs);

  return (
    <SceneFrame>
      <div className="absolute inset-0">
        <StartEntryAlleyLayer
          backgroundOpacity={backgroundOpacity}
          entranceProgress={0}
          bokehOnlyFade={1}
          kenBurnsMotion={alleyKenBurns}
          showLights={false}
          showOrderMarkers={false}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[50] bg-black"
        style={{ opacity: overlayOpacity }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 z-[52]">
        <StartEntryAlleyLayer
          backgroundOpacity={0}
          entranceProgress={0}
          bokehOnlyFade={1}
          getLightAppear={resolveLightAppear}
          kenBurnsMotion={alleyKenBurns}
          showBackground={false}
          showAtmosphere={false}
          syncGroupLightAppear
          showOrderMarkers={SHOW_LOADING_GATE_LIGHT_ORDER_MARKERS}
        />
      </div>

      <LoadingGateMessage />
    </SceneFrame>
  );
}
