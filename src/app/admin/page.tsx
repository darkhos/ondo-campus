"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminKakaoNotifyCard } from "@/components/admin-kakao-notify-card";
import {
  Check,
  CheckCircle2,
  Coffee,
  Copy,
  Database,
  Flame,
  Inbox,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  ROUTES,
} from "@/lib/ondo-constants";
import {
  DbOndoMember,
  DbSupportTicket,
  checkIsAdmin,
  getAuthUserId,
  signInWithKakao,
  supabase,
} from "@/lib/supabase";
import { Button, cn } from "@/components/ondo-ui";

export const SUPABASE_SETUP_SQL = `-- Server-side isolated in supabase/security_rls_and_rpc.sql`;

interface AdminMember {
  uid: string;
  nickname: string;
  gender: "FEMALE" | "MALE";
  age: number;
  school: string;
  department: string;
  email: string;
  emailVerified: boolean;
  voiceRecorded: boolean;
  voiceAudioDataUrl?: string | null;
  tickets: number;
  mannerTemp: number;
  responseRate: number;
  locationLabel: string;
  kakaoId?: string | null;
  memoNote?: string | null;
  verifyStatus?: string;
  verifyMethod?: string | null;
  schoolEmail?: string | null;
  studentIdImagePath?: string | null;
  penaltySkipRemaining?: number;
}

const INITIAL_ADMIN_MEMBERS: AdminMember[] = [];

interface EscrowPair {
  id: string;
  femaleName: string;
  maleName: string;
  schoolPair: string;
  responseSummary: string;
  escrowStatus: "HELD" | "CHATTING" | "CONFIRMED" | "PASSED" | "REFUNDED";
  createdAt: string;
}

const TICKET_KIND_LABEL: Record<DbSupportTicket["kind"], string> = {
  INQUIRY: "💬 문의",
  REPORT: "🚨 신고",
  TOPUP: "☕ 충전",
  INVITE: "🎁 초대",
  PROMO: "📣 홍보",
  VERIFY: "🪪 학생증",
};

// 충전 신청 사유(서버가 기록한 "pkg-2 · 커피티켓 2장 · 3,900원")에서 지급할 장수 계산
function topupTickets(reason: string | null): number {
  const pkg = reason?.split(" ")[0];
  return pkg === "pkg-1" ? 1 : pkg === "pkg-2" ? 2 : pkg === "pkg-3" ? 4 : 0;
}

type AdminData =
  | { ok: false }
  | {
      ok: true;
      members: AdminMember[];
      escrowPairs: EscrowPair[];
      tickets: DbSupportTicket[];
    };

/** 운영자 전용 서버 함수로 회원·매칭·문의 목록을 한 번에 불러옴 */
async function loadAdminData(): Promise<AdminData> {
  try {
    const { data: rpcMembers, error: rpcErr } = await supabase.rpc(
      "ondo_admin_list_members"
    );
    if (rpcErr || !Array.isArray(rpcMembers)) return { ok: false };
    const memberRows = rpcMembers as DbOndoMember[];

    const { data: rpcMatches, error: matchRpcErr } = await supabase.rpc(
      "ondo_admin_list_matches"
    );
    const matchRows =
      !matchRpcErr && Array.isArray(rpcMatches) ? rpcMatches : [];

    const { data: rpcTickets, error: ticketRpcErr } = await supabase.rpc(
      "ondo_admin_list_support_tickets"
    );

    return {
      ok: true,
      members: memberRows.map((r: DbOndoMember) => ({
            uid: r.id,
            nickname: r.nickname,
            gender: r.gender === "M" || r.gender === "MALE" ? "MALE" : "FEMALE",
            age: r.age,
            school: r.univ,
            department: r.major,
            email: r.contact.includes("@")
              ? r.contact
              : `${r.id.slice(0, 6)}@univ.ac.kr`,
            emailVerified: r.verified,
            voiceRecorded: r.voice_recorded,
            voiceAudioDataUrl: r.voice_audio_url,
            tickets: r.tickets,
            mannerTemp: Number(r.temp),
            responseRate: 98,
            locationLabel: r.profile_extra?.locationLabel || "",
            kakaoId: r.contact,
            memoNote: r.bio,
            verifyStatus: r.student_id_status,
            verifyMethod: r.verify_method,
            schoolEmail: r.school_email,
            studentIdImagePath: r.student_id_image_path,
            penaltySkipRemaining: Math.max(0, Number(r.penalty_skip_remaining ?? 0)),
          })),
      escrowPairs: matchRows.map((m) => ({
          id: m.id,
          femaleName: m.female_name,
          maleName: m.male_name,
          schoolPair: m.score != null ? `${m.score}점` : "수동",
          responseSummary: `여 ${m.female_response ?? "대기"} · 남 ${
            m.male_response ?? "대기"
          }${m.male_ticket_charged ? " · 티켓예치" : ""}`,
          escrowStatus:
            m.ticket_status === "CONFIRMED" || m.ticket_status === "settled"
              ? "CONFIRMED"
              : m.ticket_status === "CHATTING"
              ? "CHATTING"
              : m.ticket_status === "PASSED"
              ? "PASSED"
              : m.ticket_status === "REFUNDED" ||
                m.ticket_status === "refunded" ||
                m.ticket_status === "EXPIRED"
              ? "REFUNDED"
              : "HELD",
          createdAt: m.created_at,
        })),
      tickets:
        !ticketRpcErr && Array.isArray(rpcTickets)
          ? (rpcTickets as DbSupportTicket[])
          : [],
    };
  } catch {
    return { ok: false };
  }
}

