export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center">
      <p className="text-[10px] tracking-[0.5em] text-stone-600 uppercase">back bar</p>
      <h1 className="font-serif-jp text-xl tracking-[0.18em] text-stone-400">
        繋がれません
      </h1>
      <p className="font-serif-jp text-sm leading-loose tracking-[0.08em] text-stone-600">
        ネットワークに接続してから<br />もう一度お試しください。
      </p>
    </div>
  );
}
