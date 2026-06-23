import type { DiaryDrinkTapeSrc } from "@/lib/diary-paper/diary-drink-tape";
import type { DiaryPaperCharacterId } from "@/lib/diary-paper/diary-paper-characters";

/** 日記詳細「紙」UI — 表示用データ */
export type DiaryPaperData = {
  /** 例: 2026 / 6 / 21　深夜 */
  dateLine: string;
  drinkImageSrc?: string | null;
  drinkAlt?: string;
  drinkCaption?: string;
  drinkName?: string;
  /**
   * 日記ごとの見た目 seed — tape / ポラロイド写真 / 傾きを固定。
   * 保存済みは diary.id、生成〜保存前は createDiaryVisualSeed() で一度決める。
   */
  diaryVisualSeed?: string;
  /** map 時に seed から決定。再計算しないこと */
  maskingTapeSrc?: DiaryDrinkTapeSrc;
  drinkPhotoTiltDeg?: number;
  body: string;
  /** 紙面キャラクター（未指定時 master） */
  characterId?: DiaryPaperCharacterId;
  /** キャラクターの言葉（AI 生成では masterComment に相当） */
  characterComment: string;
  characterSignature?: string;
};
