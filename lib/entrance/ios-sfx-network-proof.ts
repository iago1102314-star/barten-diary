"use client";

import type { BarSfxKind } from "@/lib/entrance/audio-volume-tuning";
import {
  IOS_SFX_FILE_BYTE_LENGTH,
  IOS_SFX_FILE_LAST_MODIFIED,
} from "@/lib/entrance/generated-ios-sfx-manifest";
import {
  isIosSfxFileActive,
  isIosSfxSrcDebugEnabled,
  isIosSfxTargetKind,
  resolveBarSfxSrc,
  type IosSfxTargetKind,
} from "@/lib/entrance/ios-sfx-assets";

type IosSfxNetworkProof = {
  kind: IosSfxTargetKind | BarSfxKind | null;
  method: "HEAD" | "GET";
  requestUrl: string;
  statusCode: number;
  contentLength: string | null;
  etag: string | null;
  lastModified: string | null;
  arrayBufferByteLength: number | null;
  expectedByteLength: number | null;
  expectedLastModified: string | null;
  byteLengthMatchesExpected: boolean | null;
};

const probedRequestUrls = new Set<string>();
let networkProofApiInstalled = false;

function resolveFetchUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return new URL(src, window.location.origin).href;
}

function readExpectedByteLength(
  kind: IosSfxTargetKind | BarSfxKind | null | undefined,
): number | null {
  if (!kind || !isIosSfxTargetKind(kind)) return null;
  const expected = IOS_SFX_FILE_BYTE_LENGTH[kind];
  return expected > 0 ? expected : null;
}

function readExpectedLastModified(
  kind: IosSfxTargetKind | BarSfxKind | null | undefined,
): string | null {
  if (!kind || !isIosSfxTargetKind(kind)) return null;
  return IOS_SFX_FILE_LAST_MODIFIED[kind] ?? null;
}

function buildNetworkProof(
  kind: IosSfxTargetKind | BarSfxKind | null | undefined,
  method: "HEAD" | "GET",
  requestUrl: string,
  response: Response,
  arrayBufferByteLength: number | null,
): IosSfxNetworkProof {
  const expectedByteLength = readExpectedByteLength(kind);
  return {
    kind: kind ?? null,
    method,
    requestUrl,
    statusCode: response.status,
    contentLength: response.headers.get("content-length"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    arrayBufferByteLength,
    expectedByteLength,
    expectedLastModified: readExpectedLastModified(kind),
    byteLengthMatchesExpected:
      expectedByteLength !== null && arrayBufferByteLength !== null
        ? arrayBufferByteLength === expectedByteLength
        : null,
  };
}

export async function probeIosSfxNetworkAsset(
  src: string,
  kind?: BarSfxKind,
  options?: { force?: boolean },
): Promise<IosSfxNetworkProof[]> {
  if (!isIosSfxSrcDebugEnabled() || typeof window === "undefined") {
    return [];
  }

  const requestUrl = resolveFetchUrl(src);
  const dedupeKey = `${kind ?? "unknown"}:${requestUrl}`;
  if (!options?.force && probedRequestUrls.has(dedupeKey)) {
    return [];
  }
  probedRequestUrls.add(dedupeKey);

  const logs: IosSfxNetworkProof[] = [];

  try {
    const headResponse = await fetch(requestUrl, {
      method: "HEAD",
      cache: "default",
    });
    const headProof = buildNetworkProof(kind, "HEAD", requestUrl, headResponse, null);
    logs.push(headProof);
    console.log("[ios-sfx-net] HEAD", headProof);
  } catch (error) {
    console.log("[ios-sfx-net] HEAD failed", {
      kind: kind ?? null,
      requestUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const getResponse = await fetch(requestUrl, {
      method: "GET",
      cache: "default",
    });
    const buffer = await getResponse.arrayBuffer();
    const getProof = buildNetworkProof(
      kind,
      "GET",
      requestUrl,
      getResponse,
      buffer.byteLength,
    );
    logs.push(getProof);
    console.log("[ios-sfx-net] GET", getProof);
  } catch (error) {
    console.log("[ios-sfx-net] GET failed", {
      kind: kind ?? null,
      requestUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return logs;
}

export function queueIosSfxNetworkProof(kind: BarSfxKind, src: string): void {
  if (!isIosSfxSrcDebugEnabled() || !isIosSfxFileActive(kind)) return;
  void probeIosSfxNetworkAsset(src, kind);
}

export function installIosSfxNetworkProofApi(): void {
  if (networkProofApiInstalled || typeof window === "undefined") return;
  if (!isIosSfxSrcDebugEnabled()) return;

  networkProofApiInstalled = true;
  const api = {
  probe(kind: IosSfxTargetKind) {
      return probeIosSfxNetworkAsset(resolveBarSfxSrc(kind), kind, {
        force: true,
      });
    },
    probeUrl(url: string) {
      return probeIosSfxNetworkAsset(url, undefined, { force: true });
    },
  };

  Object.assign(window as unknown as Record<string, unknown>, {
    __bartenIosSfxNet: api,
  });

  console.info("[ios-sfx-net] ready — try: await __bartenIosSfxNet.probe('door')");
}
