/**
 * 後処理: 残りすぎた口癖・フィラーを軽く除去（意味は変えない）
 */
const LINE_START_FILLERS =
  /^(おっす|おはよう|こんばんは|いやー|えーと|えっと|あのー?|うーん|まあ|なんか)[、。…\s]*/gmu;

const INLINE_FILLERS =
  /[、,]?\s*(なんか|まあ|ていうか|って感じ|ですね|えっと|あの)\s*/gu;

const TRAILING_FILLER = /[、,]?\s*って感じ[。]?$/u;

export function stripOralFillers(text: string): string {
  let result = text;

  result = result.replace(LINE_START_FILLERS, "");
  result = result.replace(TRAILING_FILLER, "。");
  result = result.replace(INLINE_FILLERS, "、");

  result = result
    .replace(/、{2,}/g, "、")
    .replace(/^[、。\s]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}
