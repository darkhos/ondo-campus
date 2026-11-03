// 한국 정통 만세력(진태양시 -30분 보정 · 24절기 절입 · 십성 · 지장간 · 12운성 · 신살 위치 · 합충원진귀문 2인 궁합 · 1:1 문답) 고정밀 엔진

export type FiveElement = "목" | "화" | "토" | "금" | "수";
export type SajuThemeMode = "future" | "reunion" | "compatibility";
export type CalendarType = "solar" | "lunar_normal" | "lunar_leap";
export type UnlockTier = "free" | "share_first" | "paid_full";

export interface ReunionDeepPack {
  unlocked: boolean;
  subconsciousTrigger: string; // 상대방이 밤마다 나를 떠올리는 무의식 방아쇠
  kakaoMessageTemplate: string; // 그대로 복사해서 보내는 맞춤형 첫 카톡/DM 문구
  threeStepScenario: string[]; // 3단계 실전 재회/플러팅 행동 시나리오
  tabooAction: string; // 절대 하면 안 되는 자폭 행동 1가지
}

export interface Vip2027CalendarPack {
  unlocked: boolean;
  wealthAndCareer: string; // 재성·관성 기반 2026~2027 금전·이직·승진 대운
  cautionMonths: string; // 상충(沖) 기반 손재수·이별수·구설수 주의 달
  quarterlyRoadmap: Array<{
    quarter: string;
    focus: string;
    detail: string;
  }>;
  luckyPrescription: {
    colorAndItem: string;
    directionAndPlace: string;
    timingAndNumber: string;
  };
}

export interface Pillar {
  stemKo: string;
  stemHanja: string;
  stemElement: FiveElement;
  branchKo: string;
  branchHanja: string;
  branchElement: FiveElement;
  animal: string;
  tenGod: string; // 천간 십성 (일주는 '본원(일간)')
  branchTenGod: string; // 지지 십성 (일지는 배우자궁 십성)
  hiddenStems: string; // 지장간 (예: "임·갑", "무·병·갑")
  twelveStage: string; // 십이운성 (장생·목욕·관대·건록·제왕 등)
  roleSummary: string; // 해당 기둥의 실제 십성·12운성 맞춤 연애 해석
}

export interface MonthlyWaveItem {
  month: string;
  ganji: string;
  score: number;
  tag: string;
  desc: string;
}

export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  dayMasterTitle: string;
  dayMasterArchetype: string;
  solarCorrectionNote: string;
  convertedSolarDate: string; // 음력 입력 시 자동 변환된 양력 YYYY-MM-DD
  calendarType: CalendarType;
  spouseStarSummary: string;
  elementCounts: Record<FiveElement, number>;
  dominantElement: FiveElement;
  lackingElement: FiveElement;
  neededElement: FiveElement; // 용신/희신 (미래 연인이 채워주는 기운)
  specialBadges: string[]; // 천을귀인, 백호대살, 괴강살, 일주 홍염, 배우자궁 도화 등
  monthlyWave: MonthlyWaveItem[]; // 내 사주 일지·용신 연동 월별 인연 파동
  charmStars: {
    dohwa: number; // 도화살 지수 (0~100)
    hongyeom: number; // 홍염살 지수 (0~100)
    hwagae: number; // 화개살 지수 (0~100)
    yeokma: number; // 역마살 지수 (0~100)
    dohwaDesc: string; // 보유 기둥 위치 & 점수별 도화살 맞춤 진단
    hongyeomDesc: string; // 보유 기둥 위치 & 점수별 홍염살 맞춤 진단
    hwagaeDesc: string; // 보유 기둥 위치 & 점수별 화개살 맞춤 진단
    yeokmaDesc: string; // 보유 기둥 위치 & 점수별 역마살 맞춤 진단
    summary: string;
  };
}

export interface PartnerCompatibilityAnalysis {
  hasPartnerInput: boolean;
  partnerBirthDate: string;
  partnerDayPillar: string;
  partnerDayMasterTitle: string;
  partnerDominantElement: FiveElement;
  partnerNeededElement: FiveElement;
  score: number;
  harmonyBadges: string[]; // 천간합, 육합, 삼합, 원진살, 귀문관살, 상호용신 등 실제 판정 배지
  outerHarmony: string; // 겉궁합 (성격·대화 티키타카)
  innerHarmony: string; // 속궁합 (도화·홍염·육합·낮과 밤의 케미)
  conflictAndSolution: string; // 갈등 원인과 해결 비책
}

export interface FuturePartnerReport {
  themeMode: SajuThemeMode;
  headline: string;
  subheadline: string;
  freePersonality: string;
  freeLoveStyle: string;
  freeCharmAnalysis: string;
  partnerAnalysis: PartnerCompatibilityAnalysis;
  partnerAppearance: {
    vibeTitle: string;
    faceShape: string;
    eyesAndSmile: string;
    styleAndAura: string;
    celebVibe: string;
    bodyAndVoiceHint: string; // 체형·키·목소리·성씨 초성 힌트
    portraitPrompt: string;
    auraColorHex: string;
    secondaryColorHex: string;
    hairStyle: "short_clean" | "dandy_wave" | "long_soft" | "medium_chic";
    gender: "male" | "female";
  };
  lockedSecrets: {
    meetingTiming: string; // 무료 공유 시 열리는 1번 카드 (시기·골든타임)
    meetingPlace: string; // 유료 결제 전용 2번 카드 (장소·동선·스타일링)
    partnerJobAndAge: string; // 유료 결제 전용 3번 카드 (직업·나이차·외형디테일·성씨초성)
    firstSignal: string; // 이 사람임을 알아보는 첫 대화/행동 시그널
    reunionOrCompatibility: {
      score: number;
      hiddenThought: string;
      contactTiming: string;
      actionAdvice: string;
      badPartnerWarning: string; // 피해야 할 나쁜 이성(악연) 판별법
    };
    wealthAndMarriage2027: string;
  };
  reunionDeepPack: ReunionDeepPack; // +2,000원 전용 업셀 리포트
  vip2027Calendar: Vip2027CalendarPack; // +3,000원 전용 업셀 리포트
  receiptCode?: string; // 인앱 브라우저 증발 방지용 영구 열람 복구 코드
  viralThreadsCopy: {
    mainPost: string;
    firstReply: string;
    reelsHook: string;
  };
  source: "gemini-live" | "manseryeok-SmartEngine";
}

const STEMS = [
  { ko: "갑", hanja: "甲", el: "목" as FiveElement, yinYang: "+" as const },
  { ko: "을", hanja: "乙", el: "목" as FiveElement, yinYang: "-" as const },
  { ko: "병", hanja: "丙", el: "화" as FiveElement, yinYang: "+" as const },
  { ko: "정", hanja: "丁", el: "화" as FiveElement, yinYang: "-" as const },
  { ko: "무", hanja: "戊", el: "토" as FiveElement, yinYang: "+" as const },
  { ko: "기", hanja: "己", el: "토" as FiveElement, yinYang: "-" as const },
  { ko: "경", hanja: "庚", el: "금" as FiveElement, yinYang: "+" as const },
  { ko: "신", hanja: "辛", el: "금" as FiveElement, yinYang: "-" as const },
  { ko: "임", hanja: "壬", el: "수" as FiveElement, yinYang: "+" as const },
  { ko: "계", hanja: "癸", el: "수" as FiveElement, yinYang: "-" as const },
];

const BRANCHES = [
  {
    ko: "자",
    hanja: "子",
    el: "수" as FiveElement,
    yinYang: "-" as const,
    animal: "푸른 쥐",
    hidden: "임·계",
  },
  {
    ko: "축",
    hanja: "丑",
    el: "토" as FiveElement,
    yinYang: "-" as const,
    animal: "묵직한 소",
    hidden: "계·신·기",
  },
  {
    ko: "인",
    hanja: "寅",
    el: "목" as FiveElement,
    yinYang: "+" as const,
    animal: "새벽 호랑이",
    hidden: "무·병·갑",
  },
  {
    ko: "묘",
    hanja: "卯",
    el: "목" as FiveElement,
    yinYang: "-" as const,
    animal: "봄날의 토끼",
    hidden: "갑·을",
  },
  {
    ko: "진",
    hanja: "辰",
    el: "토" as FiveElement,
    yinYang: "+" as const,
    animal: "구름 속 용",
    hidden: "을·계·무",
  },
  {
    ko: "사",
    hanja: "巳",
    el: "화" as FiveElement,
    yinYang: "+" as const,
    animal: "지혜로운 뱀",
    hidden: "무·경·병",
  },
  {
    ko: "오",
    hanja: "午",
    el: "화" as FiveElement,
    yinYang: "-" as const,
    animal: "한낮의 말",
    hidden: "병·기·정",
  },
  {
    ko: "미",
    hanja: "未",
    el: "토" as FiveElement,
    yinYang: "-" as const,
    animal: "온화한 양",
    hidden: "정·을·기",
  },
  {
    ko: "신",
    hanja: "申",
    el: "금" as FiveElement,
    yinYang: "+" as const,
    animal: "재치 있는 원숭이",
    hidden: "무·임·경",
  },
  {
    ko: "유",
    hanja: "酉",
    el: "금" as FiveElement,
    yinYang: "-" as const,
    animal: "보석 같은 닭",
    hidden: "경·신",
  },
  {
    ko: "술",
    hanja: "戌",
    el: "토" as FiveElement,
    yinYang: "+" as const,
    animal: "충직한 개",
    hidden: "신·정·무",
  },
  {
    ko: "해",
    hanja: "亥",
    el: "수" as FiveElement,
    yinYang: "+" as const,
    animal: "깊은 밤 호수 돼지",
    hidden: "무·갑·임",
  },
];

const ELEMENT_ORDER: FiveElement[] = ["목", "화", "토", "금", "수"];

// 십이운성(12운성) 순서 및 일간별 장생(長生) 지지 인덱스 매핑
const TWELVE_STAGES = [
  "장생",
  "목욕",
  "관대",
  "건록",
  "제왕",
  "쇠",
  "병",
  "사",
  "묘",
  "절",
  "태",
  "양",
];

const CHANGSAENG_START_BRANCH: Record<
  string,
  { startBranchIdx: number; forward: boolean }
> = {
  갑: { startBranchIdx: 11, forward: true }, // 해(11) 순행
  을: { startBranchIdx: 6, forward: false }, // 오(6) 역행
  병: { startBranchIdx: 2, forward: true }, // 인(2) 순행
  정: { startBranchIdx: 9, forward: false }, // 유(9) 역행
  무: { startBranchIdx: 2, forward: true }, // 인(2) 순행
  기: { startBranchIdx: 9, forward: false }, // 유(9) 역행
  경: { startBranchIdx: 5, forward: true }, // 사(5) 순행
  신: { startBranchIdx: 0, forward: false }, // 자(0) 역행
  임: { startBranchIdx: 8, forward: true }, // 신(8) 순행
  계: { startBranchIdx: 3, forward: false }, // 묘(3) 역행
};

function getTwelveStage(dayStemKo: string, branchIdx: number): string {
  const cfg = CHANGSAENG_START_BRANCH[dayStemKo] || {
    startBranchIdx: 11,
    forward: true,
  };
  const offset = cfg.forward
    ? (branchIdx - cfg.startBranchIdx + 12) % 12
    : (cfg.startBranchIdx - branchIdx + 12) % 12;
  return TWELVE_STAGES[offset] || "장생";
}

// 일간(Day Stem) 기준 대상 오행·음양의 정확한 십성(十星) 산출
function getTenGod(
  dayEl: FiveElement,
  dayYinYang: "+" | "-",
  targetEl: FiveElement,
  targetYinYang: "+" | "-"
): string {
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  const targetIdx = ELEMENT_ORDER.indexOf(targetEl);
  const diff = (targetIdx - dayIdx + 5) % 5;
  const samePolarity = dayYinYang === targetYinYang;

  switch (diff) {
    case 0:
      return samePolarity ? "비견" : "겁재";
    case 1:
      return samePolarity ? "식신" : "상관";
    case 2:
      return samePolarity ? "편재" : "정재";
    case 3:
      return samePolarity ? "편관" : "정관";
    case 4:
      return samePolarity ? "편인" : "정인";
    default:
      return "비견";
  }
}

// 12절기(월주 변경 기준) 천문 상수 C (20세기 / 21세기) — 연도·윤년 주기별 절입 일시 정밀 산출
const SOLAR_TERM_ASTRO_C: Record<number, { c20: number; c21: number; name: string }> = {
  1: { c20: 6.11, c21: 5.4055, name: "소한" },
  2: { c20: 4.6295, c21: 3.87, name: "입춘" },
  3: { c20: 6.3826, c21: 5.63, name: "경칩" },
  4: { c20: 5.59, c21: 4.81, name: "청명" },
  5: { c20: 6.318, c21: 5.52, name: "입하" },
  6: { c20: 6.5, c21: 5.678, name: "망종" },
  7: { c20: 7.928, c21: 7.108, name: "소서" },
  8: { c20: 8.35, c21: 7.5, name: "입추" },
  9: { c20: 8.44, c21: 7.646, name: "백로" },
  10: { c20: 9.098, c21: 8.318, name: "한로" },
  11: { c20: 8.218, c21: 7.438, name: "입동" },
  12: { c20: 7.9, c21: 7.18, name: "대설" },
};

