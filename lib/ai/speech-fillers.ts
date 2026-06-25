/**
 * 言語ごとのフィラー判定 — 意味のある発話は短くても残す
 */

const SPEECH_CHAR =
  /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9]/u;

/** 単体では意味を持たないフィラー（言語ごと） */
const FILLER_SEGMENT =
  /^(?:あー?|あ|ぁ+|えーっと|えー?|えっと|え|うーん?|うん|そのー?|なんだろう|um|uh|erm|hm+|mmm+|you know|like|那个|嗯|啊|呃)[.…、,.\s]*$/iu;

const LEADING_FILLER =
  /^(?:あー?|えーっと|えー?|えっと|うーん?|そのー?|なんだろう|um|uh|you know|那个|嗯)\s*[、。,.\s…]*/giu;

function countSpeechChars(text: string): number {
  return [...text].filter((c) => SPEECH_CHAR.test(c)).length;
}

function isFillerSegment(segment: string): boolean {
  const trimmed = segment.trim();
  if (!trimmed) return true;
  return FILLER_SEGMENT.test(trimmed);
}

/** フィラーを除いたあと、意味のある文字が残るか */
export function transcriptWithoutFillers(transcript: string): string {
  let text = transcript.trim();

  while (LEADING_FILLER.test(text)) {
    text = text.replace(LEADING_FILLER, "").trim();
  }

  const segments = text.split(/[\s\u3000、。．，,.!?！？]+/).filter(Boolean);
  const kept = segments.filter((segment) => !isFillerSegment(segment));

  return kept.join(" ").trim();
}

/** フィラーしか残らない → 日記生成しない（聞き取れなかった扱い） */
export function isFillerOnlyTranscript(transcript: string): boolean {
  const trimmed = transcript.trim();
  if (!trimmed) return true;
  return countSpeechChars(transcriptWithoutFillers(trimmed)) === 0;
}
