"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/home-screen";
import LandingPage from "@/components/landing-screen";
import { ROUTES, isSampleUid } from "@/lib/ondo-constants";
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
import { Spinner } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

export default function RootPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const oauthHandledRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Purge any legacy v1/v2 demo or stale local sessions
        window.localStorage.removeItem("ondo_campus_state_v1");
        window.localStorage.removeItem("ondo_campus_state_v2");

        // 1) 만약 카카오 OAuth가 루트(/?code=...)로 리다이렉트되었거나 방금 카카오 로그인 버튼을 눌러 돌아온 경우:
        //    기존 회원 여부를 즉시 조회하여 비회원이면 회원가입(/join) 페이지로 바로 연결합니다.
        const params = new URLSearchParams(window.location.search);
        const oauthCode = params.get("code");
        const hadOAuthAttempt = consumeOAuthLoginAttempt();

        if (!oauthHandledRef.current && (oauthCode || hadOAuthAttempt)) {
          oauthHandledRef.current = true;
          let session = (await supabase.auth.getSession()).data.session;
          if (!session && oauthCode) {
            try {
              const exchanged =
                await supabase.auth.exchangeCodeForSession(oauthCode);
              if (exchanged.data?.session) {
                session = exchanged.data.session;
              }
            } catch {
              // detectSessionInUrl이 이미 교환 중일 수 있으므로 아래 재시도로 이어짐
            }
          }
          for (let i = 0; i < 6 && !session; i++) {
            await new Promise((r) => setTimeout(r, 300));
            session = (await supabase.auth.getSession()).data.session;
          }

          if (oauthCode) {
            try {
              window.history.replaceState({}, "", window.location.pathname);
            } catch {
              // ignore
            }
          }

          if (session) {
            const nextPath = consumeAuthNextPath();
            let member = await fetchMyMemberSecure();
            if (member && isStaleAutoCreatedMember(member)) {
              await purgeStaleMemberRow(member);
              member = null;
            }
            if (nextPath && nextPath.startsWith(ROUTES.JOIN)) {
              router.replace(nextPath);
              return;
            }
            if (isCompletedMember(member)) {
              persistMemberSession(member);
              setIsLoggedIn(true);
              setChecked(true);
              return;
            }
            router.replace(`${ROUTES.JOIN}?from=login`);
            return;
          }
        }

        // ?landing=1 로 접속하면 로그인 상태여도 첫 소개 화면(LandingPage) 미리보기 허용
        if (params.get("landing") === "1") {
          setIsLoggedIn(false);
          setChecked(true);
          return;
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setIsLoggedIn(false);
          setChecked(true);
          return;
        }
        const parsed = JSON.parse(raw);
        if (
          parsed?.isLoggedIn === true &&
          parsed?.user?.uid &&
          !isSampleUid(parsed.user.uid) &&
          parsed.user.uid !== "guest-preview" &&
          parsed?.user?.selfRegisteredV2 === true
        ) {
          setIsLoggedIn(true);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
      setChecked(true);
    };

    checkAuth();
    window.addEventListener("ondo-auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("ondo-auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <Spinner className="h-6 w-6 text-zinc-900" />
      </div>
    );
  }

  return isLoggedIn ? <HomePage /> : <LandingPage />;
}
