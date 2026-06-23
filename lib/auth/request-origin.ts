/** Route Handler 用 — 実際に届いたリクエスト URL の origin */
export function getRequestOriginFromRequest(request: Request): string {
  const requestOrigin = new URL(request.url).origin;

  if (process.env.NODE_ENV === "development") {
    return requestOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return requestOrigin;
}

/** Server Action 用 — Host ヘッダーから origin を組み立てる */
export function getRequestOriginFromHeaders(headersList: Headers): string {
  const host =
    process.env.NODE_ENV === "development"
      ? headersList.get("host")
      : (headersList.get("x-forwarded-host") ?? headersList.get("host"));

  if (!host) {
    throw new Error("Host header が取得できませんでした");
  }

  const proto =
    process.env.NODE_ENV === "development"
      ? (headersList.get("x-forwarded-proto") ?? "http")
      : (headersList.get("x-forwarded-proto") ?? "https");

  return `${proto}://${host}`;
}
