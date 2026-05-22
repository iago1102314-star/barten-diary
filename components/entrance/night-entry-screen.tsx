import { SceneFrame } from "@/components/entrance/scene-frame";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import Image from "next/image";
import Link from "next/link";

type NightEntryScreenProps = {
  onEnterCounter: () => void;
};

/** 夜への入口 — 路地 */
export function NightEntryScreen({ onEnterCounter }: NightEntryScreenProps) {
  return (
    <SceneFrame className="rounded-xl">
      <Image
        src={ENTRANCE_ASSETS.start}
        alt=""
        fill
        priority
        sizes="420px"
        className="object-cover"
        draggable={false}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-between px-6 py-[12%]">
        <div className="space-y-3 text-center">
          <p className="text-[11px] tracking-[0.4em] text-stone-400/75 uppercase">
            back bar
          </p>
          <h1 className="text-xl font-light tracking-[0.12em] text-stone-100/95">
            バーテン日記
          </h1>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            type="button"
            onClick={onEnterCounter}
            className="w-full rounded-full border border-stone-600/40 bg-stone-950/50 px-6 py-3 text-sm tracking-[0.18em] text-stone-100/90 backdrop-blur-sm transition-colors hover:border-stone-500/50 hover:bg-stone-950/65"
          >
            今夜のカウンターへ
          </button>
          <Link
            href="/memories"
            className="block w-full rounded-full border border-stone-800/60 bg-stone-950/30 px-6 py-3 text-center text-sm tracking-[0.16em] text-stone-400/90 backdrop-blur-sm transition-colors hover:border-stone-700/50 hover:text-stone-300"
          >
            夜のメモを開く
          </Link>
        </div>
      </div>
    </SceneFrame>
  );
}
