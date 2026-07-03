import type { GeneratedDiary } from "@/lib/ai/types";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { mapGeneratedDiaryToDiaryPaper } from "@/lib/diary-paper/map-diary-to-paper";

/** 帰り道 — 生成済み日記を共有カードと同じ紙面データに変換 */
export function buildAlleyDiaryPaper(
  record: GeneratedDiary,
  recordedAt: string | null | undefined,
  visualSeed: string,
): DiaryPaperData {
  const at = recordedAt ? new Date(recordedAt) : new Date();
  return mapGeneratedDiaryToDiaryPaper(record, at, visualSeed);
}
