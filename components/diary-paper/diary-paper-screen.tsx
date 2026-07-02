"use client";

import { DiaryPaper } from "@/components/diary-paper/diary-paper";
import paperStyles from "@/components/diary-paper/diary-paper.module.css";
import screenStyles from "@/components/diary-paper/diary-paper-screen.module.css";
import { MemoShelfRecordBottomBar } from "@/components/memories/memo-shelf-detail-bar";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { useEffect } from "react";

const ENTRANCE_SCROLL_LOCK_CLASS = "entrance-experience-locked";

type DiaryPaperScreenProps = {
  data: DiaryPaperData;
  backHref?: string;
  backLabel?: string;
  variant?: "lab" | "detail";
};

/** ラボ用 — 紙面全画面・下部ナビ（export / edit なし） */
export function DiaryPaperScreen({
  data,
  backHref = "/memories",
  backLabel = "一覧に戻る",
  variant = "detail",
}: DiaryPaperScreenProps) {
  useEffect(() => {
    document.documentElement.classList.remove(ENTRANCE_SCROLL_LOCK_CLASS);
    document.body.classList.remove(ENTRANCE_SCROLL_LOCK_CLASS);
  }, []);

  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.body}>
        <DiaryPaper
          data={data}
          className={paperStyles.paperFullscreen}
          stretchToViewport
        />

        {variant === "lab" ? (
          <p className={screenStyles.note}>
            保存済みの最新日記があればその内容で表示します。なければ固定モックです。
          </p>
        ) : null}
      </div>

      <MemoShelfRecordBottomBar
        backHref={backHref}
        backLabel={backLabel}
        title={variant === "lab" ? "日記紙面" : "夜のメモ"}
      />
    </div>
  );
}