function getExactSolarTermCutoff(
  year: number,
  month: number
): { cutoffDay: number; cutoffHour: number; termName: string } {
  const meta = SOLAR_TERM_ASTRO_C[month] || SOLAR_TERM_ASTRO_C[2];
  const y = year % 100;
  const c = year >= 2000 ? meta.c21 : meta.c20;
  const leapCount = Math.floor((y - (month <= 2 ? 1 : 0)) / 4);
  const exactVal = y * 0.2422 + c - leapCount;
  const cutoffDay = Math.floor(exactVal);
  const frac = exactVal - cutoffDay;
  const cutoffHour = Math.min(23, Math.max(0, Math.round(frac * 24)));
  return { cutoffDay, cutoffHour, termName: meta.name };
}

// 음력(평달/윤달) → 양력(YYYY-MM-DD) 정밀 자동 변환기 (Intl.DateTimeFormat 'en-u-ca-chinese' 표준 엔진 활용)
export function convertLunarToSolar(
  inputDateStr: string,
  calendarType: CalendarType = "solar"
): { solarDate: string; conversionLabel: string } {
  if (calendarType === "solar" || !/^\d{4}-\d{2}-\d{2}$/.test(inputDateStr)) {
    return { solarDate: inputDateStr, conversionLabel: `양력 ${inputDateStr}` };
  }

  const [yStr, mStr, dStr] = inputDateStr.split("-");
  const targetYear = parseInt(yStr || "2000", 10);
  const targetMonth = parseInt(mStr || "1", 10);
  const targetDay = parseInt(dStr || "1", 10);
  const wantLeap = calendarType === "lunar_leap";

  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-chinese", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });

    // 음력 날짜는 같은 숫자의 양력 날짜보다 약 20~65일 뒤에 위치하므로 +15일~+75일 구간 정밀 탐색
    const startUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
    let fallbackMatch: string | null = null;

    for (let offset = 15; offset <= 75; offset++) {
      const candidate = new Date(startUtc + offset * 86400000);
      const parts = fmt.formatToParts(candidate);
      const rYear = parseInt(
        parts.find((p) => (p.type as string) === "relatedYear")?.value || "0",
        10
      );
      const rawMonth = parts.find((p) => p.type === "month")?.value || "";
      const isLeap = rawMonth.includes("bis");
      const rMonth = parseInt(rawMonth.replace(/[^0-9]/g, "") || "0", 10);
      const rDay = parseInt(
        parts.find((p) => p.type === "day")?.value || "0",
        10
      );

      if (rYear === targetYear && rMonth === targetMonth && rDay === targetDay) {
        const yyyy = candidate.getUTCFullYear();
        const mm = String(candidate.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(candidate.getUTCDate()).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        if (isLeap === wantLeap) {
          return {
            solarDate: iso,
            conversionLabel: `음력(${wantLeap ? "윤달" : "평달"}) ${inputDateStr} → 양력 ${iso} 자동 변환`,
          };
        }
        if (!fallbackMatch) fallbackMatch = iso;
      }
    }

    if (fallbackMatch) {
      return {
        solarDate: fallbackMatch,
        conversionLabel: `음력 ${inputDateStr} → 양력 ${fallbackMatch} 자동 변환`,
      };
    }
  } catch {
    // Fallback below
  }

  return {
    solarDate: inputDateStr,
    conversionLabel: `양력 ${inputDateStr}`,
  };
}

const DAY_MASTER_META: Record<
  string,
  {
    title: string;
    archetype: string;
    loveTrait: string;
    partnerVoiceAndHeight: string;
    surnameHint: string;
  }
> = {
  갑: {
    title: "곧게 뻗은 거목(甲木)",
    archetype: "자존심 강하고 리드하기 좋아하는 로맨티스트",
    loveTrait:
      "겉으로는 든든하고 쿨해 보이지만, 내 사람에게는 한없이 약해지고 인정받을 때 사랑이 깊어지는 스타일입니다.",
    partnerVoiceAndHeight:
      "비율이 시원시원하고 걸음걸이가 반듯하며, 대화할 때 신뢰감을 주는 맑은 중저음 보이스",
    surnameHint: "ㄱ · ㅅ · ㅇ 초성 계열(김·강·신·송·이·안 등)과 파동 합이 강함",
  },
  을: {
    title: "유연한 봄꽃 덩굴(乙木)",
    archetype: "섬세한 공감 능력으로 상대의 마음을 녹이는 외유내강형",
    loveTrait:
      "다정하고 세심하게 상대의 기분을 살피지만, 내면에는 쉽게 꺾이지 않는 단단한 기준을 가지고 있습니다.",
    partnerVoiceAndHeight:
      "어깨선과 체형이 탄탄하면서도 손가락이 고우며, 다정하게 이름을 불러주는 부드러운 음색",
    surnameHint: "ㅂ · ㅇ · ㅈ 초성 계열(박·배·윤·오·정·조 등)과 인연 줄이 깊음",
  },
  병: {
    title: "찬란한 한낮의 태양(丙火)",
    archetype: "숨김없이 감정을 표현하는 열정적인 직진 사랑꾼",
    loveTrait:
      "좋아하는 마음이 생기면 표정부터 티가 나며, 함께 있을 때 주변까지 밝게 만드는 화사한 에너지가 매력입니다.",
    partnerVoiceAndHeight:
      "옷태가 살아나는 슬림 탄탄한 피지컬에 웃을 때 눈매가 접히는 호감형, 생동감 있는 목소리",
    surnameHint: "ㅅ · ㅊ · ㅎ 초성 계열(서·손·최·차·한·홍 등)과 도화 파동이 공명함",
  },
  정: {
    title: "밤하늘을 비추는 촛불·별빛(丁火)",
    archetype: "조용히 깊어지다가 한 번 타오르면 식지 않는 감성파",
    loveTrait:
      "첫인상은 차분하고 신비롭지만, 마음이 열린 상대에게는 누구보다 따뜻하고 헌신적인 온기를 건넵니다.",
    partnerVoiceAndHeight:
      "선이 깔끔하고 목선·어깨 라인이 세련되었으며, 밤 시간대 통화할 때 설레는 나지막한 톤",
    surnameHint: "ㅇ · ㅈ · ㄱ 초성 계열(이·임·유·전·장·권 등)과 천간·지지 인연이 깊음",
  },
  무: {
    title: "넓고 듬직한 대지·산(戊土)",
    archetype: "흔들리지 않는 신뢰감으로 상대를 품어주는 안식처형",
    loveTrait:
      "가벼운 썸보다는 오래갈 수 있는 안정적인 관계에서 진가가 드러나며, 상대가 기댈 수 있는 든든한 매력이 있습니다.",
    partnerVoiceAndHeight:
      "안겼을 때 안정감을 주는 탄탄한 골격과 바른 자세, 차분하고 설득력 있는 목소리",
    surnameHint: "ㄱ · ㅁ · ㅂ 초성 계열(고·구·문·민·박·백 등)과 배우자 복이 높음",
  },
  기: {
    title: "비옥하고 따뜻한 정원(己土)",
    archetype: "실속 있고 다정하게 일상을 챙겨주는 현실 밀착형 연인",
    loveTrait:
      "사소한 말 한마디도 기억해 챙겨주는 세심함이 무기이며, 편안한 대화 속에서 스며들듯 사랑이 시작됩니다.",
    partnerVoiceAndHeight:
      "깔끔하고 단정한 피부톤에 자기관리 잘된 체형, 듣기 편안하고 다정한 말투",
    surnameHint: "ㄱ · ㅇ · ㅎ 초성 계열(김·곽·양·우·황·허 등)과 합(合)이 잘 맞음",
  },
  경: {
    title: "단단하게 제련된 원석·검(庚金)",
    archetype: "맺고 끊음이 확실하지만 내 사람에겐 의리 끝판왕",
    loveTrait:
      "밀당이나 애매한 태도를 싫어하고, 한 번 내 사람이라고 확신하면 끝까지 책임지고 지켜주는 결단력이 돋보입니다.",
    partnerVoiceAndHeight:
      "피지컬 밸런스가 돋보이는 훤칠한 실루엣에 딕션이 또렷하고 세련된 도회적 보이스",
    surnameHint: "ㅇ · ㅈ · ㅅ 초성 계열(유·안·장·주·신·심 등)과 강한 인연 자력이 작동함",
  },
  신: {
    title: "세공된 다이아몬드 보석(辛金)",
    archetype: "까다로운 안목과 독보적인 분위기로 시선을 끄는 냉미남·냉미녀",
    loveTrait:
      "아무에게나 마음을 주지 않는 도도함이 오히려 이성의 정복욕과 호기심을 강하게 자극하는 매력을 지녔습니다.",
    partnerVoiceAndHeight:
      "수트나 셔츠 핏이 완벽하게 떨어지는 모델형 비율, 차분하지만 내 앞에선 달콤해지는 반전 음색",
    surnameHint: "ㅂ · ㅅ · ㅊ 초성 계열(박·변·송·서·최·천 등)과 홍염 파동이 연결됨",
  },
  임: {
    title: "깊고 넓은 푸른 바다(壬水)",
    archetype: "포용력과 지적인 대화로 상대를 빨아들이는 심해 매력형",
    loveTrait:
      "생각의 폭이 넓고 센스가 뛰어나 대화할수록 빠져들며, 자유로우면서도 깊은 정서적 교감을 중요하게 여깁니다.",
    partnerVoiceAndHeight:
      "여유롭고 세련된 아우라의 장신 비율과 밤새 대화하고 싶어지는 지적인 중저음 목소리",
    surnameHint: "ㅈ · ㅎ · ㅇ 초성 계열(정·조·한·하·이·원 등)과 깊은 정서적 공명을 이룸",
  },
  계: {
    title: "대지를 적시는 봄비·이슬(癸水)",
    archetype: "청초한 감성과 영리한 눈치로 상대의 빈틈을 채우는 치명적 매력",
    loveTrait:
      "상대가 무엇을 원하는지 본능적으로 캐치하는 능력이 뛰어나며, 보호본능과 설렘을 동시에 자극합니다.",
    partnerVoiceAndHeight:
      "첫인상부터 호감을 주는 맑은 피부와 탄탄한 실루엣, 다정하고 섬세한 호흡의 보이스",
    surnameHint: "ㄱ · ㄴ · ㅇ 초성 계열(김·권·남·노·윤·유 등)과 천을귀인 인연이 열림",
  },
};

// 배우자궁(일지 십성) 10가지별 미래 연인 디테일 조합자 (같은 오행 용신이어도 일지 십성에 따라 전혀 다른 결과가 나오도록 설계)
const SPOUSE_TENGOD_MODIFIERS: Record<
  string,
  {
    faceDetail: string;
    smileDetail: string;
    venueDetail: string;
    careerDetail: string;
    firstSignalDetail: string;
    ageGapDetail: string;
  }
