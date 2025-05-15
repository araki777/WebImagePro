import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // グローバルCSSを適用

// GoogleFontsGeist Sansフォントを設定
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// GoogleFontsのGeist Monoフォントを設定
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// メタデータ(SEO用)
export const metadata: Metadata = {
  title: "WebImagePro",
  description: "画像編集ツール",
  keywords: ["画像編集", "画像処理", "Webアプリ"],
  authors: [{ name: "araki777" }],
  openGraph: {
    title: "WebImagePro",
    description: "画像編集ツール",
    type: "website",
  },
};

// ビューポート設定
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  minimumScale: 1,
  height: "device-height",
};

// ルートレイアウトコンポーネント
export default function RootLayout({
  children, // 子コンポーネント
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          href="/webimagepro.png"
          sizes="512x512"
        />
      </head>
      <body
        suppressHydrationWarning // ハイドレーションエラーを抑制
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} // フォント適用 & アンチエイリアス
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Toaster richColors />
            <div className="flex-grow">
              {children} {/* 各ページのコンテンツをレンダリング */}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
