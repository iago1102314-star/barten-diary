import type { GeneratedDiaryContent } from "@/lib/ai/types";

export function parseGeneratedDiaryContent(
  content: string,
): GeneratedDiaryContent | null {
  try {
    const parsed = JSON.parse(content) as Partial<GeneratedDiaryContent>;

    if (typeof parsed.diary !== "string") {
      return null;
    }

    const diary = parsed.diary.trim();
    const drinkNote =
      typeof parsed.drinkNote === "string" ? parsed.drinkNote.trim() : "";

    if (!diary) {
      return null;
    }

    return { diary, drinkNote, masterComment: "" };
  } catch {
    return null;
  }
}
