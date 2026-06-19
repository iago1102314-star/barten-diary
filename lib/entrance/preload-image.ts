/** 単一画像を decode まで待ってプリロードする */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(() => resolve()).catch(() => resolve());
        return;
      }
      resolve();
    };

    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
}
