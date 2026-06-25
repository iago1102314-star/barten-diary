"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import type { MemoShelfFetchedPage } from "@/lib/memories/memo-shelf-page-motion";
import {
  createMemoShelfPageCache,
  measureMemoShelfRender,
  type MemoShelfPageCache,
} from "@/lib/memories/memo-shelf-page-cache";
import { resolveMemoShelfTotalCount } from "@/lib/memories/resolve-memo-shelf-total-count";
import { skipMemoShelfPolaroidIntro } from "@/lib/memories/memo-shelf-polaroid-intro";
import { useCallback, useEffect, useRef, useState } from "react";

type MemoShelfPolaroidIntroSession = {
  visitIdRef: React.MutableRefObject<number>;
  playedVisitIdRef: React.MutableRefObject<number>;
};

type UseMemoShelfListDataOptions = {
  enabled?: boolean;
  initialPage?: number;
  initialSeed?: MemoShelfFetchedPage;
  polaroidIntroSession?: MemoShelfPolaroidIntroSession;
};

export function useMemoShelfListData({
  enabled = true,
  initialPage = 0,
  initialSeed,
  polaroidIntroSession,
}: UseMemoShelfListDataOptions = {}) {
  const cacheRef = useRef<MemoShelfPageCache | null>(null);
  if (!cacheRef.current) {
    cacheRef.current = createMemoShelfPageCache();
    if (initialSeed) {
      cacheRef.current.seedPage(initialPage, initialSeed);
    }
  }
  const cache = cacheRef.current;

  const [page, setPage] = useState(initialPage);
  const [memos, setMemos] = useState<DiaryListItem[]>(initialSeed?.memos ?? []);
  const [hasMore, setHasMore] = useState(initialSeed?.hasMore ?? false);
  const [totalCount, setTotalCount] = useState(initialSeed?.totalCount ?? 0);
  const [loading, setLoading] = useState(!initialSeed);
  const [error, setError] = useState<string | null>(null);

  const applyEntry = useCallback(
    (pageNum: number, entry: MemoShelfFetchedPage) => {
      const resolvedTotal = resolveMemoShelfTotalCount(
        entry.totalCount,
        cache.getTotalCount(),
      );
      setMemos(entry.memos);
      setHasMore(entry.hasMore);
      setTotalCount(resolvedTotal);
      setPage(pageNum);
      setError(null);
      if (resolvedTotal > 0) {
        cache.setTotalCount(resolvedTotal);
      }
      cache.prefetchAheadOf(pageNum, entry.hasMore);
    },
    [cache],
  );

  useEffect(() => {
    if (!enabled || initialSeed) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const { page: startPage, entry } = await cache.bootstrapInitialPages();
        if (cancelled) return;
        applyEntry(startPage, entry);
        measureMemoShelfRender();
      } catch {
        if (!cancelled) {
          setError("夜のメモを開けませんでした。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyEntry, cache, enabled, initialSeed]);

  useEffect(() => {
    if (!enabled || !initialSeed) return;

    const pagesToWarm = [initialPage + 1, initialPage + 2].filter(
      (pageNum) => pageNum > initialPage,
    );

    void (async () => {
      try {
        await Promise.all(
          pagesToWarm.map((pageNum) => cache.fetchAndCachePage(pageNum)),
        );
        cache.prefetchAheadOf(initialPage, initialSeed.hasMore);
      } catch {
        // 初回 SSR シードは表示済み — 裏の先読み失敗は無視
      }
    })();
  }, [cache, enabled, initialPage, initialSeed]);

  const fetchPagePreview = useCallback(
    async (pageNum: number): Promise<MemoShelfFetchedPage> => {
      const entry = await cache.resolvePageForNavigation(pageNum);
      return entry;
    },
    [cache],
  );

  const navigateToPage = useCallback(
    async (
      nextPage: number,
      preloaded?: MemoShelfFetchedPage,
    ) => {
      if (nextPage !== 0 && polaroidIntroSession) {
        skipMemoShelfPolaroidIntro(polaroidIntroSession);
      }

      if (preloaded) {
        applyEntry(nextPage, preloaded);
        return;
      }

      const cached = cache.getCached(nextPage);
      if (cached) {
        applyEntry(nextPage, cached);
        return;
      }

      const entry = await cache.resolvePageForNavigation(nextPage);
      applyEntry(nextPage, entry);
    },
    [applyEntry, cache, polaroidIntroSession],
  );

  return {
    page,
    memos,
    hasMore,
    totalCount,
    loading,
    error,
    fetchPagePreview,
    navigateToPage,
    sharedPageCacheRef: cache.pageCache,
  };
}