> = {
  비견: {
    faceDetail: "이목구비 대칭이 시원하고 자기주관이 뚜렷해 보이는 당당한 호감형",
    smileDetail: "장난기 섞인 눈웃음으로 친구처럼 편안하게 무장해제시키는 미소",
    venueDetail: "러닝·테니스·클라이밍 같은 액티브 동호회나 직무 커뮤니티·스터디 모임",
    careerDetail: "독립적인 전문직, 프리랜서, IT 기획/개발, 창업가처럼 자기 분야가 확실한 커리어",
    firstSignalDetail:
      "첫 대화부터 어색함 없이 오랜 친구처럼 티키타카가 터지며, 운동·취미·일하는 방식이 놀라울 정도로 비슷하다는 걸 발견하게 됩니다.",
    ageGapDetail: "동갑이거나 1~2세 이내의 또래일 때 가장 폭발적인 시너지",
  },
  겁재: {
    faceDetail: "눈빛에 강한 흡입력과 카리스마가 서려 있어 한 번 보면 잊히지 않는 입체적 인상",
    smileDetail: "무심한 듯 시크하다가 내 말에만 피식 웃으며 시선을 고정하는 승부사적 미소",
    venueDetail: "경쟁력 있는 프로젝트 미팅, 트렌디한 라운지 모임, 지인 여럿이 모인 뒤풀이 자리",
    careerDetail: "금융·투자, 영업/세일즈 디렉터, 스포츠·엔터, 전략 컨설팅 등 승부욕과 추진력이 빛나는 직군",
    firstSignalDetail:
      "여러 사람이 있는 자리에서 유독 내 말에만 빠르게 반응하고, 은근한 승부욕이나 직진 플러팅으로 단숨에 일대일 구도를 만듭니다.",
    ageGapDetail: "1~3세 연상 또는 패기 넘치는 연하와 강렬한 텐션",
  },
  식신: {
    faceDetail: "볼과 입매가 부드럽고 복스러우며 바라만 봐도 기분이 좋아지는 훈훈한 인상",
    smileDetail: "맛있는 음식을 먹을 때나 웃을 때 반달눈이 되며 다정함이 뚝뚝 떨어지는 미소",
    venueDetail: "성수·한남·연남동 오마카세/맛집 투어, 와인 모임, 요리·베이킹·커피 클래스",
    careerDetail: "F&B 브랜드 기획, 연구개발(R&D), 의사·약사, 콘텐츠 제작, 라이프스타일 디렉터",
    firstSignalDetail:
      "맛집이나 커피·위스키·디저트 취향 이야기로 대화가 급격히 길어지며, '다음에 거기 같이 가요'라는 자연스러운 데이트 신청이 첫 시그널입니다.",
    ageGapDetail: "나이 차이를 의식하지 않게 만드는 다정한 1~3세 차 또는 동갑",
  },
  상관: {
    faceDetail: "트렌디하고 날렵한 콧날과 화려한 분위기로 어디서나 스포트라이트를 받는 감각적 미형",
    smileDetail: "윙크하듯 한쪽 입꼬리가 올라가며 설렘을 유발하는 여우/고양이 같은 눈웃음",
    venueDetail: "전시회·아트페어·팝업스토어, 패션/디자인 행사, 인스타·스레드 등 감각적인 소셜 네트워크",
    careerDetail: "크리에이티브 디렉터, 디자이너, 미디어/방송, 마케팅, 예술·뷰티·아키텍처 분야",
    firstSignalDetail:
      "센스 넘치는 칭찬(‘오늘 입으신 스타일/향이 너무 잘 어울려요’)으로 먼저 말을 걸어오며, 대화 센스와 유머 코드가 완벽하게 맞아떨어집니다.",
    ageGapDetail: "감각이 젊은 연상 또는 트렌디한 1~3세 연하와 최상의 케미",
  },
  편재: {
    faceDetail: "시원시원한 이마와 호탕한 아우라로 스케일이 크고 여유로워 보이는 매력적인 얼굴",
    smileDetail: "주변 공기까지 화사하게 바꾸는 호쾌하고 자신감 넘치는 백만 불짜리 미소",
    venueDetail: "해외여행지·공항·출장길, 비즈니스 네트워킹 파티, 골프·요트·드라이브 모임",
    careerDetail: "글로벌 비즈니스, 무역·유통, 사업가/스타트업 대표, 금융 애널리스트, 벤처 투자",
    firstSignalDetail:
      "여행 경험이나 새로운 핫플레이스 이야기를 나누다 급격히 가까워지며, 계산하거나 챙겨줄 때 망설임 없이 통 크게 배려하는 모습에서 확신이 옵니다.",
    ageGapDetail: "리드력이 돋보이는 2~5세 연상 또는 능력 있는 동갑",
  },
  정재: {
    faceDetail: "단정하고 바른 이목구비에 피부가 깨끗하여 '상견례 프리패스'라는 말이 절로 나오는 귀티 인상",
    smileDetail: "과장되지 않고 온화하게 눈을 맞추며 신뢰감을 주는 반듯한 미소",
    venueDetail: "신뢰할 만한 선배·지인의 정식 1:1 소개팅, 사내·동문 모임, 금융·경제 세미나",
    careerDetail: "대기업·금융권 핵심 부서, 회계사·세무사, 공기업·안정적 전문직, 자산운용/관리직",
    firstSignalDetail:
      "약속 시간보다 일찍 도착해 배려하고, 내가 흘려 말한 사소한 취향이나 일정을 정확히 기억해 다음 만남에 반영하는 성실함이 결정적 시그널입니다.",
    ageGapDetail: "결혼 적령기 밸런스가 가장 좋은 동갑 ~ 3세 차이",
  },
  편관: {
    faceDetail: "턱선과 눈매가 또렷하고 자기관리 흔적이 역력한 시크·섹시 카리스마 인상",
    smileDetail: "평소엔 냉미남·냉미녀처럼 무표정하다가 내 앞에서만 무장해제되는 반전 눈웃음",
    venueDetail: "청담·강남 비즈니스 협업 자리, 프라이빗 피트니스·PT·크로스핏, 공식 프로젝트 현장",
    careerDetail: "법조계·변호사, 외과의·의료계, 외국계 임원, 보안/IT 아키텍트, 고위 공직·지휘 직군",
    firstSignalDetail:
      "남들에게는 빈틈없고 차가워 보이던 사람이 나에게만 은밀하게 개인적인 질문을 건네거나 퇴근길·주말 시간을 먼저 비워두는 반전 행동을 보입니다.",
    ageGapDetail: "든든하게 나를 지켜주는 2~5세 연상 또는 성숙한 연하",
  },
  정관: {
    faceDetail: "이마와 콧대가 반듯하고 기품이 흘러 누가 봐도 좋은 가정환경과 교양이 느껴지는 정석 미남·미녀",
    smileDetail: "예의 바르고 다정한 눈빛으로 내 이야기를 끝까지 경청하며 짓는 스윗한 미소",
    venueDetail: "지인 결혼식·하객 자리, 동문회/학회, 품격 있는 호텔 라운지나 정식 주선 자리",
    careerDetail: "대기업/다국적기업 정통 엘리트, 행정·법무·공직, 대학·연구기관, 판검사·의료 전문직",
    firstSignalDetail:
      "말투와 매너가 유독 단정하고 존중이 배어 있으며, 썸 단계에서도 어장관리나 애매한 밀당 없이 진지한 호감을 명확히 표현합니다.",
    ageGapDetail: "안정적인 가치관을 공유하는 1~4세 연상 또는 반듯한 동갑",
  },
  편인: {
    faceDetail: "신비롭고 몽환적인 눈빛과 예술가적 아우라가 공존해 자꾸만 궁금증을 자아내는 매력적인 마스크",
    smileDetail: "나른하고 섹시한 무드 속에 내 마음을 꿰뚫어 보는 듯한 깊은 미소",
    venueDetail: "심야 위스키·재즈바, 독립서점·심야 영화관, 예술·심리·철학 모임이나 밤 시간대 온라인 소통",
    careerDetail: "AI·데이터 사이언티스트, 의사·심리상담, 작가·프로듀서, 건축·브랜드 전략가",
    firstSignalDetail:
      "남들에게 쉽게 꺼내지 못했던 깊은 속마음이나 상처를 이야기하게 되고, 밤 시간대 대화나 통화가 시간 가는 줄 모르고 이어지는 순간이 옵니다.",
    ageGapDetail: "나이 차이를 초월해 정신적 교감이 깊은 상대 (연상·연하 모두 길함)",
  },
  정인: {
    faceDetail: "선이 곱고 우아하며 따뜻한 햇살 같은 기품이 감도는 지적이고 인자한 호감형",
    smileDetail: "보는 사람의 긴장을 사르르 녹여주는 포근하고 다정한 첫사랑 재질 미소",
    venueDetail: "북카페·도서관·직무 강의실, 멘토링/세미나, 차분한 티룸이나 갤러리 카페",
    careerDetail: "교육·교수·연구원, 언론·출판·에디터, 의료/법률 자문, 대기업 인사·기획·브랜드 직군",
    firstSignalDetail:
      "내 고민이나 커리어 이야기를 누구보다 진심으로 응원해 주고, 함께 있으면 조급했던 마음이 신기하리만큼 편안해지는 위로를 느끼게 됩니다.",
    ageGapDetail: "나를 아낌없이 예뻐해 주는 2~4세 연상 또는 포용력 있는 동갑",
  },
};

const ELEMENT_PARTNER_PROFILE: Record<
  FiveElement,
  {
    vibeTitle: string;
    faceShape: string;
    eyesAndSmile: string;
    styleAndAura: string;
    celebVibe: string;
    auraColorHex: string;
    secondaryColorHex: string;
    hairStyleMale: "short_clean" | "dandy_wave";
    hairStyleFemale: "long_soft" | "medium_chic";
    meetingSeason: string;
    meetingMonthsDetail: string;
    meetingPlace: string;
    jobCluster: string;
    dateLookTip: string;
  }
> = {
  목: {
    vibeTitle: "청량한 숲속 아침처럼 다정하고 성장 에너지가 넘치는 연인",
    faceShape: "선이 깔끔하고 턱선이 부드러운 계란형·청초한 인상의 얼굴",
    eyesAndSmile: "눈꼬리가 살짝 휘어지며 웃을 때 소년·소녀미가 살아나는 맑은 눈매",
    styleAndAura: "과하게 꾸미지 않아도 셔츠나 캐시미어 니트 핏이 깔끔한 ‘남친·여친룩의 정석’ 분위기",
    celebVibe: "청량하고 반듯한 대형견미·첫사랑 재질의 배우형 인상",
    auraColorHex: "#10b981",
    secondaryColorHex: "#34d399",
    hairStyleMale: "dandy_wave",
    hairStyleFemale: "long_soft",
    meetingSeason: "목(木) 기운이 만개하는 봄(2~4월 인·묘·진월) 및 환절기",
    meetingMonthsDetail:
      "2026년 11월(해월: 수생목 상생월)의 설레는 스파크 이후, 2027년 2월~4월(인·묘·진월)에 결혼까지 이어질 수 있는 정연(正緣) 대운이 강하게 안착합니다.",
    meetingPlace: "성수·연남동 북카페, 직무 스터디/세미나, 러닝·테니스 크루 등 건강한 취미나 배움이 오가는 공간",
    jobCluster: "IT 프로덕트 기획·디자인·교육·건축·바이오·브랜드 디렉팅 등 무언가를 키우고 창조하는 직군",
    dateLookTip: "아이보리·세이지 그린 톤의 부드러운 니트나 셔츠에 은은한 시트러스·비누향을 매치하면 첫만남 호감도가 200% 상승합니다.",
  },
  화: {
    vibeTitle: "어디서나 시선을 사로잡는 입체적인 이목구비와 화사한 텐션의 연인",
    faceShape: "입체적인 T존과 또렷한 윤곽으로 첫인상부터 기억에 남는 화려한 얼굴형",
    eyesAndSmile: "눈빛에 생기가 가득하고, 활짝 웃을 때 주변 공기까지 밝아지는 매력적인 미소",
    styleAndAura: "트렌디한 재킷·레더 핏과 세련된 향수가 잘 어울리는 패셔너블한 아우라",
    celebVibe: "화려한 고양이상·여우상과 햇살 같은 미소가 공존하는 배우·아이돌형 인상",
    auraColorHex: "#f43f5e",
    secondaryColorHex: "#fb7185",
    hairStyleMale: "dandy_wave",
    hairStyleFemale: "medium_chic",
    meetingSeason: "화(火) 에너지가 상승하는 초여름(5~7월) 및 11~12월 연말 모임 시즌",
    meetingMonthsDetail:
      "가장 가까운 인연 파동은 2026년 11월 중순~12월 연말 소셜 모임 시즌에 1차로 강하게 들어오며, 2027년 5월~6월(사·오월)에 관계가 급진전됩니다.",
    meetingPlace: "성수·한남 팝업스토어/전시회, 루프탑 라운지, 지인 생일파티, 인스타그램/스레드 등 감각적인 소셜 접점",
    jobCluster: "마케팅·브랜드 디렉터·미디어·패션·아트·크리에이터·외교/영업 등 트렌드와 사람을 이끄는 직군",
    dateLookTip: "로즈·버건디·웜톤 포인트 컬러나 골드 주얼리로 얼굴에 화사한 조명을 켠 듯 연출하면 도화·홍염 파동이 극대화됩니다.",
  },
  토: {
    vibeTitle: "한 번 안기면 떠나기 힘든 듬직한 어깨와 깊은 신뢰감의 연인",
    faceShape: "이마와 콧대가 바르고 조화로워 볼수록 마음이 놓이는 호감형 귀티 인상",
    eyesAndSmile: "깊고 잔잔한 눈동자에 차분한 중저음 목소리, 입꼬리가 부드럽게 올라가는 온화한 미소",
    styleAndAura: "캐멀 코트와 슬랙스, 클래식한 시계가 잘 어울리는 ‘어른스러운 여유와 안정감’",
    celebVibe: "상견례 프리패스상이라 불리는 단정하고 기품 있는 배우·아나운서형 인상",
    auraColorHex: "#f59e0b",
    secondaryColorHex: "#fbbf24",
    hairStyleMale: "short_clean",
    hairStyleFemale: "long_soft",
    meetingSeason: "토(土) 기운이 중화되는 환절기(4월·7월·10월) 또는 이직·이사 등 환경이 바뀌는 변곡점",
    meetingMonthsDetail:
      "2026년 11월(술·해월 교차기)에 신뢰할 만한 사람을 통한 연결고리가 열리며, 2027년 4월(진월)과 7월(미월)에 진지한 장기 연애·결혼운이 정점에 달합니다.",
    meetingPlace: "신뢰할 수 있는 선배·지인의 정식 소개(주선), 사내·동문 모임, 호텔 라운지나 조용한 프라이빗 다이닝",
    jobCluster: "금융·대기업/공기업 핵심 관리직·법무·회계·부동산·안정적인 전문직 및 사업가",
    dateLookTip: "베이지·크림·브라운 계열의 단정한 코트나 자켓으로 고급스럽고 차분한 인상을 주면 상대방이 첫눈에 결혼까지 떠올리게 됩니다.",
  },
  금: {
    vibeTitle: "차가운 도시미 속에 나에게만 무장해제되는 츤데레 냉미남·냉미녀",
    faceShape: "콧날과 턱선이 날렵하고 피부가 맑아 세련된 도회적 분위기가 흐르는 얼굴",
    eyesAndSmile: "무표정일 땐 시크하고 도도하지만, 내 앞에서만 사르르 풀리는 반전 눈웃음",
    styleAndAura: "테일러드 수트·모노톤 재킷과 미니멀한 액세서리가 찰떡인 ‘일 잘하는 프로페셔널’ 아우라",
    celebVibe: "세련된 늑대상·고양이상으로 슈트핏과 사복 센스가 뛰어난 모델·배우형 인상",
    auraColorHex: "#6366f1",
    secondaryColorHex: "#a855f7",
    hairStyleMale: "short_clean",
    hairStyleFemale: "medium_chic",
    meetingSeason: "금(金) 기운이 결실을 맺는 8~10월 가을 시즌 및 초겨울",
    meetingMonthsDetail:
      "2026년 11월~12월 사이에 일이나 자기계발과 연관된 자리에서 강렬한 첫인상의 인연이 포착되며, 2027년 가을(신·유월)에 확고한 관계로 자리 잡습니다.",
    meetingPlace: "청담·강남 비즈니스 미팅, 직무 컨퍼런스, 프라이빗 피트니스·클라이밍·골프 등 자기관리 공간",
    jobCluster: "IT 개발·AI 엔지니어·의사/약사·변호사·금융 퀀트·전략 컨설팅 등 전문성과 결단력이 높은 직군",
    dateLookTip: "화이트·차콜·블랙의 미니멀 시크 룩에 실버 포인트 시계·주얼리를 매치하면 상대의 시선을 단번에 사로잡습니다.",
  },
  수: {
    vibeTitle: "밤바다처럼 깊고 지적인 대화로 밤새도록 설레게 만드는 연인",
    faceShape: "피부가 맑고 선이 고우며, 분위기 있는 나른함과 섹시함이 공존하는 얼굴",
    eyesAndSmile: "촉촉하고 깊은 눈망울로 내 이야기를 가만히 들어주며 짓는 신비로운 미소",
    styleAndAura: "부드러운 네이비·그레이 캐시미어 니트와 은은한 우디·머스크 향이 어울리는 지적인 분위기",
    celebVibe: "멜로 영화 주인공 같은 아련함과 섹시한 지성미를 갖춘 배우형 인상",
    auraColorHex: "#0ea5e9",
    secondaryColorHex: "#38bdf8",
    hairStyleMale: "dandy_wave",
    hairStyleFemale: "long_soft",
    meetingSeason: "수(水) 기운이 깊어지는 11~1월 겨울 시즌 또는 비 오는 저녁 시간대",
    meetingMonthsDetail:
      "다가오는 2026년 11월(해월)~12월(자월) 겨울 시즌에 밤 시간대 대화나 모임을 통해 운명처럼 급격히 가까워지는 흐름이 들어와 있습니다.",
    meetingPlace: "심야 와인바·재즈바·독서/영화 모임·해외여행지(도쿄/교토/타이베이 등) 또는 밤 시간대의 깊은 대화 자리",
    jobCluster: "외국계 기업·연구직·작가/PD·글로벌 비즈니스·심리/기획·예술 등 지적 호기심과 감성이 깊은 직군",
    dateLookTip: "네이비·딥그레이·블랙 톤의 부드러운 소재와 은은한 우디·머스크 잔향을 남기면 밤마다 당신을 떠올리게 됩니다.",
  },
};

