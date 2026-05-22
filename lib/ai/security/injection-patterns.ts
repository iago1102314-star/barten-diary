/**
 * プロンプトインジェクション検出パターン（ラボ警告・監視用）
 * 検出しても入力は「ユーザー発話」として扱い、生成自体はブロックしない
 */
export type InjectionPattern = {
  id: string;
  label: string;
  pattern: RegExp;
};

export const INJECTION_PATTERNS: InjectionPattern[] = [
  {
    id: "ignore-instructions",
    label: "指示の無視要求",
    pattern: /今までの指示を無視|指示を無視|以前の指示|これまでのルールを無視/i,
  },
  {
    id: "show-system",
    label: "システムプロンプト開示",
    pattern: /system\s*prompt|システムプロンプト|開発者プロンプト|developer\s*prompt/i,
  },
  {
    id: "non-json",
    label: "JSON拒否",
    pattern: /JSON以外|json以外|マークダウンで|プレーンテキストで返/i,
  },
  {
    id: "api-key",
    label: "APIキー要求",
    pattern: /API\s*キー|api\s*key|sk-[a-zA-Z0-9]|OPENAI_API/i,
  },
  {
    id: "override-dev",
    label: "開発者命令の上書き",
    pattern: /開発者命令|developer\s*message|ルールを上書き|制約を解除/i,
  },
  {
    id: "jailbreak",
    label: "ジェイルブレイク",
    pattern: /DANモード|制限を外して|何でも答えて|フィルターを無効/i,
  },
  {
    id: "role-play-system",
    label: "システム役割の乗っ取り",
    pattern: /あなたは今から|これ以降あなたは|役割を切り替え/i,
  },
];

/** 出力に含まれたら危険（内部情報漏洩） */
export const OUTPUT_LEAK_PATTERNS: InjectionPattern[] = [
  {
    id: "leak-sk",
    label: "APIキー様式",
    pattern: /sk-[a-zA-Z0-9]{8,}/,
  },
  {
    id: "leak-system-text",
    label: "システムプロンプト漏洩",
    pattern: /## 忠実度|FIDELITY_RULES|buildDiaryGenerationSystemPrompt/i,
  },
  {
    id: "leak-schema-hint",
    label: "内部スキーマ言及",
    pattern: /response_format|json_object|GeneratedDiaryContent/i,
  },
];
