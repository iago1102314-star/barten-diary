import type { DiaryListItem } from "@/components/diaries/diary-list";
import type { Transition, Variants } from "motion/react";

export type MemoShelfFetchedPage = {
  memos: DiaryListItem[];
  hasMore: boolean;
  totalCount: number;
};

/** 夜のメモ一覧 — ページめくり */
export const MEMO_SHELF_PAGE_EASE = [0.22, 1, 0.36, 1] as const;

export const MEMO_SHELF_PAGE_DURATION_SEC = 0.3;

export const MEMO_SHELF_PAGE_SLIDE_PERCENT = 10;

export const MEMO_SHELF_PAGE_ROTATE_DEG = 1;

/** ドラッグ — 方向判定前の最小移動（px） */
export const MEMO_SHELF_SWIPE_LOCK_PX = 8;

/** 指を離したとき、この割合を超えたらページ確定（マウス） */
export const MEMO_SHELF_SWIPE_COMMIT_PROGRESS = 0.18;

/** 指を離したとき、この割合を超えたらページ確定（タッチ） */
export const MEMO_SHELF_SWIPE_COMMIT_PROGRESS_TOUCH = 0.1;

/** タッチ — この距離を超えたら確定（px） */
export const MEMO_SHELF_SWIPE_COMMIT_PX_TOUCH = 36;

/** 速いフリックでも確定（px/s） */
export const MEMO_SHELF_SWIPE_COMMIT_VELOCITY = 320;

/** タッチ — フリック確定（px/s） */
export const MEMO_SHELF_SWIPE_COMMIT_VELOCITY_TOUCH = 220;

export type MemoShelfSwipeAxis = "none" | "horizontal" | "vertical";

export function clampMemoShelfSwipeOffset(
  dx: number,
  direction: 1 | -1,
  stageWidth: number,
): number {
  if (stageWidth <= 0) return 0;
  if (direction > 0) {
    return Math.max(-stageWidth, Math.min(0, dx));
  }
  return Math.max(0, Math.min(stageWidth, dx));
}

export function resolveMemoShelfSwipeMove(input: {
  axis: MemoShelfSwipeAxis;
  direction: 1 | -1 | null;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  stageWidth: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}): {
  axis: MemoShelfSwipeAxis;
  direction: 1 | -1 | null;
  offset: number;
  shouldPreventScroll: boolean;
} {
  const dx = input.clientX - input.startX;
  const dy = input.clientY - input.startY;

  if (input.axis === "vertical") {
    return {
      axis: "vertical",
      direction: null,
      offset: 0,
      shouldPreventScroll: false,
    };
  }

  if (input.axis === "horizontal" && input.direction) {
    return {
      axis: "horizontal",
      direction: input.direction,
      offset: clampMemoShelfSwipeOffset(dx, input.direction, input.stageWidth),
      shouldPreventScroll: true,
    };
  }

  if (
    Math.abs(dx) < MEMO_SHELF_SWIPE_LOCK_PX &&
    Math.abs(dy) < MEMO_SHELF_SWIPE_LOCK_PX
  ) {
    return {
      axis: "none",
      direction: null,
      offset: 0,
      shouldPreventScroll: false,
    };
  }

  if (Math.abs(dy) > Math.abs(dx)) {
    return {
      axis: "vertical",
      direction: null,
      offset: 0,
      shouldPreventScroll: false,
    };
  }

  const direction: 1 | -1 = dx < 0 ? 1 : -1;
  if (direction > 0 && !input.canGoNext) {
    return {
      axis: "vertical",
      direction: null,
      offset: 0,
      shouldPreventScroll: false,
    };
  }
  if (direction < 0 && !input.canGoPrev) {
    return {
      axis: "vertical",
      direction: null,
      offset: 0,
      shouldPreventScroll: false,
    };
  }

  return {
    axis: "horizontal",
    direction,
    offset: clampMemoShelfSwipeOffset(dx, direction, input.stageWidth),
    shouldPreventScroll: true,
  };
}

export function shouldCommitMemoShelfSwipe(input: {
  offset: number;
  stageWidth: number;
  direction: 1 | -1;
  velocityX: number;
  isTouch: boolean;
}): boolean {
  const progress = memoShelfPageProgressFromOffset(
    input.offset,
    input.stageWidth,
  );
  const flick =
    input.direction > 0
      ? input.velocityX < -getMemoShelfSwipeCommitVelocity(input.isTouch)
      : input.velocityX > getMemoShelfSwipeCommitVelocity(input.isTouch);

  if (flick) return true;

  if (input.isTouch) {
    return (
      progress >= MEMO_SHELF_SWIPE_COMMIT_PROGRESS_TOUCH ||
      Math.abs(input.offset) >= MEMO_SHELF_SWIPE_COMMIT_PX_TOUCH
    );
  }

  return progress >= MEMO_SHELF_SWIPE_COMMIT_PROGRESS;
}

function getMemoShelfSwipeCommitVelocity(isTouch: boolean): number {
  return isTouch
    ? MEMO_SHELF_SWIPE_COMMIT_VELOCITY_TOUCH
    : MEMO_SHELF_SWIPE_COMMIT_VELOCITY;
}

export function memoShelfPageProgressFromOffset(
  offsetPx: number,
  stageWidth: number,
): number {
  if (stageWidth <= 0) return 0;
  return Math.min(1, Math.abs(offsetPx) / stageWidth);
}

export function memoShelfPageSwipePanelStyle(
  progress: number,
  role: "current" | "adjacent",
  direction: 1 | -1,
): { rotate: number } {
  const rotate = MEMO_SHELF_PAGE_ROTATE_DEG;
  const p = Math.max(0, Math.min(1, progress));

  if (direction > 0) {
    if (role === "current") {
      return { rotate: -p * rotate };
    }
    return { rotate: (1 - p) * rotate };
  }

  if (role === "current") {
    return { rotate: p * rotate };
  }
  return { rotate: -(1 - p) * rotate };
}

export function getMemoShelfPageTransition(
  prefersReducedMotion: boolean | null,
): Transition {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  return {
    duration: MEMO_SHELF_PAGE_DURATION_SEC,
    ease: [...MEMO_SHELF_PAGE_EASE],
  };
}

export function getMemoShelfPageVariants(
  prefersReducedMotion: boolean | null,
): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 1, x: 0, rotate: 0 },
      center: { opacity: 1, x: 0, rotate: 0 },
      exit: { opacity: 1, x: 0, rotate: 0 },
    };
  }

  const slide = `${MEMO_SHELF_PAGE_SLIDE_PERCENT}%`;
  const rotate = MEMO_SHELF_PAGE_ROTATE_DEG;

  return {
    enter: (direction: number) => ({
      x: direction > 0 ? slide : `-${slide}`,
      opacity: 0,
      rotate: direction > 0 ? rotate : -rotate,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? `-${slide}` : slide,
      opacity: 0,
      rotate: direction > 0 ? -rotate : rotate,
    }),
  };
}
