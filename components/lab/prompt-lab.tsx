"use client";

import {
  VariantReviewPanel,
  formatReviewLogEntry,
} from "@/components/lab/variant-review-panel";
import { InputSecurityPanel } from "@/components/lab/input-security-panel";
import { DrinkCategoryMenu } from "@/components/night/drink-category-menu";
import { generateDiaryVariants } from "@/lib/ai/generate-diary-client";
import { buildInputSecurityReport } from "@/lib/ai/security/security-report";
import { SECURITY_TEST_SAMPLES } from "@/lib/ai/security/test-samples";
import { formatGoodOutputMarkdown } from "@/lib/ai/quality/export-review";
import type { GeneratedDiaryVariant } from "@/lib/ai/types";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { useLabReviews } from "@/hooks/use-lab-reviews";
import { useState } from "react";

const SAMPLE_TRANSCRIPT = `今日はレジが詰まって焦った。でもラストの客が「ゆっくりできた」って言ってくれて、少し救われた。帰り道、雨だった。仕込みはまあまあだったけど、もう半拍早く気づけたらよかったな。`;

function variantReviewId(variant: GeneratedDiaryVariant): string {
  return `${variant.label}-${variant.temperature}`;
}

export function PromptLab() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<DrinkCategoryId>("clear");
  const [variants, setVariants] = useState<GeneratedDiaryVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reviews, upsertReview, clearReviews } = useLabReviews();

  const inputReport = buildInputSecurityReport(transcript);

  const handleCompare = async () => {
    if (!inputReport.inputOk) {
      setError(inputReport.inputMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setVariants([]);

    try {
      const results = await generateDiaryVariants(transcript, {
        variantCount: 3,
        recordedAt: new Date().toISOString(),
        selectedCategoryId,
      });
      setVariants(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "比較生成に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  const savedReviews = Object.values(reviews).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const copyAllGoodOutputs = async () => {
    const goodOnes = savedReviews.filter((r) => r.rating === "good");
    const body = goodOnes
      .map((r) => formatGoodOutputMarkdown(r.transcript, r.output, r))
      .join("\n---\n\n");
    await navigator.clipboard.writeText(body || "（◎ 良い と記録した案がありません）");
  };

  return (
    <div className="space-y-8">
      <DrinkCategoryMenu
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <div className="space-y-3">
        <label
          htmlFor="lab-transcript"
          className="block text-xs tracking-[0.2em] text-stone-600 uppercase"
        >
          試す音声（文字起こし）
        </label>
        <textarea
          id="lab-transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full resize-y rounded-xl border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm leading-relaxed text-stone-300 outline-none focus:border-stone-600"
        />
        <InputSecurityPanel transcript={transcript} />
        <div className="flex flex-wrap gap-2">
          {SECURITY_TEST_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => setTranscript(sample.transcript)}
              className="rounded-full border border-stone-800 px-2.5 py-1 text-[10px] text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-400"
            >
              {sample.label}
              {sample.expectBlocked ? " · 拒否想定" : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleCompare()}
          disabled={loading || !transcript.trim() || !inputReport.inputOk}
          className="rounded-full border border-amber-800/40 px-6 py-2.5 text-sm text-amber-200/80 transition-colors hover:border-amber-700/60 disabled:opacity-50"
        >
          {loading ? "紡いでいます…" : "3案を比較する"}
        </button>
        <p className="text-xs text-stone-600">
          温度 0.62（静） / 0.64（標準・本番） / 0.74（温）。入力・出力のセキュリティ警告は各所に表示されます。
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300/80">
          {error}
        </p>
      )}

      {variants.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {variants.map((variant) => (
            <VariantReviewPanel
              key={variantReviewId(variant)}
              variant={variant}
              transcript={transcript}
              review={reviews[variantReviewId(variant)]}
              onSaveReview={upsertReview}
            />
          ))}
        </div>
      )}

      {savedReviews.length > 0 && (
        <section className="space-y-3 rounded-xl border border-stone-800/60 bg-stone-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs tracking-[0.2em] text-stone-500 uppercase">
              レビュー履歴（このブラウザ）
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyAllGoodOutputs()}
                className="rounded-full border border-amber-900/40 px-3 py-1 text-[11px] text-amber-200/70"
              >
                良い案をまとめてコピー
              </button>
              <button
                type="button"
                onClick={clearReviews}
                className="rounded-full border border-stone-800 px-3 py-1 text-[11px] text-stone-600 hover:text-stone-400"
              >
                履歴を消す
              </button>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-stone-500">
            {savedReviews.map((r) => (
              <li key={r.id}>{formatReviewLogEntry(r)}</li>
            ))}
          </ul>
          <p className="text-[10px] text-stone-700">
            コピーしたブロックを lib/ai/prompts/good_outputs.md に貼って蓄積してください。
          </p>
        </section>
      )}

      <p className="text-center text-xs text-stone-700">
        調整: lib/ai/prompts/ · セキュリティ: lib/ai/security/ · 参照: good_outputs.md / ng_patterns.md
      </p>
    </div>
  );
}
