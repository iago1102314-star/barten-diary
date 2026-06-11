import { fetchDiariesForShelf } from "@/lib/diaries/fetch-diaries";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchDiariesForShelf(supabase);

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error,
        diaries: [],
        drinkNoteColumnMissing: result.drinkNoteColumnMissing,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    diaries: result.diaries,
    drinkNoteColumnMissing: result.drinkNoteColumnMissing,
  });
}
