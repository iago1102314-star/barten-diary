/**
 * 改行が少ない出力に、句点単位で軽く呼吸（段落）を付ける
 */
export function ensureBreathingParagraphs(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const paragraphCount = (trimmed.match(/\n\n/g) || []).length + 1;
  if (paragraphCount >= 3 && paragraphCount <= 5) return trimmed;

  const sentences = trimmed
    .replace(/\n+/g, " ")
    .split(/(?<=[。…!?])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return trimmed;

  const targetParagraphs = Math.min(5, Math.max(3, Math.ceil(sentences.length / 2)));
  const sentencesPerParagraph = Math.max(
    1,
    Math.min(3, Math.ceil(sentences.length / targetParagraphs)),
  );

  const paragraphs: string[] = [];
  let buffer: string[] = [];

  for (const sentence of sentences) {
    buffer.push(sentence);
    if (buffer.length >= sentencesPerParagraph) {
      paragraphs.push(buffer.join(""));
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    if (paragraphs.length > 0 && buffer.length === 1 && paragraphs.length < 5) {
      paragraphs.push(buffer.join(""));
    } else if (paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1] += buffer.join("");
    } else {
      paragraphs.push(buffer.join(""));
    }
  }

  return paragraphs.join("\n\n").trim();
}
