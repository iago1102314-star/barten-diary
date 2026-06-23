import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { mapLatestDiaryForDevSkip } from "@/lib/dev/map-latest-diary-for-skip";
import { fetchDiariesForShelf } from "@/lib/diaries/fetch-diaries";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isDevShortcutEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchDiariesForShelf(supabase, { page: 0, pageSize: 1 });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const latest = result.diaries[0];
  if (!latest) {
    return NextResponse.json(
      { error: "保存済みの日記がありません。" },
      { status: 404 },
    );
  }

  const snapshot = mapLatestDiaryForDevSkip(latest);
  if (!snapshot) {
    return NextResponse.json(
      { error: "最新の日記に transcript がありません。" },
      { status: 422 },
    );
  }

  return NextResponse.json({ snapshot });
}
