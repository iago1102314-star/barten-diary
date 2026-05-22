import type { BottleTagItem } from "@/lib/diaries/bottle-tag-item";
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

  const { data, error } = await supabase
    .from("diaries")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch bottle tags:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bottles: BottleTagItem[] = (data ?? []).map((row) => ({
    id: row.id,
    bottleTag: row.title,
  }));

  return NextResponse.json({ bottles });
}
