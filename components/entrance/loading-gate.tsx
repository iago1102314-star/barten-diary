"use client";

import {
  readLoadingGateFallbackSnapshot,
  runLoadingGateInit,
  type LoadingGateSnapshot,
} from "@/lib/entrance/loading-gate-init";
import { useEffect, useRef } from "react";

type LoadingGateProps = {
  onReady: (snapshot: LoadingGateSnapshot) => void;
};

/** 初期化完了までの黒画面ゲート（装飾なし） */
export function LoadingGate({ onReady }: LoadingGateProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    void runLoadingGateInit()
      .then((snapshot) => {
        if (!cancelled) onReady(snapshot);
      })
      .catch(() => {
        if (!cancelled) {
          onReady(readLoadingGateFallbackSnapshot());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return <div className="fixed inset-0 z-[9999] bg-black" aria-hidden />;
}
