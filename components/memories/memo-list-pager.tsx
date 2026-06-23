import Link from "next/link";

type MemoListPagerProps = {
  page: number;
  hasMore: boolean;
  /** サーバー側ページ遷移（/memories?page=…） */
  basePath?: string;
  /** クライアント側ページ遷移 */
  onPageChange?: (page: number) => void;
  loading?: boolean;
  className?: string;
  linkClassName?: string;
};

const DEFAULT_NAV_CLASS =
  "mt-10 flex items-center justify-between gap-4";
const DEFAULT_LINK_CLASS =
  "text-[11px] tracking-[0.18em] text-stone-600 transition-colors hover:text-stone-400 disabled:pointer-events-none disabled:opacity-40";

export function MemoListPager({
  page,
  hasMore,
  basePath,
  onPageChange,
  loading = false,
  className = DEFAULT_NAV_CLASS,
  linkClassName = DEFAULT_LINK_CLASS,
}: MemoListPagerProps) {
  const showPrev = page > 0;
  const showNext = hasMore;

  if (!showPrev && !showNext) {
    return null;
  }

  const linkClass = linkClassName;

  return (
    <nav className={className} aria-label="夜のメモのページ">
      {showPrev ? (
        basePath ? (
          <Link href={pageHref(basePath, page - 1)} className={linkClass}>
            ← 前のページ
          </Link>
        ) : (
          <button
            type="button"
            className={linkClass}
            disabled={loading}
            onClick={() => onPageChange?.(page - 1)}
          >
            ← 前のページ
          </button>
        )
      ) : (
        <span aria-hidden />
      )}

      {showNext ? (
        basePath ? (
          <Link href={pageHref(basePath, page + 1)} className={linkClass}>
            次のページ →
          </Link>
        ) : (
          <button
            type="button"
            className={linkClass}
            disabled={loading}
            onClick={() => onPageChange?.(page + 1)}
          >
            次のページ →
          </button>
        )
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}

function pageHref(basePath: string, page: number): string {
  if (page <= 0) {
    return basePath;
  }
  return `${basePath}?page=${page}`;
}