export default function AdminDashboardPage() {
  // 운영자 확인: 카카오 로그인 + 서버의 운영자 명찰(ondo_admins) 확인
  const [adminState, setAdminState] = useState<
    "checking" | "login" | "denied" | "ok"
  >("checking");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "members" | "matching" | "escrow" | "tickets"
  >("members");
  const [tickets, setTickets] = useState<DbSupportTicket[]>([]);
  const [members, setMembers] = useState<AdminMember[]>(INITIAL_ADMIN_MEMBERS);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  // 첫 불러오기 동안에도 새로고침 아이콘이 돌도록 true 로 시작
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    getAuthUserId().then(async (id) => {
      setAuthUserId(id);
      if (!id) {
        setAdminState("login");
        return;
      }
      setAdminState((await checkIsAdmin()) ? "ok" : "denied");
    });
  }, []);

  const [selectedFemaleUid, setSelectedFemaleUid] = useState<string>("");
  const [selectedMaleUid, setSelectedMaleUid] = useState<string>("");
  const [escrowPairs, setEscrowPairs] = useState<EscrowPair[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [studentIdModal, setStudentIdModal] = useState<{
    member: AdminMember;
    signedUrl: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const openStudentIdModal = async (member: AdminMember) => {
    if (!member.studentIdImagePath) {
      showToast("등록된 학생증 사진이 없습니다.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("student-ids")
      .createSignedUrl(member.studentIdImagePath, 300);
    if (error || !data?.signedUrl) {
      showToast("학생증 사진을 불러오지 못했습니다.");
      return;
    }
    setStudentIdModal({ member, signedUrl: data.signedUrl });
  };

  const handleReviewStudentId = async (memberId: string, approve: boolean) => {
    const target = members.find((m) => m.uid === memberId);
    const ok = window.confirm(
      approve
        ? `${target?.nickname ?? memberId}님의 학생 인증을 승인할까요? 승인하면 학생증 사진은 바로 삭제됩니다.`
        : `${target?.nickname ?? memberId}님의 학생 인증을 반려할까요? 반려하면 학생증 사진은 바로 삭제되고, 회원은 다시 올려야 합니다.`
    );
    if (!ok) return;
    const { data: removedPath, error } = await supabase.rpc(
      "ondo_admin_review_student",
      { p_member_id: memberId, p_approve: approve }
    );
    if (error) {
      showToast("처리에 실패했습니다.");
      return;
    }
    if (typeof removedPath === "string" && removedPath) {
      await supabase.storage.from("student-ids").remove([removedPath]);
    }
    setTickets((prev) =>
      prev.map((x) =>
        x.kind === "VERIFY" && x.member_id === memberId
          ? { ...x, status: "DONE" }
          : x
      )
    );
    setMembers((prev) =>
      prev.map((m) =>
        m.uid === memberId
          ? {
              ...m,
              emailVerified: approve,
              verifyStatus: approve ? "verified" : "rejected",
              studentIdImagePath: null,
            }
          : m
      )
    );
    setStudentIdModal(null);
    showToast(
      approve
        ? "학생 인증을 승인했고, 학생증 사진을 삭제했습니다."
        : "학생 인증을 반려했고, 학생증 사진을 삭제했습니다."
    );
  };

  const applyAdminData = useCallback((result: AdminData) => {
    setDbConnected(result.ok);
    if (result.ok) {
      setMembers(result.members);
      setEscrowPairs(result.escrowPairs);
      setTickets(result.tickets);
      const firstFemale = result.members.find((m) => m.gender === "FEMALE");
      const firstMale = result.members.find((m) => m.gender === "MALE");
      if (firstFemale) {
        setSelectedFemaleUid((prev) => prev || firstFemale.uid);
      }
      if (firstMale) {
        setSelectedMaleUid((prev) => prev || firstMale.uid);
      }
    }
    setSyncing(false);
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    applyAdminData(await loadAdminData());
  }, [applyAdminData]);

  const refreshFromSupabase = () => {
    setSyncing(true);
    void fetchFromSupabase();
  };

  useEffect(() => {
    if (adminState !== "ok") return;
    let cancelled = false;
    loadAdminData().then((result) => {
      if (!cancelled) applyAdminData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [adminState, applyAdminData]);

  const handleGrantTicket = async (uid: string, delta: number) => {
    const { data: nextTickets, error } = await supabase.rpc(
      "ondo_admin_grant_ticket",
      { p_uid: uid, p_delta: delta }
    );
    if (error || nextTickets == null) {
      showToast("티켓 변경에 실패했습니다. 운영자 로그인 상태를 확인해 주세요.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, tickets: Number(nextTickets) } : m))
    );
    showToast(
      delta > 0
        ? `커피티켓 +${delta}장 지급 완료 (보유 ${nextTickets}장)`
        : `커피티켓 ${-delta}장 차감 완료 (보유 ${nextTickets}장)`
    );
  };

  const handleCreateManualMatch = async () => {
    const female =
      members.find((m) => m.uid === selectedFemaleUid && m.gender === "FEMALE") ??
      members.find((m) => m.gender === "FEMALE");
    const male =
      members.find((m) => m.uid === selectedMaleUid && m.gender === "MALE") ??
      members.find((m) => m.gender === "MALE");
    if (!female || !male) {
      showToast("매칭할 여성 회원과 남성 회원이 각각 1명 이상 필요합니다.");
      return;
    }

    const { data: created, error } = await supabase.rpc("ondo_admin_create_match", {
      p_match_id: `admin-${Date.now()}`,
      p_female_id: female.uid,
      p_male_id: male.uid,
    });
    if (error || !created) {
      showToast(
        error?.message?.includes("Active match already exists")
          ? "이미 두 회원 사이에 진행 중인 매칭이 있습니다."
          : "매칭 생성에 실패했습니다. 운영자 로그인 상태를 확인해 주세요."
      );
      return;
    }
    await fetchFromSupabase();
    showToast(`${female.nickname}님과 ${male.nickname}님을 매칭했습니다.`);
  };

  const handleRunNightBatchMatching = async () => {
    const { data: batchRes, error: rpcErr } = await supabase.rpc(
      "ondo_admin_run_autonomous_batch"
    );
    if (rpcErr || !batchRes) {
      showToast("자동 매칭 실행에 실패했습니다. 운영자 로그인 상태를 확인해 주세요.");
      return;
    }
    await fetchFromSupabase();
    showToast(
      `자동 매칭 실행 완료 (신규 매칭 ${batchRes.matched_count ?? 0}건 · 24시간 미응답 처리 ${
        batchRes.refunded_count ?? 0
      }건)`
    );
  };

  const femaleCount = members.filter((m) => m.gender === "FEMALE").length;
  const maleCount = members.filter((m) => m.gender === "MALE").length;
  const pendingVerifyCount = members.filter((m) => !m.emailVerified).length;
  const openTicketCount = tickets.filter((t) => t.status === "OPEN").length;

  if (adminState !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 px-5 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <div>
              <p className="text-[15px] font-black tracking-tight">
                ONDO ADMIN
              </p>
              <p className="text-[11.5px] text-zinc-400">
                운영자 전용 보안 접속
              </p>
            </div>
          </div>

          {adminState === "checking" && (
            <p className="mt-5 text-[13px] text-zinc-400">운영자 계정 확인 중…</p>
          )}

          {adminState === "login" && (
            <>
              <p className="mt-5 text-[13px] leading-relaxed text-zinc-300">
                운영자 카카오 계정으로 로그인해 주세요.
              </p>
              <Button
                fullWidth
                size="lg"
                variant="kakao"
                className="mt-4"
                onClick={() => signInWithKakao("/admin")}
              >
                카카오로 운영자 로그인
              </Button>
            </>
          )}

          {adminState === "denied" && (
            <>
              <p className="mt-5 text-[13px] leading-relaxed text-zinc-300">
                운영자로 등록되지 않은 계정입니다.
              </p>
              <p className="mt-2 break-all rounded-xl bg-zinc-900 px-3 py-2 font-mono text-[11.5px] text-zinc-300">
                {`insert into public.ondo_admins (auth_user_id) values ('${authUserId}');`}
              </p>
              <Button
                fullWidth
                size="md"
                className="mt-3 bg-rose-600 hover:bg-rose-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `insert into public.ondo_admins (auth_user_id) values ('${authUserId}');`
                    );
                    showToast("운영자 등록 SQL 복사 완료!");
                  } catch {
                    // ignore
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                운영자 등록 SQL 복사
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      {/* Top Operator Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-zinc-900 text-white">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between gap-2 px-4 sm:h-14 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <Flame className="h-3.5 w-3.5" fill="currentColor" />
            </div>
            <span className="truncate text-[14px] font-black tracking-tight sm:text-[15px]">
              ONDO ADMIN
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                dbConnected
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              )}
            >
              <Database className="h-2.5 w-2.5" />
              {dbConnected ? "DB 연결됨" : "DB 점검"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={refreshFromSupabase}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-zinc-800 px-2.5 text-[11.5px] font-bold text-zinc-200 hover:bg-zinc-700"
            >
              <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
              <span>새로고침</span>
            </button>
            <Link
              href={ROUTES.HOME}
              className="rounded-full bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-zinc-900 transition-colors hover:bg-stone-200"
            >
              메인 →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-3.5 py-4 sm:space-y-6 sm:px-5 sm:py-7">
        {/* If Supabase table isn't created yet, show 1-click SQL setup box */}
        {dbConnected === false && (
          <section className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[15px] font-black text-zinc-900">
                  Supabase DB 연결을 확인해 주세요
                </h2>
                <p className="mt-0.5 text-[12px] text-zinc-600">
                  SQL Editor에서 설정 SQL을 실행한 뒤 새로고침을 눌러 주세요.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={async () => {
                    await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 2500);
                  }}
                >
                  {sqlCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      SQL 복사
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={refreshFromSupabase}
                >
                  다시 확인
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* KPI Summary Cards */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-3 sm:rounded-3xl sm:p-4">
            <span className="text-[11px] font-bold text-zinc-400">
              가입 회원
            </span>
            <p className="mt-0.5 text-[20px] font-black text-zinc-900 sm:text-[22px]">
              {members.length}명
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-rose-600">
              여 {femaleCount} · 남 {maleCount}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-3 sm:rounded-3xl sm:p-4">
            <span className="text-[11px] font-bold text-zinc-400">
              인증 대기
            </span>
            <p className="mt-0.5 text-[20px] font-black text-zinc-900 sm:text-[22px]">
              {pendingVerifyCount}명
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
              승인 {members.length - pendingVerifyCount}명
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-3 sm:rounded-3xl sm:p-4">
            <span className="text-[11px] font-bold text-zinc-400">
              매칭 내역
            </span>
            <p className="mt-0.5 text-[20px] font-black text-zinc-900 sm:text-[22px]">
              {escrowPairs.length}건
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
              에스크로 보호
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-3 sm:rounded-3xl sm:p-4">
            <span className="text-[11px] font-bold text-zinc-400">
              미처리 문의
            </span>
            <p className="mt-0.5 text-[20px] font-black text-zinc-900 sm:text-[22px]">
              {openTicketCount}건
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
              누적 {tickets.length}건
            </p>
          </div>
        </section>

        {/* Admin Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1.5 border-b border-stone-200 pb-3 sm:flex sm:flex-wrap sm:gap-2">
          {(
            [
              {
                id: "members",
                label: `회원 (${members.length})`,
                icon: Users,
              },
              {
                id: "matching",
                label: "매칭 실행",
                icon: Link2,
              },
              {
                id: "escrow",
                label: `정산 (${escrowPairs.length})`,
                icon: ShieldCheck,
              },
              {
                id: "tickets",
                label: `문의·인증 (${openTicketCount})`,
                icon: Inbox,
              },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold transition-all sm:rounded-full sm:px-4 sm:text-[13px]",
                  active
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white text-zinc-600 ring-1 ring-stone-200 hover:bg-stone-100"
                )}
              >
                <t.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Members & Ticket Granting */}
        {activeTab === "members" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[15px] font-extrabold text-zinc-900 sm:text-[17px]">
                가입 회원 관리 ({members.length}명)
              </h2>
              <span className="text-[11.5px] text-zinc-500">
                티켓 충전 · 학생증 승인
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white sm:rounded-3xl">
              <div className="divide-y divide-stone-100">
                {members.map((m) => (
                  <div
                    key={m.uid}
                    className="flex flex-col justify-between gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            m.gender === "FEMALE"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-stone-100 text-zinc-700"
                          )}
                        >
                          {m.gender === "FEMALE" ? "여" : "남"} · {m.age}세
                        </span>
                        <span className="text-[14.5px] font-extrabold text-zinc-900">
                          {m.nickname}
                        </span>
                        {m.emailVerified ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {m.verifyMethod === "SCHOOL_EMAIL"
                              ? "메일인증"
                              : m.verifyMethod === "ADMIN_REVIEW"
                              ? "학생증승인"
                              : "인증됨"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
                            {m.verifyStatus === "pending_review"
                              ? "심사 대기"
                              : m.verifyStatus === "rejected"
                              ? "반려됨"
                              : "미인증"}
                          </span>
                        )}
                        {(m.penaltySkipRemaining ?? 0) > 0 && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10.5px] font-bold text-rose-700">
                            패널티 {m.penaltySkipRemaining}회
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[12px] text-zinc-500">
                        {m.school} {m.department}
                        {m.locationLabel ? ` · ${m.locationLabel}` : ""} · 카톡{" "}
                        <span className="font-mono font-semibold text-zinc-700">
                          {m.kakaoId || "미등록"}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF9F6] px-2.5 py-1 text-[11.5px] font-bold text-zinc-800 ring-1 ring-stone-200">
                        <Coffee className="h-3 w-3 text-rose-600" />
                        {m.tickets}장
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleGrantTicket(m.uid, 1)}
                        className="h-7 rounded-full bg-rose-600 px-2.5 text-[11.5px] hover:bg-rose-700"
                      >
                        <Plus className="h-3 w-3" />
                        +1
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGrantTicket(m.uid, -1)}
                        className="h-7 rounded-full px-2.5 text-[11.5px]"
                      >
                        -1
                      </Button>

                      {m.studentIdImagePath && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openStudentIdModal(m)}
                          className="h-7 rounded-full px-2.5 text-[11.5px]"
                        >
                          🪪 학생증
                        </Button>
                      )}

                      {!m.emailVerified && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReviewStudentId(m.uid, true)}
                            className="h-7 rounded-full px-2.5 text-[11.5px]"
                          >
                            ✅ 승인
                          </Button>
                          {m.verifyStatus === "pending_review" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReviewStudentId(m.uid, false)}
                              className="h-7 rounded-full px-2 text-[11.5px]"
                            >
                              반려
                            </Button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `${m.nickname} 회원과 매칭 기록을 영구 삭제할까요? 되돌릴 수 없습니다.`
                            )
                          )
                            return;
                          const { data: deleted, error } = await supabase.rpc(
                            "ondo_admin_delete_members",
                            { p_uids: [m.uid] }
                          );
                          if (error || deleted !== true) {
                            showToast("회원 삭제에 실패했습니다.");
                            return;
                          }
                          setMembers((prev) =>
                            prev.filter((item) => item.uid !== m.uid)
                          );
                          showToast(`${m.nickname} 회원을 삭제했습니다.`);
                        }}
                        className="rounded-full px-2 py-1 text-[11.5px] font-bold text-zinc-400 hover:bg-stone-100 hover:text-rose-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Manual & Automated Batch Matching Controller */}
        {activeTab === "matching" && (
          <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            {/* Manual Matchmaker */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:rounded-3xl sm:p-5">
              <h3 className="text-[16px] font-extrabold text-zinc-900">
                수동 커플 매칭
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                여·남 회원을 선택해 즉시 매칭을 생성합니다.
              </p>

              <div className="mt-3.5 space-y-3">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-zinc-600">
                    여성 회원
                  </label>
                  <select
                    value={selectedFemaleUid}
                    onChange={(e) => setSelectedFemaleUid(e.target.value)}
                    className="h-10 w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 text-[13px] font-semibold"
                  >
                    {members
                      .filter((m) => m.gender === "FEMALE")
                      .map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.nickname} ({m.school} · {m.age}세)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-zinc-600">
                    남성 회원
                  </label>
                  <select
                    value={selectedMaleUid}
                    onChange={(e) => setSelectedMaleUid(e.target.value)}
                    className="h-10 w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 text-[13px] font-semibold"
                  >
                    {members
                      .filter((m) => m.gender === "MALE")
                      .map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.nickname} ({m.school} · {m.age}세)
                        </option>
                      ))}
                  </select>
                </div>

                <Button
                  fullWidth
                  size="md"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={handleCreateManualMatch}
                >
                  <Link2 className="h-4 w-4" />
                  선택 회원 매칭 생성
                </Button>
              </div>
            </div>

            {/* Night 9 PM Batch Matching Trigger */}
            <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 sm:rounded-3xl sm:p-5">
              <div>
                <h3 className="text-[16px] font-extrabold text-zinc-900">
                  밤 9시 자동 매칭 실행기
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  매일 밤 9시 자동 실행되며, 지금 수동으로 즉시 돌릴 수도 있습니다.
                </p>

                <div className="mt-3.5 grid grid-cols-2 gap-1.5 text-[11.5px] font-semibold text-zinc-700">
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2">
                    ✓ 같은 학교 100% 제외
                  </div>
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2">
                    ✓ 나이·키·흡연·종교 반영
                  </div>
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2">
                    ✓ 24h 미응답 자동 정리
                  </div>
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2">
                    ✓ 무응답 3회 스킵 패널티
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                size="md"
                className="mt-4"
                onClick={handleRunNightBatchMatching}
              >
                <Zap className="h-4 w-4 text-amber-400" fill="currentColor" />
                자동 매칭 지금 실행
              </Button>
            </div>
          </section>
        )}

        {/* TAB 3: Escrow Settlement & Refund Management */}
        {activeTab === "escrow" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[15px] font-extrabold text-zinc-900 sm:text-[17px]">
                매칭 내역 및 정산 ({escrowPairs.length}건)
              </h2>
              <span className="text-[11.5px] text-zinc-500">
                확정 시 연락처 공개 · 종료 시 티켓 환급
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white sm:rounded-3xl">
              <div className="divide-y divide-stone-100">
                {escrowPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex flex-col justify-between gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[14px] font-extrabold text-zinc-900">
                          {pair.femaleName} ❤️ {pair.maleName}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            pair.escrowStatus === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700"
                              : pair.escrowStatus === "CHATTING"
                              ? "bg-rose-50 text-rose-600"
                              : pair.escrowStatus === "REFUNDED" ||
                                pair.escrowStatus === "PASSED"
                              ? "bg-stone-100 text-zinc-600"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {pair.escrowStatus === "CONFIRMED"
                            ? "연락처 공개"
                            : pair.escrowStatus === "CHATTING"
                            ? "블라인드 대화 중"
                            : pair.escrowStatus === "PASSED"
                            ? "패스 종료"
                            : pair.escrowStatus === "REFUNDED"
                            ? "만료·환급"
                            : "수락 대기"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-zinc-500">
                        {pair.schoolPair} · {pair.responseSummary} ·{" "}
                        {pair.createdAt.slice(0, 10)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(pair.escrowStatus === "HELD" ||
                        pair.escrowStatus === "CHATTING") &&
                        (["CONFIRMED", "REFUNDED"] as const).map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant={next === "CONFIRMED" ? "primary" : "secondary"}
                            className="h-7 rounded-full px-3 text-[11.5px]"
                            onClick={async () => {
                              const ok = window.confirm(
                                next === "CONFIRMED"
                                  ? `${pair.femaleName} ↔ ${pair.maleName} 매칭을 확정할까요? 확정하면 두 사람에게 서로의 카카오톡 ID가 공개됩니다.`
                                  : `${pair.femaleName} ↔ ${pair.maleName} 매칭을 미응답 종료로 처리할까요? (남성 회원이 차감한 티켓이 있다면 자동으로 +1장 환급됩니다)`
                              );
                              if (!ok) return;
                              const { data: updated, error } = await supabase.rpc(
                                "ondo_admin_update_match_status",
                                { p_match_id: pair.id, p_status: next }
                              );
                              if (error || updated !== true) {
                                showToast("매칭 상태 변경에 실패했습니다.");
                                return;
                              }
                              await fetchFromSupabase();
                              showToast(
                                next === "CONFIRMED"
                                  ? "매칭을 확정했습니다. 두 사람에게 연락처가 공개됩니다."
                                  : "매칭을 미응답 종료 처리하고 예치된 티켓을 반환했습니다."
                              );
                            }}
                          >
                            {next === "CONFIRMED" ? "확정" : "종료·환급"}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Support Inquiries & Reports */}
        {activeTab === "tickets" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[15px] font-extrabold text-zinc-900 sm:text-[17px]">
                문의·신고 및 인증 접수함
              </h2>
              <span className="text-[11.5px] text-zinc-500">
                미처리 {openTicketCount}건
              </span>
            </div>

            <AdminKakaoNotifyCard />

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white sm:rounded-3xl">
              {tickets.length === 0 ? (
                <p className="p-6 text-center text-[12.5px] text-zinc-500">
                  접수된 내역이 없습니다.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {tickets.map((t) => {
                    const member = t.member_id
                      ? members.find((m) => m.uid === t.member_id)
                      : undefined;
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          "flex flex-col justify-between gap-2.5 p-3.5 sm:flex-row sm:items-start sm:gap-4 sm:p-4",
                          t.status === "DONE" && "opacity-55"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                t.kind === "REPORT"
                                  ? "bg-rose-50 text-rose-700"
                                  : t.kind === "TOPUP"
                                  ? "bg-amber-50 text-amber-800"
                                  : t.kind === "INQUIRY"
                                  ? "bg-sky-50 text-sky-700"
                                  : t.kind === "VERIFY"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              {TICKET_KIND_LABEL[t.kind]}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                t.status === "OPEN"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-stone-100 text-zinc-600"
                              )}
                            >
                              {t.status === "OPEN" ? "미처리" : "완료"}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              #{t.id} ·{" "}
                              {new Date(t.created_at).toLocaleString("ko-KR", {
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {t.reason && (
                            <p className="mt-1.5 text-[12.5px] font-bold text-zinc-900">
                              {t.reason}
                            </p>
                          )}
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] text-zinc-700">
                            {t.message}
                          </p>
                          <p className="mt-1 text-[11.5px] text-zinc-500">
                            {member
                              ? `${member.nickname} (${member.school})`
                              : t.member_id
                              ? `ID: ${t.member_id.slice(0, 8)}`
                              : "비회원"}
                            {t.reply_contact
                              ? ` · 연락처: ${t.reply_contact}`
                              : member?.kakaoId
                              ? ` · 카톡: ${member.kakaoId}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
                          {t.kind === "VERIFY" && t.status === "OPEN" && t.member_id && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!member?.studentIdImagePath}
                                className="h-7 rounded-full px-2.5 text-[11.5px]"
                                onClick={() => {
                                  if (member) void openStudentIdModal(member);
                                }}
                              >
                                🪪 학생증
                              </Button>
                              {(["approve", "reject"] as const).map((action) => (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant={action === "approve" ? "destructive" : "ghost"}
                                  className="h-7 rounded-full px-2.5 text-[11.5px]"
                                  onClick={() =>
                                    handleReviewStudentId(
                                      t.member_id!,
                                      action === "approve"
                                    )
                                  }
                                >
                                  {action === "approve" ? "✅ 승인" : "반려"}
                                </Button>
                              ))}
                            </>
                          )}
                          {t.kind === "TOPUP" &&
                            t.status === "OPEN" &&
                            t.member_id &&
                            topupTickets(t.reason) > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 rounded-full px-2.5 text-[11.5px]"
                                onClick={async () => {
                                  const n = topupTickets(t.reason);
                                  if (
                                    !window.confirm(
                                      `입금을 확인하셨나요? ${member?.nickname ?? t.member_id}님에게 커피티켓 ${n}장을 지급합니다.`
                                    )
                                  )
                                    return;
                                  const { data: granted, error: grantErr } =
                                    await supabase.rpc("ondo_admin_grant_ticket", {
                                      p_uid: t.member_id,
                                      p_delta: n,
                                    });
                                  if (grantErr || granted == null) {
                                    showToast("티켓 지급에 실패했습니다.");
                                    return;
                                  }
                                  await supabase.rpc(
                                    "ondo_admin_update_support_ticket",
                                    { p_id: t.id, p_status: "DONE" }
                                  );
                                  setTickets((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id ? { ...x, status: "DONE" } : x
                                    )
                                  );
                                  setMembers((prev) =>
                                    prev.map((m) =>
                                      m.uid === t.member_id
                                        ? { ...m, tickets: Number(granted) }
                                        : m
                                    )
                                  );
                                  showToast(
                                    `커피티켓 ${n}장 지급 완료 (보유 ${granted}장)`
                                  );
                                }}
                              >
                                티켓 +{topupTickets(t.reason)}장 지급
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant={t.status === "OPEN" ? "primary" : "secondary"}
                            className="h-7 rounded-full px-2.5 text-[11.5px]"
                            onClick={async () => {
                              const nextStatus =
                                t.status === "OPEN" ? "DONE" : "OPEN";
                              const { data, error } = await supabase.rpc(
                                "ondo_admin_update_support_ticket",
                                {
                                  p_id: t.id,
                                  p_status: nextStatus,
                                }
                              );
                              if (error || data !== true) {
                                showToast("상태 변경에 실패했습니다.");
                                return;
                              }
                              setTickets((prev) =>
                                prev.map((x) =>
                                  x.id === t.id ? { ...x, status: nextStatus } : x
                                )
                              );
                            }}
                          >
                            {t.status === "OPEN" ? "완료 처리" : "다시 열기"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {studentIdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setStudentIdModal(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-extrabold text-rose-600">
                  🪪 학생증 확인
                </span>
                <h3 className="mt-1 text-[16px] font-black text-zinc-900">
                  {studentIdModal.member.nickname} ({studentIdModal.member.age}세)
                </h3>
                <p className="text-[12px] font-semibold text-zinc-600">
                  {studentIdModal.member.school} · {studentIdModal.member.department} · 카톡{" "}
                  <span className="font-mono">{studentIdModal.member.kakaoId || "-"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentIdModal(null)}
                className="rounded-full bg-stone-100 px-2.5 py-1 text-[11.5px] font-bold text-zinc-600 hover:bg-stone-200"
              >
                닫기 ✕
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={studentIdModal.signedUrl}
                alt={`${studentIdModal.member.nickname} 학생증 사진`}
                className="max-h-[58vh] w-full object-contain"
              />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
              <a
                href={studentIdModal.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] font-bold text-zinc-500 underline hover:text-zinc-800"
              >
                ↗ 원본 열기
              </a>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleReviewStudentId(studentIdModal.member.uid, false)
                  }
                >
                  반려
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    handleReviewStudentId(studentIdModal.member.uid, true)
                  }
                >
                  ✅ 승인 (사진 삭제)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 mx-auto max-w-md px-5">
          <div className="rounded-full bg-zinc-900 px-5 py-3 text-center text-[13px] font-bold text-white shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
