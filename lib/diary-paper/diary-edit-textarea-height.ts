/** 自動伸長時にスクロール位置が飛ばないよう、必要なときだけ追従する */
export function syncDiaryBodyTextareaHeight(textarea: HTMLTextAreaElement) {
  const scrollRoot = textarea.closest(
    "[data-diary-paper-scroll]",
  ) as HTMLElement | null;

  const previousScrollTop = scrollRoot?.scrollTop ?? 0;
  const previousBottom = textarea.getBoundingClientRect().bottom;

  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;

  if (!scrollRoot) return;

  const heightDelta = textarea.getBoundingClientRect().bottom - previousBottom;
  if (heightDelta <= 0.5) {
    scrollRoot.scrollTop = previousScrollTop;
    return;
  }

  const viewport = window.visualViewport;
  const viewportBottom =
    (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);

  if (previousBottom > viewportBottom - 56) {
    scrollRoot.scrollTop = previousScrollTop + heightDelta;
    return;
  }

  scrollRoot.scrollTop = previousScrollTop;
}
