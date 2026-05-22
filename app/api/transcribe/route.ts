import { refineTranscript } from "@/lib/transcribe/refine-transcript";
import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";
import { WHISPER_INITIAL_PROMPT } from "@/lib/transcribe/whisper-context";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API キーが設定されていません。" },
      { status: 500 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "音声ファイルが見つかりません。" },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "音声ファイルが空です。" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "音声ファイルが大きすぎます（最大 25MB）。" },
      { status: 400 },
    );
  }

  const mimeType = file.type || "audio/webm";
  const extension = getAudioExtension(mimeType);
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadFile = new File([buffer], `recording.${extension}`, {
    type: mimeType,
  });

  const openai = new OpenAI({ apiKey });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: uploadFile,
      model: "whisper-1",
      language: "ja",
      prompt: WHISPER_INITIAL_PROMPT,
    });

    const refined = await refineTranscript(openai, transcription.text);

    return NextResponse.json({ transcript: refined });
  } catch (error) {
    console.error("OpenAI transcription failed:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error:
              "OpenAI の利用上限に達しています。platform.openai.com の Billing で残高・プランを確認してください。",
          },
          { status: 429 },
        );
      }

      if (error.status === 401) {
        return NextResponse.json(
          { error: "OpenAI API キーが無効です。.env.local を確認してください。" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "声を聴き取れませんでした。" },
      { status: 500 },
    );
  }
}
