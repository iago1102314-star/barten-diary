import {
  MOOD_ORNAMENTAL_DIVIDER_TUNING,
  ornamentalDiamondPath,
} from "@/lib/entrance/mood-ornamental-divider-tuning";

type MoodOrnamentalDividerProps = {
  variant: "pastBottle" | "moodFooter";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** 気分選択画面 — 装飾ライン SVG */
export function MoodOrnamentalDivider({
  variant,
  color = "currentColor",
  className,
  style,
}: MoodOrnamentalDividerProps) {
  const { viewBoxWidth, viewBoxHeight, centerY } = MOOD_ORNAMENTAL_DIVIDER_TUNING;

  const svgProps = {
    width: "100%" as const,
    height: viewBoxHeight,
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    className,
    style: { color, display: "block", ...style },
    "aria-hidden": true as const,
  };

  if (variant === "pastBottle") {
    const t = MOOD_ORNAMENTAL_DIVIDER_TUNING.pastBottle;
    return (
      <svg {...svgProps}>
        <line
          x1={t.lineStartX}
          y1={centerY}
          x2={t.lineEndX}
          y2={centerY}
          stroke="currentColor"
          strokeWidth={t.strokeWidth}
        />
        <path
          d={ornamentalDiamondPath(
            t.diamondCenterX,
            centerY,
            t.diamondHalfWidth,
            t.diamondHalfHeight,
          )}
          fill="currentColor"
        />
      </svg>
    );
  }

  const t = MOOD_ORNAMENTAL_DIVIDER_TUNING.moodFooter;
  return (
    <svg {...svgProps}>
      <line
        x1={t.leftLineStartX}
        y1={centerY}
        x2={t.leftLineEndX}
        y2={centerY}
        stroke="currentColor"
        strokeWidth={t.strokeWidth}
      />
      <line
        x1={t.rightLineStartX}
        y1={centerY}
        x2={t.rightLineEndX}
        y2={centerY}
        stroke="currentColor"
        strokeWidth={t.strokeWidth}
      />
      <path
        d={ornamentalDiamondPath(
          t.diamondCenterX,
          centerY,
          t.diamondHalfWidth,
          t.diamondHalfHeight,
        )}
        fill="currentColor"
      />
    </svg>
  );
}
