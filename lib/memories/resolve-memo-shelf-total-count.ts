import type { MemoShelfFetchedPage } from "@/lib/memories/memo-shelf-page-motion";

export function resolveMemoShelfTotalCount(
  entryTotalCount: number | undefined,
  knownTotalCount: number,
): number {
  const entryCount = entryTotalCount ?? 0;
  return Math.max(entryCount, knownTotalCount);
}

export function withResolvedTotalCount(
  entry: MemoShelfFetchedPage,
  knownTotalCount: number,
): MemoShelfFetchedPage {
  return {
    ...entry,
    totalCount: resolveMemoShelfTotalCount(entry.totalCount, knownTotalCount),
  };
}
