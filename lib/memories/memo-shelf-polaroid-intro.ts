import type { MutableRefObject } from "react";
import { MEMO_SHELF_PAGE_EASE } from "@/lib/memories/memo-shelf-page-motion";

const BASE_DURATION_SEC = 0.28;
const BASE_STAGGER_DELAYS_SEC = [0, 0.06, 0.12, 0.18] as const;

/** 1 = 通常速度、0.5 = 半分の速さ（2倍の時間） */
export const MEMO_SHELF_POLAROID_INTRO_SPEED = 0.5;

const INTRO_TIME_SCALE = 1 / MEMO_SHELF_POLAROID_INTRO_SPEED;

/** 夜のメモ一覧 — 初回ポラロイド表示 */
export const MEMO_SHELF_POLAROID_INTRO_DURATION_SEC =
  BASE_DURATION_SEC * INTRO_TIME_SCALE;

export const MEMO_SHELF_POLAROID_INTRO_STAGGER_DELAYS_SEC =
  BASE_STAGGER_DELAYS_SEC.map((delay) => delay * INTRO_TIME_SCALE) as [
    number,
    number,
    number,
    number,
  ];

export const MEMO_SHELF_POLAROID_INTRO_FROM_Y = 8;

export const MEMO_SHELF_POLAROID_INTRO_FROM_SCALE = 0.98;

export const MEMO_SHELF_POLAROID_INTRO_EASE = MEMO_SHELF_PAGE_EASE;

export type MemoShelfPolaroidIntroSession = {
  visitIdRef: MutableRefObject<number>;
  playedVisitIdRef: MutableRefObject<number>;
};

export type MemoShelfPolaroidIntroOptions = {
  introStagger: boolean;
};

export function resolveMemoShelfPolaroidIntro(
  pageNum: number,
  session: MemoShelfPolaroidIntroSession,
): MemoShelfPolaroidIntroOptions {
  return {
    introStagger:
      pageNum === 0 &&
      session.playedVisitIdRef.current < session.visitIdRef.current,
  };
}

export function markMemoShelfPolaroidIntroPlayed(
  session: MemoShelfPolaroidIntroSession,
): void {
  session.playedVisitIdRef.current = session.visitIdRef.current;
}

export function skipMemoShelfPolaroidIntro(
  session: MemoShelfPolaroidIntroSession,
): void {
  markMemoShelfPolaroidIntroPlayed(session);
}
