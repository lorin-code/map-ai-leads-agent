import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "AI 线索助手",
    template: "%s | AI 线索助手",
  },
  description: "输入城市、区域和行业，查找线索并下载结果。",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    siteName: "AI 线索助手",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
