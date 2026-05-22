import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";

export type TranscribeAudioResult = {
  transcript: string;
};

export type TranscribeAudioError = {
  error: string;
};

export async function transcribeAudio(
  blob: Blob,
  mimeType: string,
): Promise<TranscribeAudioResult> {
  const extension = getAudioExtension(mimeType);
  const formData = new FormData();
  formData.append("file", blob, `recording.${extension}`);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as
    | TranscribeAudioResult
    | TranscribeAudioError;

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error
        ? data.error
        : "声を聴き取れませんでした。",
    );
  }

  if (!("transcript" in data) || !data.transcript) {
    throw new Error("文字起こし結果が空でした。");
  }

  return data;
}
