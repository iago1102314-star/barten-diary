import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import { mergeShelfWineNote } from "@/lib/night/merge-shelf-wine-note";

export type ShelfBottleFields = {
  bottleTag: string;
  diary: string;
  drinkNote?: string | null;
  masterComment?: string | null;
};

export type ShelfBottleDisplay = ShelfBottleFields & {
  drinkName: string;
  tagLabel: string;
  /** 表示用に統合した棚の酒メモ */
  shelfWineNote: string | null;
};

export function toShelfBottleDisplay(
  fields: ShelfBottleFields,
): ShelfBottleDisplay {
  const parsed = parseBottleTag(fields.bottleTag);

  return {
    ...fields,
    tagLabel: parsed.label || fields.bottleTag,
    drinkName: parsed.drinkName || fields.bottleTag,
    shelfWineNote: mergeShelfWineNote(fields.drinkNote, fields.masterComment),
  };
}
