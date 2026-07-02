import type { DiaryDrinkContext } from "@/lib/ai/types";

export function buildDiaryGenerationUserPrompt(
  transcript: string,
  drinkContext: DiaryDrinkContext,
) {
  const speech = transcript.trim();

  return `今夜の棚の酒: ${drinkContext.selectedDrinkName}

あなたは編集者。ライターでも共同執筆者でもない。
順番を整え、意味を持たないフィラーだけ取り、読みやすくする。話した内容はできるだけ残す。
短くても意味があればそのまま残す。入力の言語を保ち、翻訳しない。話し方の温度感も残す。
締め・感情の補完・前向きな一文・読後感は足さない。話したところで終わる。

<<<USER_SPEECH>>>
${speech}
<<<END_USER_SPEECH>>>`;
}
