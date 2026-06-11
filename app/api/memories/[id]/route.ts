import { fetchDiaryById } from "@/lib/diaries/fetch-diary";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { diary, error } = await fetchDiaryById(supabase, id);

  if (error) {
    return NextResponse.json({ error, diary: null }, { status: 500 });
  }

  if (!diary) {
    return NextResponse.json({ error: "Not found", diary: null }, { status: 404 });
  }

  return NextResponse.json({ diary });
}
