import { FetchTimeoutError, fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getAudioExtension } from "@/lib/transcribe/get-audio-extension";

export type TranscribeAudioResult = {
  transcript: string;
};

export type TranscribeAudioError = {
  error: string;
};

const TRANSCRIBE_TIMEOUT_MS = 90_000;

export async function transcribeAudio(
  blob: Blob,
  mimeType: string,
): Promise<TranscribeAudioResult> {
  const extension = getAudioExtension(mimeType);
  const formData = new FormData();
  formData.append("file", blob, `recording.${extension}`);

  let response: Response;

  try {
    response = await fetchWithTimeout(
      "/api/transcribe",
      { method: "POST", body: formData },
      TRANSCRIBE_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof FetchTimeoutError) {
      throw new Error("文字起こしに時間がかかりすぎました。もう一度お試しください。");
    }
    throw error;
  }

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
