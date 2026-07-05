import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  shipporiMincho,
  zenOldMinchoBold,
} from "@/lib/fonts/jp-brand-fonts";
import { BehaviorLogInit } from "@/components/app/behavior-log-init";
import { AudioVolumeRouteTestPanel } from "@/components/app/audio-volume-route-test-panel";
import { BisectFeatureFlagPanel } from "@/components/app/bisect-feature-flag-panel";
import { LayoutShell } from "@/components/app/layout-shell";
import { ServiceWorkerRegister } from "@/components/app/service-worker-register";
import { IosSafariVisualHeightSync } from "@/components/app/ios-safari-visual-height-sync";
import { isLayoutAppShellEnabledServer } from "@/lib/layout/layout-feature-flags";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "バーテン日記",
  description: "深夜のバーで、夜の記録を残す",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "バーテン日記",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverAppShellEnabled = isLayoutAppShellEnabledServer();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${zenOldMinchoBold.variable} ${shipporiMincho.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-200">
        <IosSafariVisualHeightSync />
        <ServiceWorkerRegister />
        <BehaviorLogInit />
        <LayoutShell serverAppShellEnabled={serverAppShellEnabled}>
          {children}
        </LayoutShell>
        <Analytics />
        <BisectFeatureFlagPanel />
        <AudioVolumeRouteTestPanel />
      </body>
    </html>
  );
}
