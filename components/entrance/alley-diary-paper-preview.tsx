"use client";

import { DiaryPaper } from "@/components/diary-paper/diary-paper";
import { ALLEY_DIARY_COMPLETE_TUNING as T } from "@/lib/entrance/alley-diary-complete-tuning";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import type { CSSProperties } from "react";
import styles from "@/components/entrance/alley-diary-paper-preview.module.css";

type AlleyDiaryPaperPreviewProps = {
  paper: DiaryPaperData;
};

const wrapStyle = {
  maxHeight: T.previewClipMaxHeight,
  "--preview-paper-max-width": `${T.previewPaperMaxWidthRem}rem`,
  "--preview-fade-height": `${T.previewFadeHeightRem}rem`,
  "--preview-fade-transparent-stop": `${T.previewFadeTransparentStopPercent}%`,
  "--preview-fade-mid-stop": `${T.previewFadeMidStopPercent}%`,
  "--preview-fade-mid-opacity": T.previewFadeMidOpacity,
  "--preview-fade-late-stop": `${T.previewFadeLateStopPercent}%`,
  "--preview-fade-late-opacity": T.previewFadeLateOpacity,
  "--preview-fade-bottom-opacity": T.previewFadeBottomOpacity,
} as CSSProperties;

/** 帰り道 — 共有カードと同じ DiaryPaper をチラ見せ */
export function AlleyDiaryPaperPreview({ paper }: AlleyDiaryPaperPreviewProps) {
  return (
    <div className={styles.wrap} style={wrapStyle}>
      <DiaryPaper data={paper} className={styles.paper} />
      <div className={styles.fadeMask} aria-hidden />
    </div>
  );
}
