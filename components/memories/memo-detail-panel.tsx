"use client";

import { ShelfDiaryCard } from "@/components/diaries/shelf-diary-card";
import { EditMemoForm } from "@/components/memories/edit-memo-form";
import type { DiaryListRow } from "@/lib/diaries/fetch-diaries";
import { useCallback, useState } from "react";

type MemoDetailPanelProps = {
  diary: DiaryListRow;
};

export function MemoDetailPanel({ diary }: MemoDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const closeEditor = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <EditMemoForm
        diaryId={diary.id}
        initialBody={diary.body}
        onCancel={closeEditor}
        onSaved={closeEditor}
      />
    );
  }

  return (
    <>
      <ShelfDiaryCard
        bottleTag={diary.title}
        diary={diary.body}
        drinkNote={diary.drink_note}
        masterComment={diary.master_comment}
        createdAt={diary.created_at}
      />

      <footer className="mt-12 space-y-2 text-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] tracking-[0.2em] text-stone-600 transition-colors hover:text-stone-400"
        >
          言葉を整える
        </button>
        <p className="text-[11px] leading-relaxed text-stone-700/90">
          名前や聞き間違いがあれば、少しだけ直せます。
        </p>
      </footer>
    </>
  );
}
