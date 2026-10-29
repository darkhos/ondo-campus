import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ONDO 36.5°（温度）— 学生認証済みの大学生・日本人留学生 1:1 ブラインド紹介",
  description:
    "ソウル・京畿・仁川エリアの韓国大学生＆日本人留学生（語学堂・正規/交換留学生）専用 1:1 ブラインド紹介。お互いに承認したらチャットから始まり、話が合えばカカオトークを交換できます。",
  openGraph: {
    title: "ONDO 36.5°（温度）— 大学生・日本人留学生 1:1 ブラインド紹介",
    description:
      "友達が紹介してくれるように、気の合う大学生とマッチング。お互いに承認したら会話からスタート、話が合えばカカオトーク交換。",
    url: "https://darkhos.github.io/ondo-campus/jp/",
    siteName: "ONDO 36.5°（温度）",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "https://darkhos.github.io/ondo-campus/ondo-kakao-profile.jpg",
        width: 1024,
        height: 1024,
        alt: "ONDO 36.5° OFFICIAL SUPPORT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONDO 36.5°（温度）— 大学生・日本人留学生 1:1 ブラインド紹介",
    description:
      "学生認証済みの韓国大学生＆日本人留学生（語学堂・大学）専用 1:1 ブラインド紹介",
    images: ["https://darkhos.github.io/ondo-campus/ondo-kakao-profile.jpg"],
  },
};

export default function JapaneseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
