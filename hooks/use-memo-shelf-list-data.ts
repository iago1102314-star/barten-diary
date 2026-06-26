"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { MemoShelfFetchedPage } from "@/lib/memories/memo-shelf-page-motion";
import { fetchGuestDiaryDraftShelfPage } from "@/lib/memories/guest-diary-shelf-page";
import {
  createMemoShelfPageCache,
  measureMemoShelfRender,
  type MemoShelfPageCache,
} from "@/lib/memories/memo-shelf-page-cache";
import { resolveMemoShelfTotalCount } from "@/lib/memories/resolve-memo-shelf-total-count";
import { skipMemoShelfPolaroidIntro } from "@/lib/memories/memo-shelf-polaroid-intro";
import { subscribeGuestDiaryDrafts } from "@/lib/night/guest-diary-drafts";
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
  const { isLoggedIn, isLoading: authLoading } = useAuthUser();
  const guestListMode = enabled && !authLoading && !isLoggedIn;

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
  const prevGuestListModeRef = useRef<boolean | null>(null);

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
      if (!guestListMode) {
        cache.prefetchAheadOf(pageNum, entry.hasMore);
      }
    },
    [cache, guestListMode],
  );

  const loadGuestPage = useCallback(
    (pageNum: number) => {
      const entry = fetchGuestDiaryDraftShelfPage(pageNum);
      applyEntry(pageNum, entry);
      setLoading(false);
      if (pageNum === 0) {
        measureMemoShelfRender();
      }
    },
    [applyEntry],
  );

  useEffect(() => {
    if (!enabled || authLoading) return;

    if (guestListMode) {
      prevGuestListModeRef.current = true;
      loadGuestPage(page);
      return subscribeGuestDiaryDrafts(() => {
        loadGuestPage(page);
      });
    }

    const wasGuest = prevGuestListModeRef.current === true;
    prevGuestListModeRef.current = false;

    if (!wasGuest) return;

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
  }, [applyEntry, authLoading, cache, enabled, guestListMode, loadGuestPage, page]);

  useEffect(() => {
    if (!enabled || initialSeed || guestListMode || authLoading) return;

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
  }, [applyEntry, authLoading, cache, enabled, guestListMode, initialSeed]);

  useEffect(() => {
    if (!enabled || !initialSeed || guestListMode) return;

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
  }, [cache, enabled, guestListMode, initialPage, initialSeed]);

  const fetchPagePreview = useCallback(
    async (pageNum: number): Promise<MemoShelfFetchedPage> => {
      if (guestListMode) {
        return fetchGuestDiaryDraftShelfPage(pageNum);
      }
      const entry = await cache.resolvePageForNavigation(pageNum);
      return entry;
    },
    [cache, guestListMode],
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

      if (guestListMode) {
        loadGuestPage(nextPage);
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
    [applyEntry, cache, guestListMode, loadGuestPage, polaroidIntroSession],
  );

  const removeMemoLocally = useCallback(
    (memoId: string) => {
      cache.clear();
      setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setHasMore(false);
      setPage(0);
      setError(null);
    },
    [cache],
  );

  const syncShelfSeed = useCallback(
    (pageNum: number, entry: MemoShelfFetchedPage) => {
      cache.clear();
      cache.seedPage(pageNum, entry);
      applyEntry(pageNum, entry);
      setLoading(false);
    },
    [applyEntry, cache],
  );

  return {
    page,
    memos,
    hasMore,
    totalCount,
    loading: loading || authLoading,
    error,
    fetchPagePreview,
    navigateToPage,
    removeMemoLocally,
    syncShelfSeed,
    sharedPageCacheRef: cache.pageCache,
    guestListMode,
  };
}
