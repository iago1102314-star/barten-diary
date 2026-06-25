/**
 * 後処理: 意味を持たないフィラーのみ除去（話し方・温度感は残す）
 */
const LINE_START_FILLERS =
  /^(あー?|えーっと|えー?|えっと|うーん?|そのー?|なんだろう|um|uh|you know|那个|嗯)[、。…\s]*/gimu;

export function stripOralFillers(text: string): string {
  let result = text;

  result = result.replace(LINE_START_FILLERS, "");

  result = result
    .replace(/、{2,}/g, "、")
    .replace(/^[、。\s]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}
