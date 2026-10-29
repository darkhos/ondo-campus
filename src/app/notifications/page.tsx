"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Gift, Heart, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  fetchMyMatchPartners,
  fetchMyMemberSecure,
  toVerificationStatus,
} from "@/lib/supabase";
import { PageHeader, cn } from "@/components/ondo-ui";

const READ_KEY = "ondo_read_notifications_v1";

interface NotificationItem {
  id: string;
  type: "MATCH_ARRIVED" | "MATCH_SUCCESS" | "POINT_REWARD";
  title: string;
  titleJa: string;
  body: string;
  bodyJa: string;
  read: boolean;
  href: string;
}

function loadReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    // ignore
  }
}

// 서버의 실제 상태(학생 인증·매칭)로 알림 목록을 만듦
async function buildNotifications(): Promise<NotificationItem[]> {
  const [member, matches] = await Promise.all([
    fetchMyMemberSecure(),
    fetchMyMatchPartners(),
  ]);
  if (!member) return [];
  const read = loadReadIds();
  const items: Omit<NotificationItem, "read">[] = [];
  const status = toVerificationStatus(member);
  if (status !== "verified") {
    items.push({
      id: `verify-${status}`,
      type: "POINT_REWARD",
      title: status === "pending_review" ? "학생증 확인 중이에요" : status === "rejected" ? "학생증 확인이 반려됐어요" : "학생 인증을 마쳐 주세요",
      titleJa: status === "pending_review" ? "学生証を確認中です" : status === "rejected" ? "学生証の確認が却下されました" : "学生認証を完了してください",
      body: status === "pending_review" ? "운영팀이 확인을 마치면 매칭에 참여할 수 있어요." : "학생 인증을 마쳐야 매일 밤 10시 매칭에 참여할 수 있어요.",
      bodyJa: status === "pending_review" ? "運営チームの確認後、マッチングに参加できます。" : "学生認証を完了すると毎晩22時のマッチングに参加できます。",
      href: status === "pending_review" ? ROUTES.HOME : ROUTES.JOIN,
    });
  }
  for (const m of matches) {
    if (m.ticket_status === "PENDING" && m.my_response === "PENDING") {
      items.push({
        id: `match-new-${m.match_id}`,
        type: "MATCH_ARRIVED",
        title: `${m.nickname}님과 새 매칭이 도착했어요`,
        titleJa: `${m.nickname}さんとの新しいマッチングが届きました`,
        body: "24시간 안에 수락하거나 넘겨 주세요.",
        bodyJa: "24時間以内に承認またはパスしてください。",
        href: ROUTES.HOME,
      });
    } else if (m.ticket_status === "CHATTING") {
      items.push({
        id: `match-chat-${m.match_id}`,
        type: "MATCH_SUCCESS",
        title: `${m.nickname}님과 대화방이 열렸어요`,
        titleJa: `${m.nickname}さんとのチャットが開きました`,
        body: "서로 2번 이상, 합쳐서 5번 이상 대화하면 카카오톡 ID가 공개돼요.",
        bodyJa: "お互いに2回以上・合計5回以上会話するとカカオトークIDが公開されます。",
        href: ROUTES.HOME,
      });
    } else if (m.ticket_status === "CONFIRMED") {
      items.push({
        id: `match-contact-${m.match_id}`,
        type: "MATCH_SUCCESS",
        title: `${m.nickname}님의 카카오톡 ID가 공개됐어요`,
        titleJa: `${m.nickname}さんのカカオトークIDが公開されました`,
        body: "대화방에서 카카오톡 ID를 확인해 보세요.",
        bodyJa: "チャット画面でカカオトークIDを確認してください。",
        href: ROUTES.HOME,
      });
    }
  }
  items.push({
    id: "welcome-tickets",
    type: "POINT_REWARD",
    title: "가입 축하 커피티켓 2장이 지급됐어요 🎁",
    titleJa: "新規登録ウェルカム・コーヒーチケット2枚が付与されました 🎁",
    body: "매칭을 수락할 때 사용할 수 있어요.",
    bodyJa: "マッチングの承認時に使用できます。",
    href: ROUTES.POINTS,
  });
  return items.map((n) => ({ ...n, read: read.has(n.id) }));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    buildNotifications().then(setItems);
  }, []);

  const markRead = (ids: string[]) => {
    const read = loadReadIds();
    ids.forEach((id) => read.add(id));
    saveReadIds(read);
    setItems((prev) => prev?.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)) ?? prev);
  };

  const unreadCount = (items ?? []).filter((n) => !n.read).length;
  const markAllRead = () => markRead((items ?? []).map((n) => n.id));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "ラウンジ通知" : "라운지 알림"}
        back
        right={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-100"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {isJa ? "すべて既読" : "모두 읽음"}
            </button>
          ) : null
        }
      />

      <div className="flex-1 space-y-2.5 px-5 py-5">
        {items !== null && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white px-6 py-20 text-center">
            <Bell className="h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-[14px] font-bold text-zinc-800">
              {isJa ? "通知はまだありません" : "아직 도착한 알림이 없어요"}
            </p>
            <p className="mt-1 text-[12px] text-zinc-500">
              {isJa
                ? "ログインすると22時のマッチングやトークのお知らせが届きます。"
                : "로그인하면 밤 10시 주파수 매칭과 대화 소식을 알려 드려요."}
            </p>
          </div>
        )}
        {(items ?? []).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              markRead([item.id]);
              router.push(item.href);
            }}
            className={cn(
              "flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all",
              !item.read
                ? "border-rose-200 bg-white shadow-2xs"
                : "border-stone-200/80 bg-white/75 opacity-85 hover:bg-white"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                item.type === "MATCH_ARRIVED"
                  ? "bg-rose-50 text-rose-600"
                  : item.type === "MATCH_SUCCESS"
                  ? "bg-zinc-900 text-rose-400"
                  : "bg-amber-50 text-amber-600"
              )}
            >
              {item.type === "MATCH_ARRIVED" && <Sparkles className="h-5 w-5" />}
              {item.type === "MATCH_SUCCESS" && <Heart className="h-5 w-5" />}
              {item.type === "POINT_REWARD" && <Gift className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[14px] font-bold text-zinc-900">
                  {isJa ? item.titleJa : item.title}
                </p>
                {!item.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-rose-600" />
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
                {isJa ? item.bodyJa : item.body}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
