"use client";

import { useEffect } from "react";

const LOCK_CLASS = "entrance-experience-locked";
export const LOGIN_ROUTE_CLASS = "login-route";

export function clearEntranceExperienceLock() {
  document.documentElement.classList.remove(LOCK_CLASS);
  document.body.classList.remove(LOCK_CLASS);
}

/** /diaries バー体験中のみ — ドキュメントスクロールと iOS バウンスを抑止 */
export function useEntranceScrollLock(): void {
  useEffect(() => {
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.classList.add(LOCK_CLASS);

    return () => {
      clearEntranceExperienceLock();
    };
  }, []);
}

/** ログイン等 — 体験画面の scroll lock が残ったとき iOS でタップ不能になるのを防ぐ */
export function useClearEntranceExperienceLock(): void {
  useEffect(() => {
    clearEntranceExperienceLock();

    const handlePageShow = () => {
      clearEntranceExperienceLock();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}
