"use client";

import type { DiaryListItem } from "@/components/diaries/diary-list";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import {
  MEMO_SHELF_PAGE_EASE,
  MEMO_SHELF_PAGE_DURATION_SEC,
  memoShelfPageProgressFromOffset,
  memoShelfPageSwipePanelStyle,
  resolveMemoShelfSwipeMove,
  shouldCommitMemoShelfSwipe,
  type MemoShelfFetchedPage,
  type MemoShelfSwipeAxis,
} from "@/lib/memories/memo-shelf-page-motion";
import {
  markMemoShelfPolaroidIntroPlayed,
  resolveMemoShelfPolaroidIntro,
  skipMemoShelfPolaroidIntro,
  type MemoShelfPolaroidIntroOptions,
  type MemoShelfPolaroidIntroSession,
} from "@/lib/memories/memo-shelf-polaroid-intro";
import { preloadMemoShelfImages } from "@/lib/memories/preload-memo-shelf-images";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type MemoShelfSwipePagerProps = {
  page: number;
  hasMore: boolean;
  enabled: boolean;
  currentMemos: DiaryListItem[];
  /** 一覧入場ごとに visitId=1 — ページ送りで played を合わせて無効化 */
  polaroidIntroSession: MemoShelfPolaroidIntroSession;
  renderList: (
    memos: DiaryListItem[],
    pageNum: number,
    intro: MemoShelfPolaroidIntroOptions,
  ) => ReactNode;
  onNavigate: (
    nextPage: number,
    preloaded?: MemoShelfFetchedPage,
  ) => void | Promise<void>;
  onFetchPreview: (pageNum: number) => Promise<MemoShelfFetchedPage>;
  onPlayPageSound: () => void;
  onTransitioningChange: (transitioning: boolean) => void;
  registerGoToPage: (handler: ((nextPage: number) => void) | null) => void;
  /** 親が保持するページキャッシュ（戻る操作で再取得しない） */
  sharedPageCache?: Map<number, MemoShelfFetchedPage>;
};

type DragPhase = "idle" | "dragging" | "animating";

type PageSlot = {
  page: number;
  memos: DiaryListItem[];
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  axis: MemoShelfSwipeAxis;
  direction: 1 | -1 | null;
  isTouch: boolean;
};

const NO_POLAROID_INTRO: MemoShelfPolaroidIntroOptions = {
  introStagger: false,
};

function memoIdsMatch(a: DiaryListItem[], b: DiaryListItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index]?.id);
}

