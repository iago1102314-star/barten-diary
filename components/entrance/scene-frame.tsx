import type { ReactNode } from "react";
import { isPerfGrainEnabled } from "@/lib/layout/perf-feature-flags";

type SceneFrameProps = {
  children: ReactNode;
  className?: string;
  /** ヴィネット・グレイン等の空気感レイヤーを重ねる（既定: true） */
  atmosphere?: boolean;
  /** false で grain のみ停止（vignette は atmosphere に従う） */
  grain?: boolean;
  onPointerDown?: React.ComponentProps<"div">["onPointerDown"];
};

/**
 * 1536×2560 縦画面 — 会話シーン共通フレーム（.stage + grain + vignette）
 */
export function SceneFrame({
  children,
  className = "",
  atmosphere = true,
  grain,
  onPointerDown,
}: SceneFrameProps) {
  const grainOn = grain !== false && atmosphere && isPerfGrainEnabled();
  const atmosphereLayers = [
    grainOn ? "grain" : "",
    atmosphere ? "vignette" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`stage relative overflow-hidden bg-black ${atmosphereLayers} ${className}`}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  );
}
