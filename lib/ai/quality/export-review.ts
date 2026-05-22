import type { GeneratedDiary } from "@/lib/ai/types";
import type { LabReviewNote } from "@/lib/ai/quality/review-types";

export function formatGoodOutputMarkdown(
  transcript: string,
  record: GeneratedDiary,
  review: LabReviewNote,
): string {
  const reason =
    review.goodReason?.trim() ||
    review.badReason?.trim() ||
    "（理由を記入）";

  return `## サンプル — ${new Date(review.updatedAt).toLocaleDateString("ja-JP")}

**入力（要約）**: ${transcript.slice(0, 120)}${transcript.length > 120 ? "…" : ""}

**なぜ良いか / メモ**: ${reason}

\`\`\`json
${JSON.stringify(record, null, 2)}
\`\`\`
`;
}

export function formatReviewLogEntry(review: LabReviewNote): string {
  const rating = review.rating === "good" ? "◎ 良い" : "△ 要調整";
  const reason =
    review.rating === "good"
      ? review.goodReason || "（未記入）"
      : review.badReason || "（未記入）";

  return `- ${rating} · ${review.variantLabel} (${review.temperature}) — ${reason}`;
}
