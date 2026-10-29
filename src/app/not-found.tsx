"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ondo-ui";
import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

// 예전 주소(/signup/basic 등)로 들어온 경우 가입 화면을 먼저 안내
function useCameFromOldSignupLink(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => window.location.pathname.includes("/signup"),
    () => false
  );
}

export default function NotFound() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const fromSignup = useCameFromOldSignupLink();

  const homeLink = (
    <Link
      href={ROUTES.HOME}
      className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-900 text-[15px] font-bold text-white transition-colors hover:bg-zinc-800"
    >
      {isJa ? "ONDO 36.5° ホームへ" : "온도 홈으로 가기"}
    </Link>
  );
  const joinLink = (
    <Link
      href={ROUTES.JOIN}
      className={
        fromSignup
          ? "flex h-12 w-full items-center justify-center rounded-2xl bg-rose-600 text-[15px] font-bold text-white transition-colors hover:bg-rose-700"
          : "flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white text-[15px] font-bold text-zinc-800 transition-colors hover:bg-stone-50"
      }
    >
      {isJa ? "新規登録へ" : "회원가입하러 가기"}
    </Link>
  );

  return (
    <main className="flex min-h-dvh flex-col bg-[#FAF9F6]">
      <header className="flex h-14 items-center justify-between px-5">
        <span className="text-[15px] font-extrabold tracking-tight text-zinc-900">
          ONDO 36.5°
        </span>
        <LanguageToggle />
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="text-[44px] leading-none">🌡️</p>
        <p className="mt-4 text-[13px] font-bold tracking-widest text-rose-600">
          404
        </p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug text-zinc-900">
          {isJa ? "ページが見つかりません" : "페이지를 찾을 수 없어요"}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">
          {isJa
            ? "アドレスが変更されたか、削除されたページです。下のボタンから続けてご利用ください。"
            : "주소가 바뀌었거나 없어진 페이지예요. 아래 버튼으로 이어서 이용해 주세요."}
        </p>

        <div className="mt-8 flex w-full flex-col gap-2.5">
          {fromSignup ? (
            <>
              {joinLink}
              {homeLink}
            </>
          ) : (
            <>
              {homeLink}
              {joinLink}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
