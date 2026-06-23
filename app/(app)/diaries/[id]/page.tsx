import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { fetchDiaryById } from "@/lib/diaries/fetch-diary";
import { createClient } from "@/lib/supabase/server";
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
      <div className="mx-auto w-full max-w-xl px-6 py-10 text-center">
        <p
          role="alert"
          className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200/80"
        >
          夜のメモを開けませんでした。
        </p>
      </div>
    );
  }

  if (!diary) {
    notFound();
  }

  return (
    <MemoDetailPanel
      diary={diary}
      layout="screen"
      backHref="/memories"
      backLabel="一覧に戻る"
    />
  );
}
