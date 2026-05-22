import { detectLeakageInOutput } from "@/lib/ai/security/detect-injection";
import type { GeneratedDiary } from "@/lib/ai/types";

const THIRD_PERSON_PATTERNS = [
  { label: "三人称（彼/彼女）", pattern: /彼は|彼女は/ },
  { label: "三人称（バーテンダーは）", pattern: /バーテンダーは|店員は/ },
];

export function validateOutputSecurity(record: GeneratedDiary): string[] {
  const warnings: string[] = [];

  for (const { label, pattern } of THIRD_PERSON_PATTERNS) {
    if (pattern.test(record.diary)) {
      warnings.push(`出力: ${label}（夜の記録）`);
    }
  }

  const combined = [
    record.diary,
    record.drinkNote,
    record.masterComment,
  ].join("\n");

  for (const hit of detectLeakageInOutput(combined)) {
    warnings.push(`漏洩疑い: ${hit.pattern.label}（「${hit.excerpt}」）`);
  }

  if (/申し訳|お答えできません|ポリシーにより|安全上/i.test(combined)) {
    warnings.push("出力: 説教的な拒否文が含まれている可能性");
  }

  if (
    /迷っているみたい|お疲れ様|頑張|大丈夫だな|だろうな$/i.test(
      record.masterComment,
    )
  ) {
    warnings.push("マスター: 感情分析っぽい（選酒理由ではない）");
  }

  return warnings;
}
