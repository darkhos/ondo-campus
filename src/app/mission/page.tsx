"use client";

import React, { useState } from "react";
import { Check, Copy, ImagePlus, Megaphone } from "lucide-react";
import { CAMPUS_POST_TEMPLATES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader, cn } from "@/components/ondo-ui";


export default function CampusMissionPage() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [selectedKey, setSelectedKey] = useState<string>(
    CAMPUS_POST_TEMPLATES[0].key
  );
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentTemplate =
    CAMPUS_POST_TEMPLATES.find((t) => t.key === selectedKey) ??
    CAMPUS_POST_TEMPLATES[0];

  const templateBody = isJa ? currentTemplate.bodyJa : currentTemplate.body;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(templateBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmitProof = async () => {
    setErrorMsg(null);
    const result = await submitSupportTicket({
      kind: "PROMO",
      message: `캠퍼스 앰배서더 공유 미션 신청: ${postUrl.trim() || "커뮤니티/SNS 공유 완료"}`,
    });
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setErrorMsg(
      result.error === "login_required"
        ? isJa
          ? "ミッション認証の申請はカカオログイン後にご利用いただけます。"
          : "미션 신청은 카카오 로그인 후에 할 수 있어요."
        : result.error === "rate_limited"
        ? isJa
          ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
          : "짧은 시간에 너무 많이 신청했어요. 잠시 후 다시 시도해 주세요."
        : isJa
        ? "申請に失敗しました。カカオトーク1:1相談室へご連絡ください。"
        : "신청에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "ONDO 36.5° キャンパス・アンバサダー" : "ONDO 36.5° 캠퍼스 앰배서더 미션"}
        back
      />

      <div className="flex-1 space-y-6 px-5 py-6">
        <section className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-xs">
            <Megaphone className="h-5 w-5" strokeWidth={2} />
          </div>
          <h2 className="mt-3.5 text-[21px] font-black tracking-tight text-zinc-900">
            {isJa ? (
              <>
                日韓キャンパス・ラウンジをシェアして
                <br />
                <span className="text-rose-600">
                  エスクロー・コーヒーチケット1枚(☕)獲得
                </span>
              </>
            ) : (
              <>
                캠퍼스 커뮤니티·SNS에 라운지를 알리고
                <br />
                <span className="text-rose-600">에스크로 커피티켓 1장(☕) 받기</span>
              </>
            )}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
            {isJa
              ? "下のテーマ別紹介カードから1つを選んで大学コミュニティやSNSにシェアし、申請を送ると運営チーム確認後にコーヒーチケット1枚が付与されます。"
              : "아래 테마별 라운지 소개글 중 하나를 골라 교내 커뮤니티나 SNS에 공유한 뒤 알려주시면 운영팀 확인 후 에스크로 커피티켓 1장을 지급해 드립니다."}
          </p>
        </section>

        {/* 3 Copy Templates */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-zinc-900">
              {isJa
                ? "1. 紹介文を選択＆コピー"
                : "1. 마음에 드는 문구 선택 & 복사"}
            </h3>
            <div className="flex gap-1.5">
              {CAMPUS_POST_TEMPLATES.map((tpl) => {
                const active = tpl.key === selectedKey;
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => setSelectedKey(tpl.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
                      active
                        ? "bg-rose-600 text-white"
                        : "bg-stone-200/70 text-zinc-600 hover:bg-stone-200"
                    )}
                  >
                    {isJa ? tpl.labelJa : tpl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-3xl border border-stone-200 bg-white p-4">
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-zinc-700">
              {templateBody}
            </pre>
            <Button
              variant="secondary"
              fullWidth
              size="md"
              className={cn(
                "mt-4 transition-colors duration-300",
                copied && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="ondo-check-pop h-4 w-4 text-emerald-600" strokeWidth={3} />
                  {isJa
                    ? "クリップボードにコピーされました！"
                    : "문구가 클립보드에 복사되었어요!"}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {isJa
                    ? `「${currentTemplate.labelJa}」の紹介文をコピー`
                    : `${currentTemplate.label} 문구 복사하기`}
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Proof Submission */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h3 className="text-[14px] font-bold text-zinc-900">
            {isJa
              ? "2. 投稿した掲示板名またはタイトルを入力"
              : "2. 업로드한 게시판명 또는 글 제목 입력"}
          </h3>
          <p className="mt-1 text-[12px] text-zinc-500">
            {isJa
              ? "送信すると運営チームの管理画面(/admin)に通知が届き、確認後すぐにコーヒーチケット1枚が付与されます。"
              : "제출하시면 운영자 페이지(/admin)로 알림이 전달되어 확인 즉시 커피티켓 1장을 지급해 드립니다."}
          </p>

          <div className="mt-3 space-y-3">
            {submitted ? (
              <div className="ondo-pop-box rounded-2xl bg-rose-50 p-5 text-center">
                <p className="text-[15px] font-bold text-rose-700">
                  {isJa
                    ? "🎉 紹介認証申請が受付されました！"
                    : "🎉 홍보 인증 신청이 접수되었어요!"}
                </p>
                <p className="mt-1 text-[12px] text-zinc-600">
                  {isJa
                    ? "運営チームが確認後、あなたのアカウントへコーヒーチケット1枚を即時付与いたします。"
                    : "운영팀이 확인 후 회원님의 계정으로 커피티켓 1장을 즉시 지급해 드립니다."}
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder={
                    isJa
                      ? "例: 延世大コミュニティ / Instagramストーリーにシェア完了"
                      : "예: 연세대 캠퍼스 게시판 / 인스타그램 스토리 공유 완료"
                  }
                  className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 text-[13px] font-medium text-zinc-900 outline-none focus:border-rose-500"
                />
                {errorMsg && (
                  <p className="text-[12px] font-semibold text-rose-600">
                    {errorMsg}
                  </p>
                )}
                <Button
                  fullWidth
                  size="lg"
                  variant="destructive"
                  onClick={handleSubmitProof}
                >
                  <ImagePlus className="h-4 w-4" />
                  {isJa
                    ? "認証申請してコーヒーチケット1枚を受け取る"
                    : "홍보 인증 신청하고 커피티켓 1장 받기"}
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
