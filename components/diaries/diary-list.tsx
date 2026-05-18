import type { Diary } from "@/types/database";

export type DiaryListItem = Pick<
  Diary,
  "id" | "title" | "body" | "transcript" | "master_comment" | "created_at"
>;

type DiaryListProps = {
  diaries: DiaryListItem[];
};

export function DiaryList({ diaries }: DiaryListProps) {
  if (diaries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        まだ日記がありません。手入力または音声録音から日記を追加してみましょう。
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
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  {diary.title}
                </h3>
                {diary.transcript && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                    AI日記
                  </span>
                )}
              </div>
            </div>
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

          {diary.master_comment && (
            <blockquote className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                マスターの一言
              </p>
              <p className="mt-1">{diary.master_comment}</p>
            </blockquote>
          )}

          {diary.transcript && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                文字起こしを表示
              </summary>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                {diary.transcript}
              </p>
            </details>
          )}
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
