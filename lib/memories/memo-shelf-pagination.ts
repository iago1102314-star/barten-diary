import { DIARY_LIST_PAGE_SIZE } from "@/lib/diaries/fetch-diaries";

export function memoShelfTotalPages(
  totalCount: number,
  pageSize = DIARY_LIST_PAGE_SIZE,
): number {
  if (totalCount <= 0) return 1;
  return Math.ceil(totalCount / pageSize);
}

export function memoShelfPageIndicator(
  page: number,
  totalCount: number,
  pageSize = DIARY_LIST_PAGE_SIZE,
): string {
  const totalPages = memoShelfTotalPages(totalCount, pageSize);
  return `${page + 1}/${totalPages}`;
}
