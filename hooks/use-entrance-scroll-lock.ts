"use client";

import { useEffect } from "react";

const LOCK_CLASS = "entrance-experience-locked";

/** /diaries バー体験中のみ — ドキュメントスクロールと iOS バウンスを抑止 */
export function useEntranceScrollLock(): void {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add(LOCK_CLASS);
    document.body.classList.add(LOCK_CLASS);

    return () => {
      html.classList.remove(LOCK_CLASS);
      document.body.classList.remove(LOCK_CLASS);
    };
  }, []);
}
