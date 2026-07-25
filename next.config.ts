import type { NextConfig } from "next";

/**
 * LAN IP は .env.local の LOCAL_LAN_IP で管理する。
 * IP が変わったら .env.local の値を更新するだけでよい（このファイルは触らない）。
 * dev / production 環境（Vercel）では LOCAL_LAN_IP を設定しないので空になる。
 */
const lanIp = process.env.LOCAL_LAN_IP;

/**
 * 最小限のセキュリティヘッダ。
 * CSP / Permissions-Policy は演出・録音への影響が大きいため入れていない。
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  ...(lanIp ? { allowedDevOrigins: [lanIp] } : {}),
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