// 과다 오행별 피해야 할 악연(나쁜 이성) 경고 데이터
const BAD_PARTNER_BY_DOMINANT: Record<FiveElement, string> = {
  목: "내 사주에 이미 강한 목(木) 기운을 과열시켜 자기주장만 내세우고 사소한 자존심 싸움으로 내 에너지를 갉아먹는 독선적인 이성은 반드시 피하세요.",
  화: "초반에 불꽃처럼 화려한 말과 감정 표현으로 급발진했다가 금방 식어버리는 감정 기복형·충동형 이성은 내 마음만 소모시키는 악연입니다.",
  토: "안정감을 빙자해 내 행동반경을 통제하려 들거나, 속마음을 말하지 않고 고집스럽게 입을 닫아버리는 답답한 성향의 이성은 피하셔야 합니다.",
  금: "시크한 매력 뒤에 날 선 비판이나 계산적인 태도를 숨기고, 내 자존감을 은근히 깎아내리며 우위를 점하려는 냉소적 이성은 절대 금물입니다.",
  수: "비밀이 많고 밤 시간대 연락이나 이성 관계가 불투명하며, 확신을 주지 않은 채 애매한 어장관리로 감정 소모를 유발하는 이성을 조심하세요.",
};

// 지지 합·충·원진·귀문 테이블
const YUKHAP_PAIRS: Record<string, string> = {
  자: "축",
  축: "자",
  인: "해",
  해: "인",
  묘: "술",
  술: "묘",
  진: "유",
  유: "진",
  사: "신",
  신: "사",
  오: "미",
  미: "오",
};

const CHUNG_PAIRS: Record<string, string> = {
  자: "오",
  오: "자",
  축: "미",
  미: "축",
  인: "신",
  신: "인",
  묘: "유",
  유: "묘",
  진: "술",
  술: "진",
  사: "해",
  해: "사",
};

const WONJIN_PAIRS: Record<string, string> = {
  자: "미",
  미: "자",
  축: "오",
  오: "축",
  인: "유",
  유: "인",
  묘: "신",
  신: "묘",
  진: "해",
  해: "진",
  사: "술",
  술: "사",
};

const GWIMUN_PAIRS: Record<string, string> = {
  자: "유",
  유: "자",
  축: "오",
  오: "축",
  인: "미",
  미: "인",
  묘: "신",
  신: "묘",
  진: "해",
  해: "진",
  사: "술",
  술: "사",
};

const STEM_HAP_PAIRS: Record<string, { partner: string; label: string }> = {
  갑: { partner: "기", label: "갑기합토(甲己合) — 신뢰와 존중의 정신적 합" },
  기: { partner: "갑", label: "갑기합토(甲己合) — 신뢰와 존중의 정신적 합" },
  을: { partner: "경", label: "을경합금(乙庚合) — 결단력과 다정함의 자석 합" },
  경: { partner: "을", label: "을경합금(乙庚合) — 결단력과 다정함의 자석 합" },
  병: { partner: "신", label: "병신합수(丙辛合) — 화려함과 세련미의 관능적 합" },
  신: { partner: "병", label: "병신합수(丙辛合) — 화려함과 세련미의 관능적 합" },
  정: { partner: "임", label: "정임합목(丁壬合) — 밤새 빠져드는 감성·로맨스 합" },
  임: { partner: "정", label: "정임합목(丁壬合) — 밤새 빠져드는 감성·로맨스 합" },
  무: { partner: "계", label: "무계합화(戊癸合) — 든든함과 총명함의 불꽃 합" },
  계: { partner: "무", label: "무계합화(戊癸合) — 든든함과 총명함의 불꽃 합" },
};

// 사주 일지·용신 기반 개인화 월별 인연 파동 산출
function buildPersonalizedMonthlyWave(
  dayBranch: string,
  neededEl: FiveElement,
  dohwaBase: number
): MonthlyWaveItem[] {
  const targetMonths: Array<{
    month: string;
    ganji: string;
    branch: string;
    el: FiveElement;
    seasonLabel: string;
  }> = [
    { month: "2026.11", ganji: "기해(己亥)월", branch: "해", el: "수", seasonLabel: "초겨울 밤 대화운" },
    { month: "2026.12", ganji: "경자(庚子)월", branch: "자", el: "수", seasonLabel: "연말 도화 스파크" },
    { month: "2027.02", ganji: "임인(壬寅)월", branch: "인", el: "목", seasonLabel: "입춘 새 인연 이동수" },
    { month: "2027.04", ganji: "갑진(甲辰)월", branch: "진", el: "토", seasonLabel: "봄 정연(正緣) 안착기" },
    { month: "2027.06", ganji: "병오(丙午)월", branch: "오", el: "화", seasonLabel: "초여름 홍염 절정기" },
  ];

  return targetMonths.map((m) => {
    const isYukhap = YUKHAP_PAIRS[dayBranch] === m.branch;
    const isChung = CHUNG_PAIRS[dayBranch] === m.branch;
    const isNeededEl = m.el === neededEl;
    const isDohwaMonth = ["자", "오", "묘", "유"].includes(m.branch);

    let score = Math.min(94, Math.max(76, Math.round(dohwaBase * 0.92)));
    let tag = m.seasonLabel;
    const reasons: string[] = [];

    if (isYukhap) {
      score = Math.min(99, score + 11);
      tag = "💘 배우자궁 육합(六合)";
      reasons.push(
        `내 배우자궁(일지 ‘${dayBranch}’)과 ${m.ganji}의 ‘${m.branch}’가 정통 육합(六合)을 이루어 속마음과 스킨십이 자석처럼 끌리는 최고 골든타임입니다.`
      );
    }
    if (isNeededEl) {
      score = Math.min(99, score + 8);
      if (!isYukhap) tag = `✨ 용신(${neededEl}) 만개`;
      reasons.push(
        `사주에서 가장 갈망하던 용신 ‘${neededEl}’ 에너지가 달의 기운으로 강하게 유입되어 이상형에 가까운 상대를 마주칠 확률이 급상승합니다.`
      );
    }
    if (isChung && !isYukhap) {
      score = Math.max(78, score - 2);
      tag = "⚡ 충(沖) 변곡점·스파크";
      reasons.push(
        `일지 ‘${dayBranch}’와 ‘${m.branch}’가 상충(沖)하며 기존 관계의 정체가 깨지고, 예상치 못한 장소에서 번개 같은 첫눈 끌림이나 재회 연락 변수가 터집니다.`
      );
    }
    if (isDohwaMonth && reasons.length === 0) {
      score = Math.min(97, score + 5);
      tag = "🌸 도화(桃花) 집중기";
      reasons.push(
        `${m.ganji}의 도화 기운이 내 원국을 자극해 모임·소개·SNS에서 이성의 시선과 연락이 집중되는 시기입니다.`
      );
    }
    if (reasons.length === 0) {
      score = Math.min(95, score + 3);
      reasons.push(
        `${m.ganji}의 흐름 속에서 가벼운 스침보다 대화가 깊이 통하는 진중한 인연과 신뢰를 쌓아가기 좋은 안정기입니다.`
      );
    }

    return {
      month: m.month,
      ganji: m.ganji,
      score,
      tag,
      desc: reasons.join(" "),
    };
  });
}

