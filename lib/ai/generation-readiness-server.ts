import OpenAI from "openai";

/** runDiaryGeneration と同じモデル — 到達性だけ確認 */
const READINESS_MODEL = "gpt-4o-mini";
const READINESS_TIMEOUT_MS = 5_000;

export type GenerationReadinessResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

export async function verifyGenerationReadiness(): Promise<GenerationReadinessResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: "OpenAI API キーが設定されていません。", status: 500 };
  }

  const openai = new OpenAI({
    apiKey,
    timeout: READINESS_TIMEOUT_MS,
    maxRetries: 0,
  });

  try {
    await openai.models.retrieve(READINESS_MODEL);
    return { ok: true };
  } catch (error) {
    console.error("Generation readiness check failed:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return {
          ok: false,
          error: "接続の設定を確認してください。",
          status: 401,
        };
      }
      if (error.status === 429) {
        return {
          ok: false,
          error:
            "今夜は少し休ませてください。しばらくしてからもう一度お試しください。",
          status: 429,
        };
      }
    }

    return {
      ok: false,
      error: "日記生成の準備が整いませんでした。",
      status: 503,
    };
  }
}
