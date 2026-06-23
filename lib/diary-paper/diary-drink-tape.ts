import { DIARY_DRINK_TAPE_ASSETS } from "@/lib/assets/public-paths";

/** 写真上部マスキング — 位置・大きさは variant 共通（CSS `.drinkTape` とセット） */
export const DIARY_DRINK_TAPE_WHITE = DIARY_DRINK_TAPE_ASSETS.white;
/** 差し替え時は ?v= を上げてキャッシュを避ける */
export const DIARY_DRINK_TAPE_BROWN = DIARY_DRINK_TAPE_ASSETS.brown;

export const DIARY_DRINK_TAPE_SRCS = [
  DIARY_DRINK_TAPE_WHITE,
  DIARY_DRINK_TAPE_BROWN,
] as const;

export const DIARY_DRINK_TAPE_IMAGE_SIZE = {
  width: 240,
  height: 77,
} as const;

export type DiaryDrinkTapeSrc = (typeof DIARY_DRINK_TAPE_SRCS)[number];

export const DIARY_DRINK_TAPE_OPACITY: Record<DiaryDrinkTapeSrc, number> = {
  [DIARY_DRINK_TAPE_WHITE]: 0.7,
  [DIARY_DRINK_TAPE_BROWN]: 0.85,
};

export function getDiaryDrinkTapeOpacity(src: DiaryDrinkTapeSrc): number {
  return DIARY_DRINK_TAPE_OPACITY[src];
}

export function pickRandomDiaryDrinkTapeSrc(): DiaryDrinkTapeSrc {
  return DIARY_DRINK_TAPE_SRCS[
    Math.floor(Math.random() * DIARY_DRINK_TAPE_SRCS.length)
  ]!;
}

export const DIARY_DRINK_PHOTO_TILTS = [-3.2, 3.2, 2.3, -2.3, 0, 1, -1] as const;

function stableSeedHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickStableDiaryDrinkTapeSrc(seed: string): DiaryDrinkTapeSrc {
  return DIARY_DRINK_TAPE_SRCS[
    stableSeedHash(`${seed}:tape`) % DIARY_DRINK_TAPE_SRCS.length
  ]!;
}

export function pickStableDiaryDrinkPhotoTilt(
  seed: string,
  resampleSalt?: string,
): number {
  const tiltKey = resampleSalt ? `${seed}:tilt:${resampleSalt}` : `${seed}:tilt`;
  return DIARY_DRINK_PHOTO_TILTS[
    stableSeedHash(tiltKey) % DIARY_DRINK_PHOTO_TILTS.length
  ]!;
}
