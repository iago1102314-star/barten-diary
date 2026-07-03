import {
  COUNTER_BACK_DARKEN_OPACITY,
  COUNTER_BACK_DARKEN_TOP_GRADIENT,
} from "@/lib/entrance/counter-scene-tuning";

/**
 * counter-back / back-record 専用の暗化レイヤー。
 * 画像の直上・同じ overflow 枠内に置く（手前レイヤーにはかからない）。
 */
export function CounterBackDarkenOverlay() {
  if (COUNTER_BACK_DARKEN_OPACITY <= 0 && COUNTER_BACK_DARKEN_TOP_GRADIENT <= 0) {
    return null;
  }

  return (
    <>
      {COUNTER_BACK_DARKEN_TOP_GRADIENT > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse 95% 70% at 50% 18%, rgba(0, 0, 0, ${COUNTER_BACK_DARKEN_TOP_GRADIENT}), transparent 72%)`,
          }}
        />
      )}
      {COUNTER_BACK_DARKEN_OPACITY > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
          style={{ backgroundColor: `rgba(0, 0, 0, ${COUNTER_BACK_DARKEN_OPACITY})` }}
        />
      )}
    </>
  );
}
