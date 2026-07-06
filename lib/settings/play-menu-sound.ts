import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";

/** メニュー内タップ — menu-click.mp4 */
export function playMenuTapSound(): void {
  primeMenuAudioForGesture();
  barAudioEngine.playMenuClick();
}

export function playMenuOpenSound(): void {
  primeMenuAudioForGesture();
  barAudioEngine.playMenuOpen();
}

export function playMenuAdjustSound(): void {
  primeMenuAudioForGesture();
  barAudioEngine.playMenuClick();
}

/** FAB 押下前 — SE プール生成だけ先に済ませる */
export function primeMenuAudioForGesture(): void {
  barAudioEngine.primeMenuSfxForUserGesture();
}
