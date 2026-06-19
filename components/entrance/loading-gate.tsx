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

/** 初期化完了まで — 黒背景 + 控えめな準備テキスト */
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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      role="status"
      aria-live="polite"
    >
      <p className="loading-gate-message font-serif-jp translate-y-6 text-[13px] tracking-[0.14em] text-amber-200/45">
        夜を準備しています
      </p>
    </div>
  );
}
