import {
  NG_WORD_RULES,
  type NgWordRule,
} from "@/lib/ai/prompts/ng-word-list";
import type { GeneratedDiary } from "@/lib/ai/types";

export type NgHit = {
  rule: NgWordRule;
  field: "diary" | "drinkNote" | "masterComment" | "bottleTag";
  excerpt: string;
};

export function detectNgWordsInText(
  text: string,
  field: NgHit["field"],
): NgHit[] {
  const hits: NgHit[] = [];

  for (const rule of NG_WORD_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      hits.push({
        rule,
        field,
        excerpt: match[0],
      });
    }
  }

  return hits;
}

export function detectNgWords(record: GeneratedDiary): NgHit[] {
  return [
    ...detectNgWordsInText(record.bottleTag, "bottleTag"),
    ...detectNgWordsInText(record.diary, "diary"),
    ...detectNgWordsInText(record.drinkNote, "drinkNote"),
    ...detectNgWordsInText(record.masterComment, "masterComment"),
  ];
}
