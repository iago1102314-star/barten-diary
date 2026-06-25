"use client";

import { useLayoutEffect, type RefObject } from "react";

const SCROLL_ROOT_SELECTOR = "[data-diary-paper-scroll]";

function updateKeyboardInset(scrollRoot: HTMLElement) {
  const viewport = window.visualViewport;
  if (!viewport) {
    scrollRoot.style.removeProperty("--diary-edit-keyboard-inset");
    return;
  }

  const inset = Math.max(
    0,
    window.innerHeight - viewport.height - viewport.offsetTop,
  );
  scrollRoot.style.setProperty("--diary-edit-keyboard-inset", `${inset}px`);
}

/** 編集中 — キーボード分の余白と data 属性（セピア帯の追従はしない） */
export function useDiaryEditScrollRoot(
  anchorRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useLayoutEffect(() => {
    if (!active) return;

    const scrollRoot = anchorRef.current?.closest(
      SCROLL_ROOT_SELECTOR,
    ) as HTMLElement | null;
    if (!scrollRoot) return;

    scrollRoot.dataset.diaryEditing = "true";
    updateKeyboardInset(scrollRoot);

    const onViewportChange = () => {
      updateKeyboardInset(scrollRoot);
    };

    window.visualViewport?.addEventListener("resize", onViewportChange, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", onViewportChange, {
      passive: true,
    });

    return () => {
      delete scrollRoot.dataset.diaryEditing;
      scrollRoot.style.removeProperty("--diary-edit-keyboard-inset");
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, [active, anchorRef]);
}
