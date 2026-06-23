import {
  pickStableDiaryDrinkPhotoTilt,
  pickStableDiaryDrinkTapeSrc,
  type DiaryDrinkTapeSrc,
} from "@/lib/diary-paper/diary-drink-tape";
import { pickDiaryDrinkImagePathByName } from "@/lib/drinks/drink-assets";

export type DiaryDrinkVisuals = {
  drinkImageSrc: string | null;
  maskingTapeSrc: DiaryDrinkTapeSrc;
  drinkPhotoTiltDeg: number;
};

/**
 * 日記ごとの見た目 — seed が同じなら tape / 写真 / 傾きは常に同じ。
 * 保存済み日記は `diary.id`、生成〜保存前はセッションで一度決めた seed を使う。
 */
export function resolveDiaryDrinkVisuals(
  seed: string,
  drinkName: string | null | undefined,
  options?: { tiltResampleSalt?: string },
): DiaryDrinkVisuals {
  return {
    drinkImageSrc: pickDiaryDrinkImagePathByName(drinkName, seed),
    maskingTapeSrc: pickStableDiaryDrinkTapeSrc(seed),
    drinkPhotoTiltDeg: pickStableDiaryDrinkPhotoTilt(
      seed,
      options?.tiltResampleSalt,
    ),
  };
}

/** 生成直後（保存前）に一度だけ呼び、セッションに保持する */
export function createDiaryVisualSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `visual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
