import type { DiaryListRow } from "@/lib/diaries/fetch-diaries";
import type { SupabaseClient } from "@supabase/supabase-js";

const SELECT_WITH_DRINK_NOTE =
  "id, title, body, drink_note, transcript, master_comment, created_at";

const SELECT_LEGACY =
  "id, title, body, transcript, master_comment, created_at";

function isDrinkNoteColumnMissing(message: string): boolean {
  return message.includes("drink_note") && message.includes("does not exist");
}

export async function fetchDiaryById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ diary: DiaryListRow | null; error: string | null }> {
  const withNote = await supabase
    .from("diaries")
    .select(SELECT_WITH_DRINK_NOTE)
    .eq("id", id)
    .maybeSingle();

  if (!withNote.error && withNote.data) {
    return { diary: withNote.data as DiaryListRow, error: null };
  }

  if (withNote.error && !isDrinkNoteColumnMissing(withNote.error.message)) {
    return { diary: null, error: withNote.error.message };
  }

  const legacy = await supabase
    .from("diaries")
    .select(SELECT_LEGACY)
    .eq("id", id)
    .maybeSingle();

  if (legacy.error) {
    return { diary: null, error: legacy.error.message };
  }

  if (!legacy.data) {
    return { diary: null, error: null };
  }

  return {
    diary: { ...legacy.data, drink_note: null } as DiaryListRow,
    error: null,
  };
}
