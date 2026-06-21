/**
 * マスター吹き出し — 1行目インデントを詰めてから2行目へ折り返す。
 */

export type MasterDialogueLayoutOptions = {
  /** 本文が使える横幅（右 padding を除いた値） */
  textAreaWidthPx: number;
  maxIndentPx: number;
  minIndentPx: number;
  indentStepPx: number;
  measure: (text: string) => number;
};

export type MasterDialogueLayout = {
  lines: string[];
  /** 1行目の padding-left（px） */
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
 * 通常インデントで始め、1行に収まらないときだけ左へ詰め、
 * 縦線手前まで来たら2行目（通常インデント）へ。
 */
export function layoutMasterDialogueText(
  text: string,
  options: MasterDialogueLayoutOptions,
): MasterDialogueLayout {
  const {
    textAreaWidthPx,
    maxIndentPx,
    minIndentPx,
    indentStepPx,
    measure,
  } = options;

  const bodyIndentPx = maxIndentPx;

  if (!text) {
    return { lines: [], firstLineIndentPx: maxIndentPx, bodyIndentPx };
  }

  if (textAreaWidthPx <= 0 || measure("あ") <= 0) {
    return {
      lines: [text],
      firstLineIndentPx: maxIndentPx,
      bodyIndentPx,
    };
  }

  if (fitsLine(text, textAreaWidthPx, maxIndentPx, measure)) {
    return {
      lines: [text],
      firstLineIndentPx: maxIndentPx,
      bodyIndentPx,
    };
  }

  let line1 = "";
  let indentPx = maxIndentPx;
  let index = 0;

  while (index < text.length) {
    const next = line1 + text[index];

    if (fitsLine(next, textAreaWidthPx, indentPx, measure)) {
      line1 = next;
      index += 1;
      continue;
    }

    if (indentPx > minIndentPx) {
      indentPx = Math.max(minIndentPx, indentPx - indentStepPx);
      continue;
    }

    break;
  }

  const rest = text.slice(index);
  const lines = line1 ? [line1] : [];

  if (rest) {
    lines.push(...wrapWithIndent(rest, textAreaWidthPx, bodyIndentPx, measure));
  }

  return {
    lines: lines.length > 0 ? lines : [text],
    firstLineIndentPx: line1 ? indentPx : maxIndentPx,
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
  const bodyIndentPx = maxIndentPx;

  if (!shown) {
    return { lines: [], firstLineIndentPx: maxIndentPx, bodyIndentPx };
  }

  const fullLayout = layoutMasterDialogueText(fullText, options);

  if (fullLayout.lines.length === 1) {
    const shownLayout = layoutMasterDialogueText(shown, options);
    return {
      lines: [shown],
      firstLineIndentPx: shownLayout.firstLineIndentPx,
      bodyIndentPx: fullLayout.bodyIndentPx,
    };
  }

  const breakAt = fullLayout.lines[0].length;
  const line1Shown = shown.slice(0, Math.min(shown.length, breakAt));
  const line1Layout = layoutMasterDialogueText(line1Shown, options);

  if (shown.length <= breakAt) {
    return {
      lines: [line1Shown],
      firstLineIndentPx: line1Layout.firstLineIndentPx,
      bodyIndentPx: fullLayout.bodyIndentPx,
    };
  }

  return {
    lines: [line1Shown, shown.slice(breakAt)],
    firstLineIndentPx: line1Layout.firstLineIndentPx,
    bodyIndentPx: fullLayout.bodyIndentPx,
  };
}
