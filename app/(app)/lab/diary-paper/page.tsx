import { DiaryPaperScreen } from "@/components/diary-paper/diary-paper-screen";
import { fetchDiariesForShelf } from "@/lib/diaries/fetch-diaries";
import { DIARY_PAPER_MOCK } from "@/lib/diary-paper/diary-paper-mock-data";
import { mapDiaryListRowToDiaryPaper } from "@/lib/diary-paper/map-diary-to-paper";
import { createClient } from "@/lib/supabase/server";

export default async function DiaryPaperLabPage() {
  const supabase = await createClient();
  const { diaries } = await fetchDiariesForShelf(supabase, {
    page: 0,
    pageSize: 1,
  });
  const latest = diaries[0];
  const data = latest ? mapDiaryListRowToDiaryPaper(latest) : DIARY_PAPER_MOCK;

  return (
    <DiaryPaperScreen
      data={data}
      variant="lab"
      backHref="/lab"
      backLabel="← ラボ"
    />
  );
}
