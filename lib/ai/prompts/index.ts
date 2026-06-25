import { FIDELITY_RULES_PROMPT } from "@/lib/ai/prompts/rules-fidelity";
import { GOOD_EXAMPLES_PROMPT } from "@/lib/ai/prompts/good-examples";
import { MASTER_GOOD_EXAMPLES_PROMPT } from "@/lib/ai/prompts/master_good_examples";
import { NG_PATTERNS_PROMPT } from "@/lib/ai/prompts/ng-patterns";
import { MASTER_PERSONA_PROMPT } from "@/lib/ai/prompts/persona-master";
import { MEMORY_SHELF_RULES_PROMPT } from "@/lib/ai/prompts/rules-memory-shelf";
import { MONOLOGUE_RULES_PROMPT } from "@/lib/ai/prompts/rules-monologue";
import { NIGHT_RECORD_RULES_PROMPT } from "@/lib/ai/prompts/rules-night-record";
import { SHELF_WINE_RULES_PROMPT } from "@/lib/ai/prompts/rules-shelf-wine";
import { SECURITY_RULES_PROMPT } from "@/lib/ai/prompts/rules-security";

const OUTPUT_SCHEMA = `## 出力形式

次のJSONのみを返す:
{
  "diary": "話した内容を整理した夜の記録（段落間は \\n\\n。話していない締め・一文の追加禁止）",
  "drinkNote": "",
  "masterComment": "棚の酒メモ（20〜60字・1ブロックのみ）"
}

※ drinkNote は常に空文字 "" にする
※ bottleTag はアプリ側で付与`;

const ROLE_PROMPT = `あなたは深夜のバーで、バーテンダーの音声メモを「夜の記録」に整える編集者です。

ライターでも共同執筆者でもない。
やることは、話した内容の順番を整え、言い淀み（フィラー）を取り除き、読みやすくすることだけ。
意味を変えたり、新しい出来事・感情・一文を足したりしない。要約しない。締めも足さない。翻訳しない。`;

export function buildDiaryGenerationSystemPrompt(): string {
  return [
    ROLE_PROMPT,
    SECURITY_RULES_PROMPT,
    FIDELITY_RULES_PROMPT,
    MEMORY_SHELF_RULES_PROMPT,
    NIGHT_RECORD_RULES_PROMPT,
    MONOLOGUE_RULES_PROMPT,
    SHELF_WINE_RULES_PROMPT,
    MASTER_PERSONA_PROMPT,
    MASTER_GOOD_EXAMPLES_PROMPT,
    NG_PATTERNS_PROMPT,
    GOOD_EXAMPLES_PROMPT,
    OUTPUT_SCHEMA,
  ].join("\n\n");
}

export { buildDiaryGenerationUserPrompt } from "@/lib/ai/prompts/build-user-message";
export {
  GENERATION_TEMPERATURE,
  LAB_MAX_VARIANTS,
  LAB_TEMPERATURES,
} from "@/lib/ai/prompts/constants";
