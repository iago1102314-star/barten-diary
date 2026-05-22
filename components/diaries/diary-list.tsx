import { ShelfDiaryCard } from "@/components/diaries/shelf-diary-card";
import type { Diary } from "@/types/database";

export type DiaryListItem = Pick<
  Diary,
  "id" | "title" | "body" | "drink_note" | "transcript" | "master_comment" | "created_at"
>;

type DiaryListProps = {
  diaries: DiaryListItem[];
};

export function DiaryList({ diaries }: DiaryListProps) {
  if (diaries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-800/80 px-6 py-14 text-center text-sm leading-relaxed text-stone-600">
        今夜の棚は、まだ空です。
      </p>
    );
  }

  return (
    <ul className="space-y-10">
      {diaries.map((diary) => (
        <li key={diary.id}>
          <ShelfDiaryCard
            id={diary.id}
            bottleTag={diary.title}
            diary={diary.body}
            drinkNote={diary.drink_note}
            masterComment={diary.master_comment}
            createdAt={diary.created_at}
            compact
          />
        </li>
      ))}
    </ul>
  );
}
