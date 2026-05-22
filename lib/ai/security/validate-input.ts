export const MIN_TRANSCRIPT_LENGTH = 20;

export type TranscriptValidationCode =
  | "empty"
  | "too_short"
  | "symbols_only"
  | "repetition_only"
  | "same_char_run"
  | "filler_only";

const MESSAGES: Record<TranscriptValidationCode, string> = {
  empty: "うまく拾えなかった。\nもう一度だけ頼む。",
  too_short: "まだ少し言葉が足りないみたいだ。\nもう少しだけ聞かせてくれ。",
  symbols_only: "うまく拾えなかった。\nもう一度だけ頼む。",
  repetition_only: "うまく拾えなかった。\nもう一度だけ頼む。",
  same_char_run: "うまく拾えなかった。\nもう一度だけ頼む。",
  filler_only: "まだ少し言葉が足りないみたいだ。\nもう少しだけ聞かせてくれ。",
};

const FILLER_PATTERN =
  /^(あ+|ぁ+|ア+|あー+|うん+|ううん+|はい+|ハイ+|え+|えー+|ん+|うー+|うーん+|hm+|um+|mmm+|…+|\.+|、+)$/iu;

export type TranscriptValidationResult =
  | { ok: true }
  | { ok: false; code: TranscriptValidationCode; message: string };

const SPEECH_CHAR =
  /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9]/u;

function countSpeechChars(text: string): number {
  return [...text].filter((c) => SPEECH_CHAR.test(c)).length;
}

function isSymbolsOnly(text: string): boolean {
  return countSpeechChars(text) < 5;
}

function hasLongSameCharRun(text: string): boolean {
  return /(.)\1{7,}/u.test(text.replace(/\s/g, ""));
}

function isMeaninglessRepetition(text: string): boolean {
  const compact = text.replace(/[\s\u3000]+/g, "");
  if (compact.length < MIN_TRANSCRIPT_LENGTH) return false;

  const chars = [...compact];
  const freq = new Map<string, number>();
  for (const c of chars) {
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  const maxFreq = Math.max(...freq.values());
  if (maxFreq / chars.length >= 0.85) return true;

  for (let len = 1; len <= 6; len++) {
    const unit = compact.slice(0, len);
    if (unit.length === 0) continue;
    const repeated = unit.repeat(Math.ceil(compact.length / len));
    if (repeated.startsWith(compact) && compact.length >= MIN_TRANSCRIPT_LENGTH) {
      return true;
    }
  }

  return false;
}

function isFillerOnly(text: string): boolean {
  const segments = text
    .trim()
    .split(/[\s\u3000、。．，,]+/)
    .filter(Boolean);

  if (segments.length === 0) {
    return true;
  }

  return segments.every((segment) => FILLER_PATTERN.test(segment));
}

export function validateTranscriptInput(
  transcript: string,
): TranscriptValidationResult {
  const trimmed = transcript.trim();

  if (!trimmed) {
    return { ok: false, code: "empty", message: MESSAGES.empty };
  }

  if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
    return { ok: false, code: "too_short", message: MESSAGES.too_short };
  }

  if (isFillerOnly(trimmed)) {
    return { ok: false, code: "filler_only", message: MESSAGES.filler_only };
  }

  if (isSymbolsOnly(trimmed)) {
    return { ok: false, code: "symbols_only", message: MESSAGES.symbols_only };
  }

  if (hasLongSameCharRun(trimmed)) {
    return {
      ok: false,
      code: "same_char_run",
      message: MESSAGES.same_char_run,
    };
  }

  if (isMeaninglessRepetition(trimmed)) {
    return {
      ok: false,
      code: "repetition_only",
      message: MESSAGES.repetition_only,
    };
  }

  return { ok: true };
}

/** API・クライアント用（従来互換: エラー時は message のみ） */
export function validateTranscript(transcript: string): string | null {
  const result = validateTranscriptInput(transcript);
  return result.ok ? null : result.message;
}
