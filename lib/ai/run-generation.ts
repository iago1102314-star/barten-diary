import {
  buildDiaryGenerationSystemPrompt,
  buildDiaryGenerationUserPrompt,
} from "@/lib/ai/prompts/index";
import { parseGeneratedDiaryContent } from "@/lib/ai/parse-generated-diary";
import {
  postProcessGeneratedContent,
  type PostProcessResult,
} from "@/lib/ai/quality/post-process";
import type { DiaryDrinkContext, GeneratedDiary } from "@/lib/ai/types";
import { assembleGeneratedDiary } from "@/lib/bottle-tag/assemble-record";
import type { BottleTagAssembly } from "@/lib/bottle-tag/assemble-record";
import OpenAI from "openai";

export type DiaryGenerationResult = PostProcessResult & {
  record: GeneratedDiary;
};

export async function runDiaryGeneration(
  openai: OpenAI,
  transcript: string,
  drinkContext: DiaryDrinkContext,
  bottleAssembly: BottleTagAssembly,
  temperature: number,
): Promise<(PostProcessResult & { record: GeneratedDiary }) | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildDiaryGenerationSystemPrompt() },
      {
        role: "user",
        content: buildDiaryGenerationUserPrompt(transcript, drinkContext),
      },
    ],
    temperature,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = parseGeneratedDiaryContent(content);
  if (!parsed) return null;

  const processed = postProcessGeneratedContent(parsed);

  return {
    ...processed,
    record: assembleGeneratedDiary(processed.record, bottleAssembly),
  };
}
