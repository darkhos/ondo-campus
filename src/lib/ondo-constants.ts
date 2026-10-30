// 온도(ONDO 36.5°) 공용 상수 · 타입 · 샘플 데이터

export const PILL_NAV_HEIGHT = 60;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  JOIN: "/join",
  REPORT: "/report",
  FAQ: "/faq",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  SAFETY: "/safety",
  POINTS: "/points",
  INVITE: "/invite",
  MISSION: "/mission",
  NOTIFICATIONS: "/notifications",
} as const;

export const KAKAO_OPENCHAT_URL = "https://open.kakao.com/o/sIwbmqUi";
export const FAQ_URL = "/faq";

// 베타 오픈 기간: 모든 회원 커피티켓 무제한 (끝낼 때 false로 바꾸고 서버 ondo_settings 의 beta_free_tickets 도 false로)
export const BETA_UNLIMITED_TICKETS = true;

export const AGE_MIN = 18;
export const AGE_MAX = 28;
export const HEIGHT_MIN = 140;
export const HEIGHT_MAX = 210;

export const VIBE_KEYWORD_LABEL = "분위기 키워드";
export const VIBE_KEYWORD_MAX = 3;

export const VIBE_STYLE_KEYWORDS = [
  "깔끔한 댄디",
  "웃는 인상이 다정한",
  "차분한 중저음",
  "미니멀 캐주얼",
  "청량한 캠퍼스룩",
  "운동으로 다져진",
  "지적인 안경 핏",
  "부드러운 눈웃음",
] as const;

// 체격 — 스스로 고르는 대략적인 체격
export const BUILD_TYPES = [
  { value: "LEAN", label: "슬림한 편" },
  { value: "MEDIUM", label: "보통인 편" },
  { value: "TONED", label: "탄탄한 편" },
  { value: "ATHLETIC", label: "근육 있는 편" },
  { value: "SOFT", label: "살짝 통통한 편" },
] as const;

// 첫인상 온도 — 동물상 대신 온도(ONDO) 콘셉트의 인상 키워드
export const IMPRESSION_TYPES = [
  { value: "WARM", label: "따뜻한 인상" },
  { value: "BRIGHT", label: "밝고 쾌활한 인상" },
  { value: "CALM", label: "차분한 인상" },
  { value: "COOL", label: "시크한 인상" },
  { value: "SOFT", label: "순한 인상" },
  { value: "SMART", label: "지적인 인상" },
] as const;

export const IMPRESSION_EMOJI: Record<string, string> = {
  WARM: "☕",
  BRIGHT: "☀️",
  CALM: "🌙",
  COOL: "🧊",
  SOFT: "🌿",
  SMART: "📚",
};

export const PREFERRED_HEIGHT_RANGES = [
  { value: "under_155", label: "155cm 이하", min: 140, max: 155 },
  { value: "156_160", label: "156 ~ 160cm", min: 156, max: 160 },
  { value: "161_165", label: "161 ~ 165cm", min: 161, max: 165 },
  { value: "166_170", label: "166 ~ 170cm", min: 166, max: 170 },
  { value: "171_175", label: "171 ~ 175cm", min: 171, max: 175 },
  { value: "176_180", label: "176 ~ 180cm", min: 176, max: 180 },
  { value: "181_185", label: "181 ~ 185cm", min: 181, max: 185 },
  { value: "over_185", label: "185cm 이상", min: 185, max: 210 },
  { value: "any", label: "키 상관없어요 (전체)", min: 140, max: 210 },
] as const;

const VALID_HEIGHT_PREF_VALUES = new Set<string>(
  PREFERRED_HEIGHT_RANGES.map((h) => h.value)
);

// 선호 키는 실제 매칭 조건이라, 저장한 적이 없으면 "상관없어요"로 시작
export function parseHeightPreferences(raw?: string | null): string[] {
  if (!raw) return ["any"];
  const tokens = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_HEIGHT_PREF_VALUES.has(s));
  if (tokens.length === 0) {
    return ["any"];
  }
  if (tokens.includes("any")) {
    return ["any"];
  }
  return tokens;
}

