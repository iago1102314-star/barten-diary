import { MemoShelfRouteView } from "@/components/memories/memo-shelf-route-view";
import {
  DIARY_LIST_PAGE_SIZE,
  fetchDiariesForShelf,
} from "@/lib/diaries/fetch-diaries";
import { createClient } from "@/lib/supabase/server";

type MemoriesPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function MemoriesPage({ searchParams }: MemoriesPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number.parseInt(pageParam ?? "0", 10) || 0);
  const supabase = await createClient();
  const { diaries, drinkNoteColumnMissing, error, hasMore, totalCount } =
    await fetchDiariesForShelf(supabase, {
      page,
      pageSize: DIARY_LIST_PAGE_SIZE,
      includeExactCount: true,
      shelfListOnly: true,
    });

  if (error) {
    console.error("Failed to fetch memos:", error);
  }

  const safeTotalCount = totalCount ?? 0;

  return (
    <MemoShelfRouteView
      page={page}
      diaries={diaries}
      hasMore={hasMore ?? false}
      totalCount={safeTotalCount}
      drinkNoteColumnMissing={drinkNoteColumnMissing}
      error={Boolean(error)}
    />
  );
}
