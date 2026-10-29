"use client";

import React, { useState } from "react";
import { Check, Coffee, Copy, Gift } from "lucide-react";
import { FIELD_INPUT } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  parseJsonObject,
  useInitialSearch,
  useLocalStorageItem,
} from "@/lib/use-browser-storage";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

export default function InvitePage() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const storedUid = (
    parseJsonObject(useLocalStorageItem(STORAGE_KEY))?.user as
      | { uid?: unknown }
      | undefined
  )?.uid;
  const myCode = storedUid
    ? `ONDO-${String(storedUid).replace(/^u-/, "").slice(0, 8).toUpperCase()}`
    : "ONDO365";
  const urlRef = new URLSearchParams(useInitialSearch()).get("ref")?.trim() ?? "";
  const savedRef = useLocalStorageItem("ondo_invited_by_code") ?? "";
  const suggestedFriendCode = (
    urlRef.length >= 4 ? urlRef : savedRef.length >= 4 ? savedRef : ""
  ).toUpperCase();
  const [copied, setCopied] = useState(false);
  // 직접 입력하기 전에는 초대 링크(?ref=)나 저장된 코드를 보여 줌
  const [typedFriendCode, setFriendCode] = useState<string | null>(null);
  const friendCode = typedFriendCode ?? suggestedFriendCode;
  const [redeemed, setRedeemed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://darkhos.github.io/ondo-campus/?ref=${myCode}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRedeem = async () => {
    if (friendCode.trim().length < 4) {
      setToast(
        isJa
          ? "友達招待コードを4文字以上入力してください。"
          : "친구 초대 코드를 4자 이상 입력해 주세요."
      );
      setTimeout(() => setToast(null), 2400);
      return;
    }
    const result = await submitSupportTicket({
      kind: "INVITE",
      reason: friendCode.trim(),
      message: `친구 초대코드 등록: ${friendCode.trim()}`,
    });
    if (!result.ok) {
      setToast(
        result.error === "login_required"
          ? isJa
            ? "招待コードの登録はカカオログイン後にご利用いただけます。"
            : "초대코드 등록은 카카오 로그인 후에 할 수 있어요."
          : result.error === "rate_limited"
          ? isJa
            ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
            : "짧은 시간에 너무 많이 등록했어요. 잠시 후 다시 시도해 주세요."
          : isJa
          ? "登録に失敗しました。カカオトーク1:1相談室へご連絡ください。"
          : "등록에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
      );
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setRedeemed(true);
    setToast(
      isJa
        ? "招待コードが登録されました！お友達の学校認証完了時にコーヒーチケット1枚が付与されます。"
        : "초대 코드가 등록되었습니다! 친구의 재학 인증 완료 시 커피티켓 1장이 지급됩니다."
    );
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "キャンパスの友達を招待" : "캠퍼스 친구 초대"}
        back
      />

      <div className="flex-1 space-y-6 px-5 py-6">
        <section className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-600 shadow-xs">
            <Gift className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-[21px] font-black tracking-tight text-zinc-900">
            {isJa ? (
              <>
                お友達を招待すると
                <br />
                <span className="text-rose-600">
                  お互いにコーヒーチケット1枚プレゼント
                </span>
              </>
            ) : (
              <>
                학우를 초대하면
                <br />
                <span className="text-rose-600">
                  친구도 나도 커피티켓 1장
                </span>
              </>
            )}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {isJa ? (
              <>
                友達があなたの招待コードで登録し、学生証認証を完了すると
                <br />
                お二人ともにエスクロー・コーヒーチケット1枚(☕)を差し上げます。
              </>
            ) : (
              <>
                친구가 내 초대 코드로 가입하고 캠퍼스 인증을 완료하면
                <br />두 분 모두에게 에스크로 커피티켓 1장(☕)을 드려요.
              </>
            )}
          </p>
        </section>

        {/* 내 초대 코드 */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-[12px] font-bold text-zinc-400">
            {isJa ? "私の招待コード" : "내 초대 코드"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-[#FAF9F6] px-4 py-3.5 ring-1 ring-stone-200">
            <span className="font-mono text-[18px] font-black tracking-wider text-zinc-900">
              {myCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-rose-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {isJa ? "コピー済み" : "복사됨"}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {isJa ? "招待リンクをコピー" : "초대 링크 복사"}
                </>
              )}
            </button>
          </div>
        </section>

        {/* 초대 코드 입력 */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-[14px] font-bold text-zinc-900">
            {isJa
              ? "友達から受け取った招待コードはありますか？"
              : "친구에게 받은 초대 코드가 있나요?"}
          </p>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {isJa
              ? "招待コードを登録すると、確認後にコーヒーチケット1枚(☕)が付与されます。"
              : "초대 코드를 등록하면 운영자 확인 후 커피티켓 1장(☕)이 지급됩니다."}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              className={FIELD_INPUT}
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder={
                isJa
                  ? "招待コードを入力 (例: ONDO-01)"
                  : "초대 코드 입력 (예: ONDO-01)"
              }
              disabled={redeemed}
            />
            <Button
              size="lg"
              variant="destructive"
              className="shrink-0"
              disabled={redeemed}
              onClick={handleRedeem}
            >
              {redeemed
                ? isJa
                  ? "登録完了"
                  : "등록 완료"
                : isJa
                ? "コード登録"
                : "코드 등록"}
            </Button>
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 mx-auto max-w-sm px-5">
          <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
