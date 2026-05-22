import type { DiaryDrinkContext } from "@/lib/ai/types";

export function buildDiaryGenerationUserPrompt(
  transcript: string,
  drinkContext: DiaryDrinkContext,
) {
  const speech = transcript.trim();

  return `今夜の棚の酒: ${drinkContext.selectedDrinkName}
（棚の酒メモは masterComment に1つだけ。drinkNote は空 ""）

「その夜へ戻れる」独白を優先。メモの行切りではなく、段落内で文をつなぐ。
挨拶・口癖だけ落とし、強い言葉は残す。創作・教訓・綺麗な締めは禁止。

<<<USER_SPEECH>>>
${speech}
<<<END_USER_SPEECH>>>`;
}
