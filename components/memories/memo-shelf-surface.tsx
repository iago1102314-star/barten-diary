import type { ReactNode } from "react";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { memoShelfPaperStyle } from "@/lib/memories/memo-shelf-tuning";

type MemoShelfSurfaceProps = {
  children: ReactNode;
  className?: string;
};

/** 日記紙と同じ質感 — 罫線なし（カード内パネル用） */
export function MemoShelfSurface({
  children,
  className,
}: MemoShelfSurfaceProps) {
  return (
    <div className={[styles.shelf, className].filter(Boolean).join(" ")}>
      <div className={styles.shelfInner}>{children}</div>
    </div>
  );
}

type MemoShelfScreenProps = {
  children: ReactNode;
  className?: string;
};

/** 画面全体の紙背景 — 罫線なし */
export function MemoShelfScreen({ children, className }: MemoShelfScreenProps) {
  return (
    <div
      className={[styles.screen, className].filter(Boolean).join(" ")}
      style={memoShelfPaperStyle()}
    >
      <div className={styles.screenPaperOverlay} aria-hidden />
      <div className={styles.screenPaperDarken} aria-hidden />
      <div className={styles.screenBody}>
        <div className={styles.screenBodyInner}>{children}</div>
      </div>
    </div>
  );
}

export function MemoShelfEmpty({ flat = false }: { flat?: boolean }) {
  const content = (
    <p className={styles.empty}>まだ、夜の記録はありません。</p>
  );

  if (flat) {
    return content;
  }

  return <MemoShelfSurface>{content}</MemoShelfSurface>;
}
