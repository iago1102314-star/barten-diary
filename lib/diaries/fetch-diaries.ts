import type { Diary } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DiaryListRow = Pick<
  Diary,
  | "id"
  | "title"
  | "body"
  | "drink_note"
  | "transcript"
  | "master_comment"
  | "created_at"
>;

export type FetchDiariesResult = {
  diaries: DiaryListRow[];
  drinkNoteColumnMissing: boolean;
  error: string | null;
};

const SELECT_WITH_DRINK_NOTE =
  "id, title, body, drink_note, transcript, master_comment, created_at";

const SELECT_LEGACY =
  "id, title, body, transcript, master_comment, created_at";

function isDrinkNoteColumnMissing(message: string): boolean {
  return message.includes("drink_note") && message.includes("does not exist");
}

export async function fetchDiariesForShelf(
  supabase: SupabaseClient,
): Promise<FetchDiariesResult> {
  const withNote = await supabase
    .from("diaries")
    .select(SELECT_WITH_DRINK_NOTE)
    .order("created_at", { ascending: false });

  if (!withNote.error) {
    return {
      diaries: (withNote.data ?? []) as DiaryListRow[],
      drinkNoteColumnMissing: false,
      error: null,
    };
  }

  if (!isDrinkNoteColumnMissing(withNote.error.message)) {
    return {
      diaries: [],
      drinkNoteColumnMissing: false,
      error: withNote.error.message,
    };
  }

  const legacy = await supabase
    .from("diaries")
    .select(SELECT_LEGACY)
    .order("created_at", { ascending: false });

  if (legacy.error) {
    return {
      diaries: [],
      drinkNoteColumnMissing: true,
      error: legacy.error.message,
    };
  }

  const diaries = (legacy.data ?? []).map((row) => ({
    ...row,
    drink_note: null,
  })) as DiaryListRow[];

  return {
    diaries,
    drinkNoteColumnMissing: true,
    error: null,
  };
}
