"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import { MigrationNotice } from "@/components/diaries/migration-notice";
import { MemoList } from "@/components/memories/memo-list";
import { MemoShelfBottomBar } from "@/components/memories/memo-shelf-bottom-bar";
import { MemoShelfSwipePager } from "@/components/memories/memo-shelf-swipe-pager";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { useMemoShelfListData } from "@/hooks/use-memo-shelf-list-data";
import { useMemoShelfPageNavigation } from "@/hooks/use-memo-shelf-page-navigation";
import { useSettingsMenuHidden } from "@/lib/settings/settings-menu-visibility";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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

  useSettingsMenuHidden("memories-list", true);

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

      <div className={styles.listMiddle}>
        <div className={styles.listTopSpacer} aria-hidden />

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
