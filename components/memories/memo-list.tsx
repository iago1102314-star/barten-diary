import { stripTrailingEllipsis } from "@/lib/ai/quality/strip-trailing-ellipsis";
import { buildDiaryPreview } from "@/lib/night/diary-preview";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import Link from "next/link";
import type { DiaryListItem } from "@/components/diaries/diary-list";

type MemoListProps = {
  memos: DiaryListItem[];
  /** 指定時は同一画面内で詳細を開く（URL 遷移なし） */
  onOpenMemo?: (memo: DiaryListItem) => void;
};

export function MemoList({ memos, onOpenMemo }: MemoListProps) {
  if (memos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-800/70 bg-stone-950/20 px-6 py-16 text-center text-sm leading-relaxed text-stone-600">
        まだ、夜のメモはありません。
      </p>
    );
  }

  return (
    <ul className="space-y-5">
      {memos.map((memo, index) => (
        <li
          key={memo.id}
          className="night-rise"
          style={{ animationDelay: `${Math.min(index, 6) * 0.08}s` }}
        >
          <MemoCard memo={memo} onOpenMemo={onOpenMemo} />
        </li>
      ))}
    </ul>
  );
}

function MemoCard({
  memo,
  onOpenMemo,
}: {
  memo: DiaryListItem;
  onOpenMemo?: (memo: DiaryListItem) => void;
}) {
  const parsed = parseBottleTag(memo.title);
  const preview = buildDiaryPreview(stripTrailingEllipsis(memo.body));
  const interactive = Boolean(onOpenMemo);

  const content = (
    <>
      <header className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.08em] text-amber-200/65">
          {parsed.label || memo.title}
        </p>
        <time
          dateTime={memo.created_at}
          className="shrink-0 text-[10px] tabular-nums text-stone-700"
        >
          {formatMemoTime(memo.created_at)}
        </time>
      </header>
      <p className="font-serif-jp mt-4 whitespace-pre-wrap text-[14px] leading-[2.05] tracking-[0.04em] text-stone-400/88">
        {preview.text}
      </p>
      {(preview.isTruncated || interactive) && (
        <p className="mt-4">
          {interactive ? (
            <span className="text-[11px] tracking-[0.18em] text-stone-600">
              開く
            </span>
          ) : (
            <Link
              href={`/diaries/${memo.id}`}
              className="text-[11px] tracking-[0.18em] text-stone-600 transition-colors hover:text-stone-400"
            >
              開く
            </Link>
          )}
        </p>
      )}
      {parsed.drinkName && (
        <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-stone-600/80">
          {parsed.drinkName}
        </p>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={() => onOpenMemo?.(memo)}
        className="w-full rounded-lg border border-stone-800/55 bg-stone-950/45 px-5 py-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-500 hover:border-stone-700/60 [-webkit-tap-highlight-color:transparent]"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="rounded-lg border border-stone-800/55 bg-stone-950/45 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-500 hover:border-stone-700/60">
      {content}
    </article>
  );
}

function formatMemoTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}
