import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";
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
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error("OpenAI transcription failed:", error);

    return NextResponse.json(
      { error: "文字起こしの処理に失敗しました。" },
      { status: 500 },
    );
  }
}
