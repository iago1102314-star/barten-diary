"use client";

import { ShelfStatusMessage } from "@/components/memories/shelf-status-message";
import { ALLEY_COMPOSING_TUNING as T } from "@/lib/entrance/alley-composing-tuning";
import styles from "@/components/entrance/alley-composing-writing-overlay.module.css";

/** 帰り道 — 生成中 Writing...（画面中央・退出暗幕の下） */
export function AlleyComposingWritingOverlay() {
  return (
    <div
      className={styles.layer}
      style={{
        zIndex: T.writingZIndex,
        opacity: T.writingOpacity,
      }}
    >
      <ShelfStatusMessage variant="writing" />
    </div>
  );
}
