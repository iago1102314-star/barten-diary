import {
  GENERATION_TEMPERATURE,
  LAB_MAX_VARIANTS,
  LAB_TEMPERATURES,
} from "@/lib/ai/prompts/index";
import { runDiaryGeneration } from "@/lib/ai/run-generation";
import type {
  GeneratedDiary,
  GeneratedDiaryVariant,
  GenerateDiaryVariantsResult,
} from "@/lib/ai/types";
import { GENERATION_PARSE_ERROR_MESSAGE } from "@/lib/ai/security/generation-errors";
import { validateTranscript } from "@/lib/ai/validate-transcript";
import { assembleBottleTag } from "@/lib/bottle-tag/assemble-record";
import { buildDrinkContext } from "@/lib/drinks/build-drink-context";
import {
  isValidDrinkCategoryId,
  type DrinkCategoryId,
} from "@/lib/drinks/drink-catalog";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const TEMPERATURE_LABELS = ["静", "標準", "温"] as const;
const DEFAULT_TIME_ZONE = "Asia/Tokyo";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API キーが設定されていません。" },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const transcript =
    typeof body === "object" &&
    body !== null &&
    "transcript" in body &&
    typeof (body as { transcript: unknown }).transcript === "string"
      ? (body as { transcript: string }).transcript
      : null;

  const recordedAt =
    typeof body === "object" &&
    body !== null &&
    "recordedAt" in body &&
    typeof (body as { recordedAt: unknown }).recordedAt === "string"
      ? (body as { recordedAt: string }).recordedAt
      : new Date().toISOString();

  const selectedCategoryId =
    typeof body === "object" &&
    body !== null &&
    "selectedCategoryId" in body &&
    typeof (body as { selectedCategoryId: unknown }).selectedCategoryId ===
      "string"
      ? (body as { selectedCategoryId: string }).selectedCategoryId
      : null;

  const selectedDrinkId =
    typeof body === "object" &&
    body !== null &&
    "selectedDrinkId" in body &&
    typeof (body as { selectedDrinkId: unknown }).selectedDrinkId === "string"
      ? (body as { selectedDrinkId: string }).selectedDrinkId
      : null;

  const timeZone =
    typeof body === "object" &&
    body !== null &&
    "timeZone" in body &&
    typeof (body as { timeZone: unknown }).timeZone === "string"
      ? (body as { timeZone: string }).timeZone
      : DEFAULT_TIME_ZONE;

  const variantCount =
    typeof body === "object" &&
    body !== null &&
    "variantCount" in body &&
    typeof (body as { variantCount: unknown }).variantCount === "number"
      ? Math.min(
          LAB_MAX_VARIANTS,
          Math.max(1, (body as { variantCount: number }).variantCount),
        )
      : 1;

  if (!transcript) {
    return NextResponse.json(
      { error: "音声が届きませんでした。" },
      { status: 400 },
    );
  }

  if (!selectedCategoryId || !isValidDrinkCategoryId(selectedCategoryId)) {
    return NextResponse.json(
      { error: "カテゴリが選ばれていません。" },
      { status: 400 },
    );
  }

  const validationError = validateTranscript(transcript);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const categoryId = selectedCategoryId as DrinkCategoryId;
  const bottleAssembly = assembleBottleTag(
    categoryId,
    recordedAt,
    timeZone,
    selectedDrinkId,
  );
  const drinkContext = buildDrinkContext(categoryId, bottleAssembly);

  const openai = new OpenAI({ apiKey });

  try {
    if (variantCount > 1) {
      const temperatures = LAB_TEMPERATURES.slice(0, variantCount);
      const results = await Promise.all(
        temperatures.map((temperature) =>
          runDiaryGeneration(
            openai,
            transcript,
            drinkContext,
            bottleAssembly,
            temperature,
          ),
        ),
      );

      const variants = results.flatMap((result, index) => {
        if (!result) return [];
        return [
          {
            ...result.record,
            temperature: temperatures[index],
            label: TEMPERATURE_LABELS[index] ?? `案${index + 1}`,
            postProcessAdjustments: result.adjustments,
          },
        ];
      }) satisfies GeneratedDiaryVariant[];

      if (variants.length === 0) {
        return NextResponse.json(
          { error: GENERATION_PARSE_ERROR_MESSAGE },
          { status: 422 },
        );
      }

      const payload: GenerateDiaryVariantsResult = { variants };
      return NextResponse.json(payload);
    }

    const generated = await runDiaryGeneration(
      openai,
      transcript,
      drinkContext,
      bottleAssembly,
      GENERATION_TEMPERATURE,
    );

    if (!generated?.record) {
      return NextResponse.json(
        { error: GENERATION_PARSE_ERROR_MESSAGE },
        { status: 422 },
      );
    }

    return NextResponse.json(generated.record satisfies GeneratedDiary);
  } catch (error) {
    console.error("OpenAI diary generation failed:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error:
              "今夜は少し休ませてください。しばらくしてからもう一度お試しください。",
          },
          { status: 429 },
        );
      }

      if (error.status === 401) {
        return NextResponse.json(
          { error: "接続の設定を確認してください。" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "夜の記録を紡げませんでした。" },
      { status: 500 },
    );
  }
}
