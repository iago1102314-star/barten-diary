import type { DiaryDrinkContext } from "@/lib/ai/types";

export function buildDiaryGenerationUserPrompt(
  transcript: string,
  drinkContext: DiaryDrinkContext,
) {
  const speech = transcript.trim();

  return `今夜の棚の酒: ${drinkContext.selectedDrinkName}
（棚の酒メモは masterComment に1つだけ。drinkNote は空 ""）

あなたは編集者。ライターでも共同執筆者でもない。
順番を整え、言い淀みを取り、読みやすくする。話した内容はできるだけ残す。
挨拶・口癖だけ落とし、強い言葉は残す。
締め・感情の補完・前向きな一文・読後感は足さない。話したところで終わる。

<<<USER_SPEECH>>>
${speech}
<<<END_USER_SPEECH>>>`;
}
