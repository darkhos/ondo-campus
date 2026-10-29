"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Coffee,
  Flame,
  Pause,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  BETA_UNLIMITED_TICKETS,
  calculateProfileCompletion,
  DEMO_PARTNERS,
  MatchHistoryItem,
  PartnerProfile,
  ROUTES,
  UserProfile,
} from "@/lib/ondo-constants";
import {
  Button,
  CampusBalanceLoungeCard,
  cn,
  ContactUnlockCard,
  HomeTabId,
  InAppBlindChatCard,
  LanguageToggle,
  MatchCard,
  MatchingToggleCard,
  Modal,
  ProfileCompletionCard,
} from "@/components/ondo-ui";
import { useAppLocale } from "@/lib/i18n";
import { useLocalStorageItem } from "@/lib/use-browser-storage";
import { DbMatchPartner, logoutEverywhere } from "@/lib/supabase";
import { RealMatchPanel, isActiveMatch } from "@/components/real-match-panel";

export type MatchViewState =
  | "recommendation"
  | "blind_chat"
  | "waiting"
  | "waiting_response"
  | "failed"
  | "paused"
  | "cancelled_after_success";

function useNextMatchCountdown(): string {
  const [countdown, setCountdown] = useState<string>("04:12:30");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(21, 0, 0, 0);
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      const diffSec = Math.max(
        0,
        Math.floor((target.getTime() - now.getTime()) / 1000)
      );
      const h = String(Math.floor(diffSec / 3600)).padStart(2, "0");
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
      const s = String(diffSec % 60).padStart(2, "0");
      setCountdown(`${h}:${m}:${s}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return countdown;
}

const noop = () => {};

export function HomeMatchTab({
  user,
  history = [],
  onUpdateUser,
  onNavigateTab,
  unreadNotificationCount,
  serverMatches = [],
  onServerChanged,
}: {
  user: UserProfile;
  /** 서버의 실제 매칭 목록 (있으면 체험 화면 대신 실제 매칭 화면을 보여 줌) */
  serverMatches?: DbMatchPartner[];
  onServerChanged?: () => void;
  history?: MatchHistoryItem[];
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onNavigateTab: (tab: HomeTabId) => void;
  onAddHistory?: (item: MatchHistoryItem) => void;
  unreadNotificationCount?: number;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const countdown = useNextMatchCountdown();

  const [matchState, setMatchState] =
    useState<MatchViewState>("recommendation");
  const [candidateIdx, setCandidateIdx] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<"ACCEPT" | "PASS" | null>(
    null
  );
  const [escrowState, setEscrowState] = useState<
    "LOCKED" | "HELD" | "CONFIRMED" | "REFUNDED"
  >("CONFIRMED");
  const [toast, setToast] = useState<string | null>(null);
  const readNotifRaw = useLocalStorageItem("ondo_read_notifications_v1");
  const readNotifIds = (() => {
    try {
      return new Set<string>(readNotifRaw ? JSON.parse(readNotifRaw) : []);
    } catch {
      return new Set<string>();
    }
  })();

  const computedUnreadCount = (() => {
    if (typeof unreadNotificationCount === "number") {
      return unreadNotificationCount;
    }
    const ids: string[] = ["welcome-tickets"];
    if (user.verificationStatus && user.verificationStatus !== "verified") {
      ids.push(`verify-${user.verificationStatus}`);
    }
    for (const m of serverMatches) {
      if (m.ticket_status === "PENDING" && m.my_response === "PENDING") {
        ids.push(`match-new-${m.match_id}`);
      } else if (m.ticket_status === "CHATTING") {
        ids.push(`match-chat-${m.match_id}`);
      } else if (m.ticket_status === "CONFIRMED") {
        ids.push(`match-contact-${m.match_id}`);
      }
    }
    return ids.filter((id) => !readNotifIds.has(id)).length;
  })();

  const completionPct = calculateProfileCompletion(user);
  const activeHistory = history.filter(
    (h) => h.resultStatus === "PENDING" || h.resultStatus === "SUCCESS"
  );
  const realPartners: PartnerProfile[] = activeHistory.map((h) => h.partner);
  const hasRealMatch = realPartners.length > 0;
  const currentPartner: PartnerProfile =
    realPartners[candidateIdx] ?? realPartners[0] ?? DEMO_PARTNERS[0];
  const ticketCount = Math.max(0, Math.floor(user.points / 2900));
  const hasActiveServerMatch = serverMatches.some(isActiveMatch);

  const handleLogout = async () => {
    await logoutEverywhere();
    router.replace("/");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleToggleMatching = () => {
    const nextPaused = user.matchingStatus !== "PAUSED";
    onUpdateUser({
      matchingStatus: nextPaused ? "PAUSED" : "ACTIVE",
    });
    setMatchState(nextPaused ? "paused" : "recommendation");
  };

  const handleConfirmAction = () => {
    if (confirmModal === "ACCEPT") {
      setConfirmModal(null);
      setEscrowState("CONFIRMED");
      setMatchState("blind_chat");
      showToast(
        isJa
          ? "価値観が繋がり、24時間ブラインド・コーヒーチャットが開きました！"
          : "주파수가 연결되어 24시간 블라인드 커피챗이 열렸어요!"
      );
    } else if (confirmModal === "PASS") {
      setConfirmModal(null);
      if (candidateIdx < realPartners.length - 1) {
        setCandidateIdx((i) => i + 1);
        showToast(
          isJa
            ? "次の価値観ノートを読み込みました。"
            : "다음 순차 주파수 노트를 불러왔어요."
        );
      } else {
        setMatchState("waiting");
      }
    }
  };

  // 티켓 차감·환급은 서버(운영자 정산)에서만 처리 — 화면에서 임의로 늘리거나 줄이지 않음
  const handleUnlockEscrow = () => {
    setEscrowState("CONFIRMED");
  };

  return (
    <div className="flex min-h-full w-full flex-col overflow-x-hidden bg-[#FAF9F6]">
      {/* ONDO Editorial Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-4xl items-center justify-between gap-1.5 px-3 sm:h-15 sm:gap-2 sm:px-5">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-rose-400 sm:h-8 sm:w-8">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-black tracking-tight text-zinc-900 sm:text-[17px]">
                  ONDO
                </span>
                <span className="text-[11px] font-bold text-rose-600 sm:text-[12px]">
                  36.5°
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
            <LanguageToggle />

            <Link
              href={ROUTES.POINTS}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 text-[11px] font-bold text-zinc-800 shadow-2xs transition-colors hover:bg-stone-50 sm:h-8 sm:gap-1.5 sm:px-3 sm:text-[12px]"
            >
              <Coffee className="h-3 w-3 text-rose-600 sm:h-3.5 sm:w-3.5" />
              <span>
                {BETA_UNLIMITED_TICKETS
                  ? isJa ? "無制限" : "티켓 무제한"
                  : isJa ? `${ticketCount}枚` : `티켓 ${ticketCount}장`}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-7 items-center rounded-full border border-stone-200 bg-white px-2 text-[11px] font-bold text-zinc-500 transition-colors hover:bg-stone-100 hover:text-zinc-900 sm:h-8 sm:px-2.5 sm:text-[12px]"
            >
              {isJa ? "ログアウト" : "로그아웃"}
            </button>

            <Link
              href={ROUTES.NOTIFICATIONS}
              aria-label={isJa ? "お知らせ" : "알림"}
              className="relative flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-700 transition-colors hover:bg-stone-50 sm:h-8 sm:w-8"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
              {computedUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-600" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Focused Single-Column Content */}
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 pb-24 sm:px-5">
        <div className="space-y-4">
          {hasActiveServerMatch && (
            <RealMatchPanel
              matches={serverMatches}
              isMale={user.gender === "MALE"}
              ticketCount={ticketCount}
              onChanged={onServerChanged ?? noop}
            />
          )}
          {completionPct < 100 && (
            <ProfileCompletionCard
              percent={completionPct}
              onOpen={() => onNavigateTab("note")}
            />
          )}

          {!hasActiveServerMatch && matchState === "recommendation" && (
            <div className="animate-fade-in space-y-4">
              {hasRealMatch ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[19px] font-extrabold tracking-tight text-zinc-900">
                        {isJa
                          ? "今日届いたプロフィール"
                          : "오늘 도착한 소개팅 상대"}
                      </h2>
                      <p className="text-[12px] text-zinc-500">
                        {isJa
                          ? "お互いOKすると24時間トークルームが開きます"
                          : "서로 수락하면 24시간 대화방이 열려요"}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {realPartners.map((p, idx) => (
                        <button
                          key={p.uid}
                          type="button"
                          onClick={() => setCandidateIdx(idx)}
                          className={cn(
                            "rounded-full px-3 py-1 text-[12px] font-bold transition-all",
                            candidateIdx === idx
                              ? "bg-rose-600 text-white"
                              : "bg-white text-zinc-600 ring-1 ring-stone-200"
                          )}
                        >
                          #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <MatchCard partner={currentPartner} />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={() => setConfirmModal("PASS")}
                    >
                      {isJa ? "パス" : "패스"}
                    </Button>
                    <Button
                      size="lg"
                      fullWidth
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={() => setConfirmModal("ACCEPT")}
                    >
                      {isJa ? "会話してみる" : "대화 수락하기"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-2xs">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                    <span className="ondo-radar-ring-1 pointer-events-none absolute inset-0 rounded-full bg-rose-500/25" />
                    <span className="ondo-radar-ring-2 pointer-events-none absolute inset-0 rounded-full bg-rose-500/20" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                      <Clock className="h-7 w-7" />
                    </div>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-extrabold text-rose-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isJa
                      ? "毎晩 21:00 1:1 紹介"
                      : "매일 밤 9:00 1:1 소개"}
                  </span>
                  <h2 className="mt-3 text-[21px] font-black tracking-tight text-zinc-900">
                    {isJa
                      ? "今夜21時の紹介まで "
                      : "오늘 밤 9시 소개까지 "}
                    <span className="font-mono text-rose-600">
                      {countdown}
                    </span>
                  </h2>
                  <p className="mt-1.5 text-[13px] text-zinc-500">
                    {isJa
                      ? "学生認証を済ませたお相手と毎晩21時にマッチングされます。"
                      : "학생 인증을 마친 상대와 매일 밤 9시에 매칭돼요."}
                  </p>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="md"
                      fullWidth
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={() => onNavigateTab("note")}
                    >
                      {isJa
                        ? "✍️ プロフィールを編集する"
                        : "✍️ 내 프로필 채우기"}
                    </Button>
                    <Button
                      size="md"
                      variant="secondary"
                      fullWidth
                      onClick={() => router.push(ROUTES.INVITE)}
                    >
                      {isJa
                        ? "🎁 友達招待でチケット+1枚"
                        : "🎁 친구 초대하고 티켓 받기"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasActiveServerMatch && matchState === "blind_chat" && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[19px] font-extrabold tracking-tight text-zinc-900">
                    {isJa
                      ? "24時間ブラインドトーク"
                      : "24시간 블라인드 대화방"}
                  </h2>
                  <p className="text-[12px] text-zinc-500">
                    {isJa
                      ? "5往復以上会話するとカカオトークIDが公開されます"
                      : "5마디 이상 대화하면 카카오톡 ID가 공개돼요"}
                  </p>
                </div>
              </div>

              {escrowState === "LOCKED" ? (
                <ContactUnlockCard
                  pointCost={2900}
                  userPoints={user.points}
                  onUnlock={handleUnlockEscrow}
                />
              ) : (
                <InAppBlindChatCard
                  partner={currentPartner}
                  escrowStatus={
                    escrowState === "REFUNDED" ? "REFUNDED" : "CONFIRMED"
                  }
                  preview={!hasRealMatch}
                />
              )}
            </div>
          )}

          {!hasActiveServerMatch && matchState === "waiting" && (
            <div className="animate-fade-in space-y-4">
              <CampusBalanceLoungeCard
                onRewardPoints={() => {
                  showToast(
                    isJa
                      ? "投票へのご参加ありがとうございます！"
                      : "온도차 투표에 참여해 주셔서 고마워요!"
                  );
                }}
              />
            </div>
          )}

          {!hasActiveServerMatch && matchState === "cancelled_after_success" && (
            <div className="animate-fade-in rounded-3xl border border-stone-200 bg-white p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-[18px] font-extrabold text-zinc-900">
                {isJa
                  ? "チケット100%返還保証"
                  : "티켓 100% 자동 환급 보장"}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                {isJa
                  ? "24時間以内に返信がない場合、チケットは100%自動返還されます。"
                  : "24시간 내 상대방의 첫 답장이 없으면 티켓은 100% 자동 환급됩니다."}
              </p>
            </div>
          )}

          {!hasActiveServerMatch && matchState === "paused" && (
            <div className="animate-fade-in rounded-3xl border border-stone-200 bg-white p-8 text-center">
              <Pause className="mx-auto h-8 w-8 text-zinc-400" />
              <h2 className="mt-3 text-[17px] font-bold text-zinc-900">
                {isJa ? "マッチングお休み中です" : "매칭 휴식 모드입니다"}
              </h2>
              <Button
                size="md"
                className="mt-4"
                onClick={handleToggleMatching}
              >
                {isJa ? "マッチングを再開する" : "매칭 다시 켜기"}
              </Button>
            </div>
          )}

          <MatchingToggleCard
            matchingStatus={user.matchingStatus}
            onToggle={handleToggleMatching}
          />
        </div>
      </div>

      {confirmModal && (
        <Modal open onClose={() => setConfirmModal(null)}>
          <h3 className="text-[18px] font-extrabold text-zinc-900">
            {confirmModal === "ACCEPT"
              ? isJa
                ? `24時間ブラインド・チャットルームを開きますか？`
                : `${currentPartner.nickname}님과 24시간 블라인드 룸을 열까요?`
              : isJa
              ? "次の価値観ノートを確認しますか？"
              : "다음 순차 가치관 노트를 확인하시겠어요?"}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            {confirmModal === "ACCEPT"
              ? isJa
                ? "個人連絡先（カカオトークID）はすぐには公開されず、5往復以上の会話が続いた時のみ安全に交換できます。"
                : "개인 연락처(카카오톡 ID)가 바로 노출되지 않으며, 5턴 이상 대화가 이어졌을 때만 안전하게 연락처를 교환할 수 있습니다."
              : isJa
              ? "強制脱落することなく、次の候補の価値観ノートへスムーズに移動します。"
              : "강제 탈락 없이 다음 후보의 가치관 노트로 부드럽게 이동합니다."}
          </p>
          <div className="mt-5 flex gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setConfirmModal(null)}
            >
              {isJa ? "キャンセル" : "취소"}
            </Button>
            <Button
              size="lg"
              fullWidth
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleConfirmAction}
            >
              {confirmModal === "ACCEPT"
                ? isJa
                  ? "ブラインド・ルームを開く"
                  : "블라인드 룸 열기"
                : isJa
                ? "次のノートを見る"
                : "다음 노트 보기"}
            </Button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-sm px-5">
          <div className="rounded-full bg-zinc-900 px-4 py-2.5 text-center text-[12px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