export function toggleHeightPreference(
  current: string[],
  value: string
): string[] {
  if (value === "any") {
    return ["any"];
  }
  const withoutAny = current.filter((v) => v !== "any");
  if (withoutAny.includes(value)) {
    const next = withoutAny.filter((v) => v !== value);
    return next.length > 0 ? next : ["any"];
  }
  return [...withoutAny, value];
}

const BUILD_VALUES = new Set<string>(BUILD_TYPES.map((b) => b.value));
const IMPRESSION_VALUES = new Set<string>(IMPRESSION_TYPES.map((i) => i.value));
const SMOKING_PREF_VALUES = new Set<string>(["any", "no_smoke", "smoke_fine"]);
const RELIGION_PREF_VALUES = new Set<string>(["any", "same_only", "none_only"]);

export function normalizeHobbies(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out = list
    .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    .map((h) => h.trim());
  return Array.from(new Set(out));
}

export function normalizeBuild(v: string | null | undefined): string | null {
  return v && BUILD_VALUES.has(v) ? v : null;
}

export function normalizeImpression(v: string | null | undefined): string | null {
  return v && IMPRESSION_VALUES.has(v) ? v : null;
}

/** 저장된 프로필(서버 profile_extra · 기기 저장값)을 현재 ONDO 값 체계로 정규화 */
export function normalizeStoredProfile<T extends Record<string, unknown>>(raw: T): T {
  const p: Record<string, unknown> = { ...raw };
  if ("impression" in p) {
    p.impression = normalizeImpression(p.impression as string | null);
  }
  if ("build" in p) {
    p.build = normalizeBuild(p.build as string | null);
  }
  if ("hobbies" in p) {
    p.hobbies = normalizeHobbies(p.hobbies);
  }
  if (Array.isArray(p.preferredImpressions)) {
    p.preferredImpressions = (p.preferredImpressions as string[]).filter((v) =>
      IMPRESSION_VALUES.has(v)
    );
  }
  if (Array.isArray(p.preferredBuilds)) {
    p.preferredBuilds = (p.preferredBuilds as string[]).filter((v) =>
      BUILD_VALUES.has(v)
    );
  }
  if (
    typeof p.preferredSmoking === "string" &&
    !SMOKING_PREF_VALUES.has(p.preferredSmoking)
  ) {
    p.preferredSmoking = "any";
  }
  if (
    typeof p.preferredReligion === "string" &&
    !RELIGION_PREF_VALUES.has(p.preferredReligion)
  ) {
    p.preferredReligion = "any";
  }
  if (p.location && typeof p.location === "object") {
    const loc = p.location as Record<string, unknown>;
    p.location = {
      sido: typeof loc.sido === "string" ? loc.sido : "",
      sigungu: typeof loc.sigungu === "string" ? loc.sigungu : "",
      label: typeof loc.label === "string" ? loc.label : "",
    };
  }
  if (p.matchingStatus !== undefined && p.matchingStatus !== "PAUSED") {
    p.matchingStatus = "ACTIVE";
  }
  if (typeof p.preferredAgeMin === "number" && Number.isFinite(p.preferredAgeMin)) {
    p.preferredAgeMin = Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(p.preferredAgeMin)));
  }
  if (typeof p.preferredAgeMax === "number" && Number.isFinite(p.preferredAgeMax)) {
    p.preferredAgeMax = Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(p.preferredAgeMax)));
  }
  if (
    typeof p.preferredAgeMin === "number" &&
    typeof p.preferredAgeMax === "number" &&
    p.preferredAgeMin > p.preferredAgeMax
  ) {
    p.preferredAgeMin = p.preferredAgeMax;
  }
  return p as T;
}

/** 게스트 체험용 샘플 계정인지 확인 */
export function isSampleUid(uid: unknown): boolean {
  return typeof uid === "string" && uid.startsWith("user-ondo-demo-");
}

