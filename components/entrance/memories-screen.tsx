"use client";

import { SceneFrame } from "@/components/entrance/scene-frame";
import { MemoList } from "@/components/memories/memo-list";
import { DiaryExportNoticePanel } from "@/components/diary-paper/diary-export-notice";
import { MemoDetailPanel } from "@/components/memories/memo-detail-panel";
import { MemoShelfSwipePager } from "@/components/memories/memo-shelf-swipe-pager";
import { MemoShelfBottomBar } from "@/components/memories/memo-shelf-bottom-bar";
import { GuestDiaryTransferToast } from "@/components/memories/guest-diary-transfer-toast";
import { GuestShelfInfoBar } from "@/components/memories/guest-shelf-info-bar";
import { MemoShelfEmptyCounterCta } from "@/components/memories/memo-shelf-empty-counter-cta";
import { MemoShelfRecordBottomBar } from "@/components/memories/memo-shelf-detail-bar";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { MemoShelfScreen } from "@/components/memories/memo-shelf-surface";
import { ShelfStatusMessage } from "@/components/memories/shelf-status-message";
import type { DiaryListItem } from "@/components/diaries/diary-list";
import { useMemoShelfListData } from "@/hooks/use-memo-shelf-list-data";
import { useMemoShelfPageNavigation } from "@/hooks/use-memo-shelf-page-navigation";
import { useShelfOutsideAmbience } from "@/hooks/use-shelf-outside-ambience";
import { useDiaryDelete } from "@/hooks/use-diary-delete";
import { useDiaryPaperExport } from "@/hooks/use-diary-paper-export";
import { skipMemoShelfPolaroidIntro } from "@/lib/memories/memo-shelf-polaroid-intro";
import {
  findGuestDiaryDraftByListId,
  guestDraftToDiaryListItem,
  guestListIdToClientId,
  isGuestDiaryListId,
  removeGuestDiaryDraft,
} from "@/lib/night/guest-diary-drafts";
import { useSettingsMenuHidden } from "@/lib/settings/settings-menu-visibility";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MemoriesScreenProps = {
  onBack: () => void;
  /** 空の棚からカウンター入店 — 暗転完了後に呼ぶ */
  onLaunchCounter?: () => void;
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
  onLaunchCounter,
  initialDiaryId,
}: MemoriesScreenProps) {
  const [selectedMemo, setSelectedMemo] = useState<DiaryListItem | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailDirty, setDetailDirty] = useState(false);
  const [deletedMemoIds, setDeletedMemoIds] = useState<Set<string>>(() => new Set());
  const [guestDeleting, setGuestDeleting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(Boolean(initialDiaryId));
  const [loadingMemoDetail, setLoadingMemoDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const diaryExportRef = useRef<HTMLDivElement>(null);
  const polaroidIntroVisitIdRef = useRef(1);
  const polaroidIntroPlayedVisitIdRef = useRef(0);
  const polaroidIntroSession = useMemo(
    () => ({
      visitIdRef: polaroidIntroVisitIdRef,
      playedVisitIdRef: polaroidIntroPlayedVisitIdRef,
    }),
    [],
  );
  const directOpen = Boolean(initialDiaryId);

  useShelfOutsideAmbience();

  useSettingsMenuHidden("diary-detail", selectedMemo !== null);

  const listData = useMemoShelfListData({
    enabled: !initialDiaryId,
    polaroidIntroSession,
  });

  const {
    page,
    memos,
    hasMore,
    totalCount,
    loading: listLoading,
    error: listError,
    fetchPagePreview,
    navigateToPage,
    sharedPageCacheRef,
    guestListMode,
    removeMemoLocally,
  } = listData;
  const visibleMemos = useMemo(
    () => memos.filter((memo) => !deletedMemoIds.has(memo.id)),
    [deletedMemoIds, memos],
  );
  const visibleTotalCount = Math.max(0, totalCount - deletedMemoIds.size);

  const loading = initialDiaryId ? loadingDetail : listLoading;
  const error = initialDiaryId ? errorDetail : listError;
  const showReading = (loadingDetail || loadingMemoDetail) && !selectedMemo;
  const showOpening = listLoading && !selectedMemo && !showReading;
  const diaryDelete = useDiaryDelete({
    diaryId: selectedMemo?.id ?? "",
    onDeleted: () => {
      if (!selectedMemo) return;

      removeMemoLocally(selectedMemo.id);
      setDeletedMemoIds((prev) => {
        const next = new Set(prev);
        next.add(selectedMemo.id);
        return next;
      });
      setSelectedMemo(null);
      setDetailEditing(false);
      setDetailDirty(false);
    },
  });

  useEffect(() => {
    if (!initialDiaryId) return;

    if (isGuestDiaryListId(initialDiaryId)) {
      const draft = findGuestDiaryDraftByListId(initialDiaryId);
      if (draft) {
        setSelectedMemo(guestDraftToDiaryListItem(draft));
        skipMemoShelfPolaroidIntro(polaroidIntroSession);
      } else {
        setErrorDetail("記録を開けませんでした。");
      }
      setLoadingDetail(false);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setErrorDetail(null);

    void (async () => {
      try {
        const res = await fetch(`/api/memories/${initialDiaryId}`);
        const data = (await res.json()) as {
          diary?: DiaryListItem;
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok || !data.diary) {
          setErrorDetail(data.error ?? "記録を開けませんでした。");
          return;
        }

        setSelectedMemo(data.diary);
        skipMemoShelfPolaroidIntro(polaroidIntroSession);
      } catch {
        if (!cancelled) {
          setErrorDetail("記録を開けませんでした。");
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDiaryId, polaroidIntroSession]);

  const refreshMemo = useCallback(async (id: string) => {
    if (isGuestDiaryListId(id)) {
      const draft = findGuestDiaryDraftByListId(id);
      if (draft) {
        setSelectedMemo(guestDraftToDiaryListItem(draft));
      }
      return;
    }

    const res = await fetch(`/api/memories/${id}`);
    const data = (await res.json()) as {
      diary?: DiaryListItem;
      error?: string;
    };

    if (!res.ok || !data.diary) return;

    setSelectedMemo(data.diary);
  }, []);

  const handleOpenMemo = useCallback((memo: DiaryListItem) => {
    skipMemoShelfPolaroidIntro(polaroidIntroSession);

    if (isGuestDiaryListId(memo.id) || memo.body?.trim()) {
      setSelectedMemo(memo);
      return;
    }

    setLoadingMemoDetail(true);

    void (async () => {
      try {
        const res = await fetch(`/api/memories/${memo.id}`);
        const data = (await res.json()) as {
          diary?: DiaryListItem;
          error?: string;
        };

        if (res.ok && data.diary) {
          setSelectedMemo(data.diary);
          return;
        }

        setSelectedMemo(memo);
      } finally {
        setLoadingMemoDetail(false);
      }
    })();
  }, [polaroidIntroSession]);

  const fetchVisiblePagePreview = useCallback(
    async (pageNum: number) => {
      const entry = await fetchPagePreview(pageNum);
      return {
        ...entry,
        memos: entry.memos.filter((memo) => !deletedMemoIds.has(memo.id)),
        totalCount: Math.max(0, entry.totalCount - deletedMemoIds.size),
      };
    },
    [deletedMemoIds, fetchPagePreview],
  );

  useEffect(() => {
    setDetailEditing(false);
    setDetailDirty(false);
  }, [selectedMemo?.id]);

  const handleGuestDelete = useCallback(() => {
    if (!selectedMemo || !isGuestDiaryListId(selectedMemo.id)) return;

    const clientId = guestListIdToClientId(selectedMemo.id);
    if (!clientId) return;

    setGuestDeleting(true);
    removeGuestDiaryDraft(clientId);
    removeMemoLocally(selectedMemo.id);
    setDeletedMemoIds((prev) => {
      const next = new Set(prev);
      next.add(selectedMemo.id);
      return next;
    });
    setSelectedMemo(null);
    setDetailEditing(false);
    setDetailDirty(false);
    setGuestDeleting(false);
  }, [removeMemoLocally, selectedMemo]);

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

  const listPaginationEnabled =
    !initialDiaryId &&
    !selectedMemo &&
    !loading &&
    !error &&
    visibleTotalCount > 0;

  const showIndexBar =
    !selectedMemo && !directOpen && visibleTotalCount > 0;

  const showEmptyShelf =
    !selectedMemo &&
    !directOpen &&
    !loading &&
    !error &&
    visibleMemos.length === 0;

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

  const selectedMemoIsGuest = selectedMemo
    ? isGuestDiaryListId(selectedMemo.id)
    : false;

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
            <>
              <MemoShelfBottomBar
                placement="top"
                page={page}
                totalCount={visibleTotalCount}
                hasMore={hasMore}
                loading={loading}
                transitioning={transitioning}
                onPageChange={goToPage}
              />
              <div className={styles.guestShelfInfoHost}>
                <GuestShelfInfoBar visible={guestListMode && visibleMemos.length > 0} />
              </div>
            </>
          )}

          <div className={styles.shelfContentStage}>
            {showOpening || showReading ? (
              <div className={styles.shelfStatusOverlay}>
                <ShelfStatusMessage
                  variant={showReading ? "reading" : "opening"}
                />
              </div>
            ) : null}

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
                        {!loading && error && (
                          <div className={styles.listAlbumGrid}>
                            <p role="alert" className={styles.errorText}>
                              {error}
                            </p>
                          </div>
                        )}

                        {!loading && !error && visibleMemos.length > 0 && (
                          <MemoShelfSwipePager
                            page={page}
                            hasMore={hasMore}
                            enabled={listPaginationEnabled}
                            currentMemos={visibleMemos}
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
                            onNavigate={navigateToPage}
                            onFetchPreview={fetchVisiblePagePreview}
                            onPlayPageSound={playPageSound}
                            onTransitioningChange={setTransitioning}
                            registerGoToPage={registerGoToPage}
                            sharedPageCache={sharedPageCacheRef}
                          />
                        )}

                        {showEmptyShelf && (
                          <div className={styles.listAlbumGrid}>
                            <MemoShelfEmptyCounterCta
                              onLaunchCounter={onLaunchCounter}
                            />
                          </div>
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
                ? selectedMemoIsGuest
                  ? {
                      onEdit: () => setDetailEditing(true),
                      onShare: diaryExport.exportDiary,
                      shareDisabled:
                        diaryExport.exporting || guestDeleting,
                      onDelete: handleGuestDelete,
                      deleteDisabled:
                        guestDeleting || diaryExport.exporting,
                    }
                  : {
                      onEdit: () => setDetailEditing(true),
                      onShare: diaryExport.exportDiary,
                      shareDisabled:
                        diaryExport.exporting || diaryDelete.deleting,
                      onDelete: diaryDelete.deleteDiary,
                      deleteDisabled:
                        diaryDelete.deleting || diaryExport.exporting,
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
          <DiaryExportNoticePanel
            notice={diaryDelete.notice}
            onDismiss={diaryDelete.dismissNotice}
          />
          <GuestDiaryTransferToast
            enabled={!guestListMode}
            loading={loading}
          />
        </div>
      </MemoShelfScreen>

    </SceneFrame>
  );
}
