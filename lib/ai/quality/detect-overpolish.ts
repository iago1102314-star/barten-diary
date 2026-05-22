/**
 * 「綺麗すぎ・AIまとめ」臭の検出（ラボ警告用）
 */
export type OverpolishHit = {
  label: string;
  excerpt: string;
};

const OVERPOLISH_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "説明・報告口調", pattern: /ことができた|となった|できました/ },
  { label: "納得・完了感", pattern: /充実|満足|うまくいった|良い一日/ },
  { label: "AIまとめ", pattern: /総じて|振り返ると|印象的だった|感じられた/ },
  { label: "感情の丸め", pattern: /不快な|悲しい気持ち|複雑な感情/ },
];

/** 発話に無いのに出やすい補完感情 */
const INVENTED_EMOTION_WORDS = [
  "孤独",
  "救われた",
  "寂しかった",
  "寂しい",
  "充実した",
  "達成感",
  "幸福感",
];

export function detectOverpolish(diary: string): OverpolishHit[] {
  const hits: OverpolishHit[] = [];

  for (const { label, pattern } of OVERPOLISH_PATTERNS) {
    const match = diary.match(pattern);
    if (match) {
      hits.push({ label, excerpt: match[0] });
    }
  }

  return hits;
}

export function detectInventedEmotions(
  diary: string,
  transcript?: string,
): OverpolishHit[] {
  if (!transcript?.trim()) return [];

  const hits: OverpolishHit[] = [];
  const speech = transcript;

  for (const word of INVENTED_EMOTION_WORDS) {
    if (diary.includes(word) && !speech.includes(word)) {
      hits.push({ label: "発話に無い感情の補完疑い", excerpt: word });
    }
  }

  return hits;
}