export const HOBBIES = [
  "산책·러닝",
  "헬스·필라테스",
  "책·글쓰기",
  "음악 감상",
  "영화·드라마",
  "전시·공연",
  "카페 투어",
  "맛집 투어",
  "요리·베이킹",
  "여행",
  "사진",
  "게임",
  "캠핑·등산",
  "드라이브",
  "패션·뷰티",
  "반려동물",
  "봉사활동",
  "어학 공부",
] as const;

export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

// 흔히 알려진 MBTI 궁합표 기준으로 잘 맞는다고 하는 유형 (재미로 보는 참고용)
export const MBTI_BEST_MATCH: Record<string, string[]> = {
  INTJ: ["ENFP", "ENTP"],
  INTP: ["ENTJ", "ESTJ"],
  ENTJ: ["INFP", "INTP"],
  ENTP: ["INFJ", "INTJ"],
  INFJ: ["ENFP", "ENTP"],
  INFP: ["ENFJ", "ENTJ"],
  ENFJ: ["INFP", "ISFP"],
  ENFP: ["INFJ", "INTJ"],
  ISTJ: ["ESFP", "ESTP"],
  ISFJ: ["ESFP", "ESTP"],
  ESTJ: ["ISTP", "INTP"],
  ESFJ: ["ISFP", "ISTP"],
  ISTP: ["ESFJ", "ESTJ"],
  ISFP: ["ENFJ", "ESFJ"],
  ESTP: ["ISFJ", "ISTJ"],
  ESFP: ["ISFJ", "ISTJ"],
};

export const RELIGION_PREFS = [
  { value: "any", label: "상관없어요" },
  { value: "same_only", label: "저와 같은 종교였으면 해요" },
  { value: "none_only", label: "종교가 없는 분이 편해요" },
] as const;

export const SMOKING_PREFS = [
  { value: "any", label: "상관없어요" },
  { value: "no_smoke", label: "담배 안 피우는 분이 좋아요" },
  { value: "smoke_fine", label: "흡연해도 괜찮아요" },
] as const;

export const RELIGIONS = [
  { value: "NONE", label: "무교" },
  { value: "CHRISTIAN", label: "기독교" },
  { value: "CATHOLIC", label: "천주교" },
  { value: "BUDDHIST", label: "불교" },
  { value: "OTHER", label: "기타" },
] as const;

export const RELIGION_AGREE_LABEL =
  "종교 항목을 내 가치관 노트에 표시하는 것에 동의합니다 (선택)";
export const RELIGION_AGREE_DETAIL =
  "체크를 해제하시면 종교 항목은 상대방 프로필 카드에 노출되지 않으며, 체크 여부와 무관하게 라운지 이용이 가능합니다.";

export const SMOKING_STATUSES = [
  { value: "NON_SMOKER", label: "비흡연" },
  { value: "OCCASIONAL", label: "가끔 (술자리 등)" },
  { value: "SMOKER", label: "흡연" },
] as const;

export const SIDO_LIST = [
  "서울특별시",
  "인천광역시",
  "경기도",
] as const;

export const SIDO_ABBR: Record<string, string> = {
  서울특별시: "서울",
  인천광역시: "인천",
  경기도: "경기",
};

