"use client";

import type { ReactNode } from "react";
import { forwardRef } from "react";

type DiaryPaperExportHostProps = {
  children: ReactNode;
  className?: string;
};

/** DiaryPaper 画像化用 — ref は紙面全体（UI 帯の外）に付ける */
export const DiaryPaperExportHost = forwardRef<
  HTMLDivElement,
  DiaryPaperExportHostProps
>(function DiaryPaperExportHost({ children, className }, ref) {
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
});
