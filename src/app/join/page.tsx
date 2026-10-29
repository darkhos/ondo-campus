"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Globe2,
  GraduationCap,
  Loader2,
  Mail,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  KAKAO_OPENCHAT_URL,
  EMPTY_USER_PROFILE,
  FIELD_INPUT,
  FIELD_LABEL,
  ROUTES,
  DISTRICTS_BY_SIDO,
  generateWittyNickname,
} from "@/lib/ondo-constants";
import {
  CAPITAL_UNIV_GROUPS,
  CAPITAL_UNIV_OPTIONS,
  KLI_INSTITUTE_LABEL_JA,
  UNIV_LABEL_JA,
  getUnivEmailGuide,
  useAppLocale,
} from "@/lib/i18n";
import {
  parseJsonObject,
  useInitialSearch,
  useSessionStorageItem,
} from "@/lib/use-browser-storage";
import {
  fetchMyMemberSecure,
  getAuthUserId,
  isStaleAutoCreatedMember,
  purgeStaleMemberRow,
  requestSchoolEmailCode,
  signInWithKakao,
  submitStudentIdForReview,
  syncUserProfileToSupabase,
  verifySchoolEmailCode,
} from "@/lib/supabase";
import { Button, PageHeader, SelectField, cn } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

export type CampusTrackType = "DEGREE" | "KLI_JP" | "INTL_JP";

const RAW_KLI_INSTITUTE_GROUPS: {
  regionKo: string;
  regionJa: string;
  items: string[];
}[] = [
  {
    regionKo: "📍 서울권 대학교 어학당·언어교육원 (34개교 · 가나다순)",
    regionJa: "📍 ソウル圏の大学付属語学堂・言語教育院 (34校・カナダ順)",
    items: [
      "연세대학교 한국어학당 (KLI)",
      "이화여자대학교 언어교육원",
      "서강대학교 한국어교육원",
      "홍익대학교 국제언어교육원",
      "고려대학교 한국어센터",
      "경희대학교 국제교육원 (서울)",
      "한국외국어대학교 한국어문화교육원 (서울)",
      "서울대학교 언어교육원 한국어교육센터",
      "한양대학교 국제교육원 (서울)",
      "성균관대학교 성균어학원 (서울)",
      "건국대학교 언어교육원",
      "동국대학교 한국어교육센터",
      "중앙대학교 국제교육원 한국어과정 (서울)",
      "서울시립대학교 한국어학당",
      "숙명여자대학교 국제언어교육원",
      "성신여자대학교 국제교육원",
      "국민대학교 국제교육원 한국어센터",
      "숭실대학교 국제교육원 한국어학당",
      "세종대학교 국제교육원 한국어과정",
      "단국대학교 국제어학원 (서울 한남)",
      "명지대학교 한국어학당 (서울 인문)",
      "상명대학교 한국언어문화교육원",
      "가톨릭대학교 한국어교육센터",
      "광운대학교 한국어문화교육원",
      "동덕여자대학교 한국어교육원",
      "덕성여자대학교 언어교육원",
      "서울여자대학교 한국어교육과정",
      "서울과학기술대학교 어학원 한국어과정",
      "서경대학교 언어문화교육원",
      "한성대학교 언어교육원",
      "삼육대학교 한국어학당",
      "총신대학교 한국어학당",
      "성공회대학교 한국어학당",
      "KC대학교 한국어교육원",
    ],
  },
  {
    regionKo: "📍 경기권 대학교 어학당·언어교육원 (24개교 · 가나다순)",
    regionJa: "📍 京畿道圏の大学付属語学堂・言語教育院 (24校・カナダ順)",
    items: [
      "가천대학교 국제어학원 한국어교육센터 (성남)",
      "단국대학교 국제어학원 한국어과정 (용인 죽전)",
      "경희대학교 글로벌캠퍼스 국제교육원 (용인)",
      "한국외국어대학교 글로벌캠퍼스 한국어문화교육원 (용인)",
      "명지대학교 자연캠퍼스 한국어학당 (용인)",
      "용인대학교 한국어학당 (용인)",
      "강남대학교 한국어교육센터 (용인)",
      "아주대학교 국제교육센터 한국어과정 (수원)",
      "경기대학교 국제교육원 한국어과정 (수원)",
      "성균관대학교 자연과학캠퍼스 성균어학원 (수원)",
      "한양대학교 ERICA캠퍼스 국제교육원 (안산)",
      "한국항공대학교 한국어학당 (고양)",
      "동국대학교 바이오메디캠퍼스 한국어과정 (고양)",
      "중부대학교 고양캠퍼스 한국어학당 (고양)",
      "한국공학대학교 언어교육원 한국어과정 (시흥)",
      "수원대학교 국제어학원 한국어학당 (화성)",
      "협성대학교 한국어학당 (화성)",
      "중앙대학교 다빈치캠퍼스 한국어교육원 (안성)",
      "안양대학교 한국어교육원 (안양)",
      "성결대학교 한국어학당 (안양)",
      "한신대학교 한국어학당 (오산)",
      "평택대학교 국제교육원 한국어과정 (평택)",
      "신한대학교 한국어학당 (의정부)",
      "대진대학교 한국어교육센터 (포천)",
    ],
  },
  {
    regionKo: "📍 인천권 대학교 어학당·언어교육원 (4개교 · 가나다순)",
    regionJa: "📍 仁川圏の大学付属語学堂・言語教育院 (4校・カナダ順)",
    items: [
      "인하대학교 언어교육원 한국어과정 (인천 미추홀구)",
      "인천대학교 한국어학당 (인천 연수구 송도)",
      "연세대학교 국제캠퍼스 한국어과정 (인천 연수구 송도)",
      "경인교육대학교 한국어교육센터 (인천 계양구)",
    ],
  },
];

const KLI_INSTITUTE_GROUPS = RAW_KLI_INSTITUTE_GROUPS.map((g) => ({
  ...g,
  items: [...g.items].sort((a, b) => a.localeCompare(b, "ko")),
}));

const KLI_INSTITUTES = KLI_INSTITUTE_GROUPS.flatMap((g) => g.items);

const KLI_LEVEL_OPTIONS = [
  { value: "1급 (1級 · 초급)", labelKo: "1급 (초급 1)", labelJa: "1級（初級1・正規/短期）" },
  { value: "2급 (2級 · 초급)", labelKo: "2급 (초급 2)", labelJa: "2級（初級2・正規/短期）" },
  { value: "3급 (3級 · 중급)", labelKo: "3급 (중급 1)", labelJa: "3級（中級1・正規/短期）" },
  { value: "4급 (4級 · 중급)", labelKo: "4급 (중급 2)", labelJa: "4級（中級2・正規/短期）" },
  { value: "5급 (5級 · 고급)", labelKo: "5급 (고급 1)", labelJa: "5級（高級1・正規/短期）" },
  { value: "6급 (6級 · 고급)", labelKo: "6급 (고급 2)", labelJa: "6級（高級2・正規/短期）" },
];

