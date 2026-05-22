import {
  detectInventedEmotions,
  detectOverpolish,
} from "@/lib/ai/quality/detect-overpolish";
import { detectNgWords } from "@/lib/ai/quality/ng-words";
import {
  DIARY_MAX_CHARS,
  DIARY_WARN_CHARS,
  SHELF_WINE_NOTE_MAX_CHARS,
  SHELF_WINE_NOTE_MIN_CHARS,
} from "@/lib/ai/prompts/constants";
import { mergeShelfWineNote } from "@/lib/night/merge-shelf-wine-note";
import type { GeneratedDiary } from "@/lib/ai/types";

export type QuietnessReport = {
  diaryChars: number;
  drinkNoteChars: number;
  masterChars: number;
  ngCount: number;
  warnings: string[];
};

export function buildQuietnessReport(
  record: GeneratedDiary,
  transcript?: string,
): QuietnessReport {
  const ngHits = detectNgWords(record);
  const warnings: string[] = [];

  if (record.diary.length > DIARY_WARN_CHARS) {
    warnings.push(`夜の記録が長めです（${record.diary.length}字）`);
  }
  if (record.diary.length > DIARY_MAX_CHARS) {
    warnings.push(`夜の記録が上限を超えています（${DIARY_MAX_CHARS}字）`);
  }
  const shelfWine = mergeShelfWineNote(record.drinkNote, record.masterComment);
  if (record.drinkNote && record.masterComment && record.drinkNote !== record.masterComment) {
    warnings.push("酒メモが二重（drinkNote + masterComment）");
  }
  if (shelfWine && shelfWine.length < SHELF_WINE_NOTE_MIN_CHARS) {
    warnings.push(`棚の酒メモが短めです（${shelfWine.length}字）`);
  }
  if (shelfWine && shelfWine.length > SHELF_WINE_NOTE_MAX_CHARS) {
    warnings.push(`棚の酒メモが長めです（${shelfWine.length}字）`);
  }

  const lineBreaks = (record.diary.match(/\n\n/g) || []).length;
  if (lineBreaks < 2 && record.diary.length > 180) {
    warnings.push("改行が少なく、塊になっています");
  }

  for (const hit of detectOverpolish(record.diary)) {
    warnings.push(`整えすぎ疑い: ${hit.label}（「${hit.excerpt}」）`);
  }

  for (const hit of detectInventedEmotions(record.diary, transcript)) {
    warnings.push(`補完疑い: ${hit.label}（「${hit.excerpt}」）`);
  }

  const sentenceCount = (record.diary.match(/[。…]/g) || []).length;
  if (sentenceCount <= 2 && record.diary.length > 120) {
    warnings.push("説明が1塊にまとまっている可能性");
  }

  for (const hit of ngHits) {
    const fieldLabel =
      hit.field === "diary"
        ? "夜の記録"
        : hit.field === "drinkNote"
          ? "酒の余韻"
          : hit.field === "masterComment"
            ? "マスター"
            : "Tag";
    warnings.push(`AI臭: 「${hit.excerpt}」 (${fieldLabel})`);
  }

  return {
    diaryChars: record.diary.length,
    drinkNoteChars: record.drinkNote.length,
    masterChars: record.masterComment.length,
    ngCount: ngHits.length,
    warnings,
  };
}