export const DISTRICTS_BY_SIDO: Record<string, string[]> = {
  서울특별시: [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  인천광역시: [
    "연수구",
    "남동구",
    "부평구",
    "미추홀구",
    "서구",
    "계양구",
    "중구",
    "동구",
    "강화군",
    "옹진군",
  ],
  경기도: [
    "수원시",
    "성남시",
    "고양시",
    "용인시",
    "부천시",
    "안산시",
    "안양시",
    "남양주시",
    "화성시",
    "평택시",
    "의정부시",
    "시흥시",
    "파주시",
    "광명시",
    "김포시",
    "군포시",
    "광주시",
    "하남시",
    "구리시",
    "오산시",
    "양주시",
    "이천시",
    "안성시",
    "포천시",
    "의왕시",
    "양평군",
    "여주시",
    "동두천시",
    "과천시",
    "가평군",
    "연천군",
  ],
};

export interface UserLocation {
  sido: string;
  sigungu: string;
  label: string;
}

export function buildLocationValue(
  sido: string,
  sigungu: string
): UserLocation | null {
  if (!DISTRICTS_BY_SIDO[sido]?.includes(sigungu)) return null;
  const label = sido === sigungu ? sido : `${sido} ${sigungu}`;
  return {
    sido,
    sigungu,
    label,
  };
}

export function formatShortLocation(loc?: UserLocation | null): string {
  if (!loc) return "미설정";
  const shortSido = SIDO_ABBR[loc.sido] ?? loc.sido;
  return loc.sido === loc.sigungu
    ? shortSido
    : `${shortSido} ${loc.sigungu}`;
}

export const FIELD_INPUT =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 disabled:bg-stone-50 disabled:opacity-60";
export const FIELD_SELECT = `${FIELD_INPUT} appearance-none pr-10`;
export const FIELD_LABEL = "mb-1.5 block text-[13px] font-medium text-zinc-600";
export const FIELD_TEXTAREA =
  "w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10";

export const CAMPUS_POST_TEMPLATES = [
  {
    key: "BLIND_COFFEE_CHAT",
    label: "24h 블라인드 챗",
    labelJa: "24hブラインドチャット",
    bodyJa: `顔写真から載せるマッチングアプリより、まずは話が合う人とゆっくり会話してみたい人に「ONDO 36.5°」ラウンジをおすすめします ☕\n24時間ブラインドルームで5往復以上会話が続いたときだけカカオトークIDが公開され、相手から返信がなければコーヒーチケットは100%自動で返ってくるので安心です！\nhttps://darkhos.github.io/ondo-campus/`,
    body: `얼굴 사진부터 올리는 데이팅앱 대신 대화 결이 통하는 사람과 먼저 이야기 나누고 싶다면 '온도(ONDO 36.5°)' 라운지 추천해요 ☕\n24시간 블라인드 룸에서 5마디 이상 대화가 이어졌을 때만 카카오톡 ID가 열리고, 상대가 무응답이면 커피티켓이 100% 자동 반환돼서 깔끔합니다!\nhttps://darkhos.github.io/ondo-campus/`,
  },
  {
    key: "GLOBAL_CAMPUS",
    label: "한·일 캠퍼스 교류",
    labelJa: "日韓キャンパス交流",
    bodyJa: `韓国の大学生はもちろん、延世大・梨花女子大・高麗大などの語学堂生や正規留学中の日本人学生とも、学生認証を済ませた人同士でつながれる「ONDO 36.5°」ラウンジです 🇰🇷🇯🇵\n韓国語・日本語の表示切り替えに対応していて、同じ学校の人とはマッチングしない設定も最初からオンになっています！\nhttps://darkhos.github.io/ondo-campus/`,
    body: `한국 대학생 학우들뿐만 아니라 연세대·이대·고려대 등 어학당 및 정규 유학 중인 일본인 학생들과도 학생 인증을 마친 사람끼리 연결되는 '온도(ONDO 36.5°)' 라운지예요 🇰🇷🇯🇵\n한국어·일본어 실시간 전환도 지원하고 같은 학교 학우 차단도 기본 제공됩니다!\nhttps://darkhos.github.io/ondo-campus/`,
  },
  {
    key: "BALANCE_LOUNGE",
    label: "가치관 주파수",
    labelJa: "価値観マッチ",
    bodyJa: `【ONDO 36.5°】キャンパス価値観 ＆ 24hブラインド・コーヒーチャット\n- 毎晩21時、希望条件に合う他大学の学生をご紹介\n- 会話が5往復続いたあとにだけ、お互いのカカオトークIDを公開\n- 24時間返信がなければ、コーヒーチケットは100%自動返還\nhttps://darkhos.github.io/ondo-campus/`,
    body: `[온도 ONDO 36.5°] 캠퍼스 가치관 & 24h 블라인드 커피챗 라운지\n- 매일 밤 9시, 선호 조건이 맞는 다른 학교 학생 소개\n- 대화 5턴 달성 후에만 상호 안심 연락처(카카오톡 ID) 공개\n- 24시간 미응답 시 100% 자동 환급 에스크로 커피티켓 보증\nhttps://darkhos.github.io/ondo-campus/`,
  },
] as const;

export interface PartnerProfile {
  uid: string;
  nickname: string;
  age: number;
  school: string;
  department: string;
  height: number;
  mbti?: string | null;
  build?: string | null;
  impression?: string | null;
  smokingStatus?: string | null;
  religion?: string | null;
  locationLabel?: string | null;
  hobbies: string[];
  bio?: string;
  vibeKeywords?: string[];
  kakaoId?: string;
  voiceIntroText?: string;
  voiceDurationSec?: number;
  voiceAudioDataUrl?: string | null;
  silhouetteTheme?: "blue" | "indigo" | "emerald" | "rose";
  relaxedConditionNote?: string | null;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  gender: "FEMALE" | "MALE";
  age: number;
  school: string;
  department: string;
  height: number;
  mbti: string | null;
  build: string | null;
  impression: string | null;
  smokingStatus: string | null;
  religion: string | null;
  hobbies: string[];
  bio: string;
  vibeKeywords: string[];
  location: UserLocation | null;
  matchingStatus: "ACTIVE" | "PAUSED";
  /** 서버 기준 학생 인증 상태 — 화면 배지는 이 값으로만 표시 */
  verificationStatus?: "verified" | "pending" | "pending_review" | "rejected";
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredHeight: string;
  avoidSameSchool: boolean;
  preferredMbti: string[];
  preferredSmoking: string;
  preferredImpressions: string[];
  preferredBuilds: string[];
  preferredReligion: string;
  points: number;
  escrowPoints?: number;
  smartRelaxFilter?: boolean;
  includeJapaneseGlobal?: boolean;
  penaltySkipRemaining?: number;
  voiceIntroText?: string;
  voiceAudioDataUrl?: string | null;
  kakaoVerified?: boolean;
  selfRegisteredV2?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "partner" | "me" | "system";
  text: string;
  time: string;
}

export interface BalanceQuestion {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
}

export const CAMPUS_BALANCE_QUESTIONS: BalanceQuestion[] = [
  {
    id: "bal-1",
    category: "연애 연락 빈도",
    question: "더 선호하는 평소 연락 스타일은?",
    optionA: "일상 공유하며 틈틈이 카톡",
    optionB: "할 일 끝내고 밤에 전화 통화",
  },
  {
    id: "bal-2",
    category: "캠퍼스 인간관계",
    question: "연인이 이성 동기와 단둘이 학식 먹기",
    optionA: "학식은 밥만 먹는 거니 괜찮다",
    optionB: "굳이 단둘이 먹는 건 신경 쓰인다",
  },
  {
    id: "bal-3",
    category: "시험기간 데이트",
    question: "중간·기말고사 기간 데이트 방식은?",
    optionA: "도서관·카페에서 옆자리에 앉아 같이 공부",
    optionB: "시험 끝나는 날까지 각자 집중 후 제대로 놀기",
  },
];

export const INITIAL_BLIND_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "sys-1",
    sender: "system",
    text: "서로 호감이 연결되어 24시간 블라인드 대화방이 열렸어요. 대화 5마디 이상을 나누면 분위기 사진 블러가 해제되고 안심 연락처를 교환할 수 있습니다.",
    time: "방금",
  },
];