const INTL_PROGRAM_OPTIONS = [
  {
    value: "학부 정규 유학생 (正規学部留学生)",
    labelKo: "학부 정규 유학생 (학위 과정)",
    labelJa: "正規学部留学生（4年制学位課程）",
  },
  {
    value: "교환·방문 유학생 (交換・訪問留学生)",
    labelKo: "교환·방문 유학생 (1학기~1년)",
    labelJa: "交換・訪問留学生（1学期〜1年派遣）",
  },
  {
    value: "대학원 정규 유학생 (正規大学院留学生)",
    labelKo: "대학원 석·박사 유학생",
    labelJa: "正規大学院留学生（修士・博士課程）",
  },
];

const MAJOR_CATEGORY_OPTIONS = [
  { ko: "경영·경제학부", ja: "経営・経済学部" },
  { ko: "컴퓨터·AI·공학계열", ja: "コンピュータ・AI・工学系" },
  { ko: "미디어·사회과학계열", ja: "メディア・社会科学系" },
  { ko: "인문·어문학계열", ja: "人文・語文学系" },
  { ko: "자연과학·의약학계열", ja: "自然科学・医薬学系" },
  { ko: "디자인·예체능계열", ja: "デザイン・芸術体育系" },
] as const;

type AiVerifyState = "IDLE" | "ANALYZING" | "VERIFIED" | "REJECTED";

