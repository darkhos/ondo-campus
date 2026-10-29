"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Megaphone, Send, ShieldCheck, Users } from "lucide-react";
import { BETA_UNLIMITED_TICKETS, INITIAL_USER_PROFILE, ROUTES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { parseJsonObject, useLocalStorageItem } from "@/lib/use-browser-storage";
import { fetchMyMemberSecure, submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader, RollingNumber, cn } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

const TICKET_PACKAGES = [
  {
    id: "pkg-1",
    tickets: 1,
    points: 2900,
    originalPrice: 2900,
    price: 2900,
    label: "커피티켓 1장 (에스크로 보증)",
    labelJa: "コーヒーチケット 1枚（エスクロー保証）",
    subLabel: "장당 2,900원 · 단건 체험용",
    subLabelJa: "1枚あたり 2,900ウォン・単発体験用",
    badge: null,
    badgeJa: null,
  },
  {
    id: "pkg-2",
    tickets: 2,
    points: 5800,
    originalPrice: 5800,
    price: 3900,
    label: "커피티켓 2장 패키지",
    labelJa: "コーヒーチケット 2枚パッケージ",
    subLabel: "장당 1,950원 · +1,000원에 1장 더!",
    subLabelJa: "1枚あたり 1,950ウォン・+1,000ウォンでもう1枚！",
    badge: "33% 할인",
    badgeJa: "33% OFF",
  },
  {
    id: "pkg-3",
    tickets: 4,
    points: 11600,
    originalPrice: 11600,
    price: 6500,
    label: "커피티켓 4장 학기 패스",
    labelJa: "コーヒーチケット 4枚 学期パス",
    subLabel: "장당 1,625원 · 총 5,100원 즉시 할인",
    subLabelJa: "1枚あたり 1,625ウォン・合計5,100ウォン割引",
    badge: "BEST · 44% 파격할인",
    badgeJa: "BEST · 44% OFF",
  },
];

export default function PointsPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const storedSession = parseJsonObject(useLocalStorageItem(STORAGE_KEY));
  const storedUser = storedSession?.user as
    | { gender?: unknown; points?: unknown }
    | undefined;
  const [serverGender, setServerGender] = useState<"FEMALE" | "MALE" | null>(null);
  const [serverPoints, setServerPoints] = useState<number | null>(null);
  const gender: "FEMALE" | "MALE" =
    serverGender ??
    (storedUser?.gender === "MALE" || storedUser?.gender === "FEMALE"
      ? storedUser.gender
      : "MALE");
  const points =
    serverPoints ??
    (typeof storedUser?.points === "number"
      ? storedUser.points
      : INITIAL_USER_PROFILE.points);
  const [selectedPkg, setSelectedPkg] = useState(TICKET_PACKAGES[1]);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const kakaoId =
    typeof storedSession?.kakaoId === "string" ? storedSession.kakaoId : "";
  const [requesting, setRequesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchMyMemberSecure().then((data) => {
      if (data && typeof data.tickets === "number") {
        setServerPoints(data.tickets * 2900);
      }
      if (data?.gender === "M" || data?.gender === "MALE") {
        setServerGender("MALE");
      } else if (data?.gender === "F" || data?.gender === "FEMALE") {
        setServerGender("FEMALE");
      }
    });
  }, []);

  const ticketCount = Math.max(0, Math.floor(points / 2900));

  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // PG 가맹점 계약 전까지는 "충전 신청 → 운영자 입금 확인 → 티켓 지급" 방식
  const handleRequestTopup = async () => {
    if (!agreeTerms) {
      showToast(
        isJa
          ? "利用規約および返金規定に同意してください。"
          : "이용약관 및 환불 규정에 동의해 주세요.",
        2400
      );
      return;
    }
    setRequesting(true);
    const result = await submitSupportTicket({
      kind: "TOPUP",
      reason: selectedPkg.id,
      message: `${selectedPkg.label} 충전 신청 (${selectedPkg.price.toLocaleString("ko-KR")}원)`,
      replyContact: kakaoId,
    });
    setRequesting(false);
    if (result.ok) {
      showToast(
        isJa
          ? "チャージ申請を受け付けました！運営チームがカカオトークでお支払い方法をご案内し、入金確認後にチケットを付与します。"
          : "충전 신청이 접수됐어요! 운영팀이 카카오톡으로 결제 방법을 안내하고, 입금 확인 후 티켓을 지급해 드려요.",
        4500
      );
      return;
    }
    showToast(
      result.error === "login_required"
        ? isJa
          ? "チャージ申請はカカオログイン後にご利用いただけます。"
          : "충전 신청은 카카오 로그인 후에 할 수 있어요."
        : result.error === "rate_limited"
        ? isJa
          ? "短時間に申請が多すぎます。しばらくしてから再度お試しください。"
          : "짧은 시간에 너무 많이 신청했어요. 잠시 후 다시 시도해 주세요."
        : isJa
        ? "申請に失敗しました。カカオトーク1:1相談室へご連絡ください。"
        : "신청에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={
          isJa
            ? gender === "FEMALE"
              ? "コーヒーチケット案内（女性無料優待）"
              : "コーヒーチケット・ストア"
            : gender === "FEMALE"
            ? "커피티켓 안내 (여성 우대)"
            : "커피티켓 충전 스토어"
        }
        back
      />

      <div className="flex-1 space-y-6 px-5 py-5">
        {/* Balance Card */}
        <section className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-rose-700">
              {isJa
                ? "保有エスクロー・コーヒーチケット"
                : "보유 에스크로 커피티켓"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold text-rose-600 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              {gender === "FEMALE"
                ? isJa
                  ? "女性無料優待適用中"
                  : "여성 학우 무료 우대 적용"
                : isJa
                ? "24h未返信時 100%自動返還"
                : "24h 무응답 100% 자동 반환"}
            </span>
          </div>
          <p className="mt-2 flex items-baseline gap-2 text-[32px] font-black tabular-nums tracking-tight text-zinc-900">
            <span>
              {BETA_UNLIMITED_TICKETS
                ? isJa ? "☕ 無制限" : "☕ 무제한"
                : isJa ? `☕ ${ticketCount}枚` : `☕ ${ticketCount}장`}
            </span>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
            {gender === "FEMALE"
              ? isJa
                ? "女性会員様は定時マッチングの24時間ブラインドチャットおよび安心連絡先（カカオトークID）交換が100%無料で提供されます。"
                : "여성 학우님은 정기 매칭의 24시간 블라인드 룸 대화 및 안심 연락처(카카오톡 ID) 확인이 100% 무료로 제공됩니다. 보유 티켓은 '오늘 한 명 더 만나보기'에 자유롭게 사용하실 수 있어요."
              : isJa
              ? "チャージしたコーヒーチケットは相手と実際に最初の会話が交わされた時のみ使用され、24時間未返信の場合は100%自動返還されます。"
              : "충전한 커피티켓은 상대방과 첫 대화가 실제로 오갔을 때만 차감되며, 미응답 시 100% 자동 반환됩니다."}
          </p>
        </section>

        {BETA_UNLIMITED_TICKETS ? (
          <section className="rounded-3xl border border-rose-100 bg-white p-5">
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
              {isJa ? "ベータオープン記念" : "베타 오픈 기념"}
            </span>
            <h2 className="mt-2 text-[17px] font-black text-zinc-900">
              {isJa
                ? "ベータ期間中はすべての会員がコーヒーチケット無制限です ☕"
                : "베타 기간에는 모든 회원이 커피티켓 무제한이에요 ☕"}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
              {isJa
                ? "チャージや決済なしで、マッチングを無料で承認できます。正式オープン前には事前にお知らせします。"
                : "충전이나 결제 없이 매칭을 무료로 수락할 수 있어요. 정식 오픈 전에는 미리 알려 드릴게요."}
            </p>
          </section>
        ) : gender === "FEMALE" ? (
          <section className="rounded-3xl border border-stone-200 bg-white p-5">
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
              {isJa
                ? "ONDO 36.5° キャンパス男女比バランス政策"
                : "ONDO 36.5° 캠퍼스 성비 균형 정책"}
            </span>
            <h2 className="mt-2 text-[17px] font-black text-zinc-900">
              {isJa ? (
                <>
                  女性会員様は有料決済なしで
                  <br />
                  すべてのマッチングと連絡先交換が無料です 🌸
                </>
              ) : (
                <>
                  여성 학우님은 별도 유료 결제 없이
                  <br />
                  모든 매칭과 연락처 교환이 무료입니다 🌸
                </>
              )}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
              {isJa
                ? "追加マッチングに使えるボーナス・コーヒーチケットは、下の友達招待ミッションでいつでも無料で受け取れます。"
                : "추가 매칭(오늘 한 명 더 만나보기)에 쓸 수 있는 보너스 커피티켓은 아래 친구 초대 또는 캠퍼스 라운지 공유 미션으로 언제든 무료로 받으실 수 있어요."}
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="px-1 text-[12px] font-bold text-zinc-500">
              {isJa
                ? "チャージパッケージ選択"
                : "충전 패키지 선택"}
            </h2>
            <div className="space-y-2.5">
              {TICKET_PACKAGES.map((pkg) => {
                const active = selectedPkg.id === pkg.id;
                const pkgLabel = isJa ? pkg.labelJa : pkg.label;
                const pkgSub = isJa ? pkg.subLabelJa : pkg.subLabel;
                const pkgBadge = isJa ? pkg.badgeJa : pkg.badge;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={cn(
                      "relative flex w-full items-center justify-between rounded-2xl border-[1.5px] px-4 py-4 text-left transition-all duration-300",
                      active
                        ? "scale-[1.015] border-rose-600 bg-rose-50/40 shadow-[0_10px_24px_-8px_rgba(225,29,72,0.28)]"
                        : "border-stone-200 bg-white hover:border-rose-200"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="ondo-check-pop absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[16px] font-black text-zinc-900">
                          {isJa ? `☕ ${pkg.tickets}枚` : `☕ ${pkg.tickets}장`}
                        </span>
                        <span className="text-[13px] font-medium text-zinc-600">
                          ({pkgLabel})
                        </span>
                        {pkgBadge && (
                          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            {pkgBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] font-semibold text-rose-600">
                        {pkgSub}
                      </p>
                    </div>
                    <div className="text-right">
                      {pkg.originalPrice > pkg.price && (
                        <p className="text-[12px] font-medium text-zinc-400 line-through tabular-nums">
                          {isJa
                            ? `定価 ${pkg.originalPrice.toLocaleString("ja-JP")}ウォン`
                            : `정가 ${pkg.originalPrice.toLocaleString("ko-KR")}원`}
                        </p>
                      )}
                      <span className="text-[16px] font-black tabular-nums text-zinc-900">
                        {isJa
                          ? `${pkg.price.toLocaleString("ja-JP")}ウォン`
                          : `${pkg.price.toLocaleString("ko-KR")}원`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <label className="mt-2 flex cursor-pointer items-center gap-2 px-1 pt-1 text-[12px] text-zinc-600">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 accent-rose-600"
              />
              <span>
                {isJa
                  ? "利用規約および未使用チケット7日以内100%返金規定に同意します。"
                  : "이용약관 및 미사용 티켓 7일 내 100% 환불 규정에 동의합니다."}
              </span>
            </label>

            <Button
              size="lg"
              fullWidth
              variant="destructive"
              className="mt-2"
              loading={requesting}
              onClick={handleRequestTopup}
            >
              <Send className="h-4 w-4" />
              {isJa ? (
                <span>
                  <RollingNumber value={selectedPkg.price} format={(v) => v.toLocaleString("ja-JP")} />
                  ウォン分のチャージを申請する
                </span>
              ) : (
                <span>
                  <RollingNumber value={selectedPkg.price} format={(v) => v.toLocaleString("ko-KR")} />
                  원 충전 신청하기
                </span>
              )}
            </Button>
            <p className="px-1 text-[12px] leading-relaxed text-zinc-500">
              {isJa
                ? "現在カード決済は準備中です。申請後、運営チームがカカオトークでお支払い方法をご案内し、入金確認後にチケットを付与します。"
                : "카드결제는 준비 중이에요. 신청하면 운영팀이 카카오톡으로 결제 방법을 안내하고, 입금이 확인되면 티켓을 지급해 드려요."}
            </p>
          </section>
        )}

        {/* Free Ticket Missions */}
        <section>
          <h2 className="mb-2.5 px-1 text-[12px] font-bold text-zinc-500">
            {isJa
              ? "無料でコーヒーチケットを受け取る"
              : "무료로 커피티켓 받기"}
          </h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push(ROUTES.INVITE)}
              className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-zinc-900">
                    {isJa
                      ? "キャンパスの友達を招待してチケット1枚もらう"
                      : "캠퍼스 친구 초대하고 커피티켓 1장 받기"}
                  </p>
                  <p className="text-[12px] text-zinc-500">
                    {isJa
                      ? "招待された友達にもあなたにもチケット1枚ずつ付与"
                      : "초대받은 학우도 나도 커피티켓 1장씩 지급"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-600">
                {isJa ? "+1枚 ☕" : "+1장 ☕"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push(ROUTES.MISSION)}
              className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-zinc-900">
                    {isJa
                      ? "キャンパス・アンバサダー紹介でチケット1枚もらう"
                      : "캠퍼스 앰배서더 공유 미션으로 커피티켓 1장 받기"}
                  </p>
                  <p className="text-[12px] text-zinc-500">
                    {isJa
                      ? "コミュニティやSNSへのシェア申請で運営チーム確認後に付与"
                      : "교내 커뮤니티·SNS 공유 신청 시 운영팀 확인 후 지급"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-600">
                {isJa ? "+1枚 ☕" : "+1장 ☕"}
              </span>
            </button>
          </div>
        </section>

        {/* Required Korean PG Inspection Business Info & Refund Policy Footer */}
        <footer className="rounded-2xl border border-stone-200/80 bg-stone-100/70 p-4 text-[12px] leading-relaxed text-zinc-500">
          <p className="font-bold text-zinc-700">
            {isJa
              ? "サービス情報および返金（クーリングオフ）案内"
              : "서비스 정보 및 환불(청약철회) 안내"}
          </p>
          <p className="mt-1">
            {isJa ? (
              <>
                サービス名: ONDO 36.5° | 形態: キャンパス価値観・会話温度マッチング利用権
                <br />
                返金規定: 未使用のコーヒーチケットはチャージ日から7日以内に全額（100%）返金が可能であり、マッチング後24時間相手が未返信の場合はエスクロー保証によりチケットが100%自動返還されます。
              </>
            ) : (
              <>
                상호명: 온도(ONDO 36.5°) | 서비스 형태: 대학생 가치관·대화온도 매칭 디지털 이용권
                <br />
                청약철회 및 환불 규정: 사용하지 않은 커피티켓은 충전일로부터 7일 이내 전액(100%) 환불이 가능하며, 매칭 후 상대방 24시간 무응답 시 에스크로 보증에 따라 티켓이 100% 자동 반환됩니다.
              </>
            )}
          </p>
        </footer>
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
