"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import { MemoShelfCard } from "@/components/memories/memo-shelf-card";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import {
  MemoShelfEmpty,
  MemoShelfSurface,
} from "@/components/memories/memo-shelf-surface";
import type { MemoShelfPolaroidIntroSession } from "@/lib/memories/memo-shelf-polaroid-intro";
import { markMemoShelfPolaroidIntroPlayed } from "@/lib/memories/memo-shelf-polaroid-intro";
import { memoShelfGridStyle } from "@/lib/memories/memo-shelf-tuning";
import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useState } from "react";

type MemoListProps = {
  memos: DiaryListItem[];
  /** 指定時は同一画面内で詳細を開く（URL 遷移なし） */
  onOpenMemo?: (memo: DiaryListItem) => void;
  page?: number;
  /** 親が紙背景のときは内側パネルを省略 */
  flat?: boolean;
  /** page 0 の一覧入場時 — 親が一覧セッション単位で制御 */
  introStagger?: boolean;
  introSession?: MemoShelfPolaroidIntroSession;
};

export function MemoList({
  memos,
  onOpenMemo,
  page = 0,
  flat = false,
  introStagger = false,
  introSession,
}: MemoListProps) {
  const prefersReducedMotion = useReducedMotion();
  const [playIntro] = useState(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return false;
    }
    return introStagger;
  });
  const shouldAnimate = playIntro && prefersReducedMotion !== true;

  useLayoutEffect(() => {
    if (shouldAnimate && introSession) {
      markMemoShelfPolaroidIntroPlayed(introSession);
    }
  }, [introSession, shouldAnimate]);

  if (memos.length === 0) {
    return <MemoShelfEmpty flat={flat} />;
  }

  const resampleTiltForPage = page === 0;

  const content = (
    <div className={styles.tunedGrid} style={memoShelfGridStyle()}>
      <ul className={styles.grid}>
        {memos.map((memo, index) => (
          <li key={memo.id} className={styles.gridItem}>
            <MemoShelfCard
              memo={memo}
              onOpenMemo={onOpenMemo}
              resampleTilt={resampleTiltForPage}
              introStaggerIndex={
                shouldAnimate && index < 4 ? index : undefined
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );

  if (flat) {
    return content;
  }

  return <MemoShelfSurface>{content}</MemoShelfSurface>;
}
