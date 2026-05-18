import { DiaryForm } from "@/components/diaries/diary-form";
import { DiaryList } from "@/components/diaries/diary-list";
import { createClient } from "@/lib/supabase/server";
import type { Diary } from "@/types/database";

export default async function DiariesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("diaries")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  const fetchError = error?.message ?? null;

  if (error) {
    console.error("Failed to fetch diaries:", error.message);
  }

  const diaries = (data ?? []) as Pick<
    Diary,
    "id" | "title" | "body" | "created_at"
  >[];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              日記を書く
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              タイトルと本文を入力して保存します。
            </p>
          </div>
          <DiaryForm />
        </section>

        {fetchError && (
          <p
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            日記の取得に失敗しました。Supabase SQL Editor で{" "}
            <code className="text-xs">002_diaries_grants.sql</code>{" "}
            を実行してください（テーブル権限不足の可能性があります）。
          </p>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              あなたの日記
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              作成日時の新しい順に表示しています。
            </p>
          </div>
          <DiaryList diaries={diaries} />
        </section>
      </div>
    </div>
  );
}
