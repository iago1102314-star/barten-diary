import type { GeneratedDiary } from "@/lib/ai/types";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import type { DiaryListRow } from "@/lib/diaries/fetch-diaries";
import { formatDiaryPaperDateLine } from "@/lib/diary-paper/format-diary-paper-date-line";
import { resolveDiaryDrinkVisuals } from "@/lib/diary-paper/resolve-diary-drink-visuals";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { mergeShelfWineNote } from "@/lib/night/merge-shelf-wine-note";

export function mapMasterVoiceToDiaryPaper(
  masterComment: string,
  masterSignature = "— Master",
): Pick<
  DiaryPaperData,
  "characterId" | "characterComment" | "characterSignature"
> {
  return {
    characterId: "master",
    characterComment: masterComment,
    characterSignature: masterSignature,
  };
}

function mapDrinkFields(
  bottleTag: string,
  visualSeed: string,
): Pick<
  DiaryPaperData,
  | "diaryVisualSeed"
  | "drinkName"
  | "drinkAlt"
  | "drinkImageSrc"
  | "maskingTapeSrc"
  | "drinkPhotoTiltDeg"
> {
  const parsed = parseBottleTag(bottleTag);
  const drinkName = parsed.drinkName || undefined;
  const visuals = resolveDiaryDrinkVisuals(visualSeed, drinkName);

  return {
    diaryVisualSeed: visualSeed,
    drinkName,
    drinkAlt: drinkName ?? "今夜の一杯",
    ...visuals,
  };
}

/** 保存済み日記 → 紙面 UI（見た目 seed = diary.id で固定） */
export function mapDiaryListRowToDiaryPaper(diary: DiaryListRow): DiaryPaperData {
  const characterComment =
    mergeShelfWineNote(diary.drink_note, diary.master_comment) ?? "";

  return {
    dateLine: formatDiaryPaperDateLine(diary.created_at),
    body: diary.body,
    ...mapDrinkFields(diary.title, diary.id),
    ...mapMasterVoiceToDiaryPaper(characterComment),
  };
}

/** 録音直後 → 紙面 UI。visualSeed は生成時に一度決めてセッションに保持すること */
export function mapGeneratedDiaryToDiaryPaper(
  record: GeneratedDiary,
  recordedAt: Date,
  visualSeed: string,
): DiaryPaperData {
  const characterComment =
    mergeShelfWineNote(record.drinkNote, record.masterComment) ?? "";

  return {
    dateLine: formatDiaryPaperDateLine(recordedAt),
    body: record.diary,
    ...mapDrinkFields(record.bottleTag, visualSeed),
    ...mapMasterVoiceToDiaryPaper(characterComment),
  };
}
