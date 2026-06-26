import type { MemoShelfFetchedPage } from "@/lib/memories/memo-shelf-page-motion";
import { DIARY_LIST_PAGE_SIZE } from "@/lib/diaries/fetch-diaries";
import { listGuestDiaryDraftsAsListItems } from "@/lib/night/guest-diary-drafts";

export function fetchGuestDiaryDraftShelfPage(
  pageNum: number,
  pageSize: number = DIARY_LIST_PAGE_SIZE,
): MemoShelfFetchedPage {
  const all = listGuestDiaryDraftsAsListItems();
  const start = pageNum * pageSize;
  const memos = all.slice(start, start + pageSize);

  return {
    memos,
    hasMore: start + pageSize < all.length,
    totalCount: all.length,
  };
}
