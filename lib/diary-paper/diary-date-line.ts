export type DiaryDateLineToken =
  | { kind: "slash"; text: string }
  | { kind: "handwriting"; text: string }
  | { kind: "space"; text: string };

const DATE_LINE_TOKEN_RE = /(\/)|(\d+)|([\u3000\s]+)|([^/\d\u3000\s]+)/g;

/** 例: 2026 / 6 / 21　深夜 — 数字・時刻語は手書き、/ は従来フォント */
export function tokenizeDiaryDateLine(dateLine: string): DiaryDateLineToken[] {
  const tokens: DiaryDateLineToken[] = [];

  for (const match of dateLine.matchAll(DATE_LINE_TOKEN_RE)) {
    if (match[1]) tokens.push({ kind: "slash", text: match[1] });
    else if (match[2]) tokens.push({ kind: "handwriting", text: match[2] });
    else if (match[3]) tokens.push({ kind: "space", text: match[3] });
    else if (match[4]) tokens.push({ kind: "handwriting", text: match[4] });
  }

  return tokens;
}
