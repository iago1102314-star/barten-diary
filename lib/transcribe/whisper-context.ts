/**
 * Whisper `prompt` — バー現場の語彙ヒント（創作ではなく聴き取り補助）
 * メタ説明（「日本語、一人称…」等）は入れない — 無音時に Whisper が echo しやすい。
 */
export const WHISPER_INITIAL_PROMPT =
  "バー、シフト、レジ、仕込み、ラスト、カウンター、カクテル、ボトル、氷、シェイク、バーテンダー。";

/** 旧プロンプト末尾 — 既存データとの照合用 */
const LEGACY_PROMPT_ECHO_MARKERS = [
  "日本語、一人称の音声メモ",
  "バーテンダー。日本語",
] as const;

/** 無音・BGM のみで Whisper が返しやすい決まり文句 */
const KNOWN_SILENCE_HALLUCINATIONS = [
  "ご視聴ありがとうございました",
  "ご清聴ありがとうございました",
  "ご視聴有難うございました",
  "チャンネル登録",
  "高評価お願いします",
  "字幕",
  "おやすみなさい",
  "ありがとうございました",
] as const;

function normalizeForHallucinationMatch(text: string): string {
  return text.replace(/[\s\u3000。、．！!？?]+/g, "").trim();
}

/** 無音 hallucination — YouTube 定型句など */
export function isKnownWhisperSilenceHallucination(text: string): boolean {
  const compact = normalizeForHallucinationMatch(text);
  if (!compact) return false;

  return KNOWN_SILENCE_HALLUCINATIONS.some((phrase) => {
    const needle = normalizeForHallucinationMatch(phrase);
    return compact === needle || compact.includes(needle);
  });
}

/**
 * 無音・極小音量の録音で Whisper が prompt をそのまま返すケースを検出。
 */
export function isWhisperPromptHallucination(text: string): boolean {
  if (isKnownWhisperSilenceHallucination(text)) {
    return true;
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return false;

  for (const marker of LEGACY_PROMPT_ECHO_MARKERS) {
    if (trimmed.includes(marker)) {
      const withoutMarker = trimmed
        .replace(new RegExp(`${marker}[。．]?`, "g"), "")
        .replace(/\s+/g, " ")
        .trim();
      if (withoutMarker.length < 12) {
        return true;
      }
    }
  }

  const compact = trimmed.replace(/[\s\u3000。、．]+/g, "");
  const promptCompact = WHISPER_INITIAL_PROMPT.replace(/[\s\u3000。、．]+/g, "");
  if (compact.length === 0) return true;

  let overlap = 0;
  for (const char of compact) {
    if (promptCompact.includes(char)) overlap += 1;
  }

  return overlap / compact.length >= 0.92 && compact.length < 80;
}
