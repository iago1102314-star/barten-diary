import type { GeneratedDiary } from "@/lib/ai/types";

type GeneratedDiaryCardsProps = {
  diary: GeneratedDiary;
};

export function GeneratedDiaryCards({ diary }: GeneratedDiaryCardsProps) {
  return (
    <div className="grid gap-3">
      <DiaryCard label="タイトル" content={diary.title} />
      <DiaryCard label="日記本文" content={diary.diary} multiline />
      <DiaryCard
        label="マスターの一言"
        content={diary.masterComment}
        accent
      />
    </div>
  );
}

function DiaryCard({
  label,
  content,
  multiline = false,
  accent = false,
}: {
  label: string;
  content: string;
  multiline?: boolean;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        accent
          ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      }`}
    >
      <h3
        className={`text-xs font-medium tracking-wide uppercase ${
          accent
            ? "text-amber-800 dark:text-amber-300"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {label}
      </h3>
      <p
        className={`mt-2 text-sm leading-6 text-zinc-800 dark:text-zinc-100 ${
          multiline ? "whitespace-pre-wrap" : "font-medium"
        }`}
      >
        {content}
      </p>
    </article>
  );
}
