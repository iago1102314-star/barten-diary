"use client";

import {
  isCompactHeightViewport,
  readViewportHeightPx,
} from "@/lib/entrance/compact-height-viewport";
import { useSyncExternalStore } from "react";

function subscribeCompactHeight(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onChange = () => onStoreChange();

  window.addEventListener("resize", onChange);
  window.visualViewport?.addEventListener("resize", onChange);
  window.visualViewport?.addEventListener("scroll", onChange);

  return () => {
    window.removeEventListener("resize", onChange);
    window.visualViewport?.removeEventListener("resize", onChange);
    window.visualViewport?.removeEventListener("scroll", onChange);
  };
}

function getCompactHeightSnapshot(): boolean {
  return isCompactHeightViewport(readViewportHeightPx());
}

function getCompactHeightServerSnapshot(): boolean {
  return false;
}

/** 高さ 699px 以下 — 感情選択 compact height プロファイル */
export function useCompactHeightViewport(): boolean {
  return useSyncExternalStore(
    subscribeCompactHeight,
    getCompactHeightSnapshot,
    getCompactHeightServerSnapshot,
  );
}
