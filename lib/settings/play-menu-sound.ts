import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";

/** タップ操作と同じ同期コンテキストで unlock + SE プール */
function primeMenuAudio(): void {
  barAudioEngine.primeMenuSfxForUserGesture();
}

export function playMenuTapSound(): void {
  primeMenuAudio();
  barAudioEngine.playClick();
}

export function playMenuOpenSound(): void {
  primeMenuAudio();
  barAudioEngine.playMenuOpen();
}

export function playMenuAdjustSound(): void {
  primeMenuAudio();
  barAudioEngine.playMenuClick();
}
