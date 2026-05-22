import {
  DIARY_MAX_CHARS,
  SHELF_WINE_NOTE_MAX_CHARS,
  SHELF_WINE_NOTE_MIN_CHARS,
} from "@/lib/ai/prompts/constants";
import { ensureBreathingParagraphs } from "@/lib/ai/quality/ensure-breathing";
import { stripOralFillers } from "@/lib/ai/quality/strip-fillers";
import { stripTrailingEllipsis } from "@/lib/ai/quality/strip-trailing-ellipsis";
import { normalizeShelfWineFields } from "@/lib/night/merge-shelf-wine-note";
import type { GeneratedDiaryContent } from "@/lib/ai/types";

const AI_CLOSING_PATTERNS = [
  /充実した一日だった。?$/,
  /良いシフトだった。?$/,
  /成長を感じる。?$/,
  /学びがあった。?$/,
  /お疲れ様でした。?$/,
  /総じて[^。]+。$/,
  /振り返ると[^。]+。$/,
  /そう思えた夜だった。?$/,
  /いい夜だった。?$/,
  /明日[^。]+。$/,
  /これから[^。]+。$/,
  /教訓[^。]+。$/,
];

export type PostProcessResult = {
  record: GeneratedDiaryContent;
  adjustments: string[];
};

export function postProcessGeneratedContent(
  raw: GeneratedDiaryContent,
): PostProcessResult {
  const adjustments: string[] = [];
  let diary = raw.diary.trim();
  const rawMasterComment = raw.masterComment.trim();
  let masterComment = rawMasterComment;
  let drinkNote = raw.drinkNote?.trim() ?? "";

  const stripped = stripOralFillers(diary);
  if (stripped !== diary) {
    diary = stripped;
    adjustments.push("口癖・フィラーのみ除去しました");
  }

  for (const pattern of AI_CLOSING_PATTERNS) {
    if (pattern.test(diary)) {
      diary = diary.replace(pattern, "").trim();
      adjustments.push("夜の記録末尾の締めを削除しました");
      break;
    }
  }

  const breathed = ensureBreathingParagraphs(diary);
  if (breathed !== diary) {
    diary = breathed;
    adjustments.push("段落の呼吸を整えました");
  }

  if (diary.length > DIARY_MAX_CHARS) {
    const trimmed = trimToParagraphLimit(diary, DIARY_MAX_CHARS);
    if (trimmed.length < diary.length) {
      diary = trimmed;
      adjustments.push(`夜の記録を${DIARY_MAX_CHARS}字付近に整えました`);
    }
  }

  const withoutEllipsis = stripTrailingEllipsis(diary);
  if (withoutEllipsis !== diary) {
    diary = withoutEllipsis;
    adjustments.push("夜の記録末尾の三点リーダーを削除しました");
  }

  masterComment = masterComment
    .replace(/！/g, "。")
    .replace(/頑張[^。]*。?/g, "")
    .replace(/明日[^。]*。?/g, "")
    .replace(/ですね/g, "")
    .trim();

  if (masterComment.length > SHELF_WINE_NOTE_MAX_CHARS) {
    masterComment = trimAtLength(masterComment, SHELF_WINE_NOTE_MAX_CHARS);
    adjustments.push(`棚の酒メモを${SHELF_WINE_NOTE_MAX_CHARS}字以内に整えました`);
  }

  if (!masterComment && rawMasterComment) {
    masterComment = trimAtLength(rawMasterComment, SHELF_WINE_NOTE_MAX_CHARS);
    adjustments.push("棚の酒メモを空にしないよう復元しました");
  }

  if (!masterComment && drinkNote) {
    masterComment = trimAtLength(drinkNote, SHELF_WINE_NOTE_MAX_CHARS);
    drinkNote = "";
  }

  const normalized = normalizeShelfWineFields({
    diary,
    drinkNote,
    masterComment,
  });

  if (normalized.drinkNote === "" && drinkNote) {
    adjustments.push("酒メモを1ブロックに統合しました");
  }

  return {
    record: normalized,
    adjustments,
  };
}

function trimToParagraphLimit(text: string, max: number): string {
  if (text.length <= max) return text;

  const paragraphs = text.split(/\n\n+/);
  let result = "";

  for (const paragraph of paragraphs) {
    const next = result ? `${result}\n\n${paragraph}` : paragraph;
    if (next.length > max) break;
    result = next;
  }

  return result.length >= max * 0.5 ? result.trim() : text.slice(0, max).trim();
}

function trimAtLength(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/[^。…\n]+$/, "").trim();
}
