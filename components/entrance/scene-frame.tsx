import type { ReactNode } from "react";

type SceneFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 1536×2560 縦画面 — 会話シーン共通フレーム
 * モバイル: max-h で viewport に収め、object-cover で自然にトリミング
 */
export function SceneFrame({ children, className = "" }: SceneFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[420px] overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: "1536 / 2560", maxHeight: "min(85dvh, 720px)" }}
    >
      {children}
    </div>
  );
}
