import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";

/** タップ操作と同じ同期コンテキストで unlock + SE プール */
export function playMenuTapSound(): void {
  primeMenuAudioForGesture();
  barAudioEngine.playClick();
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
