import type { Metadata, Viewport } from "next";
import { SecurityShield } from "@/components/security-shield";
import "./globals.css";

export const metadata: Metadata = {
  title: "온도 (ONDO 36.5°) — 학생 인증한 대학생끼리 하는 1:1 블라인드 소개팅",
  description:
    "서울·경기·인천권 대학생 & 일본인 유학생·어학당생 전용 1:1 블라인드 소개팅. 학생 인증을 마친 사람끼리 서로 수락하면 대화부터 시작하고, 말이 통하면 카카오톡을 교환해요.",
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    title: "온도 (ONDO 36.5°) — 대학생 1:1 블라인드 소개팅",
    description:
      "친구가 주선해 주듯, 결 맞는 대학생과 소개팅. 서로 수락하면 대화부터, 말이 통하면 카톡 교환.",
    url: "https://darkhos.github.io/ondo-campus/",
    siteName: "ONDO 36.5° (온도)",
    locale: "ko_KR",
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
    title: "온도 (ONDO 36.5°) — 대학생 1:1 블라인드 소개팅",
    description:
      "학생 인증한 서울·수도권 대학생 & 일본인 유학생 전용 1:1 블라인드 소개팅",
    images: ["https://darkhos.github.io/ondo-campus/ondo-kakao-profile.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full bg-[#FAF9F6] text-zinc-900 antialiased selection:bg-rose-500 selection:text-white">
        <SecurityShield />
        {children}
      </body>
    </html>
  );
}
