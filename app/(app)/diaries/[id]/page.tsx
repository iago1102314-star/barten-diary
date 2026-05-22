import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { fetchDiaryById } from "@/lib/diaries/fetch-diary";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type MemoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemoDetailPage({ params }: MemoDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { diary, error } = await fetchDiaryById(supabase, id);

  if (error) {
    console.error("Failed to fetch memo:", error);
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <p
          role="alert"
          className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200/80"
        >
          夜のメモを開けませんでした。
        </p>
        <BackToMemos />
      </div>
    );
  }

  if (!diary) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <BackToMemos />
      <header className="mt-8 mb-6 space-y-1">
        <p className="text-[11px] tracking-[0.2em] text-stone-600">夜のメモ</p>
      </header>
      <MemoDetailPanel diary={diary} />
    </div>
  );
}

function BackToMemos() {
  return (
    <p>
      <Link
        href="/memories"
        className="text-[11px] tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-400"
      >
        ← 夜のメモ
      </Link>
    </p>
  );
}
