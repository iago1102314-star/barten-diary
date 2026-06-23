"use client";

import { LoadingGateScene } from "@/components/entrance/loading-gate-scene";
import {
  runLoadingGateInit,
  type LoadingGateSnapshot,
} from "@/lib/entrance/loading-gate-init";
import { useCallback, useEffect, useRef, useState } from "react";

type LoadingGateProps = {
  onReady: (snapshot: LoadingGateSnapshot) => void;
};

/** 初期化完了まで — 路地の灯りが奥から手前へともり、ホーム入場へ繋ぐ */
export function LoadingGate({ onReady }: LoadingGateProps) {
  const startedRef = useRef(false);
  const [initSnapshot, setInitSnapshot] = useState<LoadingGateSnapshot | null>(
    null,
  );
  const [lightsComplete, setLightsComplete] = useState(false);
  const readySentRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    void runLoadingGateInit().then((snapshot) => {
      if (!cancelled) setInitSnapshot(snapshot);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const tryFinish = useCallback(() => {
    if (readySentRef.current || !initSnapshot || !lightsComplete) return;
    readySentRef.current = true;
    onReady(initSnapshot);
  }, [initSnapshot, lightsComplete, onReady]);

  useEffect(() => {
    tryFinish();
  }, [tryFinish]);

  const handleLightsComplete = useCallback(() => {
    setLightsComplete(true);
  }, []);

  return (
    <LoadingGateScene onSequenceComplete={handleLightsComplete} />
  );
}
