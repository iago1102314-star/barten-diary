/** 親要素内の pointer 位置を % に変換（LampGlow アンカー調整用） */
export function pointerToAnchorPercent(
  clientX: number,
  clientY: number,
  anchorRoot: HTMLElement,
): { offsetX: number; offsetY: number } {
  const rect = anchorRoot.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  const offsetX = Math.round(
    Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
  );
  const offsetY = Math.round(
    Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
  );

  return { offsetX, offsetY };
}

export const GLOW_ANCHOR_ROOT_ATTR = "data-glow-anchor-root";
