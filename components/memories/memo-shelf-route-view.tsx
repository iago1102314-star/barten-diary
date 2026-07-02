"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import { MigrationNotice } from "@/components/diaries/migration-notice";
import { MemoList } from "@/components/memories/memo-list";
import { MemoShelfBottomBar } from "@/components/memories/memo-shelf-bottom-bar";
import { GuestDiaryTransferToast } from "@/components/memories/guest-diary-transfer-toast";
import { GuestShelfInfoBar } from "@/components/memories/guest-shelf-info-bar";
import { MemoShelfEmptyCounterCta } from "@/components/memories/memo-shelf-empty-counter-cta";
import { MemoShelfSwipePager } from "@/components/memories/memo-shelf-swipe-pager";
import { ShelfStatusMessage } from "@/components/memories/shelf-status-message";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { useMemoShelfListData } from "@/hooks/use-memo-shelf-list-data";
import { useMemoShelfPageNavigation } from "@/hooks/use-memo-shelf-page-navigation";
import { useShelfOutsideAmbience } from "@/hooks/use-shelf-outside-ambience";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type MemoShelfRouteViewProps = {
  page: number;
  diaries: DiaryListItem[];
  hasMore: boolean;
  totalCount: number;
  drinkNoteColumnMissing?: boolean;
  error?: boolean;
};

export function MemoShelfRouteView({
  page: initialPage,
  diaries: initialDiaries,
  hasMore: initialHasMore,
  totalCount: initialTotalCount,
  drinkNoteColumnMissing = false,
  error = false,
}: MemoShelfRouteViewProps) {
  useShelfOutsideAmbience(!error);
  const router = useRouter();
  const polaroidIntroVisitIdRef = useRef(1);
  const polaroidIntroPlayedVisitIdRef = useRef(0);
  const polaroidIntroSession = {
    visitIdRef: polaroidIntroVisitIdRef,
    playedVisitIdRef: polaroidIntroPlayedVisitIdRef,
  };

  const {
    page,
    memos: diaries,
    hasMore,
    totalCount,
    fetchPagePreview,
    navigateToPage,
    sharedPageCacheRef,
    guestListMode,
    loading,
    syncShelfSeed,
  } = useMemoShelfListData({
    enabled: !error,
    initialPage,
    initialSeed: {
      memos: initialDiaries,
      hasMore: initialHasMore,
      totalCount: initialTotalCount,
    },
    polaroidIntroSession,
  });

  const serverSeedKey = useMemo(
    () =>
      `${initialTotalCount}:${initialDiaries.map((diary) => diary.id).join(",")}`,
    [initialDiaries, initialTotalCount],
  );

  useEffect(() => {
    if (guestListMode || error) return;
    syncShelfSeed(initialPage, {
      memos: initialDiaries,
      hasMore: initialHasMore,
      totalCount: initialTotalCount,
    });
  }, [
    error,
    guestListMode,
    initialHasMore,
    initialPage,
    initialTotalCount,
    serverSeedKey,
    syncShelfSeed,
  ]);

  useEffect(() => {
    router.replace(
      page <= 0 ? "/memories" : `/memories?page=${page}`,
      { scroll: false },
    );
  }, [page, router]);

  const navigateToPageWithRoute = async (
    nextPage: number,
    preloaded?: {
      memos: DiaryListItem[];
      hasMore: boolean;
      totalCount: number;
    },
  ) => {
    await navigateToPage(nextPage, preloaded);
  };

  const listEnabled = !error && diaries.length > 0;

  const {
    goToPage,
    transitioning,
    setTransitioning,
    registerGoToPage,
    playPageSound,
  } = useMemoShelfPageNavigation({
    page,
    hasMore,
    enabled: listEnabled,
  });

  return (
    <div className={`${styles.listLayout} mx-auto min-h-dvh w-full max-w-xl`}>
      <header className="px-6 pt-10">
        <Link
          href="/diaries"
          className="text-[11px] tracking-[0.22em] text-stone-600 transition-colors hover:text-stone-400"
        >
          ← 路地に戻る
        </Link>
        <h1 className="font-app-title pt-4 text-xl font-normal tracking-[0.14em] text-stone-300">
          夜の記録
        </h1>
      </header>

      {!error && diaries.length > 0 && (
        <div className="px-6">
          <MemoShelfBottomBar
            placement="top"
            page={page}
            totalCount={totalCount}
            hasMore={hasMore}
            loading={loading}
            transitioning={transitioning}
            onPageChange={goToPage}
          />
          <div className={styles.guestShelfInfoHost}>
            <GuestShelfInfoBar visible={guestListMode && totalCount > 0} />
          </div>
        </div>
      )}

      <GuestDiaryTransferToast enabled={!guestListMode} loading={loading} />

      <div className={styles.listMiddle}>
        <div className={styles.listTopSpacer} aria-hidden />

        {loading ? (
          <div className={styles.shelfStatusOverlay}>
            <ShelfStatusMessage variant="opening" />
          </div>
        ) : null}

        <div className={styles.listAlbumHost}>
          <div className={styles.listAlbumScroll}>
            {drinkNoteColumnMissing && (
              <div className={styles.listAlbumGrid}>
                <MigrationNotice variant="drink_note" />
              </div>
            )}

            {error && (
              <div className={styles.listAlbumGrid}>
                <p
                  role="alert"
                  className="mb-8 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200/80"
                >
                  夜のメモを開けませんでした。
                </p>
              </div>
            )}

            {!error && !loading && totalCount === 0 && diaries.length === 0 && (
              <div className={styles.listAlbumGrid}>
                <MemoShelfEmptyCounterCta />
              </div>
            )}

            {!error && diaries.length > 0 && (
              <MemoShelfSwipePager
                page={page}
                hasMore={hasMore}
                enabled={listEnabled}
                currentMemos={diaries}
                polaroidIntroSession={polaroidIntroSession}
                renderList={(pageMemos, pageNum, intro) => (
                  <MemoList
                    key={pageNum}
                    memos={pageMemos}
                    page={pageNum}
                    introStagger={intro.introStagger}
                    introSession={polaroidIntroSession}
                  />
                )}
                onNavigate={navigateToPageWithRoute}
                onFetchPreview={fetchPagePreview}
                onPlayPageSound={playPageSound}
                onTransitioningChange={setTransitioning}
                registerGoToPage={registerGoToPage}
                sharedPageCache={sharedPageCacheRef}
              />
            )}
          </div>
        </div>

        <div className={styles.listBottomSpacer} aria-hidden />
      </div>

      {!error && diaries.length > 0 && (
        <MemoShelfBottomBar
          page={page}
          totalCount={totalCount}
          hasMore={hasMore}
          transitioning={transitioning}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
