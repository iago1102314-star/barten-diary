"use client";

import styles from "@/components/entrance/entrance-bottom-toast.module.css";
import { ENTRANCE_BOTTOM_TOAST_TUNING as T } from "@/lib/entrance/entrance-bottom-toast-tuning";
import { getAppPortalRoot } from "@/lib/layout/app-portal";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type EntranceBottomToastProps = {
  text: string | null;
  onDismiss: () => void;
  /** 自動で閉じるまで（ms）— 未指定時は ENTRANCE_BOTTOM_TOAST_TUNING */
  durationMs?: number;
};

const toastStyle = {
  "--ebt-left": `${T.leftPercent}%`,
  "--ebt-translate-x": `${T.translateXPercent}%`,
  "--ebt-bottom-min": `${T.bottomMinRem}rem`,
  "--ebt-bottom-extra": `${T.bottomExtraRem}rem`,
  "--ebt-width": T.widthRem == null ? "auto" : `${T.widthRem}rem`,
  "--ebt-min-width": T.minWidthRem > 0 ? `${T.minWidthRem}rem` : "0",
  "--ebt-max-width": `${T.maxWidthRem}rem`,
  "--ebt-viewport-inset": `${T.maxWidthViewportInsetRem}rem`,
  "--ebt-padding-x": `${T.paddingXRem}rem`,
  "--ebt-padding-y": `${T.paddingYRem}rem`,
  "--ebt-radius": `${T.borderRadiusPx}px`,
  "--ebt-font-size": `${T.fontSizeRem}rem`,
  "--ebt-font-weight": T.fontWeight,
  "--ebt-line-height": T.lineHeight,
  "--ebt-tracking": `${T.letterSpacingEm}em`,
  "--ebt-text-color": T.textColor,
  "--ebt-bg": T.backgroundColor,
  "--ebt-shadow": T.boxShadow,
  "--ebt-z": T.zIndex,
  "--ebt-white-space": T.whiteSpace,
} as CSSProperties;

/** 入店フロー — 画面下端トースト（portal で shell レイアウトの影響を受けない） */
export function EntranceBottomToast({
  text,
  onDismiss,
  durationMs = T.durationMs,
}: EntranceBottomToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!text) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss, text]);

  if (!mounted || !text) return null;

  return createPortal(
    <div className={styles.toast} style={toastStyle} role="status">
      {text}
    </div>,
    getAppPortalRoot(),
  );
}
