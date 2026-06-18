import type { NextConfig } from "next";

/**
 * LAN IP は .env.local の LOCAL_LAN_IP で管理する。
 * IP が変わったら .env.local の値を更新するだけでよい（このファイルは触らない）。
 * dev / production 環境（Vercel）では LOCAL_LAN_IP を設定しないので空になる。
 */
const lanIp = process.env.LOCAL_LAN_IP;

const nextConfig: NextConfig = {
  ...(lanIp ? { allowedDevOrigins: [lanIp] } : {}),
};

export default nextConfig;
