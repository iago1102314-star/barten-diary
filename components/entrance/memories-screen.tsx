"use client";

import { SceneFrame } from "@/components/entrance/scene-frame";
import { MemoList } from "@/components/memories/memo-list";
import { DiaryExportNoticePanel } from "@/components/diary-paper/diary-export-notice";
import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { MemoShelfSwipePager } from "@/components/memories/memo-shelf-swipe-pager";
import { MemoShelfBottomBar } from "@/components/memories/memo-shelf-bottom-bar";
import { MemoShelfRecordBottomBar } from "@/components/memories/memo-shelf-detail-bar";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { MemoShelfScreen } from "@/components/memories/memo-shelf-surface";
import type { DiaryListItem } from "@/components/diaries/diary-list";
import { useMemoShelfPageNavigation } from "@/hooks/use-memo-shelf-page-navigation";
import { useDiaryPaperExport } from "@/hooks/use-diary-paper-export";
import { skipMemoShelfPolaroidIntro } from "@/lib/memories/memo-shelf-polaroid-intro";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type MemoriesScreenProps = {
  onBack: () => void;
  /** 指定時は一覧を飛ばしてその記録を開く（帰り道からなど） */
  initialDiaryId?: string;
};

const contentFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.45, ease: EASE_DRIFT },
} as const;

