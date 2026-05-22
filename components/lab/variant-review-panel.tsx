"use client";

import { QualityWarnings } from "@/components/lab/quality-warnings";
import { NightRecordCard } from "@/components/night/night-record-card";
import {
  formatGoodOutputMarkdown,
  formatReviewLogEntry,
} from "@/lib/ai/quality/export-review";
import type { LabReviewNote } from "@/lib/ai/quality/review-types";
import type { GeneratedDiaryVariant } from "@/lib/ai/types";
import { useState } from "react";

type VariantReviewPanelProps = {
  variant: GeneratedDiaryVariant;
  transcript: string;
  review?: LabReviewNote;
  onSaveReview: (note: LabReviewNote) => void;
};

function variantReviewId(variant: GeneratedDiaryVariant): string {
  return `${variant.label}-${variant.temperature}`;
}

export function VariantReviewPanel({
  variant,
  transcript,
  review,
  onSaveReview,
}: VariantReviewPanelProps) {
  const [rating, setRating] = useState<LabReviewNote["rating"]>(
    review?.rating ?? null,
  );
  const [goodReason, setGoodReason] = useState(review?.goodReason ?? "");
  const [badReason, setBadReason] = useState(review?.badReason ?? "");
  const [copied, setCopied] = useState(false);

  const record = {
    bottleTag: variant.bottleTag,
    diary: variant.diary,
    drinkNote: variant.drinkNote,
    masterComment: variant.masterComment,
  };

  const save = () => {
    const note: LabReviewNote = {
      id: variantReviewId(variant),
      variantLabel: variant.label,
      temperature: variant.temperature,
      rating,
      goodReason,
      badReason,
      transcript,
      output: record,
      adjustments: variant.postProcessAdjustments ?? [],
      updatedAt: new Date().toISOString(),
    };
    onSaveReview(note);
  };

  const copyGoodOutput = async () => {
    const note: LabReviewNote = {
      id: variantReviewId(variant),
      variantLabel: variant.label,
      temperature: variant.temperature,
      rating: rating ?? "good",
      goodReason,
      badReason,
      transcript,
      output: record,
      adjustments: variant.postProcessAdjustments ?? [],
      updatedAt: new Date().toISOString(),
    };
    const md = formatGoodOutputMarkdown(transcript, record, note);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-center text-[11px] tracking-widest text-stone-600 uppercase">
        {variant.label} · {variant.temperature}
      </p>

      <QualityWarnings
        record={record}
        transcript={transcript}
        postProcessAdjustments={variant.postProcessAdjustments}
      />

      <NightRecordCard record={variant} />

      <div className="space-y-2 rounded-xl border border-stone-800/80 bg-stone-950/50 p-3">
        <p className="text-[11px] tracking-wide text-stone-500 uppercase">
          品質メモ
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRating("good")}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
              rating === "good"
                ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-200/90"
                : "border-stone-800 text-stone-500 hover:border-stone-700"
            }`}
          >
            良い
          </button>
          <button
            type="button"
            onClick={() => setRating("bad")}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
              rating === "bad"
                ? "border-red-900/40 bg-red-950/30 text-red-200/80"
                : "border-stone-800 text-stone-500 hover:border-stone-700"
            }`}
          >
            要調整
          </button>
        </div>

        <label className="block text-[11px] text-stone-600">
          良い理由
          <textarea
            value={goodReason}
            onChange={(e) => setGoodReason(e.target.value)}
            rows={2}
            placeholder="静かさ・余白・口語の残り方…"
            className="mt-1 w-full resize-y rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300 outline-none focus:border-stone-600"
          />
        </label>

        <label className="block text-[11px] text-stone-600">
          悪い理由
          <textarea
            value={badReason}
            onChange={(e) => setBadReason(e.target.value)}
            rows={2}
            placeholder="AI臭・説明過多・マスターがコーチっぽい…"
            className="mt-1 w-full resize-y rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300 outline-none focus:border-stone-600"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-full border border-stone-700 px-3 py-1 text-[11px] text-stone-400 hover:border-stone-600"
          >
            メモを保存
          </button>
          <button
            type="button"
            onClick={() => void copyGoodOutput()}
            className="rounded-full border border-amber-900/40 px-3 py-1 text-[11px] text-amber-200/70 hover:border-amber-800/50"
          >
            {copied ? "コピーしました" : "good_outputs 用にコピー"}
          </button>
        </div>

        {review?.updatedAt && (
          <p className="text-[10px] text-stone-700">
            保存: {new Date(review.updatedAt).toLocaleString("ja-JP")}
          </p>
        )}
      </div>
    </div>
  );
}

export { formatReviewLogEntry };
