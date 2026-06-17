import { LampGlowLab } from "@/components/lab/lamp-glow-lab";
import Link from "next/link";

export default function LampGlowLabPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-10 space-y-3">
        <Link
          href="/lab"
          className="text-xs text-stone-600 transition-colors hover:text-stone-400"
        >
          ← ラボへ
        </Link>
        <h1 className="text-lg font-light tracking-wide text-stone-300">
          店内 LampGlow — 座標調整
        </h1>
        <p className="text-sm leading-relaxed text-stone-500">
          ランタン先端・背景照明のグローを、光源画像に追従する形で調整します。パララックス切替でずれないか確認できます。
        </p>
      </header>
      <LampGlowLab />
    </div>
  );
}