export function MemoShelfSwipePager({
  page,
  hasMore,
  enabled,
  currentMemos,
  polaroidIntroSession,
  renderList,
  onNavigate,
  onFetchPreview,
  onPlayPageSound,
  onTransitioningChange,
  registerGoToPage,
  sharedPageCache,
}: MemoShelfSwipePagerProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const pageCacheRef = useRef<Map<number, MemoShelfFetchedPage>>(
    sharedPageCache ?? new Map(),
  );

  useEffect(() => {
    if (sharedPageCache) {
      pageCacheRef.current = sharedPageCache;
    }
  }, [sharedPageCache]);
  const offsetX = useMotionValue(0);
  const directionRef = useRef<1 | -1>(1);
  const [stageWidth, setStageWidth] = useState(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slots, setSlots] = useState<[PageSlot | null, PageSlot | null]>([
    { page, memos: currentMemos },
    null,
  ]);
  const [dragDirection, setDragDirection] = useState<1 | -1 | null>(null);
  const [dragPhase, setDragPhase] = useState<DragPhase>("idle");

  const dragRef = useRef<DragSession | null>(null);
  const dragPhaseRef = useRef<DragPhase>("idle");
  const activeSlotRef = useRef<0 | 1>(0);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const enabledRef = useRef(enabled);
  const stageWidthRef = useRef(stageWidth);

  const inactiveSlot = activeSlot === 0 ? 1 : 0;
  const activeData = slots[activeSlot];
  const inactiveData = slots[inactiveSlot];

  useEffect(() => {
    dragPhaseRef.current = dragPhase;
  }, [dragPhase]);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    stageWidthRef.current = stageWidth;
  }, [stageWidth]);

  useEffect(() => {
    if (dragPhase !== "idle") return;

    const active = slots[activeSlot];
    if (
      active &&
      active.page === page &&
      memoIdsMatch(active.memos, currentMemos)
    ) {
      return;
    }

    setActiveSlot(0);
    setSlots([{ page, memos: currentMemos }, null]);
  }, [activeSlot, currentMemos, dragPhase, page, slots]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      setStageWidth(node.clientWidth);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const panelRotate = useTransform(offsetX, (value) => {
    const progress = memoShelfPageProgressFromOffset(value, stageWidth);
    if (progress <= 0 || prefersReducedMotion || dragDirection === null) {
      return 0;
    }
    return memoShelfPageSwipePanelStyle(
      progress,
      "current",
      directionRef.current,
    ).rotate;
  });

  const inactiveRotate = useTransform(offsetX, (value) => {
    const progress = memoShelfPageProgressFromOffset(value, stageWidth);
    if (progress <= 0 || prefersReducedMotion || dragDirection === null) {
      return 0;
    }
    return memoShelfPageSwipePanelStyle(
      progress,
      "adjacent",
      directionRef.current,
    ).rotate;
  });

  const unlockScrollParent = useCallback(() => {
    const parent = scrollParentRef.current;
    if (!parent) return;
    parent.style.overflowY = "";
    parent.style.touchAction = "";
    scrollParentRef.current = null;
  }, []);

  const lockScrollParent = useCallback(() => {
    const node = stageRef.current;
    if (!node || scrollParentRef.current) return;
    const parent = node.parentElement;
    if (!parent) return;
    scrollParentRef.current = parent;
    parent.style.overflowY = "hidden";
    parent.style.touchAction = "none";
  }, []);

  const resetDrag = useCallback(() => {
    offsetX.set(0);
    setDragDirection(null);
    setDragPhase("idle");
    dragRef.current = null;
    unlockScrollParent();
    onTransitioningChange(false);
  }, [offsetX, onTransitioningChange, unlockScrollParent]);

  const prefetchSlot = useCallback(
    async (slotIndex: 0 | 1, targetPage: number): Promise<MemoShelfFetchedPage> => {
      const cached = pageCacheRef.current.get(targetPage);
      if (cached) {
        preloadMemoShelfImages(cached.memos);
        setSlots((prev) => {
          if (prev[slotIndex]?.page === targetPage) return prev;
          const next: [PageSlot | null, PageSlot | null] = [...prev];
          next[slotIndex] = { page: targetPage, memos: cached.memos };
          return next;
        });
        return cached;
      }

      const payload = await onFetchPreview(targetPage);
      pageCacheRef.current.set(targetPage, payload);
      preloadMemoShelfImages(payload.memos);
      setSlots((prev) => {
        const next: [PageSlot | null, PageSlot | null] = [...prev];
        next[slotIndex] = { page: targetPage, memos: payload.memos };
        return next;
      });
      return payload;
    },
    [onFetchPreview],
  );

  const commitToPage = useCallback(
    async (targetPage: number, direction: 1 | -1, playSound: boolean) => {
      if (!enabled || dragPhaseRef.current === "animating") return;
      if (targetPage === page) return;
      if (targetPage < 0) return;
      if (targetPage > page && !hasMore) return;
      if (targetPage < page && page <= 0) return;

      if (targetPage !== pageRef.current) {
        skipMemoShelfPolaroidIntro(polaroidIntroSession);
      }

      const prevActiveSlot = activeSlotRef.current;
      const nextActiveSlot = prevActiveSlot === 0 ? 1 : 0;
      const nextInactiveSlot = prevActiveSlot;

      directionRef.current = direction;
      setDragDirection(direction);
      setDragPhase("animating");
      dragRef.current = null;
      unlockScrollParent();
      onTransitioningChange(true);
      if (playSound) onPlayPageSound();

      const width = stageWidth || stageRef.current?.clientWidth || 0;
      const targetOffset = direction > 0 ? -width : width;
      const remainingProgress =
        width > 0 ? Math.abs(targetOffset - offsetX.get()) / width : 1;
      const finishDuration =
        MEMO_SHELF_PAGE_DURATION_SEC * Math.max(0.12, remainingProgress);

      if (prefersReducedMotion) {
        try {
          const payload =
            pageCacheRef.current.get(targetPage) ??
            (await prefetchSlot(nextActiveSlot, targetPage));
          await onNavigate(targetPage, payload);
        } catch {
          resetDrag();
          return;
        }
        setActiveSlot(nextActiveSlot);
        resetDrag();
        return;
      }

      try {
        const payload =
          pageCacheRef.current.get(targetPage) ??
          (await prefetchSlot(nextActiveSlot, targetPage));

        await animate(offsetX, targetOffset, {
          duration: finishDuration,
          ease: [...MEMO_SHELF_PAGE_EASE],
        });
        await onNavigate(targetPage, payload);
        setActiveSlot(nextActiveSlot);
        offsetX.set(0);
        setDragDirection(null);
        setDragPhase("idle");
        onTransitioningChange(false);

        if (direction > 0 && payload.hasMore) {
          void prefetchSlot(nextInactiveSlot, targetPage + 1);
        } else if (direction < 0 && targetPage > 0) {
          void prefetchSlot(nextInactiveSlot, targetPage - 1);
        }
      } catch {
        await animate(offsetX, 0, {
          duration: MEMO_SHELF_PAGE_DURATION_SEC * 0.85,
          ease: [...MEMO_SHELF_PAGE_EASE],
        });
        resetDrag();
      }
    },
    [
      enabled,
      hasMore,
      offsetX,
      onNavigate,
      onPlayPageSound,
      onTransitioningChange,
      page,
      prefetchSlot,
      prefersReducedMotion,
      polaroidIntroSession,
      resetDrag,
      stageWidth,
      unlockScrollParent,
    ],
  );

  const animateToPage = useCallback(
    (nextPage: number) => {
      const direction = nextPage > page ? 1 : -1;
      void commitToPage(nextPage, direction, true);
    },
    [commitToPage, page],
  );

  useEffect(() => {
    registerGoToPage(animateToPage);
    return () => registerGoToPage(null);
  }, [animateToPage, registerGoToPage]);

  const cancelDrag = useCallback(async () => {
    if (prefersReducedMotion) {
      resetDrag();
      return;
    }

    setDragPhase("animating");
    const width = stageWidth || stageRef.current?.clientWidth || 0;
    const progress = memoShelfPageProgressFromOffset(offsetX.get(), width);
    const snapBackDuration =
      MEMO_SHELF_PAGE_DURATION_SEC * 0.85 * Math.max(0.12, progress);
    await animate(offsetX, 0, {
      duration: snapBackDuration,
      ease: [...MEMO_SHELF_PAGE_EASE],
    });
    resetDrag();
  }, [offsetX, prefersReducedMotion, resetDrag, stageWidth]);

  const beginHorizontalDrag = useCallback(
    (direction: 1 | -1) => {
      directionRef.current = direction;
      setDragDirection(direction);
      setDragPhase("dragging");
      onTransitioningChange(true);
      lockScrollParent();

      const slotIndex = activeSlotRef.current === 0 ? 1 : 0;
      const targetPage =
        direction > 0 ? pageRef.current + 1 : pageRef.current - 1;
      void prefetchSlot(slotIndex, targetPage);
    },
    [lockScrollParent, onTransitioningChange, prefetchSlot],
  );

  const applyPointerMove = useCallback(
    (clientX: number, clientY: number, timeStamp: number) => {
      const drag = dragRef.current;
      if (!drag || dragPhaseRef.current === "animating") {
        return false;
      }

      const width = stageWidthRef.current || stageRef.current?.clientWidth || 0;
      const move = resolveMemoShelfSwipeMove({
        axis: drag.axis,
        direction: drag.direction,
        startX: drag.startX,
        startY: drag.startY,
        clientX,
        clientY,
        stageWidth: width,
        canGoPrev: pageRef.current > 0,
        canGoNext: hasMoreRef.current,
      });

      const wasHorizontal = drag.axis === "horizontal";
      drag.axis = move.axis;
      drag.direction = move.direction;

      if (move.axis === "horizontal" && move.direction) {
        if (!wasHorizontal) {
          if (pageRef.current === 0) {
            skipMemoShelfPolaroidIntro(polaroidIntroSession);
          }
          beginHorizontalDrag(move.direction);
        }
        offsetX.set(move.offset);
        drag.lastX = clientX;
        drag.lastTime = timeStamp;
        return true;
      }

      return move.shouldPreventScroll;
    },
    [beginHorizontalDrag, offsetX, polaroidIntroSession],
  );

  const finishPointer = useCallback(
    (clientX: number, timeStamp: number) => {
      const drag = dragRef.current;
      dragRef.current = null;

      if (
        !drag ||
        drag.axis !== "horizontal" ||
        !drag.direction ||
        dragPhaseRef.current !== "dragging"
      ) {
        unlockScrollParent();
        return;
      }

      const width = stageWidthRef.current || stageRef.current?.clientWidth || 0;
      const offset = offsetX.get();
      const dt = Math.max(1, timeStamp - drag.lastTime);
      const velocity = ((clientX - drag.lastX) / dt) * 1000;
      const shouldCommit = shouldCommitMemoShelfSwipe({
        offset,
        stageWidth: width,
        direction: drag.direction,
        velocityX: velocity,
        isTouch: drag.isTouch,
      });

      if (shouldCommit) {
        const targetPage =
          drag.direction > 0 ? pageRef.current + 1 : pageRef.current - 1;
        void commitToPage(targetPage, drag.direction, true);
        return;
      }

      void cancelDrag();
    },
    [cancelDrag, commitToPage, offsetX, unlockScrollParent],
  );

  const startPointer = useCallback(
    (
      pointerId: number,
      clientX: number,
      clientY: number,
      timeStamp: number,
      isTouch: boolean,
    ) => {
      if (!enabledRef.current || dragPhaseRef.current === "animating") return;

      dragRef.current = {
        pointerId,
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastTime: timeStamp,
        axis: "none",
        direction: null,
        isTouch,
      };
    },
    [],
  );

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      startPointer(
        touch.identifier,
        touch.clientX,
        touch.clientY,
        event.timeStamp,
        true,
      );
    };

    const onTouchMove = (event: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const touch = Array.from(event.touches).find(
        (item) => item.identifier === drag.pointerId,
      );
      if (!touch) return;

      const shouldPrevent = applyPointerMove(
        touch.clientX,
        touch.clientY,
        event.timeStamp,
      );
      if (shouldPrevent) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const touch = Array.from(event.changedTouches).find(
        (item) => item.identifier === drag.pointerId,
      );
      if (!touch) return;

      finishPointer(touch.clientX, event.timeStamp);
    };

    const onTouchCancel = () => {
      if (dragPhaseRef.current === "dragging") {
        void cancelDrag();
        return;
      }
      dragRef.current = null;
      unlockScrollParent();
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [
    applyPointerMove,
    cancelDrag,
    finishPointer,
    startPointer,
    unlockScrollParent,
  ]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      if (!enabled || dragPhase === "animating") return;
      if (event.button !== 0) return;

      startPointer(
        event.pointerId,
        event.clientX,
        event.clientY,
        event.timeStamp,
        false,
      );
    },
    [dragPhase, enabled, startPointer],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const shouldPrevent = applyPointerMove(
        event.clientX,
        event.clientY,
        event.timeStamp,
      );

      if (
        shouldPrevent &&
        !event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [applyPointerMove],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      finishPointer(event.clientX, event.timeStamp);
    },
    [finishPointer],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;

      if (
        dragRef.current &&
        event.currentTarget.hasPointerCapture(dragRef.current.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(dragRef.current.pointerId);
      }

      if (dragPhaseRef.current === "dragging") {
        void cancelDrag();
        return;
      }

      dragRef.current = null;
      unlockScrollParent();
    },
    [cancelDrag, unlockScrollParent],
  );

  const showInactive =
    inactiveData !== null &&
    dragDirection !== null &&
    !prefersReducedMotion;

  const inactiveClass =
    dragDirection && dragDirection > 0
      ? styles.listAlbumSwipePanelNext
      : styles.listAlbumSwipePanelPrev;

  return (
    <div
      ref={stageRef}
      className={styles.listAlbumStage}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <motion.div className={styles.listAlbumSwipeTrack} style={{ x: offsetX }}>
        {inactiveData && (
          <motion.div
            className={inactiveClass}
            style={{
              rotate: showInactive ? inactiveRotate : 0,
              visibility: showInactive ? "visible" : "hidden",
            }}
            aria-hidden={!showInactive}
          >
            <div className={styles.listAlbumGrid}>
              {renderList(
                inactiveData.memos,
                inactiveData.page,
                NO_POLAROID_INTRO,
              )}
            </div>
          </motion.div>
        )}

        {activeData && (
          <motion.div
            className={styles.listAlbumSwipePanelCurrent}
            style={{ rotate: panelRotate }}
          >
            <div className={styles.listAlbumGrid}>
              {renderList(
                activeData.memos,
                activeData.page,
                resolveMemoShelfPolaroidIntro(
                  activeData.page,
                  polaroidIntroSession,
                ),
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
