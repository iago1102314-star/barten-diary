/**
 * OpenAI 呼び出しのコスト上限。
 *
 * /api/transcribe と /api/generate-diary は未認証で叩けるため、
 * 1 リクエストあたりの課金量をここで確定させる。
 */

/**
 * 生成・整形に渡す文字起こしの上限。
 * 3 分の日本語発話は概ね 400〜1,200 字なので、正常利用には十分な余裕がある。
 */
export const MAX_TRANSCRIPT_CHARS = 5000;

/** 日記生成の出力上限。DIARY_MAX_CHARS(420) + JSON 構造に対する余裕を含む。 */
export const DIARY_GENERATION_MAX_TOKENS = 1200;

/** 文字起こし整形の出力上限。切り詰められた場合は元の文字起こしにフォールバックする。 */
export const TRANSCRIPT_REFINE_MAX_TOKENS = 4000;