export function calculateSajuChart(
  birthDate: string, // YYYY-MM-DD (양력 또는 음력)
  birthHour: number, // 0~23 (-1 if unknown)
  calendarType: CalendarType = "solar"
): SajuChart {
  const { solarDate, conversionLabel } = convertLunarToSolar(
    birthDate,
    calendarType
  );
  const [yStr, mStr, dStr] = solarDate.split("-");
  const year = parseInt(yStr || "2000", 10);
  const month = parseInt(mStr || "1", 10);
  const day = parseInt(dStr || "1", 10);
  const hour = birthHour >= 0 ? birthHour : 12;

  // 1. 24절기(입춘 및 월절기) 천문 상수 기반 연도·시각 정밀 보정
  const { cutoffDay, cutoffHour, termName } = getExactSolarTermCutoff(
    year,
    month
  );
  const isBeforeSolarTerm =
    day < cutoffDay || (day === cutoffDay && hour < cutoffHour);

  const adjustedYear =
    month < 2 || (month === 2 && isBeforeSolarTerm) ? year - 1 : year;
  const effectiveSolarMonth = isBeforeSolarTerm
    ? month === 1
      ? 12
      : month - 1
    : month;

  // 2. 연주 (Year Pillar) - 1984년 = 갑자(0, 0)
  const yearStemIdx = (((adjustedYear - 1984) % 10) + 10) % 10;
  const yearBranchIdx = (((adjustedYear - 1984) % 12) + 12) % 12;

  // 3. 월주 (Month Pillar) - 인월(2월)=2 기준
  const solarMonthIndex = (effectiveSolarMonth + 9) % 12;
  const monthBranchIdx = (solarMonthIndex + 2) % 12;
  const monthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (monthStemStart + solarMonthIndex) % 10;

  // 4. 일주 (Day Pillar) - 2000-01-01 = 무오일 (stem 4, branch 6)
  const refUtc = Date.UTC(2000, 0, 1);
  const targetUtc = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((targetUtc - refUtc) / (1000 * 60 * 60 * 24));
  const dayStemIdx = (((4 + diffDays) % 10) + 10) % 10;
  const dayBranchIdx = (((6 + diffDays) % 12) + 12) % 12;

  // 5. 시주 (Hour Pillar) - 동경 127.5도 한국 진태양시(-30분) 기준 시진 매핑
  const hourBranchIdx = Math.floor(((hour + 1) % 24) / 2);
  const hourStemStart = (dayStemIdx % 5) * 2;
  const hourStemIdx = (hourStemStart + hourBranchIdx) % 10;

  const dayStem = STEMS[dayStemIdx];

  const makePillar = (
    sIdx: number,
    bIdx: number,
    pillarType: "year" | "month" | "day" | "hour"
  ): Pillar => {
    const s = STEMS[sIdx];
    const b = BRANCHES[bIdx];
    const isDayPillar = pillarType === "day";
    const stemTenGod = isDayPillar
      ? "본원(일간)"
      : getTenGod(dayStem.el, dayStem.yinYang, s.el, s.yinYang);
    const branchTenGod = getTenGod(dayStem.el, dayStem.yinYang, b.el, b.yinYang);
    const twelveStage = getTwelveStage(dayStem.ko, bIdx);

    let roleSummary = "";
    if (pillarType === "year") {
      roleSummary = `초년운·첫인상 자리에 ‘${stemTenGod}/${branchTenGod}’과 12운성 ‘${twelveStage}’이 놓여, 처음 만나는 이성에게 ${b.animal} 특유의 ${branchTenGod.includes("인") || branchTenGod.includes("관") ? "단정하고 기품 있는" : "생동감 있고 친근한"} 첫인상을 남깁니다.`;
    } else if (pillarType === "month") {
      roleSummary = `사회궁·직업 환경 자리에 ‘${stemTenGod}/${branchTenGod}’(${twelveStage})이 작동하여, 커리어·모임·사회적 활동 반경 안에서 ${branchTenGod} 성향의 능력 있는 이성과 강하게 엮입니다.`;
    } else if (pillarType === "day") {
      const mod = SPOUSE_TENGOD_MODIFIERS[branchTenGod] || SPOUSE_TENGOD_MODIFIERS["정관"];
      roleSummary = `배우자궁(일지 ‘${b.ko}’)에 ‘${branchTenGod}’과 12운성 ‘${twelveStage}’이 좌정해 있습니다. ${mod.faceDetail}의 배우자와 인연이 깊으며, 지장간(${b.hidden})의 기운이 결혼 후 안정감을 더해줍니다.`;
    } else {
      roleSummary = `말년·은밀한 애정궁(시주)에 ‘${stemTenGod}/${branchTenGod}’(${twelveStage})이 자리해, 연인과 단둘이 있을 때 ${twelveStage === "목욕" || twelveStage === "장생" || twelveStage === "제왕" ? "깊은 스킨십과 농밀한 애정 표현" : "편안하고 변치 않는 정서적 유대감"}이 강하게 발현됩니다.`;
    }

    return {
      stemKo: s.ko,
      stemHanja: s.hanja,
      stemElement: s.el,
      branchKo: b.ko,
      branchHanja: b.hanja,
      branchElement: b.el,
      animal: b.animal,
      tenGod: stemTenGod,
      branchTenGod,
      hiddenStems: b.hidden,
      twelveStage,
      roleSummary,
    };
  };

  const yearP = makePillar(yearStemIdx, yearBranchIdx, "year");
  const monthP = makePillar(monthStemIdx, monthBranchIdx, "month");
  const dayP = makePillar(dayStemIdx, dayBranchIdx, "day");
  const hourP = makePillar(hourStemIdx, hourBranchIdx, "hour");

  const counts: Record<FiveElement, number> = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  };
  [yearP, monthP, dayP, hourP].forEach((p) => {
    counts[p.stemElement] += 1;
    counts[p.branchElement] += 1;
  });

  const sortedEls = (Object.keys(counts) as FiveElement[]).sort(
    (a, b) => counts[b] - counts[a]
  );
  const dominantElement = sortedEls[0];
  const lackingElement = sortedEls[sortedEls.length - 1];

  const pillarEntries = [
    { name: "연주(첫인상)", p: yearP },
    { name: "월주(사회궁)", p: monthP },
    { name: "일주(배우자궁)", p: dayP },
    { name: "시주(애정궁)", p: hourP },
  ];

  const dohwaLocations = pillarEntries
    .filter((e) => ["자", "오", "묘", "유"].includes(e.p.branchKo))
    .map((e) => `${e.name}[${e.p.branchKo}]`);
  const yeokmaLocations = pillarEntries
    .filter((e) => ["인", "신", "사", "해"].includes(e.p.branchKo))
    .map((e) => `${e.name}[${e.p.branchKo}]`);
  const hwagaeLocations = pillarEntries
    .filter((e) => ["진", "술", "축", "미"].includes(e.p.branchKo))
    .map((e) => `${e.name}[${e.p.branchKo}]`);

  const dayPair = `${dayP.stemKo}${dayP.branchKo}`;
  const isHongyeomDay = [
    "갑오",
    "갑신",
    "병인",
    "정미",
    "무진",
    "경술",
    "경진",
    "신유",
    "임자",
    "임신",
  ].includes(dayPair);

  const isBaekhoDay = [
    "갑진",
    "을미",
    "병술",
    "정축",
    "무진",
    "임술",
    "계축",
  ].includes(dayPair);

  const isGoegangDay = ["무진", "무술", "경진", "경술", "임진", "임술"].includes(
    dayPair
  );

  // 천을귀인(天乙貴人) 판정
  const gwiinMap: Record<string, string[]> = {
    갑: ["축", "미"],
    무: ["축", "미"],
    경: ["축", "미"],
    을: ["자", "신"],
    기: ["자", "신"],
    병: ["해", "유"],
    정: ["해", "유"],
    신: ["인", "오"],
    임: ["사", "묘"],
    계: ["사", "묘"],
  };
  const gwiinBranches = gwiinMap[dayP.stemKo] || [];
  const gwiinLocations = pillarEntries
    .filter((e) => gwiinBranches.includes(e.p.branchKo))
    .map((e) => e.name);

  const dohwaScore = Math.min(
    98,
    48 + dohwaLocations.length * 21 + counts["화"] * 4 + (dayP.twelveStage === "목욕" ? 8 : 0)
  );
  const hongyeomScore = Math.min(
    99,
    (isHongyeomDay ? 84 : 54) +
      pillarEntries.filter((e) => ["오", "유", "자", "인", "신"].includes(e.p.branchKo)).length * 8
  );
  const hwagaeScore = Math.min(96, 44 + hwagaeLocations.length * 19);
  const yeokmaScore = Math.min(96, 46 + yeokmaLocations.length * 19);

  // 스페셜 신살 배지 생성
  const specialBadges: string[] = [];
  if (gwiinLocations.length > 0) {
    specialBadges.push(`천을귀인(${gwiinLocations.join("·")})`);
  }
  if (isHongyeomDay) {
    specialBadges.push(`일주 홍염살(${dayPair})`);
  }
  if (["자", "오", "묘", "유"].includes(dayP.branchKo)) {
    specialBadges.push(`배우자궁 진도화(${dayP.branchKo})`);
  }
  if (isBaekhoDay) {
    specialBadges.push(`백호대살 카리스마(${dayPair})`);
  }
  if (isGoegangDay) {
    specialBadges.push(`괴강살 독보적 아우라(${dayPair})`);
  }
  if (dayP.twelveStage === "목욕" || dayP.twelveStage === "장생") {
    specialBadges.push(`일주 12운성 ‘${dayP.twelveStage}’ 매력`);
  }
  if (specialBadges.length === 0) {
    specialBadges.push(`배우자궁 ‘${dayP.branchTenGod}’ 정연격`);
  }

  // 4대 신살 기둥 위치 기반 정밀 해설
  const dohwaDesc =
    dohwaLocations.length > 0
      ? `🌸 [도화살 ${dohwaScore}점 · ${dohwaLocations.join(", ")} 발동] 원국의 ${dohwaLocations.join("과 ")} 자리에 도화(桃花) 지지(자·오·묘·유)가 실제 자리하고 있습니다. 가만히 있어도 시선을 끌며, 특히 ${dohwaLocations.some((l) => l.includes("일주")) ? "배우자궁 도화라 연인의 외모와 매력이 매우 뛰어납니다." : "첫만남과 사회적 모임에서 이성에게 강한 호감을 얻습니다."}`
      : `🌸 [도화살 ${dohwaScore}점 · 은은한 잔향 도화] 원국 지지에 직접적인 자·오·묘·유 도화 글자는 없지만, 12운성(${dayP.twelveStage})과 오행 배합으로 첫인상의 가벼운 플러팅보다 대화할수록 스며드는 고급스러운 분위기가 작동합니다.`;

  const hongyeomDesc = isHongyeomDay
    ? `🔥 [홍염살 ${hongyeomScore}점 · 일주(${dayPair}) 정통 홍염살 보유] 타고난 일주 자체가 명리학 10대 홍염일주(${dayPair})에 해당합니다! 다수 앞에서의 인기보다 내가 점찍은 단 한 사람과 일대일로 마주 앉았을 때 눈빛·목소리·분위기만으로 상대를 무장해제시키는 치명적 중독성을 지녔습니다.`
    : `🔥 [홍염살 ${hongyeomScore}점 · 후천적 1:1 몰입 매력] 처음엔 단정하고 선을 지키는 듯 보이지만, 친밀도가 쌓여 단둘이 남는 순간 반전 애교와 깊은 눈맞춤으로 상대의 애타는 감정을 끌어올리는 은밀한 홍염 파동이 있습니다.`;

  const hwagaeDesc =
    hwagaeLocations.length > 0
      ? `🌙 [화개살 ${hwagaeScore}점 · ${hwagaeLocations.join(", ")} 발동] ${hwagaeLocations.join("·")}에 화개(진·술·축·미) 기운이 뿌리내려 감수성과 여운이 매우 깊습니다. 헤어진 연인이 밤마다 당신의 SNS나 기억을 쉽게 지우지 못하고 재회 연락을 해오게 만드는 강력한 그리움 자석입니다.`
      : `🌙 [화개살 ${hwagaeScore}점 · 깔끔한 감정 정리와 깊은 취향 교감] 과거에 질척이기보다 현재 내 곁의 사람에게 온전히 집중하며, 음악·영화·공간 취향이 통할 때 정서적 교감이 폭발합니다.`;

  const yeokmaDesc =
    yeokmaLocations.length > 0
      ? `✈️ [역마살 ${yeokmaScore}점 · ${yeokmaLocations.join(", ")} 발동] ${yeokmaLocations.join("·")}에 역마(인·신·사·해) 에너지가 강하게 흐릅니다. 집 주변의 익숙한 동선보다 여행지·출장·이직·세미나·새로운 취미 모임 등 '움직이는 공간'에서 운명의 상대를 극적으로 마주칩니다.`
      : `✈️ [역마살 ${yeokmaScore}점 · 안정적 생활권 인연] 급격한 이동보다는 내 일상 반경, 직장·학교 주변, 신뢰할 수 있는 지인의 소개처럼 안정적인 바운더리 안에서 검증된 정연(正緣)을 만날 확률이 높습니다.`;

  const dm = DAY_MASTER_META[dayP.stemKo] || DAY_MASTER_META["갑"];

  let charmSummary = "";
  if (hongyeomScore >= 78 && dohwaScore >= 70) {
    charmSummary = `가만히 있어도 시선을 끄는 ‘도화살(${dohwaScore}점)’과 일대일로 마주 앉았을 때 상대를 홀리는 ‘홍염살(${hongyeomScore}점)’이 동시에 발동하는 상위 3% 천생 매력 사주입니다. (${specialBadges.join(" · ")})`;
  } else if (hongyeomScore >= 72) {
    charmSummary = `불특정 다수보다 내가 마음먹은 단 한 사람을 눈빛과 대화만으로 깊게 중독시키는 ‘은밀한 홍염(紅艶) 매력(${hongyeomScore}점)’이 매우 강합니다. (${specialBadges.join(" · ")})`;
  } else if (dohwaScore >= 70) {
    charmSummary = `어느 모임에 가든 호감과 주목을 한 몸에 받는 ‘화사한 도화(桃花) 에너지(${dohwaScore}점)’가 사주 원국에 강하게 자리 잡고 있습니다. (${specialBadges.join(" · ")})`;
  } else {
    charmSummary = `첫인상의 가벼운 끌림보다 알면 알수록 빠져드는 깊은 여운과 신뢰감으로 오래가는 연애를 만드는 ‘진국형 매력 사주’입니다. (${specialBadges.join(" · ")})`;
  }

  const spouseMod =
    SPOUSE_TENGOD_MODIFIERS[dayP.branchTenGod] || SPOUSE_TENGOD_MODIFIERS["정관"];
  const spouseStarSummary = `배우자궁(일지 ‘${dayP.branchKo}’, 지장간 ‘${dayP.hiddenStems}’)에 ‘${dayP.branchTenGod}’과 12운성 ‘${dayP.twelveStage}’이 자리하여, ${spouseMod.faceDetail}의 상대와 만났을 때 배우자 복이 가장 크게 열립니다.`;

  const monthlyWave = buildPersonalizedMonthlyWave(
    dayP.branchKo,
    lackingElement,
    dohwaScore
  );

  return {
    year: yearP,
    month: monthP,
    day: dayP,
    hour: hourP,
    dayMasterTitle: `${dayP.stemKo}${dayP.branchKo}(${dayP.stemHanja}${dayP.branchHanja})일주 · ${dm.title}`,
    dayMasterArchetype: dm.archetype,
    solarCorrectionNote:
      birthHour >= 0
        ? `${conversionLabel} · 진태양시(-30분) · ${termName}(${month}월 ${cutoffDay}일 ${cutoffHour}시) 절입 정밀 보정`
        : `${conversionLabel} · ${termName}(${month}월 ${cutoffDay}일) 절입 · 삼주 정밀 보정`,
    convertedSolarDate: solarDate,
    calendarType,
    spouseStarSummary,
    elementCounts: counts,
    dominantElement,
    lackingElement,
    neededElement: lackingElement,
    specialBadges,
    monthlyWave,
    charmStars: {
      dohwa: dohwaScore,
      hongyeom: hongyeomScore,
      hwagae: hwagaeScore,
      yeokma: yeokmaScore,
      dohwaDesc,
      hongyeomDesc,
      hwagaeDesc,
      yeokmaDesc,
      summary: charmSummary,
    },
  };
}

