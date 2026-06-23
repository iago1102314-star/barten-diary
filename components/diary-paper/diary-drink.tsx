"use client";

import styles from "@/components/diary-paper/diary-paper.module.css";
import {
  DIARY_DRINK_TAPE_IMAGE_SIZE,
  getDiaryDrinkTapeOpacity,
  type DiaryDrinkTapeSrc,
} from "@/lib/diary-paper/diary-drink-tape";
import Image from "next/image";

type DiaryDrinkProps = {
  imageSrc?: string | null;
  alt?: string;
  maskingTapeSrc: DiaryDrinkTapeSrc;
  photoTiltDeg: number;
};

/** 今夜の一杯 — 白枠の「プリント」風。見た目は map 側で seed 固定済み */
export function DiaryDrink({
  imageSrc,
  alt = "今夜の一杯",
  maskingTapeSrc,
  photoTiltDeg,
}: DiaryDrinkProps) {
  return (
    <div className={styles.drink}>
      <div
        className={styles.drinkPhoto}
        style={{ transform: `rotate(${photoTiltDeg}deg)` }}
      >
        <Image
          src={maskingTapeSrc}
          alt=""
          aria-hidden
          width={DIARY_DRINK_TAPE_IMAGE_SIZE.width}
          height={DIARY_DRINK_TAPE_IMAGE_SIZE.height}
          className={styles.drinkTape}
          style={{ opacity: getDiaryDrinkTapeOpacity(maskingTapeSrc) }}
          unoptimized
        />
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={alt}
            width={324}
            height={215}
            className={styles.drinkImage}
            unoptimized
          />
        ) : (
          <div className={styles.drinkFrame} role="img" aria-label={alt} />
        )}
      </div>
    </div>
  );
}