/** 路地で過去の記録を振り返る — ページ遷移なし */
export function MemoriesScreen({
  onBack,
  initialDiaryId,
}: MemoriesScreenProps) {
  const [memos, setMemos] = useState<DiaryListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<DiaryListItem | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailDirty, setDetailDirty] = useState(false);
  const diaryExportRef = useRef<HTMLDivElement>(null);
  const polaroidIntroVisitIdRef = useRef(1);
  const polaroidIntroPlayedVisitIdRef = useRef(0);
  const polaroidIntroSession = {
    visitIdRef: polaroidIntroVisitIdRef,
    playedVisitIdRef: polaroidIntroPlayedVisitIdRef,
  };
  const directOpen = Boolean(initialDiaryId);

  const fetchListPage = useCallback(async (
    pageNum: number,
    preloaded?: {
      memos: DiaryListItem[];
      hasMore: boolean;
      totalCount: number;
    },
  ) => {
    if (pageNum !== 0) {
      skipMemoShelfPolaroidIntro(polaroidIntroSession);
    }

    if (preloaded) {
      setMemos(preloaded.memos);
      setHasMore(preloaded.hasMore);
      setTotalCount(preloaded.totalCount);
      setPage(pageNum);
      setError(null);
      return;
    }

    const res = await fetch(`/api/memories?page=${pageNum}`);
    const data = (await res.json()) as {
      diaries?: DiaryListItem[];
      hasMore?: boolean;
      totalCount?: number;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(data.error ?? "夜のメモを開けませんでした。");
    }

    setMemos(data.diaries ?? []);
    setHasMore(data.hasMore ?? false);
    setTotalCount(data.totalCount ?? data.diaries?.length ?? 0);
    setPage(pageNum);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        if (initialDiaryId) {
          const res = await fetch(`/api/memories/${initialDiaryId}`);
          const data = (await res.json()) as {
            diary?: DiaryListItem;
            error?: string;
          };

          if (cancelled) return;

          if (!res.ok || !data.diary) {
            setError(data.error ?? "記録を開けませんでした。");
            return;
          }

          setSelectedMemo(data.diary);
          skipMemoShelfPolaroidIntro(polaroidIntroSession);
          setMemos([data.diary]);
          return;
        }

        await fetchListPage(0);
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
  }, [fetchListPage, initialDiaryId]);

  const refreshMemo = useCallback(async (id: string) => {
    const res = await fetch(`/api/memories/${id}`);
    const data = (await res.json()) as {
      diary?: DiaryListItem;
      error?: string;
    };

    if (!res.ok || !data.diary) return;

    setSelectedMemo(data.diary);
    setMemos((prev) =>
      prev.map((memo) => (memo.id === data.diary!.id ? data.diary! : memo)),
    );
  }, []);

  const handleOpenMemo = useCallback((memo: DiaryListItem) => {
    skipMemoShelfPolaroidIntro(polaroidIntroSession);
    setSelectedMemo(memo);
  }, []);

  useEffect(() => {
    setDetailEditing(false);
    setDetailDirty(false);
  }, [selectedMemo?.id]);

  const diaryExport = useDiaryPaperExport({
    captureRef: diaryExportRef,
    createdAt: selectedMemo?.created_at ?? "",
  });

  const handleBackToAlley = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleBackToList = useCallback(() => {
    if (detailEditing && detailDirty) {
      if (!window.confirm("変更を破棄しますか？")) return;
      setDetailEditing(false);
      setDetailDirty(false);
    }
    if (directOpen) {
      handleBackToAlley();
      return;
    }
    setSelectedMemo(null);
  }, [detailDirty, detailEditing, directOpen, handleBackToAlley]);

  const backFromScreenLabel = "路地に戻る";
  const backToListLabel = "一覧に戻る";

  const fetchPagePreview = useCallback(async (pageNum: number) => {
    const res = await fetch(`/api/memories?page=${pageNum}`);
    const data = (await res.json()) as {
      diaries?: DiaryListItem[];
      hasMore?: boolean;
      totalCount?: number;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(data.error ?? "夜のメモを開けませんでした。");
    }

    return {
      memos: data.diaries ?? [],
      hasMore: data.hasMore ?? false,
      totalCount: data.totalCount ?? data.diaries?.length ?? 0,
    };
  }, []);

  const listPaginationEnabled =
    !initialDiaryId && !selectedMemo && !loading && !error && memos.length > 0;

  const showIndexBar = !selectedMemo && !directOpen;

  const {
    goToPage,
    transitioning,
    setTransitioning,
    registerGoToPage,
    playPageSound,
  } = useMemoShelfPageNavigation({
    page,
    hasMore,
    loading,
    enabled: listPaginationEnabled,
  });

  const recordBackLabel = selectedMemo
    ? directOpen
      ? backFromScreenLabel
      : backToListLabel
    : backFromScreenLabel;

  const handleRecordBack = selectedMemo ? handleBackToList : handleBackToAlley;

  return (
    <SceneFrame>
      <MemoShelfScreen>
        <div className={styles.shelfChromeLayout}>
          {showIndexBar && (
            <MemoShelfBottomBar
              placement="top"
              page={page}
              totalCount={totalCount}
              hasMore={hasMore}
              loading={loading}
              transitioning={transitioning}
              onPageChange={goToPage}
            />
          )}

          <div className={styles.shelfContentStage}>
            <AnimatePresence mode="wait">
              {selectedMemo ? (
                <motion.div
                  key={`detail-${selectedMemo.id}`}
                  {...contentFade}
                  className={`${styles.shelfContentPane} ${styles.detailLayout}`}
                >
                  <div
                    className={styles.detailPaperScroll}
                    data-diary-paper-scroll
                  >
                    <MemoDetailPanel
                      diary={selectedMemo}
                      exportRef={diaryExportRef}
                      editing={detailEditing}
                      onEditingChange={setDetailEditing}
                      onDirtyChange={setDetailDirty}
                      onPersisted={() => void refreshMemo(selectedMemo.id)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  {...contentFade}
                  className={`${styles.shelfContentPane} ${styles.listLayout}`}
                >
                  <div className={styles.listMiddle}>
                    <div className={styles.listTopSpacer} aria-hidden />

                    <div className={styles.listAlbumHost}>
                      <div className={styles.listAlbumScroll}>
                        {loading && (
                          <div className={styles.listAlbumGrid}>
                            <p className={styles.loadingText}>……</p>
                          </div>
                        )}

                        {!loading && error && (
                          <div className={styles.listAlbumGrid}>
                            <p role="alert" className={styles.errorText}>
                              {error}
                            </p>
                          </div>
                        )}

                        {!loading && !error && memos.length > 0 && (
                          <MemoShelfSwipePager
                            page={page}
                            hasMore={hasMore}
                            enabled={listPaginationEnabled}
                            currentMemos={memos}
                            polaroidIntroSession={polaroidIntroSession}
                            renderList={(pageMemos, pageNum, intro) => (
                              <MemoList
                                key={pageNum}
                                memos={pageMemos}
                                onOpenMemo={handleOpenMemo}
                                page={pageNum}
                                flat
                                introStagger={intro.introStagger}
                                introSession={polaroidIntroSession}
                              />
                            )}
                            onNavigate={fetchListPage}
                            onFetchPreview={fetchPagePreview}
                            onPlayPageSound={playPageSound}
                            onTransitioningChange={setTransitioning}
                            registerGoToPage={registerGoToPage}
                          />
                        )}
                      </div>
                    </div>

                    <div className={styles.listBottomSpacer} aria-hidden />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MemoShelfRecordBottomBar
            onBack={handleRecordBack}
            backLabel={recordBackLabel}
            detailActions={
              selectedMemo && !detailEditing
                ? {
                    onEdit: () => setDetailEditing(true),
                    onSave: diaryExport.exportDiary,
                    saveDisabled: diaryExport.exporting,
                  }
                : undefined
            }
          />

          {selectedMemo ? (
            <DiaryExportNoticePanel
              notice={diaryExport.notice}
              onDismiss={diaryExport.dismissNotice}
            />
          ) : null}
        </div>
      </MemoShelfScreen>

    </SceneFrame>
  );
}
