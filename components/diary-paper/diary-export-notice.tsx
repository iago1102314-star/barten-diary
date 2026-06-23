"use client";

import styles from "@/components/diary-paper/diary-export-notice.module.css";
import type { DiaryExportNotice } from "@/hooks/use-diary-paper-export";
import { useEffect } from "react";

type DiaryExportNoticeProps = {
  notice: DiaryExportNotice | null;
  onDismiss: () => void;
};

export function DiaryExportNoticePanel({
  notice,
  onDismiss,
}: DiaryExportNoticeProps) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;

  return (
    <div
      role={notice.type === "error" ? "alert" : "status"}
      className={
        notice.type === "error"
          ? styles.noticeError
          : styles.noticeSuccess
      }
    >
      {notice.text}
    </div>
  );
}