export interface MatchHistoryItem {
  matchId: string;
  matchDate: string;
  partnerUid: string;
  partner: PartnerProfile;
  resultStatus: "SUCCESS" | "FAILED" | "EXPIRED" | "PENDING";
  currentStatus?: "ACTIVE" | "CLOSED";
  myResponse: "ACCEPT" | "REJECT" | "PENDING";
  partnerResponse: "ACCEPT" | "REJECT" | "PENDING";
  contactUnlocked: boolean;
  pointCost: number;
  feedbackSubmitted?: boolean;
  feedbackRating?: number;
  escrowStatus?: "CONFIRMED" | "HELD" | "REFUNDED";
}

// 체험(게스트 프리뷰) 전용 샘플 프로필 — 실제 회원 프로필의 기본값으로 쓰지 않음
export const INITIAL_USER_PROFILE: UserProfile = {
  uid: "user-ondo-demo-01",
  nickname: "망원동레몬에이드",
  gender: "FEMALE",
  age: 21,
  school: "이화여자대학교",
  department: "심리학과",
  height: 161,
  mbti: "INFP",
  build: "MEDIUM",
  impression: "WARM",
  smokingStatus: "NON_SMOKER",
  religion: "NONE",
  hobbies: ["산책·러닝", "책·글쓰기", "요리·베이킹", "전시·공연"],
  bio: "한강 따라 걷다가 마음에 드는 동네 책방 발견하는 걸 좋아해요. 말투가 다정하고 대화가 편안한 분과 천천히 알아가고 싶어요 🍋",
  vibeKeywords: ["웃는 인상이 다정한", "부드러운 눈웃음"],
  location: {
    sido: "서울특별시",
    sigungu: "마포구",
    label: "서울특별시 마포구",
  },
  matchingStatus: "ACTIVE",
  preferredAgeMin: 21,
  preferredAgeMax: 27,
  preferredHeight: "171_175,176_180",
  avoidSameSchool: false,
  preferredMbti: ["ENFJ", "INFJ", "ENTP"],
  preferredSmoking: "no_smoke",
  preferredImpressions: ["WARM", "CALM", "SMART"],
  preferredBuilds: ["MEDIUM", "TONED"],
  preferredReligion: "any",
  points: 0,
  escrowPoints: 0,
  smartRelaxFilter: true,
  voiceIntroText:
    "안녕하세요! 산책이랑 책 좋아하는 이대 심리학과 학생이에요. 편하게 이야기 나눠요!",
  kakaoVerified: true,
};

