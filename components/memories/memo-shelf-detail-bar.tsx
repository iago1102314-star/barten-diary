"use client";

import styles from "@/components/memories/memo-shelf-grid.module.css";
import { DeleteActionIcon } from "@/components/ui/delete-action-icon";
import { EditActionIcon } from "@/components/ui/edit-action-icon";
import { MoreActionsIcon } from "@/components/ui/more-actions-icon";
import { ShareSaveIcon } from "@/components/ui/share-save-icon";
import { ShebronIcon } from "@/components/ui/shebron-icon";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MemoShelfRecordBottomBarDetailActions = {
  onEdit?: () => void;
  onShare?: () => void;
  shareDisabled?: boolean;
  onDelete: () => void;
  deleteDisabled?: boolean;
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
  title = "夜の記録",
  onBack,
  backHref,
  detailActions,
}: MemoShelfRecordBottomBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailActions) {
      setMenuOpen(false);
      setConfirmOpen(false);
    }
  }, [detailActions]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuShellRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

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
    <footer
      className={`${styles.bottomBar} ${menuOpen ? styles.bottomBarMenuOpen : ""}`}
    >
      <div className={styles.bottomBarSide}>{backControl}</div>
      <p className={styles.bottomBarIndicator}>{title}</p>
      <div className={`${styles.bottomBarSide} ${styles.bottomBarSideRight}`}>
        {detailActions ? (
          <div ref={menuShellRef} className={styles.bottomBarMenuShell}>
            <button
              type="button"
              className={styles.bottomBarAction}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="その他の操作"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreActionsIcon className={styles.bottomBarTriIcon} />
            </button>

            {menuOpen ? (
              <div className={styles.bottomBarMenuPanel} role="menu" aria-label="日記の操作">
                {detailActions.onEdit ? (
                  <button
                    type="button"
                    className={styles.bottomBarMenuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      detailActions.onEdit?.();
                    }}
                    role="menuitem"
                  >
                    <EditActionIcon className={styles.bottomBarActionIcon} />
                    編集
                  </button>
                ) : null}
                {detailActions.onShare ? (
                  <button
                    type="button"
                    className={styles.bottomBarMenuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      detailActions.onShare?.();
                    }}
                    disabled={detailActions.shareDisabled}
                    role="menuitem"
                  >
                    <ShareSaveIcon className={styles.bottomBarActionIcon} />
                    共有
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.bottomBarMenuItem} ${styles.bottomBarMenuDanger}`}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  disabled={detailActions.deleteDisabled}
                  role="menuitem"
                >
                  <DeleteActionIcon className={styles.bottomBarActionIcon} />
                  削除
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {confirmOpen && detailActions ? (
        <div className={styles.bottomBarConfirmLayer} role="dialog" aria-modal="true">
          <button
            type="button"
            className={styles.bottomBarConfirmBackdrop}
            aria-label="削除確認を閉じる"
            onClick={() => setConfirmOpen(false)}
          />
          <div className={styles.bottomBarConfirmCard}>
            <p className={styles.bottomBarConfirmText}>
              削除したメモは復元できません。
              <br />
              本当に削除しますか？？
            </p>
            <div className={styles.bottomBarConfirmActions}>
              <button
                type="button"
                className={styles.bottomBarConfirmDelete}
                onClick={() => {
                  setConfirmOpen(false);
                  detailActions.onDelete();
                }}
                disabled={detailActions.deleteDisabled}
              >
                削除
              </button>
              <button
                type="button"
                className={styles.bottomBarConfirmCancel}
                onClick={() => setConfirmOpen(false)}
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}

/** @deprecated MemoShelfRecordBottomBar を使用 */
export const MemoShelfDetailBottomBar = MemoShelfRecordBottomBar;
