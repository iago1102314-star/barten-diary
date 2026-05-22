const VISITED_KEY = "barten-has-visited";

export function isReturningVisitor(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(VISITED_KEY) === "1";
}

export function markReturningVisitor(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VISITED_KEY, "1");
}
