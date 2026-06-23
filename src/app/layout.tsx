import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import { AppUiProvider } from "@/components/providers/app-ui-provider";
import "./globals.css";

const notoSans = Noto_Sans_TC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export const metadata: Metadata = {
  title: "星鑽 XS 匹克球 · DUPR 賽事管理",
  description: "星鑽 XS 專業匹克球 DUPR 賽事排程 · 即時計分 · CSV 匯出",
  icons: {
    icon: "/images/xs-club-logo.png",
    apple: "/images/xs-club-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-clip bg-page text-foreground antialiased">
        <AppUiProvider>{children}</AppUiProvider>
      </body>
    </html>
  );
}
