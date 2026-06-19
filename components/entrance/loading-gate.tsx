"use client";

import {
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

    void runLoadingGateInit().then((snapshot) => {
      if (!cancelled) onReady(snapshot);
    });

    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center bg-black">
      <p
        className="loading-gate-message font-serif-jp translate-y-4 text-[14px] tracking-[0.12em] text-amber-100/80"
        role="status"
        aria-live="polite"
      >
        夜を準備しています
      </p>
    </div>
  );
}
