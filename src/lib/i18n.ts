"use client";

import { useCallback, useSyncExternalStore } from "react";

export type AppLocale = "ko" | "ja";

const LOCALE_STORAGE_KEY = "ondo_locale_v1";
const LOCALE_EVENT_NAME = "ondo-locale-change";

export function getSavedLocale(): AppLocale {
  if (typeof window === "undefined") return "ko";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "ja" || raw === "ko") return raw;
  } catch {
    // ignore
  }
  return "ko";
}

export function setAppLocale(next: AppLocale) {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedLocale();
    if (current === next) return;

    const applyUpdate = () => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent(LOCALE_EVENT_NAME, { detail: next }));
    };

    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };

    if (typeof docWithVT.startViewTransition === "function") {
      docWithVT.startViewTransition(() => {
        applyUpdate();
      });
    } else {
      document.body.classList.remove("ondo-locale-animating");
      void document.body.offsetWidth;
      document.body.classList.add("ondo-locale-animating");
      applyUpdate();
      window.setTimeout(() => {
        document.body.classList.remove("ondo-locale-animating");
      }, 360);
    }
  } catch {
    // ignore
  }
}

function subscribeLocale(onChange: () => void) {
  window.addEventListener(LOCALE_EVENT_NAME, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT_NAME, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerLocale = (): AppLocale => "ko";

export function useAppLocale(): [AppLocale, (next: AppLocale) => void] {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getSavedLocale,
    getServerLocale
  );

  const updateLocale = useCallback((next: AppLocale) => {
    setAppLocale(next);
  }, []);

  return [locale, updateLocale];
}

export const HEIGHT_LABEL_JA: Record<string, string> = {
  under_155: "155cm以下",
  "156_160": "156〜160cm",
  "161_165": "161〜165cm",
  "166_170": "166〜170cm",
  "171_175": "171〜175cm",
  "176_180": "176〜180cm",
  "181_185": "181〜185cm",
  over_185: "185cm以上",
  any: "身長は気にしない（すべて選択）",
};

export const SIDO_LABEL_JA: Record<string, string> = {
  서울특별시: "ソウル特別市",
  인천광역시: "仁川広域市",
  경기도: "京畿道",
};

export const SIGUNGU_LABEL_JA: Record<string, string> = {
  // 서울 25개 자치구
  강남구: "江南区（カンナム区）",
  강동구: "江東区（カンドン区）",
  강북구: "江北区（カンブク区）",
  강서구: "江西区（カンソ区）",
  관악구: "冠岳区（クァナク区）",
  광진구: "広津区（クァンジン区・建大）",
  구로구: "九老区（クロ区）",
  금천구: "衿川区（クムチョン区）",
  노원구: "蘆原区（ノウォン区）",
  도봉구: "道峰区（トボン区）",
  동대문구: "東大門区（トンデムン区・回基）",
  동작구: "銅雀区（トンジャク区）",
  마포구: "麻浦区（マポ区・弘大/延南）",
  서대문구: "西大門区（ソデムン区・新村/梨大）",
  서초구: "瑞草区（ソチョ区）",
  성동구: "城東区（ソンドン区・聖水/漢陽大）",
  성북구: "城北区（ソンブク区・安岩）",
  송파구: "松坡区（ソンパ区・蚕室）",
  양천구: "陽川区（ヤンチョン区）",
  영등포구: "永登浦区（ヨンドゥンポ区・汝矣島）",
  용산구: "龍山区（ヨンサン区・梨泰院）",
  은평구: "恩平区（ウンピョン区）",
  종로구: "鍾路区（チョンノ区・恵化）",
  중구: "中区（チュン区・明洞）",
  중랑구: "中浪区（チュンナン区）",

  // 인천 10개 군·구
  연수구: "延寿区（ヨンス区・松島）",
  남동구: "南洞区（ナムドン区）",
  부평구: "富平区（プピョン区）",
  미추홀구: "弥鄒忽区（ミチュホル区）",
  서구: "西区（ソ区）",
  계양구: "桂陽区（ケヤン区）",
  동구: "東区（トン区）",
  강화군: "江華郡（カンファ郡）",
  옹진군: "甕津郡（オンジン郡）",

  // 경기 31개 시·군
  수원시: "水原市（スウォン市）",
  성남시: "城南市（ソンナム市・盆唐）",
  고양시: "高陽市（コヤン市・一山）",
  용인시: "龍仁市（ヨンイン市）",
  부천시: "富川市（プチョン市）",
  안산시: "安山市（アンサン市）",
  안양시: "安養市（アニャン市）",
  남양주시: "南楊州市（ナミャンジュ市）",
  화성시: "華城市（ファソン市・東灘）",
  평택시: "平沢市（ピョンテク市）",
  의정부시: "議政府市（ウィジョンブ市）",
  시흥시: "始興市（シフン市）",
  파주시: "坡州市（パジュ市）",
  광명시: "光明市（クァンミョン市）",
  김포시: "金浦市（キンポ市）",
  군포시: "軍浦市（クンポ市）",
  광주시: "広州市（クァンジュ市）",
  하남시: "河南市（ハナム市）",
  구리시: "九里市（クリ市）",
  오산시: "烏山市（オサン市）",
  양주시: "楊州市（ヤンジュ市）",
  이천시: "利川市（イチョン市）",
  안성시: "安城市（アンソン市）",
  포천시: "抱川市（ポチョン市）",
  의왕시: "義王市（ウィワン市）",
  양평군: "楊平郡（ヤンピョン郡）",
  여주시: "驪州市（ヨジュ市）",
  동두천시: "東豆川市（トンドゥチョン市）",
  과천시: "果川市（クァチョン市）",
  가평군: "加平郡（カピョン郡）",
  연천군: "漣川郡（ヨンチョン郡）",
};

export const KLI_INSTITUTE_LABEL_JA: Record<string, string> = {
  // 서울권 34개교
  "연세대학교 한국어학당 (KLI)": "延世大学 韓国語学堂 (KLI)",
  "이화여자대학교 언어교육원": "梨花女子大学 言語教育院",
  "서강대학교 한국어교육원": "西江大学 韓国語教育院",
  "홍익대학교 국제언어교육원": "弘益大学 国際言語教育院",
  "고려대학교 한국어센터": "高麗大学 韓国語センター",
  "경희대학교 국제교육원 (서울)": "慶熙大学 国際教育院（ソウル）",
  "한국외국어대학교 한국어문화교육원 (서울)": "韓国外国語大学 韓国語文化教育院（ソウル）",
  "서울대학교 언어교육원 한국어교육센터": "ソウル大学 言語教育院 韓国語教育センター",
  "한양대학교 국제교육원 (서울)": "漢陽大学 国際教育院（ソウル）",
  "성균관대학교 성균어학원 (서울)": "成均館大学 成均語学院（ソウル）",
  "건국대학교 언어교육원": "建国大学 言語教育院",
  "동국대학교 한국어교육센터": "東国大学 韓国語教育センター",
  "중앙대학교 국제교육원 한국어과정 (서울)": "中央大学 国際教育院 韓国語課程（ソウル）",
  "서울시립대학교 한국어학당": "ソウル市立大学 韓国語学堂",
  "숙명여자대학교 국제언어교육원": "淑明女子大学 国際言語教育院",
  "성신여자대학교 국제교육원": "誠信女子大学 国際教育院",
  "국민대학교 국제교육원 한국어센터": "国民大学 国際教育院 韓国語センター",
  "숭실대학교 국제교육원 한국어학당": "崇実大学 国際教育院 韓国語学堂",
  "세종대학교 국제교육원 한국어과정": "世宗大学 国際教育院 韓国語課程",
  "단국대학교 국제어학원 (서울 한남)": "檀国大学 国際語学院（ソウル漢南）",
  "명지대학교 한국어학당 (서울 인문)": "明知大学 韓国語学堂（ソウル人文）",
  "상명대학교 한국언어문화교육원": "祥明大学 韓国言語文化教育院",
  "가톨릭대학교 한국어교육센터": "カトリック大学 韓国語教育センター",
  "광운대학교 한국어문화교육원": "光云大学 韓国語文化教育院",
  "동덕여자대학교 한국어교육원": "同徳女子大学 韓国語教育院",
  "덕성여자대학교 언어교육원": "徳成女子大学 言語教育院",
  "서울여자대학교 한국어교육과정": "ソウル女子大学 韓国語教育課程",
  "서울과학기술대학교 어학원 한국어과정": "ソウル科学技術大学 語学院 韓国語課程",
  "서경대학교 언어문화교육원": "西京大学 言語文化教育院",
  "한성대학교 언어교육원": "漢城大学 言語教育院",
  "삼육대학교 한국어학당": "三育大学 韓国語学堂",
  "총신대학교 한국어학당": "総神大学 韓国語学堂",
  "성공회대학교 한국어학당": "聖公会大学 韓国語学堂",
  "KC대학교 한국어교육원": "KC大学 韓国語教育院",

  // 경기권 24개교
  "가천대학교 국제어학원 한국어교육센터 (성남)": "嘉泉大学 国際語学院 韓国語教育センター（城南）",
  "단국대학교 국제어학원 한국어과정 (용인 죽전)": "檀国大学 国際語学院 韓国語課程（龍仁竹田）",
  "경희대학교 글로벌캠퍼스 국제교육원 (용인)": "慶熙大学 グローバルキャンパス 国際教育院（龍仁）",
  "한국외국어대학교 글로벌캠퍼스 한국어문화교육원 (용인)": "韓国外国語大学 グローバルキャンパス 韓国語文化教育院（龍仁）",
  "명지대학교 자연캠퍼스 한국어학당 (용인)": "明知大学 自然キャンパス 韓国語学堂（龍仁）",
  "용인대학교 한국어학당 (용인)": "龍仁大学 韓国語学堂（龍仁）",
  "강남대학교 한국어교육센터 (용인)": "江南大学 韓国語教育センター（龍仁）",
  "아주대학교 국제교육센터 한국어과정 (수원)": "亜洲大学 国際教育センター 韓国語課程（水原）",
  "경기대학교 국제교육원 한국어과정 (수원)": "京畿大学 国際教育院 韓国語課程（水原）",
  "성균관대학교 자연과학캠퍼스 성균어학원 (수원)": "成均館大学 自然科学キャンパス 成均語学院（水原）",
  "한양대학교 ERICA캠퍼스 국제교육원 (안산)": "漢陽大学 ERICAキャンパス 国際教育院（安山）",
  "한국항공대학교 한국어학당 (고양)": "韓国航空大学 韓国語学堂（高陽）",
  "동국대학교 바이오메디캠퍼스 한국어과정 (고양)": "東国大学 バイオメディキャンパス 韓国語課程（高陽）",
  "중부대학교 고양캠퍼스 한국어학당 (고양)": "中部大学 高陽キャンパス 韓国語学堂（高陽）",
  "한국공학대학교 언어교육원 한국어과정 (시흥)": "韓国工学大学 言語教育院 韓国語課程（始興）",
  "수원대학교 국제어학원 한국어학당 (화성)": "水原大学 国際語学院 韓国語学堂（華城）",
  "협성대학교 한국어학당 (화성)": "協成大学 韓国語学堂（華城）",
  "중앙대학교 다빈치캠퍼스 한국어교육원 (안성)": "中央大学 ダヴィンチキャンパス 韓国語教育院（安城）",
  "안양대학교 한국어교육원 (안양)": "安養大学 韓国語教育院（安養）",
  "성결대학교 한국어학당 (안양)": "聖潔大学 韓国語学堂（安養）",
  "한신대학교 한국어학당 (오산)": "韓神大学 韓国語学堂（烏山）",
  "평택대학교 국제교육원 한국어과정 (평택)": "平沢大学 国際教育院 韓国語課程（平沢）",
  "신한대학교 한국어학당 (의정부)": "新韓大学 韓国語学堂（議政府）",
  "대진대학교 한국어교육센터 (포천)": "大真大学 韓国語教育センター（抱川）",

  // 인천권 4개교
  "인하대학교 언어교육원 한국어과정 (인천 미추홀구)": "仁荷大学 言語教育院 韓国語課程（仁川 弥鄒忽区）",
  "인천대학교 한국어학당 (인천 연수구 송도)": "仁川大学 韓国語学堂（仁川 延寿区 松島）",
  "연세대학교 국제캠퍼스 한국어과정 (인천 연수구 송도)": "延世大学 国際キャンパス 韓国語課程（仁川 延寿区 松島）",
  "경인교육대학교 한국어교육센터 (인천 계양구)": "京仁教育大学 韓国語教育センター（仁川 桂陽区）",
};

export interface CapitalUnivOption {
  value: string;
  labelKo: string;
  labelJa: string;
  sido: "서울특별시" | "경기도" | "인천광역시";
  sigungu: string;
  emailDomain: string;
  altEmailDomain?: string;
}

const RAW_CAPITAL_UNIV_GROUPS: Array<{
  regionKo: string;
  regionJa: string;
  items: CapitalUnivOption[];
}> = [
  {
    regionKo: "📍 서울권 대학교 (40개교 · 가나다순)",
    regionJa: "📍 ソウル圏の大学（40校・カナダ順）",
    items: [
      { value: "가톨릭대학교 성의·성신", labelKo: "가톨릭대학교 서울캠퍼스 (서울 서초·종로구)", labelJa: "カトリック大学 ソウルキャンパス（ソウル 瑞草区）", sido: "서울특별시", sigungu: "서초구", emailDomain: "catholic.ac.kr" },
      { value: "감리교신학대학교", labelKo: "감리교신학대학교 (서울 서대문구)", labelJa: "監理教神学大学（ソウル 西大門区）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "mtu.ac.kr" },
      { value: "건국대학교", labelKo: "건국대학교 (서울 광진구)", labelJa: "建国大学（ソウル 広津区・建大）", sido: "서울특별시", sigungu: "광진구", emailDomain: "konkuk.ac.kr" },
      { value: "경기대학교 서울캠퍼스", labelKo: "경기대학교 서울캠퍼스 (서울 서대문구)", labelJa: "京畿大学 ソウルキャンパス（ソウル 西大門区）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "kyonggi.ac.kr", altEmailDomain: "kgu.ac.kr" },
      { value: "경희대학교", labelKo: "경희대학교 서울캠퍼스 (서울 동대문구)", labelJa: "慶熙大学 ソウルキャンパス（ソウル 東大門区・回基）", sido: "서울특별시", sigungu: "동대문구", emailDomain: "khu.ac.kr" },
      { value: "고려대학교", labelKo: "고려대학교 (서울 성북구)", labelJa: "高麗大学（ソウル 城北区・安岩）", sido: "서울특별시", sigungu: "성북구", emailDomain: "korea.ac.kr" },
      { value: "광운대학교", labelKo: "광운대학교 (서울 노원구)", labelJa: "光云大学（ソウル 蘆原区）", sido: "서울특별시", sigungu: "노원구", emailDomain: "kw.ac.kr" },
      { value: "국민대학교", labelKo: "국민대학교 (서울 성북구)", labelJa: "国民大学（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "kookmin.ac.kr" },
      { value: "덕성여자대학교", labelKo: "덕성여자대학교 (서울 도봉구)", labelJa: "徳成女子大学（ソウル 道峰区）", sido: "서울특별시", sigungu: "도봉구", emailDomain: "duksung.ac.kr" },
      { value: "동국대학교", labelKo: "동국대학교 서울캠퍼스 (서울 중구)", labelJa: "東国大学 ソウルキャンパス（ソウル 中区）", sido: "서울특별시", sigungu: "중구", emailDomain: "dgu.ac.kr", altEmailDomain: "dongguk.edu" },
      { value: "동덕여자대학교", labelKo: "동덕여자대학교 (서울 성북구)", labelJa: "同徳女子大学（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "dongduk.ac.kr" },
      { value: "명지대학교 인문캠퍼스", labelKo: "명지대학교 인문캠퍼스 (서울 서대문구)", labelJa: "明知大学 人文キャンパス（ソウル 西大門区）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "mju.ac.kr" },
      { value: "삼육대학교", labelKo: "삼육대학교 (서울 노원구)", labelJa: "三育大学（ソウル 蘆原区）", sido: "서울특별시", sigungu: "노원구", emailDomain: "syu.ac.kr" },
      { value: "상명대학교", labelKo: "상명대학교 서울캠퍼스 (서울 종로구)", labelJa: "祥明大学 ソウルキャンパス（ソウル 鍾路区）", sido: "서울특별시", sigungu: "종로구", emailDomain: "smu.ac.kr", altEmailDomain: "sangmyung.kr" },
      { value: "서강대학교", labelKo: "서강대학교 (서울 마포구)", labelJa: "西江大学（ソウル 麻浦区・新村）", sido: "서울특별시", sigungu: "마포구", emailDomain: "sogang.ac.kr" },
      { value: "서경대학교", labelKo: "서경대학교 (서울 성북구)", labelJa: "西京大学（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "skuniv.ac.kr" },
      { value: "서울과학기술대학교", labelKo: "서울과학기술대학교 (서울 노원구)", labelJa: "ソウル科学技術大学（ソウル 蘆原区）", sido: "서울특별시", sigungu: "노원구", emailDomain: "seoultech.ac.kr" },
      { value: "서울교육대학교", labelKo: "서울교육대학교 (서울 서초구)", labelJa: "ソウル教育大学（ソウル 瑞草区）", sido: "서울특별시", sigungu: "서초구", emailDomain: "snue.ac.kr" },
      { value: "서울대학교", labelKo: "서울대학교 (서울 관악구)", labelJa: "ソウル大学（ソウル 冠岳区）", sido: "서울특별시", sigungu: "관악구", emailDomain: "snu.ac.kr" },
      { value: "서울시립대학교", labelKo: "서울시립대학교 (서울 동대문구)", labelJa: "ソウル市立大学（ソウル 東大門区）", sido: "서울특별시", sigungu: "동대문구", emailDomain: "uos.ac.kr" },
      { value: "서울여자대학교", labelKo: "서울여자대학교 (서울 노원구)", labelJa: "ソウル女子大学（ソウル 蘆原区）", sido: "서울특별시", sigungu: "노원구", emailDomain: "swu.ac.kr" },
      { value: "성공회대학교", labelKo: "성공회대학교 (서울 구로구)", labelJa: "聖公会大学（ソウル 九老区）", sido: "서울특별시", sigungu: "구로구", emailDomain: "skhu.ac.kr" },
      { value: "성균관대학교", labelKo: "성균관대학교 인문사회캠퍼스 (서울 종로구)", labelJa: "成均館大学 人文社会キャンパス（ソウル 鍾路区・恵化）", sido: "서울특별시", sigungu: "종로구", emailDomain: "skku.edu", altEmailDomain: "g.skku.edu" },
      { value: "성신여자대학교", labelKo: "성신여자대학교 (서울 성북구)", labelJa: "誠信女子大学（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "sungshin.ac.kr" },
      { value: "세종대학교", labelKo: "세종대학교 (서울 광진구)", labelJa: "世宗大学（ソウル 広津区）", sido: "서울특별시", sigungu: "광진구", emailDomain: "sju.ac.kr", altEmailDomain: "sejong.ac.kr" },
      { value: "숙명여자대학교", labelKo: "숙명여자대학교 (서울 용산구)", labelJa: "淑明女子大学（ソウル 龍山区）", sido: "서울특별시", sigungu: "용산구", emailDomain: "sookmyung.ac.kr", altEmailDomain: "sm.ac.kr" },
      { value: "숭실대학교", labelKo: "숭실대학교 (서울 동작구)", labelJa: "崇実大学（ソウル 銅雀区）", sido: "서울특별시", sigungu: "동작구", emailDomain: "soongsil.ac.kr", altEmailDomain: "ssu.ac.kr" },
      { value: "연세대학교", labelKo: "연세대학교 (서울 서대문구)", labelJa: "延世大学（ソウル 西大門区・新村）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "yonsei.ac.kr" },
      { value: "이화여자대학교", labelKo: "이화여자대학교 (서울 서대문구)", labelJa: "梨花女子大学（ソウル 西大門区・新村）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "ewhain.net", altEmailDomain: "ewha.ac.kr" },
      { value: "장로회신학대학교", labelKo: "장로회신학대학교 (서울 광진구)", labelJa: "長老会神学大学（ソウル 広津区）", sido: "서울특별시", sigungu: "광진구", emailDomain: "puts.ac.kr" },
      { value: "중앙대학교", labelKo: "중앙대학교 서울캠퍼스 (서울 동작구)", labelJa: "中央大学 ソウルキャンパス（ソウル 銅雀区）", sido: "서울특별시", sigungu: "동작구", emailDomain: "cau.ac.kr" },
      { value: "총신대학교", labelKo: "총신대학교 (서울 동작구)", labelJa: "総神大学（ソウル 銅雀区）", sido: "서울특별시", sigungu: "동작구", emailDomain: "chongshin.ac.kr" },
      { value: "추계예술대학교", labelKo: "추계예술대학교 (서울 서대문구)", labelJa: "秋渓芸術大学（ソウル 西大門区）", sido: "서울특별시", sigungu: "서대문구", emailDomain: "chugye.ac.kr" },
      { value: "KC대학교", labelKo: "KC대학교 (서울 강서구)", labelJa: "KC大学（ソウル 江西区）", sido: "서울특별시", sigungu: "강서구", emailDomain: "kcu.ac.kr" },
      { value: "한국예술종합학교", labelKo: "한국예술종합학교 (서울 성북·서초구)", labelJa: "韓国芸術総合学校（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "karts.ac.kr" },
      { value: "한국외국어대학교", labelKo: "한국외국어대학교 서울캠퍼스 (서울 동대문구)", labelJa: "韓国外国語大学 ソウルキャンパス（ソウル 東大門区）", sido: "서울특별시", sigungu: "동대문구", emailDomain: "hufs.ac.kr" },
      { value: "한국체육대학교", labelKo: "한국체육대학교 (서울 송파구)", labelJa: "韓国体育大学（ソウル 松坡区）", sido: "서울특별시", sigungu: "송파구", emailDomain: "knsu.ac.kr" },
      { value: "한성대학교", labelKo: "한성대학교 (서울 성북구)", labelJa: "漢城大学（ソウル 城北区）", sido: "서울특별시", sigungu: "성북구", emailDomain: "hansung.ac.kr" },
      { value: "한양대학교", labelKo: "한양대학교 서울캠퍼스 (서울 성동구)", labelJa: "漢陽大学 ソウルキャンパス（ソウル 城東区）", sido: "서울특별시", sigungu: "성동구", emailDomain: "hanyang.ac.kr" },
      { value: "홍익대학교", labelKo: "홍익대학교 서울캠퍼스 (서울 마포구)", labelJa: "弘益大学 ソウルキャンパス（ソウル 麻浦区・弘大）", sido: "서울특별시", sigungu: "마포구", emailDomain: "hongik.ac.kr" },
    ],
  },
  {
    regionKo: "📍 경기권 대학교 (31개교 · 가나다순)",
    regionJa: "📍 京畿圏の大学（31校・カナダ順）",
    items: [
      { value: "가천대학교", labelKo: "가천대학교 글로벌캠퍼스 (경기 성남시)", labelJa: "嘉泉大学 グローバルキャンパス（京畿 城南市）", sido: "경기도", sigungu: "성남시", emailDomain: "gachon.ac.kr" },
      { value: "가톨릭대학교 성심교정", labelKo: "가톨릭대학교 성심교정 (경기 부천시)", labelJa: "カトリック大学 聖心校庭（京畿 富川市）", sido: "경기도", sigungu: "부천시", emailDomain: "catholic.ac.kr" },
      { value: "강남대학교", labelKo: "강남대학교 (경기 용인시)", labelJa: "江南大学（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "kangnam.ac.kr" },
      { value: "경기대학교 수원캠퍼스", labelKo: "경기대학교 수원캠퍼스 (경기 수원시)", labelJa: "京畿大学 水原キャンパス（京畿 水原市）", sido: "경기도", sigungu: "수원시", emailDomain: "kyonggi.ac.kr", altEmailDomain: "kgu.ac.kr" },
      { value: "경동대학교 양주캠퍼스", labelKo: "경동대학교 메트로폴캠퍼스 (경기 양주시)", labelJa: "京東大学 メトロポールキャンパス（京畿 楊州市）", sido: "경기도", sigungu: "양주시", emailDomain: "kduniv.ac.kr" },
      { value: "경희대학교 국제캠퍼스", labelKo: "경희대학교 국제캠퍼스 (경기 용인시)", labelJa: "慶熙大学 国際キャンパス（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "khu.ac.kr" },
      { value: "단국대학교", labelKo: "단국대학교 죽전캠퍼스 (경기 용인시)", labelJa: "檀国大学 竹田キャンパス（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "dankook.ac.kr" },
      { value: "대진대학교", labelKo: "대진대학교 (경기 포천시)", labelJa: "大真大学（京畿 抱川市）", sido: "경기도", sigungu: "포천시", emailDomain: "daejin.ac.kr" },
      { value: "동국대학교 바이오메디캠퍼스", labelKo: "동국대학교 바이오메디캠퍼스 (경기 고양시)", labelJa: "東国大学 バイオメディキャンパス（京畿 高陽市）", sido: "경기도", sigungu: "고양시", emailDomain: "dgu.ac.kr", altEmailDomain: "dongguk.edu" },
      { value: "명지대학교 자연캠퍼스", labelKo: "명지대학교 자연캠퍼스 (경기 용인시)", labelJa: "明知大学 自然キャンパス（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "mju.ac.kr" },
      { value: "서울신학대학교", labelKo: "서울신학대학교 (경기 부천시)", labelJa: "ソウル神学大学（京畿 富川市）", sido: "경기도", sigungu: "부천시", emailDomain: "stu.ac.kr" },
      { value: "성결대학교", labelKo: "성결대학교 (경기 안양시)", labelJa: "聖潔大学（京畿 安養市）", sido: "경기도", sigungu: "안양시", emailDomain: "sungkyul.ac.kr" },
      { value: "성균관대학교 자연과학캠퍼스", labelKo: "성균관대학교 자연과학캠퍼스 (경기 수원시)", labelJa: "成均館大学 自然科学キャンパス（京畿 水原市）", sido: "경기도", sigungu: "수원시", emailDomain: "skku.edu", altEmailDomain: "g.skku.edu" },
      { value: "수원대학교", labelKo: "수원대학교 (경기 화성시)", labelJa: "水原大学（京畿 華城市）", sido: "경기도", sigungu: "화성시", emailDomain: "suwon.ac.kr" },
      { value: "신한대학교", labelKo: "신한대학교 (경기 의정부시)", labelJa: "新韓大学（京畿 議政府市）", sido: "경기도", sigungu: "의정부시", emailDomain: "shinhan.ac.kr" },
      { value: "아주대학교", labelKo: "아주대학교 (경기 수원시)", labelJa: "亜洲大学（京畿 水原市）", sido: "경기도", sigungu: "수원시", emailDomain: "ajou.ac.kr" },
      { value: "안양대학교", labelKo: "안양대학교 (경기 안양시)", labelJa: "安養大学（京畿 安養市）", sido: "경기도", sigungu: "안양시", emailDomain: "anyang.ac.kr" },
      { value: "용인대학교", labelKo: "용인대학교 (경기 용인시)", labelJa: "龍仁大学（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "yongin.ac.kr" },
      { value: "을지대학교", labelKo: "을지대학교 성남·의정부캠퍼스 (경기 성남시)", labelJa: "乙支大学（京畿 城南・議政府）", sido: "경기도", sigungu: "성남시", emailDomain: "eulji.ac.kr" },
      { value: "중부대학교 고양캠퍼스", labelKo: "중부대학교 고양캠퍼스 (경기 고양시)", labelJa: "中部大学 高陽キャンパス（京畿 高陽市）", sido: "경기도", sigungu: "고양시", emailDomain: "joongbu.ac.kr" },
      { value: "중앙대학교 다빈치캠퍼스", labelKo: "중앙대학교 다빈치캠퍼스 (경기 안성시)", labelJa: "中央大学 ダヴィンチキャンパス（京畿 安城市）", sido: "경기도", sigungu: "안성시", emailDomain: "cau.ac.kr" },
      { value: "차의과학대학교", labelKo: "차의과학대학교 (경기 포천시)", labelJa: "CHA医科学大学（京畿 抱川市）", sido: "경기도", sigungu: "포천시", emailDomain: "cha.ac.kr" },
      { value: "평택대학교", labelKo: "평택대학교 (경기 평택시)", labelJa: "平沢大学（京畿 平沢市）", sido: "경기도", sigungu: "평택시", emailDomain: "ptu.ac.kr" },
      { value: "한국공학대학교", labelKo: "한국공학대학교 (경기 시흥시)", labelJa: "韓国工学大学（京畿 始興市）", sido: "경기도", sigungu: "시흥시", emailDomain: "tukorea.ac.kr", altEmailDomain: "kpu.ac.kr" },
      { value: "한국교통대학교 의왕캠퍼스", labelKo: "한국교통대학교 의왕캠퍼스 (경기 의왕시)", labelJa: "韓国交通大学 儀旺キャンパス（京畿 儀旺市）", sido: "경기도", sigungu: "의왕시", emailDomain: "ut.ac.kr" },
      { value: "한국외국어대학교 글로벌캠퍼스", labelKo: "한국외국어대학교 글로벌캠퍼스 (경기 용인시)", labelJa: "韓国外国語大学 グローバルキャンパス（京畿 龍仁市）", sido: "경기도", sigungu: "용인시", emailDomain: "hufs.ac.kr" },
      { value: "한국항공대학교", labelKo: "한국항공대학교 (경기 고양시)", labelJa: "韓国航空大学（京畿 高陽市）", sido: "경기도", sigungu: "고양시", emailDomain: "kau.kr", altEmailDomain: "kau.ac.kr" },
      { value: "한세대학교", labelKo: "한세대학교 (경기 군포시)", labelJa: "韓世大学（京畿 軍浦市）", sido: "경기도", sigungu: "군포시", emailDomain: "hansei.ac.kr" },
      { value: "한신대학교", labelKo: "한신대학교 (경기 오산시)", labelJa: "韓神大学（京畿 烏山市）", sido: "경기도", sigungu: "오산시", emailDomain: "hs.ac.kr" },
      { value: "한양대학교 ERICA캠퍼스", labelKo: "한양대학교 ERICA캠퍼스 (경기 안산시)", labelJa: "漢陽大学 ERICAキャンパス（京畿 安山市）", sido: "경기도", sigungu: "안산시", emailDomain: "hanyang.ac.kr" },
      { value: "협성대학교", labelKo: "협성대학교 (경기 화성시)", labelJa: "協成大学（京畿 華城市）", sido: "경기도", sigungu: "화성시", emailDomain: "uhs.ac.kr" },
    ],
  },
  {
    regionKo: "📍 인천권 대학교 (7개교 · 가나다순)",
    regionJa: "📍 仁川圏の大学（7校・カナダ順）",
    items: [
      { value: "가천대학교 메디컬캠퍼스", labelKo: "가천대학교 메디컬캠퍼스 (인천 연수구)", labelJa: "嘉泉大学 メディカルキャンパス（仁川 延寿区）", sido: "인천광역시", sigungu: "연수구", emailDomain: "gachon.ac.kr" },
      { value: "경인교육대학교", labelKo: "경인교육대학교 인천캠퍼스 (인천 계양구)", labelJa: "京仁教育大学 仁川キャンパス（仁川 桂陽区）", sido: "인천광역시", sigungu: "계양구", emailDomain: "ginue.ac.kr" },
      { value: "연세대학교 국제캠퍼스", labelKo: "연세대학교 국제캠퍼스 (인천 연수구 송도)", labelJa: "延世大学 国際キャンパス（仁川 延寿区 松島）", sido: "인천광역시", sigungu: "연수구", emailDomain: "yonsei.ac.kr" },
      { value: "인천가톨릭대학교", labelKo: "인천가톨릭대학교 (인천 연수구 송도)", labelJa: "仁川カトリック大学（仁川 延寿区 松島）", sido: "인천광역시", sigungu: "연수구", emailDomain: "iccu.ac.kr" },
      { value: "인천대학교", labelKo: "인천대학교 송도캠퍼스 (인천 연수구)", labelJa: "仁川大学 松島キャンパス（仁川 延寿区）", sido: "인천광역시", sigungu: "연수구", emailDomain: "inu.ac.kr" },
      { value: "인하대학교", labelKo: "인하대학교 (인천 미추홀구)", labelJa: "仁荷大学（仁川 弥鄒忽区）", sido: "인천광역시", sigungu: "미추홀구", emailDomain: "inha.edu", altEmailDomain: "inha.ac.kr" },
      { value: "청운대학교 인천캠퍼스", labelKo: "청운대학교 인천캠퍼스 (인천 미추홀구)", labelJa: "青雲大学 仁川キャンパス（仁川 弥鄒忽区）", sido: "인천광역시", sigungu: "미추홀구", emailDomain: "chungwoon.ac.kr" },
    ],
  },
];

// 지역별 그룹 내부를 항상 한국어 가나다순(localeCompare 'ko')으로 정렬 보장
export const CAPITAL_UNIV_GROUPS: Array<{
  regionKo: string;
  regionJa: string;
  items: CapitalUnivOption[];
}> = RAW_CAPITAL_UNIV_GROUPS.map((group) => ({
  ...group,
  items: [...group.items].sort((a, b) => a.labelKo.localeCompare(b.labelKo, "ko")),
}));

export const CAPITAL_UNIV_OPTIONS: CapitalUnivOption[] =
  CAPITAL_UNIV_GROUPS.flatMap((g) => g.items);

export function getUnivEmailGuide(univValue: string): {
  placeholder: string;
  domainBadge: string | null;
} {
  const matched = CAPITAL_UNIV_OPTIONS.find((u) => u.value === univValue.trim());
  if (!matched) {
    return {
      placeholder: "위에서 소속 대학교를 선택하면 학교별 웹메일 예시가 표시됩니다",
      domainBadge: null,
    };
  }
  const primary = `student@${matched.emailDomain}`;
  const placeholder = matched.altEmailDomain
    ? `예: ${primary} (또는 @${matched.altEmailDomain})`
    : `예: ${primary}`;
  const domainBadge = matched.altEmailDomain
    ? `@${matched.emailDomain} · @${matched.altEmailDomain}`
    : `@${matched.emailDomain}`;
  return { placeholder, domainBadge };
}

export const UNIV_LABEL_JA: Record<string, string> = Object.fromEntries(
  CAPITAL_UNIV_OPTIONS.map((u) => [u.value, u.labelJa])
);

export const BUILD_LABEL_JA: Record<string, string> = {
  LEAN: "スリムな方",
  MEDIUM: "普通くらい",
  TONED: "引き締まった方",
  ATHLETIC: "筋肉がある方",
  SOFT: "少しぽっちゃり",
};

export const SMOKING_LABEL_JA: Record<string, string> = {
  NON_SMOKER: "非喫煙",
  OCCASIONAL: "たまに（飲み会など）",
  SMOKER: "喫煙",
  any: "気にしない",
  no_smoke: "非喫煙の方が良い",
  smoke_fine: "喫煙でも大丈夫",
};

export const IMPRESSION_LABEL_JA: Record<string, string> = {
  WARM: "温かい印象",
  BRIGHT: "明るく快活な印象",
  CALM: "落ち着いた印象",
  COOL: "クールな印象",
  SOFT: "優しげな印象",
  SMART: "知的な印象",
};

export const RELIGION_LABEL_JA: Record<string, string> = {
  NONE: "無宗教",
  CHRISTIAN: "キリスト教",
  CATHOLIC: "カトリック",
  BUDDHIST: "仏教",
  OTHER: "その他",
  any: "気にしない",
  same_only: "同じ宗教の方が良い",
  none_only: "無宗教の方が気楽",
};

export const HOBBY_LABEL_JA: Record<string, string> = {
  "산책·러닝": "散歩・ランニング",
  "헬스·필라테스": "ジム・ピラティス",
  "책·글쓰기": "読書・執筆",
  "음악 감상": "音楽鑑賞",
  "영화·드라마": "映画・ドラマ",
  "전시·공연": "展示会・ライブ",
  "카페 투어": "カフェ巡り",
  "맛집 투어": "グルメ巡り",
  "요리·베이킹": "料理・お菓子作り",
  여행: "旅行",
  사진: "写真・カメラ",
  게임: "ゲーム",
  "캠핑·등산": "キャンプ・登山",
  드라이브: "ドライブ",
  "패션·뷰티": "ファッション・美容",
  반려동물: "ペット",
  봉사활동: "ボランティア",
  "어학 공부": "語学・韓国語勉強",
};

export const VIBE_STYLE_LABEL_JA: Record<string, string> = {
  "웃는 인상이 다정한": "笑顔が優しくて温かい",
  "깔끔한 셔츠·니트 코디": "清潔感のあるシャツ・ニット系",
  "대화 템포가 편안한": "会話のテンポが心地よい",
  "청량한 캠퍼스룩": "爽やかなキャンパスルック",
  "차분하고 지적인 무드": "落ち着いて知的な雰囲気",
  "유머러스하고 리액션 좋은": "ユーモアがあってリアクションが良い",
  "눈웃음이 매력적인": "目元の笑顔が魅力的",
  "운동으로 다져진 탄탄한": "運動で引き締まったスタイル",
};
