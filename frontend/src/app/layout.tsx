import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Viral AI | SNSマルチ展開支援",
  description:
    "動画を1本アップロードするだけで、バズる切り抜き候補・Xスレッド・SEOブログ記事をAIが自動生成。コンテンツクリエイターの生産性を10倍にする。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
