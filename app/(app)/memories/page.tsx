import { MemoList } from "@/components/memories/memo-list";
import { MigrationNotice } from "@/components/diaries/migration-notice";
import { fetchDiariesForShelf } from "@/lib/diaries/fetch-diaries";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const { diaries, drinkNoteColumnMissing, error } =
    await fetchDiariesForShelf(supabase);

  if (error) {
    console.error("Failed to fetch memos:", error);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <header className="mb-10 space-y-2">
        <Link
          href="/diaries"
          className="text-[11px] tracking-[0.22em] text-stone-600 transition-colors hover:text-stone-400"
        >
          ← 路地に戻る
        </Link>
        <h1 className="font-serif-jp pt-4 text-xl font-normal tracking-[0.14em] text-stone-300">
          夜のメモ
        </h1>
        <p className="font-serif-jp text-[12px] leading-relaxed tracking-[0.06em] text-stone-600">
          帰り道で、自分用に残した記録。
        </p>
      </header>

      {drinkNoteColumnMissing && <MigrationNotice variant="drink_note" />}

      {error && (
        <p
          role="alert"
          className="mb-8 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200/80"
        >
          夜のメモを開けませんでした。
        </p>
      )}

      <MemoList memos={diaries} />
    </div>
  );
}
