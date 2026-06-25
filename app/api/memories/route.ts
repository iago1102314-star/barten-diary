import {
  DIARY_LIST_PAGE_SIZE,
  fetchDiariesForShelf,
} from "@/lib/diaries/fetch-diaries";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, Number.parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const includeExactCount = searchParams.get("includeCount") === "true";
  const shelfListOnly = searchParams.get("shelfListOnly") === "true";

  const result = await fetchDiariesForShelf(supabase, {
    page,
    pageSize: DIARY_LIST_PAGE_SIZE,
    includeExactCount,
    shelfListOnly,
  });

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error,
        diaries: [],
        drinkNoteColumnMissing: result.drinkNoteColumnMissing,
        page,
        pageSize: DIARY_LIST_PAGE_SIZE,
        hasMore: false,
        totalCount: 0,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    diaries: result.diaries,
    drinkNoteColumnMissing: result.drinkNoteColumnMissing,
    page: result.page ?? page,
    pageSize: result.pageSize ?? DIARY_LIST_PAGE_SIZE,
    hasMore: result.hasMore ?? false,
    ...(result.totalCount != null ? { totalCount: result.totalCount } : {}),
  });
}
