"use client";

import {
  clearIosSafariVisualHeight,
  syncIosSafariVisualHeight,
} from "@/lib/layout/ios-safari-visual-height";
import { isLayoutIosSafariHeightEnabled } from "@/lib/layout/layout-feature-flags";
import { useLayoutEffect } from "react";

/** iOS Safari 通常表示 — innerHeight を --app-visual-height に同期（PWA / フラグ OFF では何もしない） */
export function IosSafariVisualHeightSync() {
  useLayoutEffect(() => {
    if (!isLayoutIosSafariHeightEnabled()) {
      clearIosSafariVisualHeight();
      return;
    }

    const sync = () => {
      syncIosSafariVisualHeight();
    };

    sync();

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      clearIosSafariVisualHeight();
    };
  }, []);

  return null;
}