// 운영자 확인용 학생증 사진: 컬러 JPEG, 긴 변 최대 1600px (보관함 용량 제한 5MB)
function toReviewJpeg(dataUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

const SIGNUP_DRAFT_KEY = "ondo_signup_draft_v1";

type SignupDraft = Record<string, unknown>;
type SignupQuery = { lang: string | null; track: string | null; from: string | null };

const subscribeNothing = () => () => {};

/**
 * 정적 빌드 HTML과 맞추기 위해 처음에는 빈 폼을 그리고,
 * 브라우저에서 임시 저장된 입력값(sessionStorage)과 주소 쿼리를 읽은 뒤 한 번 다시 마운트함.
 */
export default function JoinPage() {
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
  const draft = parseJsonObject(useSessionStorageItem(SIGNUP_DRAFT_KEY));
  const params = new URLSearchParams(useInitialSearch());
  return (
    <JoinForm
      key={isClient ? "client" : "server"}
      hydrated={isClient}
      draft={isClient ? draft : null}
      query={{
        lang: params.get("lang"),
        track: params.get("track"),
        from: params.get("from"),
      }}
    />
  );
}

function JoinForm({
  hydrated,
  draft: d,
  query,
}: {
  hydrated: boolean;
  draft: SignupDraft | null;
  query: SignupQuery;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [locale, setLocale] = useAppLocale();
  const isJa = locale === "ja";

  // 첫 값: 주소의 ?track= 이 있으면 우선, 없으면 임시 저장된 입력값, 그다음 기본값
  const queryTrack: CampusTrackType | null =
    query.track === "KLI_JP" || query.track === "INTL_JP" ? query.track : null;
  const draftText = (key: string) =>
    typeof d?.[key] === "string" && d[key] ? (d[key] as string) : null;

  const [campusTrack, setCampusTrack] = useState<CampusTrackType>(
    () => queryTrack ?? (draftText("campusTrack") as CampusTrackType | null) ?? "DEGREE"
  );
  const [nickname, setNickname] = useState(() => draftText("nickname") ?? "");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "">(() =>
    d?.gender === "FEMALE" || d?.gender === "MALE" ? d.gender : ""
  );
  const [age, setAge] = useState(() => draftText("age") ?? "");
  const [school, setSchool] = useState<string>(() =>
    queryTrack ? "" : draftText("school") ?? ""
  );
  const [department, setDepartment] = useState(() => draftText("department") ?? "");
  const [kliLevel, setKliLevel] = useState(
    () => draftText("kliLevel") ?? KLI_LEVEL_OPTIONS[2].value
  );
  const [intlProgramType, setIntlProgramType] = useState(
    () => draftText("intlProgramType") ?? INTL_PROGRAM_OPTIONS[0].value
  );
  const [intlVerifyMethod, setIntlVerifyMethod] = useState<
    "WEBMAIL" | "STUDENT_ID"
  >(() => (d?.intlVerifyMethod === "STUDENT_ID" ? "STUDENT_ID" : "WEBMAIL"));
  const [japaneseConfirmed, setJapaneseConfirmed] = useState(
    () => d?.japaneseConfirmed === true
  );
  const [sido, setSido] = useState(() => draftText("sido") ?? "서울특별시");
  const [sigungu, setSigungu] = useState(() => draftText("sigungu") ?? "서대문구");
  const [heightPrefs] = useState<string[]>(() =>
    Array.isArray(d?.heightPrefs)
      ? (d.heightPrefs as string[])
      : ["171_175", "176_180", "181_185"]
  );
  const [kakaoId, setKakaoId] = useState(() => draftText("kakaoId") ?? "");
  const [loading, setLoading] = useState(false);

  // AI Student ID / Certificate Verification State
  const [aiStatus, setAiStatus] = useState<AiVerifyState>("IDLE");
  const [aiStepText, setAiStepText] = useState("");
  const [aiReason, setAiReason] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 올린 학생증 사진 (가입 완료 시 운영자 확인용으로 업로드)
  const [studentIdBlob, setStudentIdBlob] = useState<Blob | null>(null);
  const [hasKakaoSession, setHasKakaoSession] = useState<boolean | null>(null);

  // 한국 대학생: 학교 메일 인증
  const [schoolEmail, setSchoolEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailStage, setEmailStage] = useState<
    "idle" | "sending" | "sent" | "verifying" | "verified"
  >("idle");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const handleSelectUniversity = (univValue: string) => {
    setSchool(univValue);
    if (emailStage !== "verified") {
      setEmailMsg(null);
    }
    const matched = CAPITAL_UNIV_OPTIONS.find((u) => u.value === univValue);
    if (matched) {
      setSido(matched.sido);
      setSigungu(matched.sigungu);
    }
  };

  const persistSignupDraft = () => {
    try {
      window.sessionStorage.setItem(
        SIGNUP_DRAFT_KEY,
        JSON.stringify({
          campusTrack,
          nickname,
          age,
          gender,
          school,
          department,
          kliLevel,
          intlProgramType,
          intlVerifyMethod,
          japaneseConfirmed,
          kakaoId,
          sido,
          sigungu,
          heightPrefs,
          schoolEmail,
        })
      );
    } catch {
      // ignore
    }
  };

  // 페이지 진입 시 강제 리다이렉트 루프를 일으키지 않고 카카오 세션 상태만 확인 + 레거시 자동생성 계정 자동 초기화
  useEffect(() => {
    // 정적 HTML용 첫 마운트에서는 건너뛰고, 브라우저에서 다시 마운트된 폼에서만 한 번 실행
    if (!hydrated) return;
    (async () => {
      const authUserId = await getAuthUserId();
      if (authUserId) {
        const existing = await fetchMyMemberSecure();
        if (existing && isStaleAutoCreatedMember(existing)) {
          const res = await purgeStaleMemberRow(existing);
          setHasKakaoSession(res.sessionKept ? !!(await getAuthUserId()) : false);
          return;
        }
      }
      setHasKakaoSession(!!authUserId);
    })();
  }, [hydrated]);

  // 주소 쿼리(?lang=ja&track=...)는 첫 값에만 쓰고 바로 지워서, 이후 사용자가 바꾼 언어·트랙을 덮어쓰지 않게 함
  useEffect(() => {
    if (query.lang === "ja") setLocale("ja");
    if (query.lang || query.track || query.from) {
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        // ignore
      }
    }
  }, [query.lang, query.track, query.from, setLocale]);

  const isJapaneseTrack =
    campusTrack === "KLI_JP" || campusTrack === "INTL_JP";
  // 한국 대학생(DEGREE), 일본인 어학당생(KLI_JP), 일본인 대학 유학생(INTL_JP) 모두
  // 학교 공식 웹메일 인증(WEBMAIL) 또는 학생증(도서관 모바일 이용증 등 신분 입증 자료) 인증(STUDENT_ID) 중 선택 가능
  const usesStudentIdVerification = intlVerifyMethod === "STUDENT_ID";
  const emailGuide = getUnivEmailGuide(school, isJa);

  // 학생증 사진은 자동 검사 없이 그대로 받아 두었다가, 가입 완료 시 운영자 확인용으로 업로드
  const handleStudentIdFile = async (file: File) => {
    setAiStatus("ANALYZING");
    setAiReason("");
    setAiStepText(isJa ? "写真を準備しています..." : "사진을 준비하는 중...");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read_error"));
        reader.readAsDataURL(file);
      });
      const blob = await toReviewJpeg(dataUrl);
      if (!blob) throw new Error("image_error");
      setStudentIdBlob(blob);
      setAiStatus("VERIFIED");
      setAiReason(
        isJa
          ? "登録を完了すると、運営者が学生証を直接確認して承認します。（写真は運営者のみ閲覧でき、承認・却下の直後に削除されます）"
          : "가입을 완료하면 운영자가 학생증을 직접 확인한 뒤 승인해 드려요. (사진은 운영자만 볼 수 있고, 승인·반려 즉시 삭제돼요)"
      );
    } catch {
      setStudentIdBlob(null);
      setAiStatus("REJECTED");
      setAiReason(
        isJa
          ? "画像ファイルを読み込めませんでした。別の写真でもう一度お試しください。"
          : "사진 파일을 읽지 못했어요. 다른 사진으로 다시 시도해 주세요."
      );
    }
  };

  // 입력값 검사 후 서버에 저장할 프로필을 만듦 (학생 인증 여부와 무관)
  // showError: 오류를 누른 버튼 바로 옆에 보여 주기 위한 콜백
  const buildProfile = async (
    showError: (msg: string) => void = setSubmitError,
    requireKakaoId = true
  ) => {
    setSubmitError(null);
    if (nickname.trim().length < 2) {
      showError(
        isJa
          ? "使用するニックネームを2文字以上直接入力してください。（🎲ボタンでおすすめも選べます）"
          : "사용할 닉네임을 2자 이상 직접 입력해 주세요. (원하시면 🎲 버튼으로 추천받을 수도 있어요)"
      );
      return null;
    }

    const parsedAge = Number(age.trim());
    if (!age.trim() || !Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 40) {
      showError(
        isJa
          ? "満年齢（18〜40歳）を直接入力してください。"
          : "만 나이(18~40세)를 직접 입력해 주세요."
      );
      return null;
    }

    if (gender !== "FEMALE" && gender !== "MALE") {
      showError(
        isJa
          ? "性別（女性または男性）を選択してください。"
          : "내 성별(여성 또는 남성)을 선택해 주세요."
      );
      return null;
    }

    if (!school.trim()) {
      showError(
        isJa
          ? "在学中の大学（または語学堂）を選択してください。"
          : "재학 중인 대학교(또는 어학당)를 선택해 주세요."
      );
      return null;
    }

    if (isJapaneseTrack && !japaneseConfirmed) {
      showError(
        isJa
          ? "日本国籍（必須確認）のチェックボックスに同意していただく必要があります。"
          : "일본 국적 필수 확인 체크박스에 동의하셔야 가입이 완료됩니다."
      );
      return null;
    }

    if (campusTrack !== "KLI_JP" && !department.trim()) {
      showError(
        isJa
          ? "所属学部・専攻を入力してください。"
          : "소속 학과·전공을 직접 입력하거나 아래 버튼에서 선택해 주세요."
      );
      return null;
    }

    if (requireKakaoId && (!kakaoId.trim() || kakaoId.trim().length < 2)) {
      showError(
        isJa
          ? "本人確認およびマッチング成立後の連絡先交換のため、ご自身のカカオトークIDを入力してください。"
          : "본인 확인 및 매칭 성사 후 연락처 교환을 위해 본인의 카카오톡 ID를 직접 입력해 주세요."
      );
      return null;
    }

    const authUserId = await getAuthUserId();
    if (!authUserId) {
      persistSignupDraft();
      await signInWithKakao(ROUTES.JOIN);
      return null;
    }
    const finalKakao = kakaoId.trim() || "미등록";
    // 회원 id는 서버(ondo_upsert_my_profile)와 동일하게 카카오 로그인 계정으로 결정
    const newUid = `u-${authUserId}`;
    const finalSchool = school.trim();
    const finalDept =
      campusTrack === "KLI_JP"
        ? `🇯🇵 일본인 어학당생 · ${kliLevel}`
        : campusTrack === "INTL_JP"
        ? `🇯🇵 일본인 유학생 (${intlProgramType.split(" ")[0]}) · ${
            department.trim()
          }`
        : department.trim();

    const updatedUser = {
      ...EMPTY_USER_PROFILE,
      uid: newUid,
      nickname: nickname.trim(),
      gender,
      age: parsedAge,
      school: finalSchool,
      department: finalDept,
      preferredHeight: heightPrefs.join(","),
      location: null,
      bio: "",
      verificationStatus: (
        !usesStudentIdVerification && emailStage === "verified"
          ? "verified"
          : "pending_review"
      ) as "verified" | "pending_review",
      selfRegisteredV2: true,
    };
    return { updatedUser, finalKakao };
  };

  const saveProfile = async (
    profile: NonNullable<Awaited<ReturnType<typeof buildProfile>>>
  ) => {
    // 이전에 자동 인증되어 있던 레거시 행이 남아 있어 학교 변경이나 재인증을 막고 있다면 먼저 초기화
    const existing = await fetchMyMemberSecure();
    if (
      existing &&
      (isStaleAutoCreatedMember(existing) ||
        (existing.verified && emailStage !== "verified"))
    ) {
      await purgeStaleMemberRow(existing);
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.isLoggedIn = true;
      parsed.user = profile.updatedUser;
      parsed.kakaoId = profile.finalKakao;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      window.sessionStorage.removeItem("ondo_signup_draft_v1");
      window.dispatchEvent(new Event("ondo-auth-change"));
    } catch {
      // ignore
    }
    return syncUserProfileToSupabase(profile.updatedUser, profile.finalKakao);
  };

  // 한국 대학생 및 일본인 대학 유학생(웹메일 선택 시): 서버에 소속 학교를 먼저 동기화한 뒤 학교 메일로 인증번호 발송
  const handleSendSchoolCode = async () => {
    setEmailMsg(null);
    if (!schoolEmail.trim()) {
      setEmailMsg(
        isJa
          ? "大学の公式ウェブメールアドレスを入力してください。"
          : "학교 메일 주소를 입력해 주세요."
      );
      return;
    }
    const profile = await buildProfile(setEmailMsg, false);
    if (!profile) return;
    setEmailStage("sending");

    // 이전에 자동 인증되어 있던 레거시 행이 있으면 먼저 정리해야 새 학교로 메일 인증번호를 받을 수 있음
    const existing = await fetchMyMemberSecure();
    if (existing && (isStaleAutoCreatedMember(existing) || existing.verified)) {
      await purgeStaleMemberRow(existing);
    }

    if (
      !(await syncUserProfileToSupabase(
        profile.updatedUser,
        profile.finalKakao
      ))
    ) {
      setEmailStage("idle");
      setEmailMsg(
        isJa
          ? "プロフィールの保存に失敗しました。しばらくしてから再度お試しください。"
          : "프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요."
      );
      return;
    }
    const result = await requestSchoolEmailCode(schoolEmail.trim());
    if (result.ok) {
      setEmailStage("sent");
      setEmailMsg(
        isJa
          ? `${schoolEmail.trim()} 宛に6桁の認証番号を送信しました。10分以内に入力してください。（届かない場合は迷惑メールフォルダもご確認ください）`
          : `${schoolEmail.trim()}로 6자리 인증번호를 보냈어요. 10분 안에 입력해 주세요. (메일이 안 보이면 스팸함도 확인해 주세요)`
      );
      return;
    }
    const dispSchoolName = isJa
      ? UNIV_LABEL_JA[school.trim()] || school.trim()
      : school.trim();
    setEmailStage(result.error === "already_verified" ? "verified" : "idle");
    setEmailMsg(
      result.error === "invalid_email"
        ? isJa
          ? `${dispSchoolName}の公式大学ウェブメールアドレスではありません。選択した大学から発行されたウェブメールアドレス（${emailGuide.domainBadge || "@ac.kr"}）を入力してください。`
          : `${school.trim()}의 공식 학교 웹메일 주소가 아니에요. 선택한 대학교에서 발급한 웹메일 주소(${emailGuide.domainBadge || "@ac.kr"})를 입력해 주세요.`
        : result.error === "school_not_supported"
        ? isJa
          ? `${dispSchoolName}はまだ大学メールドメインが登録されていません。カカオ1:1相談室へ大学メールアドレスをお知らせいただければすぐに追加いたします。`
          : `${school.trim()}는 아직 학교 메일 도메인이 등록되지 않았어요. 카톡 고객센터로 학교 메일 주소(예: @xxx.ac.kr)를 알려 주시면 바로 추가해 드릴게요.`
        : result.error === "email_used"
        ? isJa
          ? "すでに他のアカウントで認証に使用されている大学メールです。"
          : "이미 다른 계정에서 인증에 사용된 학교 메일이에요."
        : result.error === "too_many"
        ? isJa
          ? "認証番号のリクエストが多すぎます。1分後に再度お試しください。（1日最大5回）"
          : "인증번호를 너무 자주 요청했어요. 1분 뒤에 다시 시도해 주세요. (하루 최대 5번)"
        : result.error === "already_verified"
        ? isJa
          ? "すでに大学メール認証が完了しています。"
          : "이미 학교 메일 인증을 마쳤어요."
        : result.error === "not_configured"
        ? isJa
          ? "現在、大学ウェブメール送信設定を確認中です。カカオ1:1相談室へお問い合わせいただければすぐにご案内いたします。"
          : "현재 학교 웹메일 발송 설정을 확인 중이에요. 카톡 1:1 고객센터로 문의해 주시면 즉시 도와드릴게요."
        : isJa
        ? "認証番号の送信に失敗しました。しばらくしてから再度お試しいただくか、カカオ1:1相談室へお問い合わせください。"
        : "인증번호 발송에 실패했어요. 잠시 후 다시 시도하거나 카톡 1:1 고객센터로 문의해 주세요."
    );
  };

  const handleVerifySchoolCode = async () => {
    setEmailMsg(null);
    if (!/^\d{6}$/.test(emailCode.trim())) {
      setEmailMsg(
        isJa
          ? "メールで届いた6桁の数字を入力してください。"
          : "메일로 받은 6자리 숫자를 입력해 주세요."
      );
      return;
    }
    setEmailStage("verifying");
    const result = await verifySchoolEmailCode(emailCode.trim());
    if (result.ok) {
      setEmailStage("verified");
      setEmailMsg(
        isJa
          ? "大学ウェブメール認証が完了しました！このまま会員登録を完了できます。"
          : "학교 메일 인증 완료! 이제 가입을 마칠 수 있어요."
      );
      return;
    }
    setEmailStage("sent");
    setEmailMsg(
      result.error === "wrong"
        ? isJa
          ? "認証番号が一致しません。もう一度ご確認ください。（5回間違えると再取得が必要です）"
          : "인증번호가 맞지 않아요. 다시 확인해 주세요. (5번 틀리면 새로 받아야 해요)"
        : result.error === "expired"
        ? isJa
          ? "認証番号の有効期限が切れました。認証番号を再取得してください。"
          : "인증번호가 만료됐어요. 인증번호를 다시 받아 주세요."
        : result.error === "too_many"
        ? isJa
          ? "5回以上間違えました。認証番号を再取得してください。"
          : "5번 넘게 틀렸어요. 인증번호를 다시 받아 주세요."
        : isJa
        ? "認証の確認に失敗しました。しばらくしてから再度お試しください。"
        : "인증 확인에 실패했어요. 잠시 후 다시 시도해 주세요."
    );
  };

  const handleStart = async () => {
    setSubmitError(null);

    if (!usesStudentIdVerification && emailStage !== "verified") {
      setSubmitError(
        isJa
          ? "在学中の学校の公式ウェブメール認証（6桁コード確認）を先に完了してください。（ウェブメールがない場合は上で「🪪 学生証・モバイル身分証認証」に切り替えて登録できます）"
          : "재학 중인 학교 공식 웹메일 6자리 인증번호 확인을 먼저 완료해 주세요. (웹메일이 없거나 인증이 어려운 경우 위에서 '🪪 학생증·모바일 신분증 인증'으로 전환할 수 있어요)"
      );
      return;
    }

    if (usesStudentIdVerification && (aiStatus !== "VERIFIED" || !studentIdBlob)) {
      setAiStatus("REJECTED");
      const msg = isJa
        ? "ONDO 36.5°は100%学生認証制です。学生証（または図書館モバイル利用証などご自身の身分を証明できるもの）の写真を先にアップロードしてください。運営チームが直接確認して承認します。"
        : "ONDO 36.5°는 100% 학생 인증제예요. 학생증(또는 도서관 모바일 이용증 등 본인의 신분을 입증할 수 있는 자료) 사진을 먼저 올려 주세요. 운영자가 직접 확인해 승인해 드려요.";
      setAiReason(msg);
      setSubmitError(msg);
      return;
    }

    const profile = await buildProfile();
    if (!profile) return;
    setLoading(true);
    if (!(await saveProfile(profile))) {
      setLoading(false);
      setSubmitError(
        isJa
          ? "プロフィールの保存に失敗しました。しばらくしてから再度お試しください。"
          : "프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요."
      );
      return;
    }

    if (usesStudentIdVerification && studentIdBlob) {
      if (!(await submitStudentIdForReview(studentIdBlob))) {
        setLoading(false);
        setSubmitError(
          isJa
            ? "学生証のアップロードに失敗しました。もう一度お試しいただくか、カカオ1:1相談室へご連絡ください。"
            : "학생증 업로드에 실패했어요. 다시 시도하거나 카톡 고객센터로 문의해 주세요."
        );
        return;
      }
    }
    setLoading(false);
    router.push("/?view=note&setup=1");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "ONDO 36.5° プロフィール登録" : "ONDO 36.5° 주파수 등록"}
        back
      />

      <div className="flex-1 space-y-5 px-5 py-6">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-zinc-900">
            {isJa
              ? "キャンパス所属と理想の条件設定"
              : "내 캠퍼스 프로필과 주파수 설정"}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
            {isJa
              ? "韓国の大学生、日本人語学堂生、日本人正規・交換留学生のためのプライベート・マッチングラウンジです。"
              : "한국 대학교 재학생, 🇯🇵 일본인 어학당 학생, 🇯🇵 일본인 대학교 유학생 전용 캠퍼스 매칭 라운지입니다."}
          </p>
        </div>

        {/* Kakao Account Verification Banner (Non-blocking on load, preserves draft on click) */}
        {hasKakaoSession === false ? (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[13px] font-extrabold text-zinc-900">
                {isJa
                  ? "🪪 1ステップ：カカオ3秒本人確認（必須）"
                  : "🪪 1단계: 카카오 3초 본인 확인 (필수)"}
              </p>
              <p className="mt-0.5 text-[12px] text-zinc-600">
                {isJa
                  ? "先にカカオ連携を行うか、下の項目を入力した後に連携できます（入力内容は自動保存されます）。"
                  : "먼저 카카오 연동을 하거나, 아래 항목을 입력한 뒤 연동할 수 있어요 (입력한 내용은 자동 보존됩니다)."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                persistSignupDraft();
                signInWithKakao(ROUTES.JOIN);
              }}
              className="shrink-0 rounded-xl bg-[#FEE500] px-3.5 py-2.5 text-[12px] font-extrabold text-[#191919] shadow-2xs hover:brightness-95"
            >
              {isJa ? "💬 カカオで本人確認" : "💬 카카오 3초 본인 확인"}
            </button>
          </div>
        ) : hasKakaoSession === true ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[12px] font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              {isJa
                ? "カカオアカウント連携済み — 下のプロフィールと学生認証を入力して登録を完了してください"
                : "카카오 계정 연동 완료 — 아래 프로필과 학교 인증을 입력해 회원가입을 완료해 주세요"}
            </span>
          </div>
        ) : null}

        {/* 3-Track Campus Track Selector: Korean Degree vs Japanese KLI vs Japanese Intl/Exchange */}
        <div>
          <label className={FIELD_LABEL}>
            {isJa
              ? "キャンパス所属区分（3つのトラックから選択）"
              : "내 캠퍼스 소속 구분 (3개 트랙 중 선택)"}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* Track 1: Korean Degree Student */}
            <button
              type="button"
              onClick={() => {
                setCampusTrack("DEGREE");
                setJapaneseConfirmed(false);
                setSubmitError(null);
                if (
                  school &&
                  !CAPITAL_UNIV_OPTIONS.some((u) => u.value === school)
                ) {
                  setSchool("");
                }
              }}
              className={cn(
                "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all",
                campusTrack === "DEGREE"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-stone-200 bg-white text-zinc-700 hover:border-stone-300"
              )}
            >
              <GraduationCap className="h-4 w-4 text-rose-500" />
              <span className="mt-1.5 text-[13px] font-extrabold">
                {isJa ? "🇰🇷 韓国の大学生" : "🇰🇷 한국 대학생"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[12px] leading-snug",
                  campusTrack === "DEGREE" ? "text-zinc-300" : "text-zinc-400"
                )}
              >
                {isJa ? "学部・大学院 正規在学生" : "학부·대학원 재학생"}
              </span>
            </button>

            {/* Track 2: Japanese KLI Student (어학당 학생) */}
            <button
              type="button"
              onClick={() => {
                setCampusTrack("KLI_JP");
                setSubmitError(null);
                if (school && !KLI_INSTITUTES.includes(school)) {
                  setSchool("");
                }
              }}
              className={cn(
                "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all",
                campusTrack === "KLI_JP"
                  ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                  : "border-stone-200 bg-white text-zinc-700 hover:border-stone-300"
              )}
            >
              <BookOpen
                className={cn(
                  "h-4 w-4",
                  campusTrack === "KLI_JP" ? "text-white" : "text-rose-600"
                )}
              />
              <span className="mt-1.5 text-[13px] font-extrabold">
                {isJa ? "🇯🇵 日本人 語学堂生" : "🇯🇵 일본인 어학당생"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[12px] leading-snug",
                  campusTrack === "KLI_JP" ? "text-rose-100" : "text-zinc-400"
                )}
              >
                {isJa
                  ? "大学付属語学堂・言語教育院"
                  : "대학교 부설 어학당·언어교육원"}
              </span>
            </button>

            {/* Track 3: Japanese International / Exchange Degree Student (일본인 대학교 유학생) */}
            <button
              type="button"
              onClick={() => {
                setCampusTrack("INTL_JP");
                setSubmitError(null);
                if (
                  school &&
                  !CAPITAL_UNIV_OPTIONS.some((u) => u.value === school)
                ) {
                  setSchool("");
                }
              }}
              className={cn(
                "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all",
                campusTrack === "INTL_JP"
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-stone-200 bg-white text-zinc-700 hover:border-stone-300"
              )}
            >
              <Globe2
                className={cn(
                  "h-4 w-4",
                  campusTrack === "INTL_JP" ? "text-white" : "text-indigo-600"
                )}
              />
              <span className="mt-1.5 text-[13px] font-extrabold">
                {isJa ? "🇯🇵 日本人 大学留学生" : "🇯🇵 일본인 대학 유학생"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[12px] leading-snug",
                  campusTrack === "INTL_JP"
                    ? "text-indigo-100"
                    : "text-zinc-400"
                )}
              >
                {isJa
                  ? "正規学部・交換・大学院留学生"
                  : "학부 정규·교환·대학원 유학생"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-gray-600">
                {isJa ? "ニックネーム（直接入力）" : "닉네임 (직접 입력)"}
              </label>
              <button
                type="button"
                onClick={() => {
                  setNickname((prev) => generateWittyNickname(isJa, prev));
                }}
                className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
              >
                {isJa ? "🎲 おすすめ" : "🎲 자동 추천"}
              </button>
            </div>
            <input
              className={FIELD_INPUT}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={
                isJa
                  ? "ニックネームを直接入力（2文字以上）"
                  : "사용할 닉네임을 직접 입력 (2자 이상)"
              }
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "満年齢（歳）" : "만 나이"}
            </label>
            <input
              type="number"
              className={FIELD_INPUT}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={isJa ? "例: 22" : "예: 22"}
              min={18}
              max={40}
            />
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL}>{isJa ? "性別（選択）" : "내 성별 (선택)"}</label>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                {
                  val: "FEMALE",
                  labelKo: "여성",
                  labelJa: "女性",
                },
                { val: "MALE", labelKo: "남성", labelJa: "男性" },
              ] as const
            ).map((g) => (
              <button
                key={g.val}
                type="button"
                onClick={() => setGender(g.val)}
                className={cn(
                  "rounded-2xl border py-3 text-[13px] font-bold transition-all",
                  gender === g.val
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-stone-200 bg-white text-zinc-700"
                )}
              >
                {isJa ? g.labelJa : g.labelKo}
              </button>
            ))}
          </div>
        </div>

        {/* Track-specific School & Program Inputs */}
        {campusTrack === "DEGREE" && (
          <div className="space-y-2.5">
            <div>
              <label className={FIELD_LABEL}>
                {isJa
                  ? "在学中の大学を選択（ソウル・京畿・仁川圏 78校）"
                  : "소속 대학교 선택 (서울·경기·인천권 78개교)"}
              </label>
              <SelectField value={school} onChange={handleSelectUniversity}>
                <option value="">
                  {isJa
                    ? "-- 在学中の大学を選択してください --"
                    : "-- 재학 중인 대학교를 선택해 주세요 --"}
                </option>
                {CAPITAL_UNIV_GROUPS.map((grp) => (
                  <optgroup
                    key={grp.regionKo}
                    label={isJa ? grp.regionJa : grp.regionKo}
                  >
                    {grp.items.map((u) => (
                      <option key={u.value} value={u.value}>
                        {isJa ? u.labelJa : u.labelKo}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>
            </div>
            <div>
              <label className={FIELD_LABEL}>
                {isJa
                  ? "所属学部・専攻（タップで簡単選択または入力）"
                  : "소속 학과·전공 (클릭하여 간편 선택 또는 직접 입력)"}
              </label>
              <input
                className={FIELD_INPUT}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={isJa ? "例: 経営学科" : "예: 경영학과"}
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MAJOR_CATEGORY_OPTIONS.map((m) => {
                  const val = isJa ? m.ja : m.ko;
                  const active = department === val;
                  return (
                    <button
                      key={m.ko}
                      type="button"
                      onClick={() => setDepartment(val)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors",
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-stone-200 bg-white text-zinc-600 hover:bg-stone-100"
                      )}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {campusTrack === "KLI_JP" && (
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-extrabold text-rose-700">
                {isJa
                  ? "🇯🇵 日本人 語学堂生 専用トラック（ソウル・京畿・仁川 62校）"
                  : "🇯🇵 일본인 어학당 학생 전용 트랙 (서울·경기·인천 62개교)"}
              </span>
            </div>
            <div>
              <label className={FIELD_LABEL}>
                {isJa
                  ? "在学中の大学付属語学堂・言語教育院を選択"
                  : "소속 대학교 어학당 / 언어교육원 선택 (서울·경기·인천 62개교)"}
              </label>
              <SelectField
                value={school}
                onChange={(v) => {
                  setSchool(v);
                  if (v.includes("(인천")) {
                    setSido("인천광역시");
                    setSigungu(
                      v.includes("송도")
                        ? "연수구"
                        : v.includes("계양")
                        ? "계양구"
                        : "미추홀구"
                    );
                  } else if (
                    v.includes("(성남)") ||
                    v.includes("(용인") ||
                    v.includes("(수원)") ||
                    v.includes("(안산)") ||
                    v.includes("(고양)") ||
                    v.includes("(시흥)") ||
                    v.includes("(화성)") ||
                    v.includes("(안성)") ||
                    v.includes("(안양)") ||
                    v.includes("(오산)") ||
                    v.includes("(평택)") ||
                    v.includes("(의정부)") ||
                    v.includes("(포천)")
                  ) {
                    setSido("경기도");
                    setSigungu(DISTRICTS_BY_SIDO["경기도"]?.[0] ?? "수원시");
                  } else {
                    setSido("서울특별시");
                  }
                }}
              >
                <option value="">
                  {isJa
                    ? "-- 在学中の語学堂・言語教育院を選択してください --"
                    : "-- 재학 중인 어학당·언어교육원을 선택해 주세요 --"}
                </option>
                {KLI_INSTITUTE_GROUPS.map((grp) => (
                  <optgroup
                    key={grp.regionKo}
                    label={isJa ? grp.regionJa : grp.regionKo}
                  >
                    {grp.items.map((inst) => (
                      <option key={inst} value={inst}>
                        {isJa ? KLI_INSTITUTE_LABEL_JA[inst] || inst : inst}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>
            </div>

            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "現在の語学堂の級・課程" : "현재 수강 급수·과정"}
              </label>
              <SelectField value={kliLevel} onChange={setKliLevel}>
                {KLI_LEVEL_OPTIONS.map((lv) => (
                  <option key={lv.value} value={lv.value}>
                    {isJa ? lv.labelJa : lv.labelKo}
                  </option>
                ))}
              </SelectField>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-rose-200 bg-white p-3 text-[12px] font-semibold text-zinc-800">
              <input
                type="checkbox"
                checked={japaneseConfirmed}
                onChange={(e) => setJapaneseConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-rose-600"
              />
              <span>
                <strong className="text-rose-600">
                  {isJa ? "[必須確認] " : "[필수 확인] "}
                </strong>
                {isJa
                  ? "私は日本国籍であり、韓国の大学付属語学堂に在学中であることを確認します。"
                  : "본인은 일본 국적의 한국 대학교 부설 어학당 재학생임을 확인합니다."}
              </span>
            </label>
          </div>
        )}

        {campusTrack === "INTL_JP" && (
          <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-extrabold text-indigo-700">
                {isJa
                  ? "🇯🇵 日本人 正規学部・交換・大学院留学生 専用トラック"
                  : "🇯🇵 일본인 대학교 정규·교환 유학생 전용 트랙"}
              </span>
            </div>

            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "留学課程の区分" : "유학 과정 구분"}
              </label>
              <SelectField
                value={intlProgramType}
                onChange={setIntlProgramType}
              >
                {INTL_PROGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isJa ? opt.labelJa : opt.labelKo}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className={FIELD_LABEL}>
                  {isJa
                    ? "在学中の韓国の大学を選択（ソウル・京畿・仁川圏 78校）"
                    : "재학 중인 대학교 선택 (서울·경기·인천권 78개교)"}
                </label>
                <SelectField value={school} onChange={handleSelectUniversity}>
                  <option value="">
                    {isJa
                      ? "-- 在学中の大学を選択してください --"
                      : "-- 재학 중인 대학교를 선택해 주세요 --"}
                  </option>
                  {CAPITAL_UNIV_GROUPS.map((grp) => (
                    <optgroup
                      key={grp.regionKo}
                      label={isJa ? grp.regionJa : grp.regionKo}
                    >
                      {grp.items.map((u) => (
                        <option key={u.value} value={u.value}>
                          {isJa ? u.labelJa : u.labelKo}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </SelectField>
              </div>
              <div>
                <label className={FIELD_LABEL}>
                  {isJa
                    ? "所属学部・専攻（タップで学部系列を簡単選択または直接入力）"
                    : "소속 학과·전공 (클릭하여 학부 계열 간편 선택 또는 직접 입력)"}
                </label>
                <input
                  className={FIELD_INPUT}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={isJa ? "例: メディア学部" : "예: 미디어학과"}
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {MAJOR_CATEGORY_OPTIONS.map((m) => {
                    const val = isJa ? m.ja : m.ko;
                    const active = department === val;
                    return (
                      <button
                        key={m.ko}
                        type="button"
                        onClick={() => setDepartment(val)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors",
                          active
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-stone-200 bg-white text-zinc-600 hover:bg-stone-100"
                        )}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-indigo-200 bg-white p-3 text-[12px] font-semibold text-zinc-800">
              <input
                type="checkbox"
                checked={japaneseConfirmed}
                onChange={(e) => setJapaneseConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-indigo-600"
              />
              <span>
                <strong className="text-indigo-600">
                  {isJa ? "[必須確認] " : "[필수 확인] "}
                </strong>
                {isJa
                  ? "私は日本国籍であり、韓国の大学の正規学部・交換・大学院に在学中の留学生であることを確認します。"
                  : "본인은 일본 국적의 한국 대학교 정규 학위과정 또는 교환 유학생임을 확인합니다."}
              </span>
            </label>
          </div>
        )}

        <div>
          <label className={FIELD_LABEL}>
            {isJa
              ? "本人確認・安心連絡先（カカオトークID・5往復の会話後に公開）"
              : "본인 확인 및 안심 연락처 (내 카카오톡 ID 직접 입력 · 5턴 대화 후 공개)"}
          </label>
          <input
            className={FIELD_INPUT}
            value={kakaoId}
            onChange={(e) => setKakaoId(e.target.value)}
            placeholder={
              isJa
                ? "ご自身のカカオトークIDを入力してください"
                : "본인의 카카오톡 ID를 직접 입력해 주세요"
            }
          />
        </div>

        {/* Unified Verification Method Selector for ALL 3 Tracks (Korean Degree, Japanese KLI, Japanese University Student) */}
        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5">
          <label className="block text-[12px] font-extrabold text-rose-800">
            {isJa
              ? "🪪 学生認証方法を選択（ウェブメールまたは学生証のどちらも可能）"
              : "🪪 학생 인증 방식 선택 (웹메일 또는 학생증 중 편한 방식으로 선택)"}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setIntlVerifyMethod("WEBMAIL");
                setSubmitError(null);
              }}
              className={cn(
                "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                intlVerifyMethod === "WEBMAIL"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                  : "border-stone-200 bg-white text-zinc-700 hover:border-rose-300"
              )}
            >
              <span className="text-[13px] font-extrabold">
                {isJa
                  ? "📧 学校公式ウェブメール認証"
                  : "📧 학교 공식 웹메일 인증"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[11px]",
                  intlVerifyMethod === "WEBMAIL"
                    ? "text-zinc-300"
                    : "text-zinc-500"
                )}
              >
                {isJa
                  ? "6桁コードで待ち時間なし・即時承認"
                  : "6자리 인증번호로 대기 없이 즉시 승인"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIntlVerifyMethod("STUDENT_ID");
                setSubmitError(null);
              }}
              className={cn(
                "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                intlVerifyMethod === "STUDENT_ID"
                  ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                  : "border-stone-200 bg-white text-zinc-700 hover:border-rose-300"
              )}
            >
              <span className="text-[13px] font-extrabold">
                {isJa
                  ? "🪪 学生証・モバイル身分証認証"
                  : "🪪 학생증·모바일 신분증 인증"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[11px]",
                  intlVerifyMethod === "STUDENT_ID"
                    ? "text-rose-100"
                    : "text-zinc-500"
                )}
              >
                {isJa
                  ? "実物学生証・図書館モバイル利用証など身分証明なら何でもOK"
                  : "실물 학생증·도서관 모바일 이용증 등 신분 입증 자료 가능"}
              </span>
            </button>
          </div>
          <p className="text-[11.5px] font-medium leading-relaxed text-zinc-600">
            {isJa
              ? "💡 韓国の大学生・語学堂生・日本人留学生すべて同じ認証方式をご利用いただけます。学生証認証は図書館モバイル利用証など、ご自身の身分を証明できるものなら何でもOKです。"
              : "💡 한국 대학생·어학당 학생·일본 유학생 모두 웹메일 또는 학생증 중 편한 방식을 선택할 수 있어요. 학생증은 도서관 모바일 이용증 등 자기 신분을 입증할 수 있는 거면 뭐든지 가능합니다."}
          </p>
        </div>

        {/* School Webmail Verification (When Webmail Selected) */}
        {!usesStudentIdVerification && (
          <section className="rounded-3xl border border-rose-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
                <Mail className="h-3.5 w-3.5" />
                {isJa
                  ? "学校公式ウェブメール認証"
                  : "학교 공식 웹메일 인증"}
              </span>
              <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[12px] font-extrabold text-white">
                {isJa ? "6桁コード即時承認" : "6자리 코드 즉시 승인"}
              </span>
            </div>
            <h3 className="mt-2 text-[15px] font-extrabold text-zinc-900">
              {campusTrack === "KLI_JP"
                ? isJa
                  ? `🇯🇵 ${KLI_INSTITUTE_LABEL_JA[school.trim()] || school.trim() || "在学中の学校"} 公式ウェブメールで認証`
                  : `🇯🇵 ${school.trim() || "소속 학교"} 공식 웹메일로 인증`
                : campusTrack === "INTL_JP"
                ? isJa
                  ? `🇯🇵 ${UNIV_LABEL_JA[school.trim()] || school.trim() || "在学中の大学"} 公式ウェブメールで留学生認証`
                  : `🇯🇵 ${school.trim() || "소속 대학교"} 공식 웹메일로 유학생 인증`
                : isJa
                ? `🇰🇷 ${UNIV_LABEL_JA[school.trim()] || school.trim() || "在学中の大学"} 公式ウェブメールで在学生認証`
                : `🇰🇷 ${school.trim() || "소속 대학교"} 공식 웹메일로 재학생 인증`}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
              {isJa
                ? "在学中の大学から発行された公式ウェブメールで6桁の認証番号を受け取ると、運営チームの確認待ちなしで即時に登録が完了します。（ウェブメールがない場合は上のボタンで「🪪 学生証・モバイル身分証認証」に切り替えられます）"
                : "재학 중인 학교에서 발급한 공식 웹메일로 6자리 인증번호를 받으면 운영팀 확인 대기 없이 즉시 가입이 완료돼요. (웹메일이 없거나 학생증으로 인증하고 싶다면 위에서 '🪪 학생증·모바일 신분증 인증'을 선택해 주세요)"}
            </p>
            {school.trim() && emailGuide.domainBadge && (
              <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-1.5 text-[12px] font-bold text-rose-700">
                <span>
                  📧{" "}
                  {isJa
                    ? `${UNIV_LABEL_JA[school.trim()] || KLI_INSTITUTE_LABEL_JA[school.trim()] || school.trim()} 公式ドメイン:`
                    : `${school.trim()} 공식 도메인:`}
                </span>
                <span className="font-black underline">{emailGuide.domainBadge}</span>
                <span className="text-rose-500">
                  ({emailGuide.placeholder})
                </span>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                type="email"
                className={FIELD_INPUT}
                value={schoolEmail}
                disabled={emailStage === "verified"}
                onChange={(e) => setSchoolEmail(e.target.value)}
                placeholder={emailGuide.placeholder}
              />
              <Button
                size="lg"
                className="shrink-0"
                loading={emailStage === "sending"}
                disabled={emailStage === "verified"}
                onClick={handleSendSchoolCode}
              >
                {emailStage === "sent" || emailStage === "verifying"
                  ? isJa
                    ? "再送信"
                    : "다시 받기"
                  : isJa
                  ? "認証番号を受け取る"
                  : "인증번호 받기"}
              </Button>
            </div>

            {(emailStage === "sent" || emailStage === "verifying") && (
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className={FIELD_INPUT}
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={isJa ? "6桁の認証番号" : "6자리 인증번호"}
                />
                <Button
                  size="lg"
                  variant="destructive"
                  className="shrink-0"
                  loading={emailStage === "verifying"}
                  onClick={handleVerifySchoolCode}
                >
                  {isJa ? "確認" : "확인"}
                </Button>
              </div>
            )}

            {emailMsg && (
              <p
                className={cn(
                  "mt-2 text-[12px] font-semibold leading-relaxed",
                  emailStage === "verified"
                    ? "text-emerald-700"
                    : emailStage === "sent" || emailStage === "verifying"
                    ? "text-zinc-600"
                    : "text-rose-600"
                )}
              >
                {emailStage === "verified" && (
                  <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-600" />
                )}
                {emailMsg}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-stone-200/80 bg-[#FAF9F6] px-3.5 py-2.5 text-[12px]">
              <span className="font-semibold text-zinc-600">
                {isJa
                  ? "大学メール認証でお困りですか？"
                  : "학교 메일 인증에 문제가 있나요?"}
              </span>
              <a
                href={KAKAO_OPENCHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-[#FEE500] px-2.5 py-1 font-extrabold text-zinc-900 hover:brightness-95"
              >
                {isJa ? "💬 カカオ1:1相談" : "💬 카톡 1:1 고객센터"}
              </a>
            </div>
          </section>
        )}

        {/* Student ID / Mobile Library Card photo → operator review */}
        {usesStudentIdVerification && (
        <section className="rounded-3xl border border-rose-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
              <Sparkles className="h-3.5 w-3.5" />
              {isJa
                ? "学生証・モバイル身分証 確認"
                : "학생증·모바일 신분증 운영팀 확인"}
            </span>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[12px] font-extrabold text-white">
              {isJa ? "身分証明なら何でもOK" : "신분 입증 자료 모두 가능"}
            </span>
          </div>

          <h3 className="mt-2 text-[15px] font-extrabold text-zinc-900">
            {campusTrack === "KLI_JP"
              ? isJa
                ? "🇯🇵 語学堂の学生証・モバイル身分証で認証"
                : "🇯🇵 일본인 어학당 학생증 · 모바일 신분증으로 인증"
              : campusTrack === "INTL_JP"
              ? isJa
                ? "🇯🇵 日本人大学留学生の学生証・モバイル身分証で認証"
                : "🇯🇵 일본인 대학교 유학생 학생증 · 모바일 신분증으로 인증"
              : isJa
              ? "🇰🇷 韓国大学生の学生証・モバイル身分証で認証"
              : "🇰🇷 한국 대학생 학생증 · 모바일 신분증으로 인증"}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-600">
            {isJa
              ? "実物の学生証、モバイル学生証、図書館モバイル利用証など、ご自身の学校・身分を証明できるものなら何でもOKです！学校名とご自身の身分が見えるように撮影またはスクショしてアップロードしてください。写真は運営者のみ閲覧でき、承認・却下の直後に削除されます。"
              : "실물 학생증, 모바일 학생증, 도서관 모바일 이용증 등 자기 신분을 입증할 수 있는 거면 뭐든지 가능해요! 학교 이름과 본인 신분이 보이도록 찍거나 캡처해 올려 주세요. 사진은 운영자만 볼 수 있고 승인·반려 즉시 삭제돼요."}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleStudentIdFile(f);
              }
            }}
          />

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 px-4 py-3 text-[13px] font-bold text-rose-700 transition-colors hover:bg-rose-50"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isJa
                  ? "学生証・図書館モバイル利用証など身分証明の写真をアップロード"
                  : "학생증 · 도서관 모바일 이용증 등 신분 입증 사진 올리기"}
              </span>
            </button>
          </div>

          {aiStatus === "ANALYZING" && (
            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-zinc-900 p-3.5 text-[12px] font-semibold text-white">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-rose-400" />
              <span>{aiStepText}</span>
            </div>
          )}

          {aiStatus === "VERIFIED" && (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  {isJa
                    ? "写真を受け付けました — 登録後、運営者が確認します"
                    : "사진이 올라갔어요 — 가입 후 운영자가 확인해요"}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-emerald-700">
                {aiReason}
              </p>
            </div>
          )}

          {aiStatus === "REJECTED" && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-rose-700">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>
                  {isJa
                    ? "写真をアップロードできませんでした"
                    : "사진을 올리지 못했어요"}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-rose-600">
                {aiReason}
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-stone-200/80 bg-[#FAF9F6] px-3.5 py-2.5 text-[12px]">
            <span className="font-semibold text-zinc-600">
              {isJa
                ? "学生証の認証や登録でお困りですか？"
                : "학생증 인증이나 가입 과정에서 도움이 필요하신가요?"}
            </span>
            <a
              href={KAKAO_OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[#FEE500] px-2.5 py-1 font-extrabold text-zinc-900 hover:brightness-95"
            >
              {isJa ? "💬 カカオ1:1相談" : "💬 카톡 1:1 고객센터"}
            </a>
          </div>
        </section>
        )}

        <div className="space-y-2.5 pt-2">
          {submitError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[12px] font-semibold text-rose-600">
              {submitError}
            </div>
          )}
          <Button
            size="lg"
            fullWidth
            loading={loading}
            className="bg-rose-600 hover:bg-rose-700"
            onClick={handleStart}
          >
            <FileCheck2 className="h-4 w-4" />
            {usesStudentIdVerification
              ? isJa
                ? "学生証認証を完了して登録する →"
                : "학생증 인증 신청하고 회원가입 완료하기 →"
              : isJa
              ? "大学メール認証を完了して登録する →"
              : "학교 웹메일 인증 완료하고 회원가입 완료하기 →"}
          </Button>
          <p className="text-center text-[11px] font-medium text-zinc-400">
            {isJa
              ? "会員登録完了後、身長や居住エリアなどお相手に表示されるプロフィール入力画面へ移動します。"
              : "회원가입 완료 직후 키·거주지역·MBTI 등 상대방에게 보이는 내 프로필 입력 화면으로 이어집니다."}
          </p>
        </div>
      </div>
    </div>
  );
}
