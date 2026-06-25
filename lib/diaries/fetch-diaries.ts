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
  /**
   * true のときだけ COUNT(*) を実行（件数増加で遅くなる主因）。
   * 初回の page 0 のみ true にし、以降は limit+1 で hasMore を判定する。
   */
  includeExactCount?: boolean;
  /** 一覧ポラロイド用 — body / transcript を取得しない */
  shelfListOnly?: boolean;
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

/** 棚一覧カード + 詳細表示に必要なカラム（transcript は詳細 API で取得） */
const SELECT_SHELF_LIST = "id, title, created_at, body, master_comment";

const SELECT_WITH_DRINK_NOTE =
  "id, title, body, drink_note, transcript, master_comment, created_at";

const SELECT_LEGACY =
  "id, title, body, transcript, master_comment, created_at";

function isDrinkNoteColumnMissing(message: string): boolean {
  return message.includes("drink_note") && message.includes("does not exist");
}

function toShelfListRow(row: {
  id: string;
  title: string;
  created_at: string;
  body: string;
  master_comment: string | null;
}): DiaryListRow {
  return {
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    body: row.body,
    master_comment: row.master_comment,
    drink_note: null,
    transcript: null,
  };
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

function hasMoreFromProbe(rowCount: number, pageSize: number): boolean {
  return rowCount > pageSize;
}

type RangeOptions = {
  page: number;
  pageSize: number;
  includeExactCount: boolean;
};

function buildRange({ page, pageSize, includeExactCount }: RangeOptions) {
  const probeExtra = includeExactCount ? 0 : 1;
  const from = page * pageSize;
  const to = page * pageSize + pageSize - 1 + probeExtra;
  return { from, to, probeExtra };
}

async function fetchShelfListPage(
  supabase: SupabaseClient,
  options: RangeOptions,
): Promise<FetchDiariesResult> {
  const { from, to, probeExtra } = buildRange(options);

  const result = await supabase
    .from("diaries")
    .select(SELECT_SHELF_LIST, {
      count: options.includeExactCount ? "exact" : undefined,
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (result.error) {
    return {
      diaries: [],
      drinkNoteColumnMissing: false,
      error: result.error.message,
    };
  }

  const rawRows = result.data ?? [];
  const diaries = rawRows.map((row) => toShelfListRow(row));
  const trimmed =
    probeExtra > 0 ? diaries.slice(0, options.pageSize) : diaries;

  return {
    diaries: trimmed,
    drinkNoteColumnMissing: false,
    error: null,
    page: options.page,
    pageSize: options.pageSize,
    ...(options.includeExactCount
      ? paginationMeta(options.page, options.pageSize, result.count)
      : { hasMore: hasMoreFromProbe(rawRows.length, options.pageSize) }),
  };
}

async function fetchFullShelfPage(
  supabase: SupabaseClient,
  options: RangeOptions,
): Promise<FetchDiariesResult> {
  const { from, to, probeExtra } = buildRange(options);

  const withNote = await supabase
    .from("diaries")
    .select(SELECT_WITH_DRINK_NOTE, {
      count: options.includeExactCount ? "exact" : undefined,
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!withNote.error) {
    const rawRows = (withNote.data ?? []) as DiaryListRow[];
    const trimmed =
      probeExtra > 0 ? rawRows.slice(0, options.pageSize) : rawRows;

    return {
      diaries: trimmed,
      drinkNoteColumnMissing: false,
      error: null,
      page: options.page,
      pageSize: options.pageSize,
      ...(options.includeExactCount
        ? paginationMeta(options.page, options.pageSize, withNote.count)
        : { hasMore: hasMoreFromProbe(rawRows.length, options.pageSize) }),
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
    .select(SELECT_LEGACY, {
      count: options.includeExactCount ? "exact" : undefined,
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (legacy.error) {
    return {
      diaries: [],
      drinkNoteColumnMissing: true,
      error: legacy.error.message,
    };
  }

  const rawRows = legacy.data ?? [];
  const diaries = rawRows.map((row) => ({
    ...row,
    drink_note: null,
  })) as DiaryListRow[];
  const trimmed =
    probeExtra > 0 ? diaries.slice(0, options.pageSize) : diaries;

  return {
    diaries: trimmed,
    drinkNoteColumnMissing: true,
    error: null,
    page: options.page,
    pageSize: options.pageSize,
    ...(options.includeExactCount
      ? paginationMeta(options.page, options.pageSize, legacy.count)
      : { hasMore: hasMoreFromProbe(rawRows.length, options.pageSize) }),
  };
}

export async function fetchDiariesForShelf(
  supabase: SupabaseClient,
  options: FetchDiariesOptions = {},
): Promise<FetchDiariesResult> {
  const page = Math.max(0, options.page ?? 0);
  const pageSize = options.pageSize;
  const usePagination = pageSize != null && pageSize > 0;

  if (!usePagination) {
    return fetchFullShelfPage(supabase, {
      page: 0,
      pageSize: DIARY_LIST_PAGE_SIZE,
      includeExactCount: false,
    });
  }

  const rangeOptions: RangeOptions = {
    page,
    pageSize,
    includeExactCount: options.includeExactCount ?? false,
  };

  if (options.shelfListOnly) {
    return fetchShelfListPage(supabase, rangeOptions);
  }

  return fetchFullShelfPage(supabase, rangeOptions);
}