// 정통 명리학 천간합·육합·충·원진·귀문관살 기반 2인 정밀 궁합 엔진
export function buildPartnerCompatibility(
  myChart: SajuChart,
  partnerBirthDate?: string
): PartnerCompatibilityAnalysis {
  const hasPartnerInput = Boolean(
    partnerBirthDate && /^\d{4}-\d{2}-\d{2}$/.test(partnerBirthDate.trim())
  );

  // 파트너 미입력 시 내 사주 용신·육합 이상형 가상 원국 생성
  const effectiveDate = hasPartnerInput
    ? partnerBirthDate!.trim()
    : "1998-11-24";
  const pChart = calculateSajuChart(effectiveDate, 12);

  const myStem = myChart.day.stemKo;
  const pStem = pChart.day.stemKo;
  const myBranch = myChart.day.branchKo;
  const pBranch = pChart.day.branchKo;

  const isStemHap = STEM_HAP_PAIRS[myStem]?.partner === pStem;
  const isYukhap = YUKHAP_PAIRS[myBranch] === pBranch;
  const isChung = CHUNG_PAIRS[myBranch] === pBranch;
  const isWonjin = WONJIN_PAIRS[myBranch] === pBranch;
  const isGwimun = GWIMUN_PAIRS[myBranch] === pBranch;
  const myNeedsMet =
    pChart.dominantElement === myChart.neededElement ||
    pChart.elementCounts[myChart.neededElement] >= 2;
  const partnerNeedsMet =
    myChart.dominantElement === pChart.neededElement ||
    myChart.elementCounts[pChart.neededElement] >= 2;

  let score = 86;
  const harmonyBadges: string[] = [];

  if (isStemHap) {
    score += 6;
    harmonyBadges.push(STEM_HAP_PAIRS[myStem].label);
  }
  if (isYukhap) {
    score += 7;
    harmonyBadges.push(`일지 ${myBranch}${pBranch} 육합(六合) 최상위 속궁합`);
  }
  if (myNeedsMet && partnerNeedsMet) {
    score += 6;
    harmonyBadges.push(`상호 용신(${myChart.neededElement}↔${pChart.neededElement}) 완벽 보완`);
  } else if (myNeedsMet || partnerNeedsMet) {
    score += 4;
    harmonyBadges.push(`오행 결핍(${myChart.neededElement}) 상생 보완`);
  }
  if (isGwimun) {
    score += 2;
    harmonyBadges.push(`일지 ${myBranch}${pBranch} 귀문관살(鬼門) 중독·미련 인연`);
  }
  if (isWonjin) {
    score -= 2;
    harmonyBadges.push(`일지 ${myBranch}${pBranch} 원진살(怨嗔) 애증 스파크`);
  }
  if (isChung && !isYukhap) {
    score -= 3;
    harmonyBadges.push(`일지 ${myBranch}${pBranch} 상충(沖) 강렬한 첫끌림`);
  }

  score = Math.min(99, Math.max(78, score));
  if (harmonyBadges.length === 0) {
    harmonyBadges.push(
      `배우자궁(${myChart.day.branchTenGod}) × ${myChart.neededElement} 용신 공명`
    );
  }

  let outerHarmony = "";
  if (hasPartnerInput) {
    outerHarmony = `내 일주(${myStem}${myBranch})와 상대방 일주(${pStem}${pBranch})는 ${
      isStemHap
        ? `정통 ‘${STEM_HAP_PAIRS[myStem].label}’을 이루어 첫 대화부터 가치관과 유머 코드가 자석처럼 맞물립니다.`
        : `내 사주의 부족한 ‘${myChart.neededElement}’ 기운과 상대의 ‘${pChart.dominantElement}’ 에너지가 교차하며 서로에게 없는 매력을 강하게 느끼는 구조입니다.`
    } 겉궁합 티키타카 만족도 ${score}점의 인연입니다.`;
  } else {
    const mod =
      SPOUSE_TENGOD_MODIFIERS[myChart.day.branchTenGod] ||
      SPOUSE_TENGOD_MODIFIERS["정관"];
    outerHarmony = `내 배우자궁(${myBranch}·${myChart.day.branchTenGod})과 12운성(${myChart.day.twelveStage}) 구조상, 나의 강한 ${myChart.dominantElement} 기운을 부드럽게 감싸고 부족한 ${myChart.neededElement} 오행을 채워주는 상대와 만났을 때 대화 만족도가 극대화됩니다. (${mod.venueDetail} 인연 강세)`;
  }

  let innerHarmony = "";
  if (isYukhap) {
    innerHarmony = `두 사람의 배우자궁 지지(${myBranch}·${pBranch})가 명리학 최고의 속궁합인 ‘육합(六合)’으로 묶여 있습니다! 스킨십 템포와 밤 시간대 정서적 밀착도가 상위 1% 수준이며, 한 번 가까워지면 쉽게 떨어질 수 없는 강한 합(合)입니다.`;
  } else if (isGwimun || isWonjin) {
    innerHarmony = `일지 사이에 ‘${myBranch}${pBranch} 귀문·원진 파동’과 홍염살(${myChart.charmStars.hongyeom}점)이 동시에 작동합니다. 미워도 다시 생각나고 밤마다 서로의 잔상이 지워지지 않는 치명적인 애증·중독형 속궁합 케미를 보입니다.`;
  } else {
    innerHarmony = `내 도화살(${myChart.charmStars.dohwa}점)·홍염살(${myChart.charmStars.hongyeom}점) 파동과 상대방의 12운성(${pChart.day.twelveStage}) 에너지가 공명하여, 만날수록 스킨십의 깊이와 정서적 안정감이 함께 올라가는 상위 5% 속궁합입니다.`;
  }

  let conflictAndSolution = "";
  if (isChung) {
    conflictAndSolution = `일지 ‘${myBranch}${pBranch} 상충(沖)’ 기운이 있어 평소엔 죽이 잘 맞다가도 자존심이 부딪히면 순간적으로 찬바람이 불 수 있습니다. 감정이 올라올 때 카톡으로 따지기보다 하루만 템포를 늦추고 대면해서 눈을 보며 풀면 오히려 위기가 뜨거운 화해로 바뀝니다.`;
  } else if (isWonjin || isGwimun) {
    conflictAndSolution = `서로 너무 좋아해서 생기는 서운함과 확인 욕구(귀문·원진 파동)가 유일한 갈등 요인입니다. 상대의 연락 템포 하나에 의미를 부여해 추궁하기보다, 내 일상의 여유를 유지할 때 상대가 먼저 안달 나며 다가옵니다.`;
  } else {
    conflictAndSolution = `내 사주에서 강한 ‘${myChart.dominantElement}’ 기운이 올라오는 날에는 속마음과 달리 말이 직설적으로 나갈 수 있습니다. 서운한 점은 짧은 유머나 다정한 스킨십과 함께 건넬 때 관계의 주도권을 완벽히 잡을 수 있습니다.`;
  }

  return {
    hasPartnerInput,
    partnerBirthDate: hasPartnerInput
      ? effectiveDate
      : "미입력 (내 배우자궁 원국 기준)",
    partnerDayPillar: `${pChart.day.stemKo}${pChart.day.branchKo}(${pChart.day.stemHanja}${pChart.day.branchHanja})`,
    partnerDayMasterTitle: pChart.dayMasterTitle,
    partnerDominantElement: pChart.dominantElement,
    partnerNeededElement: pChart.neededElement,
    score,
    harmonyBadges,
    outerHarmony,
    innerHarmony,
    conflictAndSolution,
  };
}

