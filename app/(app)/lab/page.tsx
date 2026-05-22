import { PromptLab } from "@/components/lab/prompt-lab";
import Link from "next/link";

export default function LabPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-10 space-y-3">
        <Link
          href="/diaries"
          className="text-xs text-stone-600 transition-colors hover:text-stone-400"
        >
          ← カウンターへ
        </Link>
        <h1 className="text-lg font-light tracking-wide text-stone-300">
          記録の温度 — 比較
        </h1>
        <p className="text-sm leading-relaxed text-stone-500">
          同じ音声から3つの温度で夜の記録を生成し、NGワード・長さ・メモを残しながら「静かな夜」の空気を調整します。
        </p>
      </header>
      <PromptLab />
    </div>
  );
}
