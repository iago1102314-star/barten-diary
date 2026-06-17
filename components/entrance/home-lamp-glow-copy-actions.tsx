"use client";

import { formatLampGlowsForCopy } from "@/lib/entrance/lamp-glow-format";
import {
  clearLampGlowOverrides,
  saveLampGlowOverrides,
} from "@/lib/entrance/lamp-glow-dev-overrides";
import type { CounterLampGlowConfig } from "@/lib/entrance/counter-lamp-glows";
import { useState } from "react";

export function HomeLampGlowCopyActions({
  glows,
}: {
  glows: CounterLampGlowConfig[];
}) {
  const [copied, setCopied] = useState(false);
  const [committed, setCommitted] = useState(false);

  const handleCopy = async () => {
    saveLampGlowOverrides(glows);
    await navigator.clipboard.writeText(formatLampGlowsForCopy(glows));
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  /** TS に貼り付けたあと — 下書きを消して counter-lamp-glows.ts を正とする */
  const handleCommittedToFile = () => {
    clearLampGlowOverrides();
    setCommitted(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="flex max-w-lg flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-md border border-amber-700/60 bg-black/80 px-3 py-1.5 font-mono text-[10px] text-amber-100"
        >
          {copied ? "コピー済 — TS に貼って！" : "① クリップボードにコピー"}
        </button>
        <button
          type="button"
          onClick={handleCommittedToFile}
          className="rounded-md border border-emerald-800/80 bg-black/80 px-3 py-1.5 font-mono text-[10px] text-emerald-300"
        >
          {committed ? "ファイル優先に戻します…" : "② TS に貼った → 反映"}
        </button>
      </div>
      <p className="max-w-md text-center font-mono text-[9px] leading-relaxed text-stone-500">
        コピーだけでは TS は変わりません。①でコピー →{" "}
        <code className="text-stone-400">counter-lamp-glows.ts</code>{" "}
        に貼り付け → ②を押す
      </p>
    </div>
  );
}
