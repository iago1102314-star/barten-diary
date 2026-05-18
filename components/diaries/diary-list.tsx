import type { Diary } from "@/types/database";

type DiaryListProps = {
  diaries: Pick<Diary, "id" | "title" | "body" | "created_at">[];
};

export function DiaryList({ diaries }: DiaryListProps) {
  if (diaries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        まだ日記がありません。上のフォームから最初の日記を書いてみましょう。
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {diaries.map((diary) => (
        <li
          key={diary.id}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              {diary.title}
            </h3>
            <time
              dateTime={diary.created_at}
              className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
            >
              {formatDate(diary.created_at)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {diary.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
