const OVERLAY_ID = "barten-sign-out-overlay";

/** ログアウト処理中 — ゲスト UI の一瞬の表示を防ぐ全画面オーバーレイ */
export function showClientSignOutOverlay(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(OVERLAY_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    background: "#000",
    pointerEvents: "all",
  });
  document.body.appendChild(overlay);
}
