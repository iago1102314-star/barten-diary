import type { ReactNode } from "react";
import { isPerfGrainEnabled } from "@/lib/layout/perf-feature-flags";

type SceneFrameProps = {
  children: ReactNode;
  className?: string;
  /** ヴィネット・グレイン等の空気感レイヤーを重ねる（既定: true） */
  atmosphere?: boolean;
  onPointerDown?: React.ComponentProps<"div">["onPointerDown"];
};

/**
 * 1536×2560 縦画面 — 会話シーン共通フレーム（.stage + grain + vignette）
 */
export function SceneFrame({
  children,
  className = "",
  atmosphere = true,
  onPointerDown,
}: SceneFrameProps) {
  const atmosphereLayers =
    atmosphere && isPerfGrainEnabled() ? "grain vignette" : atmosphere ? "vignette" : "";

  return (
    <div
      className={`stage relative overflow-hidden bg-black ${atmosphereLayers} ${className}`}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  );
}
