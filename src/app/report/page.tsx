"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_LABEL, ROUTES, FIELD_TEXTAREA } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader, cn } from "@/components/ondo-ui";


const REPORT_REASONS_KO = [
  "카카오톡 ID가 검색되지 않거나 존재하지 않아요",
  "상대방이 24시간 이상 응답하지 않아요",
  "불쾌하거나 무례한 언행을 사용했어요",
  "프로필 정보가 실제와 달라요 (허위 정보)",
  "기타 사유",
];

const REPORT_REASONS_JA = [
  "相手のカカオトークIDが検索できない・存在しません",
  "相手から24時間以上返信がありません",
  "不快または無礼な言動がありました",
  "プロフィール情報が実際と異なります（虚偽情報）",
  "その他の理由",
];

export default function ReportPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const reasons = isJa ? REPORT_REASONS_JA : REPORT_REASONS_KO;

  const [reasonIdx, setReasonIdx] = useState(0);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const chosenReason = REPORT_REASONS_KO[reasonIdx] || REPORT_REASONS_KO[0];
    const result = await submitSupportTicket({
      kind: "REPORT",
      reason: chosenReason,
      message: detail.trim() || "상세 내용 없음",
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setErrorMsg(
      result.error === "login_required"
        ? isJa
          ? "通報はカカオログイン後にご利用いただけます。"
          : "신고는 카카오 로그인 후에 할 수 있어요."
        : result.error === "rate_limited"
        ? isJa
          ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
          : "짧은 시간에 너무 많이 접수했어요. 잠시 후 다시 시도해 주세요."
        : isJa
        ? "送信に失敗しました。カカオトーク1:1相談室へご連絡ください。"
        : "접수에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader title={isJa ? "運営チームへ通報・申請" : "신고하기"} back />
      <div className="flex-1 space-y-6 px-5 py-6">
        {submitted ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-2xs">
            <p className="text-[18px] font-bold text-zinc-900">
              {isJa
                ? "通報・返金申請が受付されました"
                : "신고가 정상적으로 접수되었어요"}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              {isJa
                ? "運営チームが24時間以内に内容を確認し、お相手側の事由（カカオトークID検索不可・無응答など）と確認された場合、使用したコーヒーチケットを100%返還いたします。"
                : "운영팀이 24시간 내에 관리자 콘솔에서 내용을 확인하며, 상대방 귀책 사유(카카오톡 ID 미검색·무응답 등)로 확인될 경우 사용한 커피티켓을 100% 환불해 드립니다."}
            </p>
            <Button
              size="lg"
              fullWidth
              variant="destructive"
              className="mt-6"
              onClick={() => router.push(ROUTES.HOME)}
            >
              {isJa ? "ホームへ戻る" : "홈으로 돌아가기"}
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "通報・申請の理由を選択" : "신고 사유 선택"}
              </label>
              <div className="space-y-2">
                {reasons.map((r, idx) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReasonIdx(idx)}
                    className={cn(
                      "flex w-full items-center rounded-2xl border-[1.5px] px-4 py-3.5 text-left text-[14px] font-medium transition-all",
                      reasonIdx === idx
                        ? "border-rose-600 bg-rose-50 text-rose-700 font-bold"
                        : "border-stone-200 bg-white text-zinc-700"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "詳細内容（相手のニックネーム等）" : "상세 내용 (상대방 닉네임 및 상황)"}
              </label>
              <textarea
                className={cn(FIELD_TEXTAREA, "h-32")}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={
                  isJa
                    ? "状況を詳しくご記入いただくと、迅速な確認およびチケット返還処理に役立ちます。"
                    : "상황을 자세히 적어주시면 운영팀의 빠른 확인과 커피티켓 100% 환불 처리에 도움이 됩니다."
                }
              />
            </div>

            {errorMsg && (
              <p className="text-[12px] font-semibold text-rose-600">
                {errorMsg}
              </p>
            )}

            <Button
              size="lg"
              fullWidth
              loading={submitting}
              variant="destructive"
              onClick={handleSubmitReport}
            >
              {isJa ? "通報・返金申請を送信する" : "신고 접수하기"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
