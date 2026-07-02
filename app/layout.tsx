import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  shipporiMincho,
  zenOldMinchoBold,
} from "@/lib/fonts/jp-brand-fonts";
import { LayoutFeatureFlagPanel } from "@/components/app/layout-feature-flag-panel";
import {
  LayoutShell,
  readServerLayoutShellEnabled,
} from "@/components/app/layout-shell";
import { IosSafariVisualHeightSync } from "@/components/app/ios-safari-visual-height-sync";
import { buildIosSafariVisualHeightBootstrapScript } from "@/lib/layout/ios-safari-visual-height";
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
  const iosBootstrapScript = buildIosSafariVisualHeightBootstrapScript();
  const serverAppShellEnabled = readServerLayoutShellEnabled();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${zenOldMinchoBold.variable} ${shipporiMincho.variable} h-full antialiased`}
    >
      <head>
        {iosBootstrapScript ? (
          <script
            dangerouslySetInnerHTML={{
              __html: iosBootstrapScript,
            }}
          />
        ) : null}
        {/* Service Worker — production のみ（Preview/dev では JS チャンク競合を避ける） */}
        {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-200">
        <IosSafariVisualHeightSync />
        <LayoutShell serverAppShellEnabled={serverAppShellEnabled}>
          {children}
        </LayoutShell>
        <LayoutFeatureFlagPanel />
      </body>
    </html>
  );
}
