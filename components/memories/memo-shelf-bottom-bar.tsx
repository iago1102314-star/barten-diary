import styles from "@/components/memories/memo-shelf-grid.module.css";
import { TriNavIcon } from "@/components/ui/tri-nav-icon";
import { DIARY_LIST_PAGE_SIZE } from "@/lib/diaries/fetch-diaries";
import { memoShelfPageIndicator } from "@/lib/memories/memo-shelf-pagination";
import Link from "next/link";

type MemoShelfBottomBarProps = {
  page: number;
  totalCount: number;
  hasMore: boolean;
  pageSize?: number;
  loading?: boolean;
  transitioning?: boolean;
  placement?: "top" | "bottom";
  /** サーバー側ページ遷移（/memories?page=…） */
  basePath?: string;
  /** クライアント側ページ遷移（page SE 再生込み） */
  onPageChange?: (page: number) => void;
};

export function MemoShelfBottomBar({
  page,
  totalCount,
  hasMore,
  pageSize = DIARY_LIST_PAGE_SIZE,
  loading = false,
  transitioning = false,
  placement = "bottom",
  basePath,
  onPageChange,
}: MemoShelfBottomBarProps) {
  const showPrev = page > 0;
  const showNext = hasMore;
  const indicator = memoShelfPageIndicator(page, totalCount, pageSize);
  const interactionLocked = loading || transitioning;
  const barClassName =
    placement === "top" ? styles.indexTopBar : styles.bottomBar;
  const Tag = placement === "top" ? "header" : "footer";

  return (
    <Tag className={barClassName}>
      <div className={styles.bottomBarSide}>
        <BottomBarAction
          direction="left"
          ariaLabel="前のページへ"
          enabled={showPrev}
          loading={interactionLocked}
          href={basePath && showPrev ? pageHref(basePath, page - 1) : undefined}
          onClick={showPrev ? () => onPageChange?.(page - 1) : undefined}
        />
      </div>

      <p className={styles.bottomBarIndicator} aria-live="polite">
        {indicator}
      </p>

      <div className={`${styles.bottomBarSide} ${styles.bottomBarSideRight}`}>
        <BottomBarAction
          direction="right"
          ariaLabel="次のページへ"
          enabled={showNext}
          loading={interactionLocked}
          href={basePath && showNext ? pageHref(basePath, page + 1) : undefined}
          onClick={showNext ? () => onPageChange?.(page + 1) : undefined}
        />
      </div>
    </Tag>
  );
}

function BottomBarAction({
  direction,
  ariaLabel,
  enabled,
  loading,
  href,
  onClick,
}: {
  direction: "left" | "right";
  ariaLabel: string;
  enabled: boolean;
  loading: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = [
    styles.bottomBarAction,
    !enabled ? styles.bottomBarActionDisabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  const icon = (
    <TriNavIcon direction={direction} className={styles.bottomBarTriIcon} />
  );

  if (href && enabled) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel}
        aria-disabled={loading || undefined}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={!enabled || loading}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function pageHref(basePath: string, page: number): string {
  if (page <= 0) {
    return basePath;
  }
  return `${basePath}?page=${page}`;
}
