import type {
  GeneratedDiary,
  GeneratedDiaryVariant,
  GenerateDiaryError,
  GenerateDiaryVariantsResult,
} from "@/lib/ai/types";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import { validateTranscript } from "@/lib/ai/validate-transcript";

type GenerateOptions = {
  recordedAt?: string;
  variantCount?: number;
  selectedCategoryId: DrinkCategoryId;
  selectedDrinkId?: DrinkId | null;
  timeZone?: string;
};

export async function generateDiaryFromTranscript(
  transcript: string,
  options: GenerateOptions,
): Promise<GeneratedDiary> {
  const result = await requestGeneration(transcript, {
    ...options,
    variantCount: 1,
  });

  if ("variants" in result) {
    return result.variants[0];
  }

  return result;
}

export async function generateDiaryVariants(
  transcript: string,
  options: GenerateOptions,
): Promise<GeneratedDiaryVariant[]> {
  const variantCount = options.variantCount ?? 3;
  const result = await requestGeneration(transcript, {
    ...options,
    variantCount,
  });

  if ("variants" in result) {
    return result.variants;
  }

  return [
    {
      ...result,
      temperature: 0.64,
      label: "標準",
    },
  ];
}

async function requestGeneration(
  transcript: string,
  options: GenerateOptions,
): Promise<GeneratedDiary | GenerateDiaryVariantsResult> {
  const validationError = validateTranscript(transcript);

  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetch("/api/generate-diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      recordedAt: options.recordedAt,
      variantCount: options.variantCount ?? 1,
      selectedCategoryId: options.selectedCategoryId,
      selectedDrinkId: options.selectedDrinkId,
      timeZone:
        options.timeZone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });

  const data = (await response.json()) as
    | GeneratedDiary
    | GenerateDiaryVariantsResult
    | GenerateDiaryError;

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error
        ? data.error
        : "夜の記録を紡げませんでした。",
    );
  }

  if ("variants" in data && Array.isArray(data.variants)) {
    return data;
  }

  if (
    "bottleTag" in data &&
    "diary" in data &&
    "drinkNote" in data &&
    "masterComment" in data
  ) {
    return data;
  }

  throw new Error("夜の記録の形式が正しくありません。");
}