// 실제 회원의 시작 프로필: 본인이 입력하지 않은 값은 비워 둠 (샘플 값으로 채우지 않음)
export const EMPTY_USER_PROFILE: UserProfile = {
  uid: "",
  nickname: "",
  gender: "FEMALE",
  age: 22,
  school: "",
  department: "",
  height: 0,
  mbti: null,
  build: null,
  impression: null,
  smokingStatus: null,
  religion: null,
  hobbies: [],
  bio: "",
  vibeKeywords: [],
  location: null,
  matchingStatus: "ACTIVE",
  preferredAgeMin: AGE_MIN,
  preferredAgeMax: AGE_MAX,
  preferredHeight: "any",
  avoidSameSchool: true,
  preferredMbti: [],
  preferredSmoking: "any",
  preferredImpressions: [],
  preferredBuilds: [],
  preferredReligion: "any",
  points: 0,
  escrowPoints: 0,
  smartRelaxFilter: true,
  includeJapaneseGlobal: true,
  voiceIntroText: "",
  kakaoVerified: false,
};

export const DEMO_PARTNERS: PartnerProfile[] = [
  {
    uid: "partner-01",
    nickname: "노원구줴줴이야",
    age: 24,
    school: "광운대학교",
    department: "경영학과",
    height: 181,
    mbti: "ENFJ",
    build: "TONED",
    impression: "BRIGHT",
    smokingStatus: "NON_SMOKER",
    religion: "NONE",
    locationLabel: "서울 노원구",
    hobbies: ["헬스·필라테스", "카페 투어", "맛집 투어", "여행", "영화·드라마"],
    bio: "평일에는 학교 근처에서 운동하고 주말에는 맛있는 디저트 카페나 전시회 찾아다니는 걸 좋아합니다. 같이 걸으며 소소한 일상 이야기 나누실 분 만나고 싶어요!",
    vibeKeywords: ["깔끔한 댄디", "웃는 인상이 다정한"],
    voiceIntroText:
      "안녕하세요! 광운대 경영학과 재학 중이고, 주말엔 조용한 카페나 전시 보러 다니는 걸 좋아합니다. 반갑습니다!",
    voiceDurationSec: 8,
    silhouetteTheme: "blue",
    relaxedConditionNote: null,
  },
  {
    uid: "partner-02",
    nickname: "관악산밤산책러",
    age: 23,
    school: "서울대학교",
    department: "경제학부",
    height: 178,
    mbti: "INFJ",
    build: "MEDIUM",
    impression: "CALM",
    smokingStatus: "NON_SMOKER",
    religion: "NONE",
    locationLabel: "서울 마포구",
    hobbies: ["책·글쓰기", "음악 감상", "전시·공연", "카페 투어", "사진"],
    bio: "조용한 독립서점과 LP 바를 좋아하는 경제학도입니다. 리액션이 좋다는 이야기를 자주 듣고, 예의 바르고 다정한 연애를 추구해요.",
    vibeKeywords: ["차분한 중저음", "지적인 안경 핏"],
    voiceIntroText:
      "안녕하세요, LP 음악과 산책을 좋아하는 서울대 경제학부 학생입니다. 대화 템포가 편안한 분이면 좋겠어요.",
    voiceDurationSec: 7,
    silhouetteTheme: "indigo",
    relaxedConditionNote: null,
  },
  {
    uid: "partner-03",
    nickname: "한양대성수러버",
    age: 25,
    school: "한양대학교",
    department: "정보시스템학과",
    height: 179,
    mbti: "ENTJ",
    build: "ATHLETIC",
    impression: "COOL",
    smokingStatus: "NON_SMOKER",
    religion: "NONE",
    locationLabel: "서울 성동구",
    hobbies: ["드라이브", "맛집 투어", "헬스·필라테스", "영화·드라마"],
    bio: "성수동 맛집 지도를 직접 만들고 있을 정도로 맛있는 음식 먹는 걸 좋아합니다. 유머 코드 잘 맞고 함께 성장할 수 있는 분이면 좋겠어요!",
    vibeKeywords: ["미니멀 캐주얼", "운동으로 다져진"],
    voiceIntroText:
      "반갑습니다! 성수동 맛집 투어와 드라이브를 좋아하는 한양대 학생입니다.",
    voiceDurationSec: 6,
    silhouetteTheme: "emerald",
    relaxedConditionNote: "거리 조건 1단계 완화 (서대문구 → 성동구 20분)",
  },
  {
    uid: "partner-04",
    nickname: "신촌동하루카",
    age: 22,
    school: "연세대학교 한국어학당",
    department: "🌏 한국어 4급 · 도쿄 유학생",
    height: 163,
    mbti: "ENFP",
    build: "LEAN",
    impression: "SOFT",
    smokingStatus: "NON_SMOKER",
    religion: "NONE",
    locationLabel: "서울 서대문구",
    hobbies: ["카페 투어", "맛집 투어", "사진", "산책·러닝", "음악 감상"],
    bio: "도쿄에서 온 연세대 어학당 학생입니다! 한국 카페랑 산책하는 걸 정말 좋아해서 한국 대학생 친구와 따뜻하게 대화 나누고 싶어요.",
    vibeKeywords: ["밝게 잘 웃는", "다정한 한국어 발음"],
    voiceIntroText:
      "안녕하세요! 연세대 한국어학당에 다니고 있어요. 신촌·연남동 예쁜 카페 같이 가요!",
    voiceDurationSec: 7,
    silhouetteTheme: "rose",
    relaxedConditionNote: "🌏 어학당 학생증 확인 완료",
  },
];

