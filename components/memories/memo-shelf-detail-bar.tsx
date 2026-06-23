"use client";

import styles from "@/components/memories/memo-shelf-grid.module.css";
import { EditActionIcon } from "@/components/ui/edit-action-icon";
import { ShareSaveIcon } from "@/components/ui/share-save-icon";
import { ShebronIcon } from "@/components/ui/shebron-icon";
import Link from "next/link";

type MemoShelfRecordBottomBarDetailActions = {
  onEdit: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
};

type MemoShelfRecordBottomBarProps = {
  backLabel: string;
  title?: string;
  onBack?: () => void;
  backHref?: string;
  detailActions?: MemoShelfRecordBottomBarDetailActions;
};

/** 夜のメモ — 下部ナビ（戻る + タイトル + 詳細時アクション） */
export function MemoShelfRecordBottomBar({
  backLabel,
  title = "夜のメモ",
  onBack,
  backHref,
  detailActions,
}: MemoShelfRecordBottomBarProps) {
  const backControl =
    backHref != null ? (
      <Link
        href={backHref}
        className={styles.topBarBack}
        aria-label={backLabel}
      >
        <ShebronIcon className={styles.topBarIcon} />
      </Link>
    ) : (
      <button
        type="button"
        className={styles.topBarBack}
        onClick={onBack}
        aria-label={backLabel}
      >
        <ShebronIcon className={styles.topBarIcon} />
      </button>
    );

  return (
    <footer className={styles.bottomBar}>
      <div className={styles.bottomBarSide}>{backControl}</div>
      <p className={styles.bottomBarIndicator}>{title}</p>
      <div className={`${styles.bottomBarSide} ${styles.bottomBarSideRight}`}>
        {detailActions ? (
          <div className={styles.bottomBarDetailActions}>
            <button
              type="button"
              className={`${styles.bottomBarTextAction} ${styles.bottomBarEditAction}`}
              onClick={detailActions.onEdit}
              aria-label="編集"
            >
              <EditActionIcon className={styles.bottomBarActionIcon} />
              編集
            </button>
            <button
              type="button"
              className={`${styles.bottomBarTextAction} ${styles.bottomBarSaveAction}`}
              onClick={detailActions.onSave}
              disabled={detailActions.saveDisabled}
              aria-label="保存"
            >
              <ShareSaveIcon className={styles.bottomBarActionIcon} />
              保存
            </button>
          </div>
        ) : null}
      </div>
    </footer>
  );
}

/** @deprecated MemoShelfRecordBottomBar を使用 */
export const MemoShelfDetailBottomBar = MemoShelfRecordBottomBar;
