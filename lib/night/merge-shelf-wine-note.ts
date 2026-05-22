/**
 * 酒棚メモ — drinkNote と masterComment を1ブロックに
 */
export function mergeShelfWineNote(
  drinkNote?: string | null,
  masterComment?: string | null,
): string | null {
  const master = masterComment?.trim() ?? "";
  const note = drinkNote?.trim() ?? "";

  if (master && note) {
    if (master === note) return master;
    if (master.includes(note) || note.includes(master)) return master;
    return master;
  }

  return master || note || null;
}

export function normalizeShelfWineFields<
  T extends { drinkNote?: string; masterComment: string },
>(record: T): T {
  const merged = mergeShelfWineNote(record.drinkNote, record.masterComment);
  if (!merged) return { ...record, drinkNote: "", masterComment: "" };

  return {
    ...record,
    drinkNote: "",
    masterComment: merged,
  };
}
