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

export const DIARY_LIST_PAGE_SIZE = 4;

export type FetchDiariesOptions = {
  page?: number;
  pageSize?: number;
};

export type FetchDiariesResult = {
  diaries: DiaryListRow[];
  drinkNoteColumnMissing: boolean;
  error: string | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  hasMore?: boolean;
};

const SELECT_WITH_DRINK_NOTE =
  "id, title, body, drink_note, transcript, master_comment, created_at";

const SELECT_LEGACY =
  "id, title, body, transcript, master_comment, created_at";

function isDrinkNoteColumnMissing(message: string): boolean {
  return message.includes("drink_note") && message.includes("does not exist");
}

function paginationMeta(
  page: number,
  pageSize: number,
  totalCount: number | null,
): Pick<FetchDiariesResult, "page" | "pageSize" | "totalCount" | "hasMore"> {
  const safeTotal = totalCount ?? 0;
  return {
    page,
    pageSize,
    totalCount: safeTotal,
    hasMore: (page + 1) * pageSize < safeTotal,
  };
}

export async function fetchDiariesForShelf(
  supabase: SupabaseClient,
  options: FetchDiariesOptions = {},
): Promise<FetchDiariesResult> {
  const page = Math.max(0, options.page ?? 0);
  const pageSize = options.pageSize;
  const usePagination = pageSize != null && pageSize > 0;
  const rangeFrom = usePagination ? page * pageSize : undefined;
  const rangeTo = usePagination ? page * pageSize + pageSize - 1 : undefined;

  let withNoteQuery = supabase
    .from("diaries")
    .select(SELECT_WITH_DRINK_NOTE, {
      count: usePagination ? "exact" : undefined,
    })
    .order("created_at", { ascending: false });

  if (rangeFrom != null && rangeTo != null) {
    withNoteQuery = withNoteQuery.range(rangeFrom, rangeTo);
  }

  const withNote = await withNoteQuery;

  if (!withNote.error) {
    return {
      diaries: (withNote.data ?? []) as DiaryListRow[],
      drinkNoteColumnMissing: false,
      error: null,
      ...(usePagination
        ? paginationMeta(page, pageSize, withNote.count)
        : {}),
    };
  }

  if (!isDrinkNoteColumnMissing(withNote.error.message)) {
    return {
      diaries: [],
      drinkNoteColumnMissing: false,
      error: withNote.error.message,
    };
  }

  let legacyQuery = supabase
    .from("diaries")
    .select(SELECT_LEGACY, {
      count: usePagination ? "exact" : undefined,
    })
    .order("created_at", { ascending: false });

  if (rangeFrom != null && rangeTo != null) {
    legacyQuery = legacyQuery.range(rangeFrom, rangeTo);
  }

  const legacy = await legacyQuery;

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
    ...(usePagination ? paginationMeta(page, pageSize, legacy.count) : {}),
  };
}
