"use client";

import { DiaryDateLine } from "@/components/diary-paper/diary-date-line";
import type { DiaryListItem } from "@/components/diaries/diary-list";
import styles from "@/components/memories/memo-shelf-grid.module.css";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import { resolveDrinkFromBottleTag } from "@/lib/drinks/resolve-drink-from-bottle-tag";
import {
  DIARY_DRINK_TAPE_IMAGE_SIZE,
  getDiaryDrinkTapeOpacity,
} from "@/lib/diary-paper/diary-drink-tape";
import { formatDiaryShelfDateLine } from "@/lib/diary-paper/format-diary-shelf-date-line";
import { resolveDiaryDrinkVisuals } from "@/lib/diary-paper/resolve-diary-drink-visuals";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import {
  MEMO_SHELF_POLAROID_INTRO_DURATION_SEC,
  MEMO_SHELF_POLAROID_INTRO_EASE,
  MEMO_SHELF_POLAROID_INTRO_FROM_SCALE,
  MEMO_SHELF_POLAROID_INTRO_FROM_Y,
  MEMO_SHELF_POLAROID_INTRO_STAGGER_DELAYS_SEC,
} from "@/lib/memories/memo-shelf-polaroid-intro";
import { MEMO_SHELF_TUNING } from "@/lib/memories/memo-shelf-tuning";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "motion/react";

type MemoShelfCardProps = {
  memo: DiaryListItem;
  onOpenMemo?: (memo: DiaryListItem) => void;
  /** 1ページ目 — 傾きを再抽選バッチで決める */
  resampleTilt?: boolean;
  /** 初回一覧表示 — 0〜3 で stagger 順（左上→右上→左下→右下） */
  introStaggerIndex?: number;
};

export function MemoShelfCard({
  memo,
  onOpenMemo,
  resampleTilt = false,
  introStaggerIndex,
}: MemoShelfCardProps) {
  const parsed = parseBottleTag(memo.title);
  const resolved = resolveDrinkFromBottleTag(memo.title);
  const drinkName =
    (resolved?.drink.name ?? parsed.drinkName.trim()) || undefined;
  const dateLine = formatDiaryShelfDateLine(memo.created_at);
  const { drinkImageSrc, maskingTapeSrc, drinkPhotoTiltDeg } =
    resolveDiaryDrinkVisuals(memo.id, drinkName, {
      tiltResampleSalt: resampleTilt
        ? MEMO_SHELF_TUNING.shelfLatestSixTiltResampleSalt
        : undefined,
    });

  const polaroidBody = (
    <>
      <Image
        src={maskingTapeSrc}
        alt=""
        aria-hidden
        width={DIARY_DRINK_TAPE_IMAGE_SIZE.width}
        height={DIARY_DRINK_TAPE_IMAGE_SIZE.height}
        className={styles.tape}
        style={{ opacity: getDiaryDrinkTapeOpacity(maskingTapeSrc) }}
        unoptimized
      />
      {drinkImageSrc ? (
        <Image
          key={drinkImageSrc}
          src={drinkImageSrc}
          alt={drinkName ?? "今夜の一杯"}
          width={400}
          height={400}
          className={styles.photo}
          unoptimized
        />
      ) : (
        <div
          className={styles.photoPlaceholder}
          role="img"
          aria-label={drinkName ?? "今夜の一杯"}
        />
      )}
      <div className={styles.caption}>
        <DiaryDateLine
          dateLine={dateLine}
          className={styles.dateLine}
          slashClassName={styles.dateSlash}
        />
        {drinkName ? <p className={styles.drinkName}>{drinkName}</p> : null}
      </div>
    </>
  );

  const polaroidStyle = {
    "--polaroid-tilt": drinkPhotoTiltDeg,
  } as CSSProperties;

  const polaroidEl = (
    <div className={styles.polaroid} style={polaroidStyle}>
      {polaroidBody}
    </div>
  );

  const polaroid =
    introStaggerIndex !== undefined ? (
      <motion.div
        className={styles.polaroidIntro}
        initial={{
          opacity: 0,
          y: MEMO_SHELF_POLAROID_INTRO_FROM_Y,
          scale: MEMO_SHELF_POLAROID_INTRO_FROM_SCALE,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: MEMO_SHELF_POLAROID_INTRO_DURATION_SEC,
          delay:
            MEMO_SHELF_POLAROID_INTRO_STAGGER_DELAYS_SEC[introStaggerIndex] ?? 0,
          ease: [...MEMO_SHELF_POLAROID_INTRO_EASE],
        }}
      >
        {polaroidEl}
      </motion.div>
    ) : (
      polaroidEl
    );

  if (onOpenMemo) {
    return (
      <button
        type="button"
        className={styles.cardButton}
        onClick={() => {
          barAudioEngine.playClick();
          onOpenMemo(memo);
        }}
      >
        {polaroid}
      </button>
    );
  }

  return (
    <Link
      href={`/diaries/${memo.id}`}
      className={styles.cardLink}
      onClick={() => barAudioEngine.playClick()}
    >
      {polaroid}
    </Link>
  );
}