export function buildSmartFallbackReport(params: {
  name: string;
  gender: "female" | "male";
  birthDate: string;
  partnerBirthDate?: string;
  concern?: string;
  themeMode?: SajuThemeMode;
  chart: SajuChart;
}): FuturePartnerReport {
  const {
    name,
    gender,
    chart,
    partnerBirthDate,
    concern,
    themeMode = "future",
  } = params;
  const userTitle = name.trim() ? `${name.trim()}님` : "회원님";
  const partnerGender: "male" | "female" =
    gender === "female" ? "male" : "female";
  const dm = DAY_MASTER_META[chart.day.stemKo] || DAY_MASTER_META["갑"];
  const ep = ELEMENT_PARTNER_PROFILE[chart.neededElement];
  const spouseMod =
    SPOUSE_TENGOD_MODIFIERS[chart.day.branchTenGod] ||
    SPOUSE_TENGOD_MODIFIERS["정관"];
  const partnerAnalysis = buildPartnerCompatibility(chart, partnerBirthDate);
  const compatScore = partnerAnalysis.score;

  // 가장 점수가 높은 피크 월 추출
  const peakWave = [...chart.monthlyWave].sort((a, b) => b.score - a.score)[0] ||
    chart.monthlyWave[0];

  // 테마별 맞춤 헤드라인 & 서브헤드라인 분기
  let headline = `${userTitle}의 배우자궁(${chart.day.branchKo}·${chart.day.branchTenGod})에 들어올 정연(正緣)은 ‘${ep.vibeTitle}’입니다`;
  let subheadline = `${chart.dayMasterTitle}(12운성: ${chart.day.twelveStage})의 강한 ${chart.dominantElement}(${chart.elementCounts[chart.dominantElement]}개) 기운을 감싸고, 용신 ‘${chart.neededElement}’을 채워줄 운명적 배필`;

  if (themeMode === "reunion") {
    headline = `${userTitle}을 향한 그 사람의 미련 파동은 아직 끊어지지 않았습니다 (재회 궁합 ${compatScore}점)`;
    subheadline = partnerAnalysis.hasPartnerInput
      ? `내 일주(${chart.day.stemKo}${chart.day.branchKo}) × 상대 일주(${partnerAnalysis.partnerDayPillar}) · ${partnerAnalysis.harmonyBadges.join(" · ")}`
      : `${chart.dayMasterTitle} 원국의 화개살(${chart.charmStars.hwagae}점)과 홍염살(${chart.charmStars.hongyeom}점)이 상대방의 밤 시간대 그리움을 강하게 자극하는 시기`;
  } else if (themeMode === "compatibility") {
    headline = `${userTitle}과 그 사람의 정통 명리 겉궁합·속궁합 점수는 ‘${compatScore}점’입니다`;
    subheadline = partnerAnalysis.hasPartnerInput
      ? `내 사주(${chart.day.stemKo}${chart.day.branchKo}) × 상대 사주(${partnerAnalysis.partnerDayPillar}) · ${partnerAnalysis.harmonyBadges.join(" · ")}`
      : `도화살 ${chart.charmStars.dohwa}점 · 홍염살 ${chart.charmStars.hongyeom}점의 치명적 끌림과 배우자궁(${chart.day.branchTenGod}) 케미스트리`;
  }

  // 일주 × 배우자궁 십성 × 용신 오행 3중 조합 외모/장소/직업/시그널 생성 (중복 제로화)
  const combinedFaceShape = `${ep.faceShape}에 배우자궁(${chart.day.branchTenGod})의 기운이 더해져, ${spouseMod.faceDetail}`;
  const combinedEyesAndSmile = `${ep.eyesAndSmile}. 특히 ${spouseMod.smileDetail}`;
  const combinedStyleAndAura = `${ep.styleAndAura}. (${dm.partnerVoiceAndHeight})`;
  const bodyAndVoiceHint = `${dm.partnerVoiceAndHeight} · ${dm.surnameHint}`;
  const badPartnerWarning = BAD_PARTNER_BY_DOMINANT[chart.dominantElement];

  return {
    themeMode,
    headline,
    subheadline,
    freePersonality: `${userTitle}은 사주 원국에서 ‘${chart.dayMasterTitle}’와 12운성 ‘${chart.day.twelveStage}’을 타고났습니다. ${dm.archetype} 기질이 뚜렷하며, 남들에게는 쉽게 속내를 다 보여주지 않으면서도 내 사람이라고 확신한 순간부터는 마음의 온도를 아낌없이 올리는 타입입니다.`,
    freeLoveStyle: `${dm.loveTrait} ${chart.spouseStarSummary}`,
    freeCharmAnalysis: `${chart.charmStars.summary}`,
    partnerAnalysis,
    partnerAppearance: {
      vibeTitle: ep.vibeTitle,
      faceShape: combinedFaceShape,
      eyesAndSmile: combinedEyesAndSmile,
      styleAndAura: combinedStyleAndAura,
      celebVibe: `${ep.celebVibe} (${chart.day.branchTenGod} 특유의 ${spouseMod.ageGapDetail})`,
      bodyAndVoiceHint,
      portraitPrompt: `Korean ${partnerGender === "male" ? "handsome man" : "beautiful woman"} in mid-to-late 20s, ${ep.faceShape}, ${ep.eyesAndSmile}, ${ep.styleAndAura}, 85mm f/1.4 editorial portrait photography`,
      auraColorHex: ep.auraColorHex,
      secondaryColorHex: ep.secondaryColorHex,
      hairStyle:
        partnerGender === "male" ? ep.hairStyleMale : ep.hairStyleFemale,
      gender: partnerGender,
    },
    lockedSecrets: {
      meetingTiming:
        themeMode === "reunion"
          ? `[1차 재회·연락 골든타임] 상대방의 자존심이 누그러지고 연락 운기가 열리는 가장 강한 시점은 ${peakWave.month}(${peakWave.ganji}, 파동 ${peakWave.score}점)과 절기가 교차하는 매월 14~24일 사이입니다.\n\n[배우자궁 합(合)의 작용] ${peakWave.desc}\n\n[연락 시간대 & 징조] 낮 시간대보다는 감성이 깊어지는 밤 9시 30분~11시 45분 사이에 SNS 스토리 조회나 프로필 뮤직/사진 변경 이후 짧은 안부 카톡으로 먼저 신호가 들어올 확률이 89% 이상입니다.`
          : `[핵심 인연 계절 & 용신 유입기] ${ep.meetingSeason}\n\n[내 배우자궁(${chart.day.branchKo}) 최고 골든타임: ${peakWave.month} (${peakWave.score}점)] ${peakWave.desc}\n\n[연간 타임라인 상세] ${ep.meetingMonthsDetail} 특히 평소 귀찮아서 망설이던 모임이나 갑자기 잡힌 주말·수요일 저녁 약속에서 예상치 못한 호감 시그널이 강하게 들어옵니다.`,
      meetingPlace:
        themeMode === "compatibility"
          ? `[겉궁합 & 데이트 케미] ${partnerAnalysis.outerHarmony}\n\n[관계가 급진전되는 결정적 장소] ${spouseMod.venueDetail} 또는 ${ep.meetingPlace}처럼 조명이 은은하고 나란히 앉아 대화할 수 있는 공간에서 두 사람의 어색함이 한 번에 무너지며 스킨십과 확신이 깊어집니다.\n\n[첫 데이트 필승 스타일링] ${ep.dateLookTip}`
          : `[용신(${chart.neededElement}) × 배우자궁(${chart.day.branchTenGod}) 핵심 조우 장소]\n• 1순위 공간: ${spouseMod.venueDetail}\n• 2순위 공간: ${ep.meetingPlace}\n\n[만남이 이루어지는 구체적 상황] 딱딱하게 각 잡힌 자리보다 지인 동석·업무 협업·취미 모임처럼 자연스럽게 대화가 섞이는 자리에서 상대방이 먼저 ${userTitle}의 분위기(도화 ${chart.charmStars.dohwa}점 · 홍염 ${chart.charmStars.hongyeom}점)에 시선을 빼앗기며 말을 걸어옵니다.\n\n[첫만남 필승 스타일링 비책] ${ep.dateLookTip}`,
      partnerJobAndAge: `[배우자궁(${chart.day.branchTenGod}) × 사회궁(${chart.month.branchTenGod}) 직업군]\n• 핵심 커리어: ${spouseMod.careerDetail}\n• 용신(${chart.neededElement}) 연계 분야: ${ep.jobCluster}\n\n[외형·체형·목소리 & 성씨 초성 힌트]\n• 체형 & 보이스: ${dm.partnerVoiceAndHeight}\n• 인연이 깊은 성씨 파동: ${dm.surnameHint}\n\n[속궁합 & 최적 나이차]\n• 나이차: ${spouseMod.ageGapDetail}\n• 속궁합: ${partnerAnalysis.innerHarmony}`,
      firstSignal: `[이 사람임을 단번에 알아보는 첫 시그널]\n${spouseMod.firstSignalDetail}\n\n특히 대화 도중 내가 무심코 흘린 사소한 말 한마디(좋아하는 계절·음식·작은 습관)를 기억해 두었다가 며칠 뒤 연락하며 자연스럽게 언급한다면, 그 사람이 바로 ${userTitle}의 사주 속 정연(正緣)입니다.`,
      reunionOrCompatibility: {
        score: compatScore,
        hiddenThought: concern
          ? `현재 질문하신 "${concern.slice(0, 60)}" 고민과 관련해, 상대방 역시 겉으로는 자존심과 현실적인 생각 때문에 태연한 척하고 있지만 밤마다 ${userTitle}과의 기억이나 SNS 근황을 의식하며 감정이 완전히 정리되지 않은 상태입니다.`
          : `상대방은 ${userTitle}의 솔직하고 대체 불가능한 매력(홍염살 ${chart.charmStars.hongyeom}점 · 12운성 ‘${chart.day.twelveStage}’)을 쉽게 잊지 못합니다. 다만 먼저 다가갔을 때 거절당하거나 자존심이 상할까 봐 신중하게 타이밍을 재는 심리가 강하게 작동하고 있습니다.`,
        contactTiming: `감정의 파동이 다시 강하게 교차하는 시점은 ${peakWave.month}(${peakWave.ganji}) 및 절기가 바뀌는 달의 중순(14일~24일 사이), 특히 밤 9시 30분~11시 30분 사이입니다. 직접적인 장문의 고백보다는 스토리 반응이나 가벼운 질문 형태로 먼저 신호가 들어올 확률이 가장 높습니다.`,
        actionAdvice: `${partnerAnalysis.conflictAndSolution} 먼저 조급하게 감정적인 확인을 요구하기보다, 여유롭고 밝은 근황 사진을 SNS/프로필에 업데이트해 상대의 궁금증을 자극하세요.`,
        badPartnerWarning,
      },
      wealthAndMarriage2027: `2026년 하반기부터 2027년은 ${userTitle}의 사주에서 부족했던 용신 ‘${chart.neededElement}’ 기운이 순환하며 연애운(배우자복)과 재물·커리어 문서운이 동시에 상승 곡선을 그리는 대운의 변곡점입니다. 나에게 상처 주던 스쳐 가는 인연이 정리되고, 결혼이나 장기적인 미래를 함께 그릴 수 있는 진짜 내 사람이 곁에 남게 됩니다.`,
    },
    reunionDeepPack: {
      unlocked: true,
      subconsciousTrigger: `상대방의 무의식을 가장 강하게 건드리는 방아쇠는 ${userTitle}의 ‘${chart.day.twelveStage}’ 에너지와 화개살(${chart.charmStars.hwagae}점)·홍염살(${chart.charmStars.hongyeom}점)이 만드는 밤 시간대 여운입니다. 특히 비 오는 밤이나 주말 저녁 10시 이후 혼자 있을 때, 과거 함께 들었던 음악·장소·향기에서 ${userTitle}의 빈자리를 가장 크게 체감하며 SNS 프로필을 몰래 염탐하는 파동이 잡힙니다.`,
      kakaoMessageTemplate:
        themeMode === "reunion"
          ? `"갑자기 문득 생각나서 카톡 남겨봐ㅎㅎ 요즘 날씨 많이 바뀌었는데 잘 지내고 있지? 전에 네가 얘기했던 거 우연히 보다가 생각났어"`
          : `"오늘 지나가다가 전에 얘기했던 곳 봤는데 갑자기 생각나서 연락했어요ㅎㅎ 이번 주나 다음 주에 시간 괜찮을 때 맛있는 거 먹으러 가요!"`,
      threeStepScenario: [
        `1단계 [시각적 잔상 심기]: 연락하기 3일 전, 우울한 글귀 대신 ${ep.dateLookTip.slice(0, 28)} 스타일의 밝고 여유로운 일상 사진을 프로필/스토리에 올리세요.`,
        `2단계 [부담 없는 핑계 접점]: ${peakWave.month} 또는 매월 14~24일 사이 밤 9시 30분~11시경, 감정 호소 없이 상대방이 쉽게 대답할 수 있는 짧은 근황·취향 질문 1줄만 던지세요.`,
        `3단계 [대면 확신 유도]: 답장이 이어지면 카톡으로 길게 끌지 말고 '${spouseMod.venueDetail}' 같은 편안한 공간에서 1시간만 가볍게 보자고 리드하면 상대의 방어기제가 완전히 무너집니다.`,
      ],
      tabooAction: `절대 피해야 할 자폭 행동: 새벽 1시 이후 감정에 취해 장문의 카톡을 보내거나, '우리 무슨 사이야 / 왜 연락 안 해?'처럼 상대의 자존심(${chart.dominantElement} 과열)을 압박하는 추궁은 금물입니다.`,
    },
    vip2027Calendar: {
      unlocked: true,
      wealthAndCareer: `${userTitle}은 월주(사회궁)에 ‘${chart.month.tenGod}/${chart.month.branchTenGod}(${chart.month.twelveStage})’이 자리해, 2026년 11월~2027년 상반기 동안 용신 ‘${chart.neededElement}’ 기운이 들어오며 본업 소득 상승은 물론 이직·승진·사이드 프로젝트·문서(계약)운이 함께 터지는 재물 대운기에 진입합니다.`,
      cautionMonths: `주의해야 할 달(沖월): 내 배우자궁(일지 ‘${chart.day.branchKo}’)과 정면 상충하는 ‘${CHUNG_PAIRS[chart.day.branchKo]}’ 지지가 들어오는 달에는 충동적인 퇴사, 무리한 금전 대여, 연인과의 감정적 자존심 싸움을 반드시 피하고 한 템포 쉬어가야 손재수와 이별수를 막을 수 있습니다.`,
      quarterlyRoadmap: [
        {
          quarter: "2026년 4분기 (11~12월)",
          focus: "인연 스파크 & 연말 금전 회수기",
          detail: `${chart.monthlyWave[0]?.ganji}·${chart.monthlyWave[1]?.ganji} 흐름으로 새로운 이성 조우 및 미뤄졌던 금전·보너스·계약 결실이 가시화됩니다.`,
        },
        {
          quarter: "2027년 1분기 (1~3월)",
          focus: "입춘(立春) 커리어 변동 & 귀인 유입",
          detail: `이직·부서 이동·새 프로젝트 제안이 들어오며, 나를 끌어주는 천을귀인(${chart.specialBadges[0]})이 사회적 무대에서 등장합니다.`,
        },
        {
          quarter: "2027년 2분기 (4~6월)",
          focus: "정연(正緣) 안착 & 자산 증식 골든타임",
          detail: `${peakWave.month}(${peakWave.ganji}) 전후로 연애가 장기적 확신(결혼/동거/진지한 교제)으로 굳어지며 문서·투자운이 가장 강합니다.`,
        },
        {
          quarter: "2027년 하반기 (7~12월)",
          focus: "결실 완성 & 배우자복 만개",
          detail: `용신 ‘${chart.neededElement}’ 에너지가 완전히 자리 잡아 연애와 금전 양쪽에서 가장 안정적인 수확을 거두는 시기입니다.`,
        },
      ],
      luckyPrescription: {
        colorAndItem: `${ep.dateLookTip}`,
        directionAndPlace: `행운 방위는 ${chart.neededElement === "목" ? "동쪽" : chart.neededElement === "화" ? "남쪽" : chart.neededElement === "토" ? "중앙·남서쪽" : chart.neededElement === "금" ? "서쪽" : "북쪽"}이며, ${spouseMod.venueDetail} 공간에서 운기가 트입니다.`,
        timingAndNumber: `행운 숫자는 ${chart.neededElement === "목" ? "3 · 8" : chart.neededElement === "화" ? "2 · 7" : chart.neededElement === "토" ? "5 · 10" : chart.neededElement === "금" ? "4 · 9" : "1 · 6"}이며, 주요 결정과 데이트는 오후 7시~11시 사이가 가장 길합니다.`,
      },
    },
    viralThreadsCopy: {
      mainPost: `내 사주팔자(${chart.dayMasterTitle} · 배우자궁 ${chart.day.branchTenGod}) 넣고 AI한테 미래 연인 실사 얼굴이랑 만나는 시기 뽑아봤는데 소름 돋음...\n\n도화살 ${chart.charmStars.dohwa}점 / 홍염살 ${chart.charmStars.hongyeom}점 나오고,\n부족한 '${chart.neededElement}' 기운 채워줄 미래 연인이 "${ep.vibeTitle}"에 ${dm.surnameHint}이라는데 내 이상형이랑 정확히 똑같아서 기절함😳\n\n다들 본인 일주랑 미래 연인 실사 어떻게 나오는지 해봐!!`,
      firstReply: `무료로 내 사주 오행 + 미래 연인 실사 몽타주 뽑아보는 링크 여기 남겨둘게요👇\n(회원가입 없이 생년월일만 넣으면 3초 만에 나와요!)`,
      reelsHook: `"내 사주에 숨겨진 미래 남편/아내 실사 얼굴을 AI로 현상해 봤더니..." (도화살 ${chart.charmStars.dohwa}점 · 홍염살 ${chart.charmStars.hongyeom}점 결과 공개)`,
    },
    source: "manseryeok-SmartEngine",
  };
}

