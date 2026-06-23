"use client";

import {
  LOADING_GATE_MESSAGE_COLOR,
  LOADING_GATE_MESSAGE_FONT_SIZE_PX,
  LOADING_GATE_MESSAGE_LETTER_SPACING_EM,
  LOADING_GATE_MESSAGE_X_PERCENT,
  LOADING_GATE_MESSAGE_Y_PERCENT,
} from "@/lib/entrance/loading-gate-message-tuning";
import { Cormorant_Garamond } from "next/font/google";

const loadingFont = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
});

/** ローディング / 位置調整用 — 画面下部の Loading... */
export function LoadingGateMessage() {
  return (
    <p
      className={`${loadingFont.className} loading-gate-caption pointer-events-none absolute z-[55] whitespace-nowrap text-center`}
      style={{
        left: `${LOADING_GATE_MESSAGE_X_PERCENT}%`,
        top: `${LOADING_GATE_MESSAGE_Y_PERCENT}%`,
        transform: "translate(-50%, -50%)",
        color: LOADING_GATE_MESSAGE_COLOR,
        fontSize: `${LOADING_GATE_MESSAGE_FONT_SIZE_PX}px`,
        letterSpacing: `${LOADING_GATE_MESSAGE_LETTER_SPACING_EM}em`,
      }}
      role="status"
      aria-live="polite"
    >
      Loading
      <span className="loading-gate-dots" aria-hidden>
        <span className="loading-gate-dot">.</span>
        <span className="loading-gate-dot">.</span>
        <span className="loading-gate-dot">.</span>
      </span>
    </p>
  );
}
