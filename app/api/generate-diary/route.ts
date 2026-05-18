import {
  buildDiaryGenerationUserPrompt,
  DIARY_GENERATION_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/generate-diary";
import type { GeneratedDiary } from "@/lib/ai/types";
import { validateTranscript } from "@/lib/ai/validate-transcript";
import OpenAI from "openai";
import { NextResponse } from "next/server";

function parseGeneratedDiary(content: string): GeneratedDiary | null {
  try {
    const parsed = JSON.parse(content) as Partial<GeneratedDiary>;

    if (
      typeof parsed.title !== "string" ||
      typeof parsed.diary !== "string" ||
      typeof parsed.masterComment !== "string"
    ) {
      return null;
    }

    const title = parsed.title.trim();
    const diary = parsed.diary.trim();
    const masterComment = parsed.masterComment.trim();

    if (!title || !diary || !masterComment) {
      return null;
    }

    return { title, diary, masterComment };
  } catch {
    return null;
  }
}

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

  if (!transcript) {
    return NextResponse.json(
      { error: "文字起こしテキストが必要です。" },
      { status: 400 },
    );
  }

  const validationError = validateTranscript(transcript);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DIARY_GENERATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildDiaryGenerationUserPrompt(transcript),
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AIからの応答が空でした。" },
        { status: 500 },
      );
    }

    const generated = parseGeneratedDiary(content);

    if (!generated) {
      return NextResponse.json(
        { error: "AI日記の形式が正しくありません。" },
        { status: 500 },
      );
    }

    return NextResponse.json(generated);
  } catch (error) {
    console.error("OpenAI diary generation failed:", error);

    return NextResponse.json(
      { error: "AI日記の生成に失敗しました。" },
      { status: 500 },
    );
  }
}