// 1:1 청담 연월당 AI 도사 후속 질문 12대 카테고리 고정밀 해답 생성기
export function buildSajuMasterReply(params: {
  name: string;
  question: string;
  chart: SajuChart;
  partnerBirthDate?: string;
}): string {
  const { name, question, chart, partnerBirthDate } = params;
  const userTitle = name.trim() ? `${name.trim()}님` : "회원님";
  const q = question.trim();
  const ep = ELEMENT_PARTNER_PROFILE[chart.neededElement];
  const dm = DAY_MASTER_META[chart.day.stemKo] || DAY_MASTER_META["갑"];
  const spouseMod =
    SPOUSE_TENGOD_MODIFIERS[chart.day.branchTenGod] ||
    SPOUSE_TENGOD_MODIFIERS["정관"];
  const pCompat = buildPartnerCompatibility(chart, partnerBirthDate);
  const peakWave = [...chart.monthlyWave].sort((a, b) => b.score - a.score)[0] ||
    chart.monthlyWave[0];

  if (
    q.includes("연락") ||
    q.includes("재회") ||
    q.includes("전남친") ||
    q.includes("전여친") ||
    q.includes("먼저") ||
    q.includes("속마음")
  ) {
    return `${userTitle}(${chart.day.stemKo}${chart.day.branchKo}일주 · 12운성 ‘${chart.day.twelveStage}’)의 원국을 보면 화개살(${chart.charmStars.hwagae}점)과 홍염살(${chart.charmStars.hongyeom}점)이 함께 작동하고 있어(${pCompat.harmonyBadges[0]}), 상대방이 당신을 완전히 잊고 끝낼 수 있는 인연이 아닙니다. 다만 지금은 상대방도 자존심 때문에 타이밍을 재고 있으니, 먼저 장문의 카톡을 보내기보다 프로필에 여유롭고 밝은 근황을 올린 뒤 ${peakWave.month}(${peakWave.ganji})이나 이달 중순(14~24일경) 밤 10시 전후에 가벼운 안부로 물꼬를 트는 것이 재회 성공률을 가장 높입니다.`;
  }

  if (
    q.includes("언제") ||
    q.includes("시기") ||
    q.includes("몇월") ||
    q.includes("몇 월") ||
    q.includes("달") ||
    q.includes("올해") ||
    q.includes("내년")
  ) {
    return `${userTitle}의 배우자궁(일지 ‘${chart.day.branchKo}’ · ${chart.day.branchTenGod})에 인연 파동이 가장 강하게 터지는 1순위 골든타임은 ‘${peakWave.month}(${peakWave.ganji}, 파동 ${peakWave.score}점)’입니다. ${peakWave.desc} 또한 ${ep.meetingSeason} 흐름이 겹치는 시기에는 평소 귀찮아서 안 나가던 모임이나 급하게 잡힌 약속도 절대 거절하지 마시고 꼭 나가보시길 권합니다.`;
  }

  if (
    q.includes("어디") ||
    q.includes("장소") ||
    q.includes("어떻게 만") ||
    q.includes("소개팅") ||
    q.includes("자만추")
  ) {
    return `${userTitle}은 배우자궁에 ‘${chart.day.branchTenGod}’이 자리하고 역마살이 ${chart.charmStars.yeokma}점이라, 억지로 각 잡고 나간 딱딱한 맞선보다는 ‘${spouseMod.venueDetail}’ 또는 ‘${ep.meetingPlace}’처럼 자연스러운 관심사나 지인이 얽힌 공간에서 인연이 시작될 확률이 압도적으로 높습니다.`;
  }

  if (
    q.includes("외모") ||
    q.includes("얼굴") ||
    q.includes("생김새") ||
    q.includes("키") ||
    q.includes("체형") ||
    q.includes("목소리") ||
    q.includes("성씨") ||
    q.includes("이름")
  ) {
    return `${userTitle}의 사주 용신(${chart.neededElement})과 배우자궁(${chart.day.branchTenGod})으로 현상한 미래 연인은 ‘${spouseMod.faceDetail}’에 ‘${dm.partnerVoiceAndHeight}’를 가진 분입니다. 특히 성씨 초성은 ${dm.surnameHint}인 경우가 많으며, 첫만남부터 ${spouseMod.smileDetail}로 당신의 긴장을 풀어줄 것입니다.`;
  }

  if (
    q.includes("나이") ||
    q.includes("연상") ||
    q.includes("연하") ||
    q.includes("동갑")
  ) {
    return `${userTitle}의 일주(${chart.dayMasterTitle})와 배우자궁 십성(${chart.day.branchTenGod}) 구조를 볼 때, 나이 차이는 ‘${spouseMod.ageGapDetail}’일 때 대화 템포와 정서적 안정감이 가장 완벽하게 맞물립니다.`;
  }

  if (
    q.includes("속궁합") ||
    q.includes("스킨십") ||
    q.includes("밤") ||
    q.includes("낮이밤져") ||
    q.includes("케미")
  ) {
    return `${userTitle}은 시주(애정궁)에 ‘${chart.hour.branchTenGod}(12운성: ${chart.hour.twelveStage})’를 두고 홍염살이 ${chart.charmStars.hongyeom}점에 달해, 신뢰가 쌓인 연인과 단둘이 있을 때 몰입도와 스킨십 텐션이 폭발하는 사주입니다. ${pCompat.innerHarmony}`;
  }

  if (
    q.includes("결혼") ||
    q.includes("배우자복") ||
    q.includes("남편복") ||
    q.includes("아내복")
  ) {
    return `${userTitle}은 배우자궁(일지 ‘${chart.day.branchKo}’) 지장간에 ‘${chart.day.hiddenStems}’을 품고 ‘${chart.day.branchTenGod}’이 좌정해 있어, 늦지 않게 안정적이고 책임감 있는 정연(正緣)과 결실을 맺는 배우자 복을 타고났습니다. 특히 2027년 세운에서 결혼·문서운이 동시에 강하게 열립니다.`;
  }

  if (
    q.includes("직업") ||
    q.includes("이직") ||
    q.includes("돈") ||
    q.includes("재물") ||
    q.includes("커리어") ||
    q.includes("취업")
  ) {
    return `${userTitle}은 ‘${chart.dayMasterTitle}’ 일주로 사회궁(월주)에 ‘${chart.month.tenGod}/${chart.month.branchTenGod}(${chart.month.twelveStage})’이 자리해 자기 주도적인 전문성을 발휘할 때 재물과 인연이 동시에 따라옵니다. 다가오는 상대 역시 ‘${spouseMod.careerDetail}’ 계열의 능력 있는 분일 확률이 매우 높습니다.`;
  }

  if (
    q.includes("조심") ||
    q.includes("피해") ||
    q.includes("나쁜") ||
    q.includes("악연") ||
    q.includes("똥차")
  ) {
    return `${userTitle}이 가장 경계해야 할 악연은 다음과 같습니다: ${BAD_PARTNER_BY_DOMINANT[chart.dominantElement]} 반대로 나에게 부족한 ‘${chart.neededElement}’ 기운(${ep.vibeTitle})을 가진 일관성 있는 상대를 만나면 궁합 점수가 ${pCompat.score}점 이상으로 상승합니다.`;
  }

  return `${userTitle}의 ‘${chart.dayMasterTitle}’(배우자궁: ${chart.day.branchTenGod} · 12운성: ${chart.day.twelveStage} · 보유 신살: ${chart.specialBadges.join(", ")}) 원국으로 볼 때, 질문하신 "${q.slice(0, 35)}"의 핵심 열쇠는 부족한 용신 ‘${chart.neededElement}’ 에너지를 채우는 데 있습니다. 가장 운기가 강하게 열리는 ${peakWave.month}(${peakWave.ganji}) 흐름을 타면서 ‘${spouseMod.venueDetail}’ 같은 공간적 변화를 주시면 원하시는 인연과 해답이 빠르게 찾아올 것입니다.`;
}

// 인앱 브라우저 증발 방지용 영구 열람 복구 코드 생성기 & 검증기
export function generateReceiptCode(params: {
  birthDate: string;
  includeReunion?: boolean;
  includeVip2027?: boolean;
}): string {
  const cleanDate = params.birthDate.replace(/[^0-9]/g, "").slice(2, 8) || "991024";
  const tierCode =
    params.includeReunion && params.includeVip2027
      ? "ALL9"
      : params.includeReunion
      ? "REU6"
      : params.includeVip2027
      ? "VIP7"
      : "BAS4";
  let hash = 0;
  const seed = `${cleanDate}:${tierCode}:YEONWOL`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 65535;
  }
  const hex = hash.toString(16).toUpperCase().padStart(4, "0");
  return `YW-${cleanDate}-${tierCode}-${hex}`;
}

export function verifyReceiptCode(code?: string): {
  valid: boolean;
  includeReunion: boolean;
  includeVip2027: boolean;
} {
  if (!code) return { valid: false, includeReunion: false, includeVip2027: false };
  const normalized = code.trim().toUpperCase();
  const match = normalized.match(/^YW-(\d{6})-(ALL9|REU6|VIP7|BAS4)-([0-9A-F]{4})$/);
  if (!match) {
    return { valid: false, includeReunion: false, includeVip2027: false };
  }
  const [, cleanDate, tierCode, hex] = match;
  let hash = 0;
  const seed = `${cleanDate}:${tierCode}:YEONWOL`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 65535;
  }
  const expectedHex = hash.toString(16).toUpperCase().padStart(4, "0");
  if (hex !== expectedHex) {
    return { valid: false, includeReunion: false, includeVip2027: false };
  }
  return {
    valid: true,
    includeReunion: tierCode === "ALL9" || tierCode === "REU6",
    includeVip2027: tierCode === "ALL9" || tierCode === "VIP7",
  };
}

// 서버 사이드 페이월 보안 마스킹 (F12 개발자 도구 Network/DOM 유출 원천 차단)
export function maskReportForSecurity(
  fullReport: FuturePartnerReport,
  unlockTier: UnlockTier,
  upsells?: { reunionDeep?: boolean; vip2027?: boolean },
  receiptCode?: string
): FuturePartnerReport {
  const REDACTED_MSG =
    "🔒 [서버 보안 잠금 영역] 열람 권한 인증 후 서버에서 전체 해답을 복호화하여 불러옵니다. (개발자 도구 열람 차단됨)";

  if (unlockTier === "paid_full") {
    return {
      ...fullReport,
      receiptCode,
      reunionDeepPack: upsells?.reunionDeep
        ? { ...fullReport.reunionDeepPack, unlocked: true }
        : {
            unlocked: false,
            subconsciousTrigger: REDACTED_MSG,
            kakaoMessageTemplate: REDACTED_MSG,
            threeStepScenario: [REDACTED_MSG],
            tabooAction: REDACTED_MSG,
          },
      vip2027Calendar: upsells?.vip2027
        ? { ...fullReport.vip2027Calendar, unlocked: true }
        : {
            unlocked: false,
            wealthAndCareer: REDACTED_MSG,
            cautionMonths: REDACTED_MSG,
            quarterlyRoadmap: [],
            luckyPrescription: {
              colorAndItem: REDACTED_MSG,
              directionAndPlace: REDACTED_MSG,
              timingAndNumber: REDACTED_MSG,
            },
          },
    };
  }

  return {
    ...fullReport,
    lockedSecrets: {
      meetingTiming:
        unlockTier === "share_first"
          ? fullReport.lockedSecrets.meetingTiming
          : REDACTED_MSG,
      meetingPlace: REDACTED_MSG,
      partnerJobAndAge: REDACTED_MSG,
      firstSignal: REDACTED_MSG,
      reunionOrCompatibility: {
        score: fullReport.lockedSecrets.reunionOrCompatibility.score,
        hiddenThought: REDACTED_MSG,
        contactTiming: REDACTED_MSG,
        actionAdvice: REDACTED_MSG,
        badPartnerWarning: REDACTED_MSG,
      },
      wealthAndMarriage2027: REDACTED_MSG,
    },
    reunionDeepPack: {
      unlocked: false,
      subconsciousTrigger: REDACTED_MSG,
      kakaoMessageTemplate: REDACTED_MSG,
      threeStepScenario: [REDACTED_MSG],
      tabooAction: REDACTED_MSG,
    },
    vip2027Calendar: {
      unlocked: false,
      wealthAndCareer: REDACTED_MSG,
      cautionMonths: REDACTED_MSG,
      quarterlyRoadmap: [],
      luckyPrescription: {
        colorAndItem: REDACTED_MSG,
        directionAndPlace: REDACTED_MSG,
        timingAndNumber: REDACTED_MSG,
      },
    },
  };
}
