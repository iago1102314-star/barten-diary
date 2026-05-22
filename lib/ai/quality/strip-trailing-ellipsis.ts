/**
 * 夜の記録末尾の装飾用三点リーダーを除去（生成後・表示時）
 */
export function stripTrailingEllipsis(text: string): string {
  let result = text.trimEnd();

  while (/(\.\.\.|…|\.{2,})$/.test(result)) {
    result = result.replace(/(\.\.\.|…|\.{2,})$/u, "").trimEnd();
  }

  return result;
}
