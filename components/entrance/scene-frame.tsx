import type { ReactNode } from "react";

type SceneFrameProps = {
  children: ReactNode;
  className?: string;
  /** ヴィネット・グレイン等の空気感レイヤーを重ねる（既定: true） */
  atmosphere?: boolean;
};

/**
 * 1536×2560 縦画面 — 会話シーン共通フレーム（.stage + grain + vignette）
 */
export function SceneFrame({
  children,
  className = "",
  atmosphere = true,
}: SceneFrameProps) {
  return (
    <div
      className={`stage relative overflow-hidden bg-black ${
        atmosphere ? "grain vignette" : ""
      } ${className}`}
    >
      {children}

      {atmosphere && (
        <div
          className="pointer-events-none absolute inset-0 z-[25]"
          aria-hidden
        >
          <div className="absolute inset-0 scene-amber-air" />
        </div>
      )}
    </div>
  );
}
