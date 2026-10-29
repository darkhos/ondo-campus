"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import {
  KAKAO_OPENCHAT_URL,
  ROUTES,
} from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  fetchMyMemberSecure,
  getAuthUserId,
  isCompletedMember,
  isStaleAutoCreatedMember,
  persistMemberSession,
  purgeStaleMemberRow,
  signInWithKakao,
} from "@/lib/supabase";
import { Button, PageHeader } from "@/components/ondo-ui";

export default function LoginPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const authUid = await getAuthUserId();
      if (authUid) {
        let member = await fetchMyMemberSecure();
        if (member && isStaleAutoCreatedMember(member)) {
          await purgeStaleMemberRow(member);
          member = null;
        }
        if (isCompletedMember(member)) {
          persistMemberSession(member);
          router.push(ROUTES.HOME);
          return;
        }
        if (await getAuthUserId()) {
          router.push(`${ROUTES.JOIN}?from=login`);
          return;
        }
      }
      await signInWithKakao();
    } catch {
      setLoading(false);
      setErrorMsg(
        isJa
          ? "一時的なネットワークエラーが発生しました。"
          : "일시적인 네트워크 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "ONDO 36.5° 1秒かんたんログイン" : "ONDO 36.5° 1초 간편 로그인"}
        back
      />

      <div className="flex flex-1 flex-col justify-between px-5 py-6">
        <div className="space-y-5">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[12px] font-bold text-rose-700">
              <ShieldCheck className="h-3 w-3" />
              {isJa
                ? "カカオ本人確認で安全にログイン"
                : "카카오 본인 확인으로 안전하게 로그인"}
            </span>
            <h2 className="mt-2 text-[22px] font-black tracking-tight text-zinc-900">
              {isJa ? (
                <>
                  カカオアカウントで
                  <br />
                  ラウンジへ入場
                </>
              ) : (
                <>
                  카카오 계정으로
                  <br />
                  바로 입장하세요
                </>
              )}
            </h2>
            <p className="mt-1.5 text-[13px] text-zinc-500">
              {isJa
                ? "カカオログインで本人だけが自分のアカウントに入れます。"
                : "카카오 로그인을 해야만 내 계정에 들어갈 수 있어요. 다른 사람은 내 정보를 볼 수 없어요."}
            </p>
          </div>

          <div className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-2xs">
            {errorMsg && (
              <p className="text-[12px] font-semibold text-rose-600">
                {errorMsg}
              </p>
            )}

            <Button
              size="lg"
              fullWidth
              loading={loading}
              variant="kakao"
              onClick={handleKakaoLogin}
            >
              {isJa ? "カカオでログイン" : "카카오로 로그인하기"}
            </Button>
          </div>
        </div>

        <div className="space-y-2.5 pt-6">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => router.push(ROUTES.JOIN)}
          >
            <Sparkles className="h-4 w-4 text-rose-600" />
            {isJa
              ? "初めての方はこちら（30秒かんたん新規登録）"
              : "처음 오셨나요? 30초 만에 간편 가입하기"}
          </Button>

          <a
            href={KAKAO_OPENCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#FEE500]/90 py-2.5 text-[12px] font-extrabold text-zinc-900 transition-colors hover:bg-[#FEE500]"
          >
            <span>
              {isJa
                ? "💬 アカウントが見つからない場合はカカオ1:1顧客センターへ"
                : "💬 계정을 못 찾으시겠나요? 공식 카카오톡 1:1 고객센터 문의"}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
