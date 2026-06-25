import { DIARY_LIST_PAGE_SIZE } from "@/lib/diaries/fetch-diaries";

/** 1ページあたりの件数（API・UI 共通） */
export const MEMO_SHELF_PAGE_SIZE = DIARY_LIST_PAGE_SIZE;

/** 初回表示で先読みするページ数（×4件）。チューニングはここだけ変更 */
export const INITIAL_PREFETCH_PAGES = 3;

/** 現在ページから常に先読みするページ数 */
export const PREFETCH_AHEAD_PAGES = 1;
