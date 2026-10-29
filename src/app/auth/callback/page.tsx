"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  consumeAuthNextPath,
  consumeOAuthLoginAttempt,
  fetchMyMemberSecure,
  isCompletedMember,
  isStaleAutoCreatedMember,
  persistMemberSession,
  purgeStaleMemberRow,
  supabase,
} from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [failed, setFailed] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const finish = async () => {
      // detectSessionInUrl(PKCE)이 ?code= 를 세션으로 교환할 때까지 최대 3초 대기
      let session = (await supabase.auth.getSession()).data.session;

      if (!session && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          try {
            const exchanged = await supabase.auth.exchangeCodeForSession(code);
            if (exchanged.data?.session) {
              session = exchanged.data.session;
            }
          } catch {
            // detectSessionInUrl이 이미 교환 중일 수 있으므로 아래 재시도로 이어짐
          }
        }
      }

      for (let i = 0; i < 8 && !session; i++) {
        await new Promise((r) => setTimeout(r, 350));
        session = (await supabase.auth.getSession()).data.session;
      }

      if (!session) {
        setFailed(true);
        return;
      }
      consumeOAuthLoginAttempt();
      const nextPath = consumeAuthNextPath();
      let member = await fetchMyMemberSecure();

      // 본인이 직접 작성·학교인증하지 않은 구버전 자동 생성 행은 즉시 초기화하고 회원가입 페이지로 안내
      if (member && isStaleAutoCreatedMember(member)) {
        await purgeStaleMemberRow(member);
        member = null;
      }

      // 사용자가 명시적으로 [회원가입] 버튼을 눌러 들어온 경우 항상 회원가입 페이지로 이동
      if (nextPath && nextPath.startsWith(ROUTES.JOIN)) {
        router.replace(nextPath);
        return;
      }

      if (isCompletedMember(member)) {
        persistMemberSession(member);
        router.replace(nextPath || "/");
        return;
      }
      // 카카오 로그인은 됐지만 아직 정식 가입 완료된 기존 회원이 아닌 경우 → 회원가입 페이지로 안내
      router.replace(`${ROUTES.JOIN}?from=login`);
    };
    finish().catch(() => setFailed(true));
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FAF9F6] px-6 text-center">
      {failed ? (
        <>
          <p className="text-[14px] font-bold text-zinc-800">
            {isJa
              ? "カカオログインに失敗しました。もう一度お試しください。"
              : "카카오 로그인에 실패했어요. 다시 시도해 주세요."}
          </p>
          <button
            type="button"
            onClick={() => router.replace(ROUTES.LOGIN)}
            className="rounded-2xl bg-zinc-900 px-5 py-2.5 text-[13px] font-bold text-white"
          >
            {isJa ? "ログイン画面へ" : "로그인 화면으로"}
          </button>
        </>
      ) : (
        <p className="text-[13px] font-semibold text-zinc-500">
          {isJa ? "カカオログイン確認中…" : "카카오 로그인 확인 중…"}
        </p>
      )}
    </div>
  );
}
