import OpenAI from "openai";

const REFINE_SYSTEM_PROMPT = `あなたはWhisperの文字起こしを「誤認識だけ」直す編集者です。

やること:
- 明らかに不自然な単語・同音異義の誤りを、前後の文脈から最小限に修正
- 「えー」「あの」などの連続・重複を1つに整理
- 句読点を自然に付ける（意味は変えない）

禁止:
- 要約・言い換えで情報を落とす
- 話に無い内容を足す・推測する
- 教訓・まとめ・締めを足す
- 一人称を三人称に変える

出力: 修正後の全文のみ（説明・JSON不要）。`;

export async function refineTranscript(
  openai: OpenAI,
  rawTranscript: string,
): Promise<string> {
  const trimmed = rawTranscript.trim();
  if (!trimmed) return trimmed;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.15,
    messages: [
      { role: "system", content: REFINE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `以下を誤認識補正のみしてください。\n\n---\n${trimmed}\n---`,
      },
    ],
  });

  const refined = completion.choices[0]?.message?.content?.trim();
  if (!refined || refined.length < trimmed.length * 0.5) {
    return trimmed;
  }

  return refined;
}
