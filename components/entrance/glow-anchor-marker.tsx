import type { LampGlowConfigBase } from "@/lib/entrance/lamp-glow-types";
import { lampGlowCenterPinStyle } from "@/lib/entrance/lamp-glow-position";
import type { ReactNode } from "react";

/** 確認用赤点 — 光本体と同じ中心ピン (offsetX, offsetY) */
export function GlowAnchorMarker({
  glow,
  compact = false,
}: {
  glow: Pick<LampGlowConfigBase, "label" | "offsetX" | "offsetY">;
  /** 位置調整用 — より小さな赤点 */
  compact?: boolean;
}) {
  const centerStyle = lampGlowCenterPinStyle(glow.offsetX, glow.offsetY);

  return (
    <>
      <div
        className={
          compact
            ? "pointer-events-none absolute z-[10] h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_1px_#fff,0_0_6px_2px_rgba(255,0,0,0.85)]"
            : "pointer-events-none absolute z-[10] h-4 w-4 rounded-full bg-red-500 shadow-[0_0_0_2px_#fff,0_0_10px_3px_rgba(255,0,0,0.9)]"
        }
        style={centerStyle}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute z-[10] whitespace-nowrap font-mono text-[10px] font-bold leading-tight text-red-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
        style={{
          ...centerStyle,
          transform: compact
            ? "translate(-50%, calc(-50% + 10px))"
            : "translate(-50%, calc(-50% + 14px))",
        }}
      >
        {glow.label} ({glow.offsetX}, {glow.offsetY})
      </span>
    </>
  );
}

/** ランタン用 % 座標の基準枠 */
export function GlowAnchorRoot({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative w-full leading-none ${className}`}>
      {children}
    </div>
  );
}
