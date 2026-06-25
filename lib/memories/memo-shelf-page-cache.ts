import type { DiaryListItem } from "@/components/diaries/diary-list";
import type { MemoShelfFetchedPage } from "@/lib/memories/memo-shelf-page-motion";
import {
  flushMemoShelfLoadProfile,
  recordMemoShelfLoadSample,
} from "@/lib/memories/memo-shelf-load-profile";
import {
  INITIAL_PREFETCH_PAGES,
  PREFETCH_AHEAD_PAGES,
} from "@/lib/memories/memo-shelf-list-tuning";
import { withResolvedTotalCount } from "@/lib/memories/resolve-memo-shelf-total-count";
import { preloadMemoShelfImages } from "@/lib/memories/preload-memo-shelf-images";

export type MemoShelfPageCacheEntry = MemoShelfFetchedPage & {
  hasMore: boolean;
};

type FetchMemoriesPageOptions = {
  includeExactCount?: boolean;
};

type FetchMemoriesPageResult = {
  diaries: DiaryListItem[];
  hasMore: boolean;
  totalCount?: number;
};

async function fetchMemoriesPageFromApi(
  pageNum: number,
  options: FetchMemoriesPageOptions = {},
): Promise<FetchMemoriesPageResult> {
  const params = new URLSearchParams({
    page: String(pageNum),
    shelfListOnly: "true",
  });

  if (options.includeExactCount) {
    params.set("includeCount", "true");
  }

  const startedAt = performance.now();
  const res = await fetch(`/api/memories?${params.toString()}`);
  const data = (await res.json()) as {
    diaries?: DiaryListItem[];
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
  };
  const fetchMs = performance.now() - startedAt;

  recordMemoShelfLoadSample("memo-shelf-bootstrap", {
    phase: "fetch",
    ms: fetchMs,
    detail: `page=${pageNum}`,
  });

  if (!res.ok) {
    throw new Error(data.error ?? "夜のメモを開けませんでした。");
  }

  return {
    diaries: data.diaries ?? [],
    hasMore: data.hasMore ?? false,
    totalCount: data.totalCount,
  };
}

async function preloadImagesWithProfile(
  memos: DiaryListItem[],
  detail: string,
): Promise<void> {
  const startedAt = performance.now();
  preloadMemoShelfImages(memos);
  await Promise.all(
    memos.flatMap((memo) => {
      // decode 完了を待たず即 return — 計測は kick のみ
      return [];
    }),
  );
  recordMemoShelfLoadSample("memo-shelf-bootstrap", {
    phase: "images",
    ms: performance.now() - startedAt,
    detail,
  });
}

export function createMemoShelfPageCache() {
  const pageCache = new Map<number, MemoShelfPageCacheEntry>();
  let totalCount = 0;
  const inflight = new Map<number, Promise<MemoShelfPageCacheEntry>>();

  const setTotalCount = (count: number) => {
    if (count > 0) {
      totalCount = count;
    }
  };

  const toEntry = (result: FetchMemoriesPageResult): MemoShelfPageCacheEntry => {
    if (result.totalCount != null && result.totalCount > 0) {
      setTotalCount(result.totalCount);
    }

    return withResolvedTotalCount(
      {
        memos: result.diaries,
        hasMore: result.hasMore,
        totalCount: result.totalCount ?? totalCount,
      },
      totalCount,
    );
  };

  const getCached = (pageNum: number): MemoShelfPageCacheEntry | undefined => {
    const entry = pageCache.get(pageNum);
    if (!entry) return undefined;
    return withResolvedTotalCount(entry, totalCount);
  };

  const seedPage = (pageNum: number, entry: MemoShelfPageCacheEntry) => {
    const resolved = withResolvedTotalCount(entry, totalCount);
    pageCache.set(pageNum, resolved);
    if (resolved.totalCount > 0) {
      setTotalCount(resolved.totalCount);
    }
  };

  const fetchAndCachePage = async (
    pageNum: number,
    options: FetchMemoriesPageOptions = {},
  ): Promise<MemoShelfPageCacheEntry> => {
    const cached = getCached(pageNum);
    if (cached) return cached;

    const pending = inflight.get(pageNum);
    if (pending) return pending;

    const task = (async () => {
      const result = await fetchMemoriesPageFromApi(pageNum, options);
      const entry = toEntry(result);
      pageCache.set(pageNum, entry);
      void preloadImagesWithProfile(
        entry.memos,
        `page=${pageNum}`,
      );
      return entry;
    })();

    inflight.set(pageNum, task);

    try {
      return await task;
    } finally {
      inflight.delete(pageNum);
    }
  };

  const prefetchPage = (pageNum: number) => {
    if (pageNum < 0) return;
    if (pageCache.has(pageNum) || inflight.has(pageNum)) return;
    void fetchAndCachePage(pageNum);
  };

  const bootstrapInitialPages = async (): Promise<{
    page: number;
    entry: MemoShelfPageCacheEntry;
  }> => {
    const first = await fetchAndCachePage(0, { includeExactCount: true });

    const restPageNumbers = Array.from(
      { length: Math.max(0, INITIAL_PREFETCH_PAGES - 1) },
      (_, index) => index + 1,
    );

    if (restPageNumbers.length > 0) {
      await Promise.all(
        restPageNumbers.map((pageNum) => fetchAndCachePage(pageNum)),
      );
    }

    const aheadPage = INITIAL_PREFETCH_PAGES - 1 + PREFETCH_AHEAD_PAGES;
    if (first.hasMore) {
      prefetchPage(aheadPage);
    }

    return { page: 0, entry: getCached(0) ?? first };
  };

  const prefetchAheadOf = (currentPage: number, hasMore: boolean) => {
    if (!hasMore) return;
    for (let offset = 1; offset <= PREFETCH_AHEAD_PAGES; offset += 1) {
      prefetchPage(currentPage + offset);
    }
  };

  const resolvePageForNavigation = async (
    pageNum: number,
  ): Promise<MemoShelfPageCacheEntry> => {
    return fetchAndCachePage(pageNum, {
      includeExactCount: pageNum === 0 && totalCount === 0,
    });
  };

  return {
    bootstrapInitialPages,
    fetchAndCachePage,
    getCached,
    seedPage,
    prefetchAheadOf,
    prefetchPage,
    resolvePageForNavigation,
    getTotalCount: () => totalCount,
    setTotalCount,
    pageCache,
  };
}

export type MemoShelfPageCache = ReturnType<typeof createMemoShelfPageCache>;

export function measureMemoShelfRender(label = "memo-shelf-bootstrap"): void {
  if (process.env.NODE_ENV === "production") return;

  const startedAt = performance.now();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      recordMemoShelfLoadSample(label, {
        phase: "render",
        ms: performance.now() - startedAt,
        detail: "double-rAF",
      });
      flushMemoShelfLoadProfile(label);
    });
  });
}
