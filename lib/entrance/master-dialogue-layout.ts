/**
 * マスター吹き出し — 1行目は固定インデント、溢れた分は2行目以降へ折り返す。
 */

export type MasterDialogueLayoutOptions = {
  /** 本文が使える横幅（右 padding を除いた値） */
  textAreaWidthPx: number;
  maxIndentPx: number;
  measure: (text: string) => number;
};

export type MasterDialogueLayout = {
  lines: string[];
  /** 1行目の padding-left（px）— 常に maxIndentPx */
  firstLineIndentPx: number;
  /** 2行目以降の padding-left（px） */
  bodyIndentPx: number;
};

function fitsLine(
  text: string,
  textAreaWidthPx: number,
  indentPx: number,
  measure: (text: string) => number,
): boolean {
  if (!text) return true;
  return measure(text) <= textAreaWidthPx - indentPx;
}

/** 指定インデントで1行に収まる最大長を先頭から取る */
function takeFirstLineChunk(
  text: string,
  textAreaWidthPx: number,
  indentPx: number,
  measure: (text: string) => number,
): string {
  if (!text) return "";

  let line = "";
  for (const char of text) {
    const candidate = line + char;
    if (fitsLine(candidate, textAreaWidthPx, indentPx, measure)) {
      line = candidate;
    } else {
      break;
    }
  }

  return line || text.charAt(0);
}

function wrapWithIndent(
  text: string,
  textAreaWidthPx: number,
  indentPx: number,
  measure: (text: string) => number,
): string[] {
  if (!text) return [];

  const lines: string[] = [];
  let remaining = text;

  while (remaining) {
    const line = takeFirstLineChunk(
      remaining,
      textAreaWidthPx,
      indentPx,
      measure,
    );
    lines.push(line);
    remaining = remaining.slice(line.length);
  }

  return lines;
}

/**
 * 1行目は maxIndentPx 固定。収まらない分は2行目以降へ（1行目の位置は動かさない）。
 */
export function layoutMasterDialogueText(
  text: string,
  options: MasterDialogueLayoutOptions,
): MasterDialogueLayout {
  const { textAreaWidthPx, maxIndentPx, measure } = options;
  const firstLineIndentPx = maxIndentPx;
  const bodyIndentPx = maxIndentPx;

  if (!text) {
    return { lines: [], firstLineIndentPx, bodyIndentPx };
  }

  if (textAreaWidthPx <= 0 || measure("あ") <= 0) {
    return {
      lines: [text],
      firstLineIndentPx,
      bodyIndentPx,
    };
  }

  if (fitsLine(text, textAreaWidthPx, maxIndentPx, measure)) {
    return {
      lines: [text],
      firstLineIndentPx,
      bodyIndentPx,
    };
  }

  const line1 = takeFirstLineChunk(
    text,
    textAreaWidthPx,
    maxIndentPx,
    measure,
  );
  const rest = text.slice(line1.length);
  const lines = line1 ? [line1] : [];

  if (rest) {
    lines.push(...wrapWithIndent(rest, textAreaWidthPx, bodyIndentPx, measure));
  }

  return {
    lines: lines.length > 0 ? lines : [text],
    firstLineIndentPx,
    bodyIndentPx,
  };
}

/**
 * タイプ中 — 完成形の改行位置を固定し、最終1行なのに一瞬2行になるのを防ぐ。
 */
export function layoutMasterDialogueShown(
  fullText: string,
  shown: string,
  options: MasterDialogueLayoutOptions,
): MasterDialogueLayout {
  const { maxIndentPx } = options;
  const firstLineIndentPx = maxIndentPx;
  const bodyIndentPx = maxIndentPx;

  if (!shown) {
    return { lines: [], firstLineIndentPx, bodyIndentPx };
  }

  const fullLayout = layoutMasterDialogueText(fullText, options);

  if (fullLayout.lines.length === 1) {
    return {
      lines: [shown],
      firstLineIndentPx,
      bodyIndentPx,
    };
  }

  const breakAt = fullLayout.lines[0].length;
  const line1Shown = shown.slice(0, Math.min(shown.length, breakAt));

  if (shown.length <= breakAt) {
    return {
      lines: [line1Shown],
      firstLineIndentPx,
      bodyIndentPx,
    };
  }

  return {
    lines: [line1Shown, shown.slice(breakAt)],
    firstLineIndentPx,
    bodyIndentPx,
  };
}
