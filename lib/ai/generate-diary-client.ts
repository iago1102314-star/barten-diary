import type { GeneratedDiary, GenerateDiaryError } from "@/lib/ai/types";
import { validateTranscript } from "@/lib/ai/validate-transcript";

export async function generateDiaryFromTranscript(
  transcript: string,
): Promise<GeneratedDiary> {
  const validationError = validateTranscript(transcript);

  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetch("/api/generate-diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  const data = (await response.json()) as GeneratedDiary | GenerateDiaryError;

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error
        ? data.error
        : "AI日記の生成に失敗しました。",
    );
  }

  if (!("title" in data) || !("diary" in data) || !("masterComment" in data)) {
    throw new Error("AI日記の形式が正しくありません。");
  }

  return data;
}
