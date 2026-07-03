"use client";

import styles from "@/components/entrance/record-bottom-action.module.css";
import {
  RECORD_BOTTOM_ACTION_TUNING,
  buildRecordBottomTaperedLinePath,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { ornamentalDiamondPath } from "@/lib/entrance/mood-ornamental-divider-tuning";
import { useId } from "react";

/** 上下共通 — テーパー・左右フェード・中央ダイヤ */
export function RecordBottomActionDivider() {
  const uid = useId().replace(/:/g, "");
  const t = RECORD_BOTTOM_ACTION_TUNING;
  const line = t.line;
  const fadeId = `record-bottom-fade-${uid}`;

  const path = buildRecordBottomTaperedLinePath(
    line.viewBoxWidth,
    line.centerY,
    line.edgeHalfHeight,
    line.centerHalfHeight,
    line.taperInflectPercent,
  );
  const diamondPath = ornamentalDiamondPath(
    line.viewBoxWidth / 2,
    line.centerY,
    line.diamondHalfWidth,
    line.diamondHalfHeight,
  );

  return (
    <div
      className={styles.lineWrap}
      style={{ maxWidth: `${line.maxWidthRem}rem` }}
    >
      <svg
        width="100%"
        height={line.viewBoxHeight}
        viewBox={`0 0 ${line.viewBoxWidth} ${line.viewBoxHeight}`}
        aria-hidden
        className={styles.lineSvg}
      >
        <defs>
          <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={t.lineColor} stopOpacity="0" />
            <stop offset={`${line.fadeInsetPercent}%`} stopColor={t.lineColor} stopOpacity="1" />
            <stop offset={`${100 - line.fadeInsetPercent}%`} stopColor={t.lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={t.lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#${fadeId})`} />
        <path
          d={diamondPath}
          fill={t.lineColor}
          style={{ opacity: line.diamondOpacity }}
        />
      </svg>
    </div>
  );
}