export const INITIAL_MATCH_HISTORY: MatchHistoryItem[] = [];

const WITTY_NICKNAME_PREFIX_KO = [
  "줴줴이야",
  "야르",
  "원영적사고",
  "설렘추구미",
  "감다살",
  "무해한설렘",
  "꽁꽁얼어붙은",
  "아망추중독",
  "텍스트힙",
  "도파민충전",
  "확신의호감상",
  "플러팅장인",
  "달디단밤양갱",
  "갓생러버",
  "낭만치사량",
  "맑눈광캠퍼스",
  "성수동팝업러",
  "연남동추구미",
  "공강엔아망추",
  "수줍은외향인",
  "사르르녹는",
  "중꺾마설렘",
];

const WITTY_NICKNAME_NOUN_KO = [
  "줴줴이야",
  "야르요정",
  "럭키비키",
  "아기쿼카",
  "골든리트리버",
  "한강고양이",
  "말랑콩떡",
  "인간비타민",
  "다정곰돌이",
  "첫사랑재질",
  "설렘요정",
  "산책메이트",
  "맛집탐험가",
  "인디리스너",
  "솜사탕",
  "복숭아",
  "댕댕이",
];

const WITTY_NICKNAME_FULL_KO = [
  "줴줴이야설렘장인",
  "오늘기분완전야르",
  "야르캠퍼스호감상",
  "줴줴이야럭키비키",
  "완전럭키비키잖아",
  "한강위걸어다니는고양이",
  "공강시간아망추요정",
  "감다살캠퍼스호감상",
  "낭만치사량리트리버",
  "도파민대신설렘충전",
  "달디달고달디단밤양갱",
  "추구미는다정한연애",
  "무해한웃음보유자",
  "텍스트힙산책러",
  "플러팅만렙아기쿼카",
  "확신의첫사랑기억조작단",
  "말랑콩떡캠퍼스요정",
  "맑눈광맛집헌터",
  "오늘부터갓생연애러",
];

