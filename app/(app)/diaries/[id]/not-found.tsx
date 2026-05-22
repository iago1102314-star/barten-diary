import Link from "next/link";

export default function MemoNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10 text-center">
      <p className="text-sm text-stone-500">その夜のメモは、見つかりません。</p>
      <p className="mt-6">
        <Link
          href="/memories"
          className="text-[11px] tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-400"
        >
          ← 夜のメモ
        </Link>
      </p>
    </div>
  );
}
