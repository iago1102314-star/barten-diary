export const MIN_TRANSCRIPT_LENGTH = 20;

export function validateTranscript(transcript: string): string | null {
  const trimmed = transcript.trim();

  if (!trimmed) {
    return "文字起こしテキストが空です。";
  }

  if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
    return `文字起こしが短すぎます（${MIN_TRANSCRIPT_LENGTH}文字以上必要です）。もう少し話してからお試しください。`;
  }

  return null;
}
