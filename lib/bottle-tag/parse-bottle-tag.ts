export type ParsedBottleTag = {
  /** 例: 5月19日 朝 */
  label: string;
  /** 例: Negroni */
  drinkName: string;
  /** 元の Bottle Tag 全文 */
  full: string;
};

/**
 * 「5月19日 朝 / Negroni」形式を分解
 */
export function parseBottleTag(bottleTag: string): ParsedBottleTag {
  const full = bottleTag.trim();
  const slash = full.lastIndexOf(" / ");

  if (slash === -1) {
    return { label: full, drinkName: "", full };
  }

  return {
    label: full.slice(0, slash).trim(),
    drinkName: full.slice(slash + 3).trim(),
    full,
  };
}
