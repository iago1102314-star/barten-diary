"use client";

import styles from "@/components/memories/memo-shelf-grid.module.css";
import {
  SHELF_STATUS_MESSAGE_FONT_SIZE_PX,
  SHELF_STATUS_MESSAGE_LETTER_SPACING_EM,
  SHELF_STATUS_WRITING_COLOR,
} from "@/lib/memories/shelf-status-message-tuning";
import { Cormorant_Garamond } from "next/font/google";

const statusFont = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
});

type ShelfStatusMessageProps = {
  variant: "opening" | "reading" | "writing";
  className?: string;
};

/** 日記一覧の Opening... / 個別の Reading... / 生成中の Writing... */
export function ShelfStatusMessage({
  variant,
  className,
}: ShelfStatusMessageProps) {
  const label =
    variant === "opening"
      ? "Opening"
      : variant === "reading"
        ? "Reading"
        : "Writing";
  const color =
    variant === "writing" ? SHELF_STATUS_WRITING_COLOR : undefined;
  const barChrome = variant === "opening" || variant === "reading";

  return (
    <p
      className={[
        statusFont.className,
        "loading-gate-caption",
        styles.shelfStatusMessage,
        barChrome ? styles.shelfStatusMessageBarChrome : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...(color ? { color } : null),
        fontSize: `${SHELF_STATUS_MESSAGE_FONT_SIZE_PX}px`,
        letterSpacing: `${SHELF_STATUS_MESSAGE_LETTER_SPACING_EM}em`,
      }}
      role="status"
      aria-live="polite"
      aria-label={`${label}…`}
    >
      {label}
      <span className="loading-gate-dots" aria-hidden>
        <span className="loading-gate-dot">.</span>
        <span className="loading-gate-dot">.</span>
        <span className="loading-gate-dot">.</span>
      </span>
    </p>
  );
}