const WITTY_NICKNAME_JA = [
  "ラッキービッキー妖精",
  "ときめき追求ミー",
  "漢江の上を歩く猫",
  "アマンチュ中毒うさぎ",
  "甘くて優しい栗羊羹",
  "無害な笑顔のレトリバー",
  "聖水ポップアップ巡り",
  "延南洞カフェ日和",
  "ドーパミンよりときめき",
  "初恋記憶操作クォッカ",
  "テキストヒップ読書家",
  "放課後ラテメイト",
];

export function generateWittyNickname(isJa: boolean, current?: string): string {
  for (let attempt = 0; attempt < 8; attempt++) {
    const num = Math.floor(10 + Math.random() * 89);
    let candidate = "";
    if (isJa) {
      const base =
        WITTY_NICKNAME_JA[Math.floor(Math.random() * WITTY_NICKNAME_JA.length)];
      candidate = `${base}${num}`;
    } else if (Math.random() < 0.45) {
      const base =
        WITTY_NICKNAME_FULL_KO[
          Math.floor(Math.random() * WITTY_NICKNAME_FULL_KO.length)
        ];
      candidate = `${base}${num}`;
    } else {
      const prefix =
        WITTY_NICKNAME_PREFIX_KO[
          Math.floor(Math.random() * WITTY_NICKNAME_PREFIX_KO.length)
        ];
      const noun =
        WITTY_NICKNAME_NOUN_KO[
          Math.floor(Math.random() * WITTY_NICKNAME_NOUN_KO.length)
        ];
      candidate = `${prefix}${noun}${num}`;
    }
    if (candidate !== current) return candidate;
  }
  return isJa ? "ラッキービッキー77" : "완전럭키비키잖아77";
}

export function calculateProfileCompletion(user: UserProfile): number {
  const checks = [
    user.nickname.trim().length >= 2,
    user.school.trim().length > 0,
    user.department.trim().length > 0,
    user.age >= AGE_MIN && user.age <= AGE_MAX,
    user.height >= HEIGHT_MIN && user.height <= HEIGHT_MAX,
    !!user.location?.sido && !!user.location?.sigungu,
    !!user.mbti,
    !!user.build,
    !!user.impression,
    !!user.smokingStatus,
    user.hobbies.length > 0,
    user.bio.trim().length >= 5,
    user.vibeKeywords.filter(Boolean).length > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}
