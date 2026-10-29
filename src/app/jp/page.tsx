"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Globe2,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/lib/ondo-constants";
import { setAppLocale, useAppLocale } from "@/lib/i18n";
import { Button, LanguageToggle } from "@/components/ondo-ui";

export default function JapaneseDedicatedPage() {
  const router = useRouter();
  const [, updateLocale] = useAppLocale();

  useEffect(() => {
    setAppLocale("ja");
    updateLocale("ja");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-rose-400">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <div>
              <span className="text-[17px] font-black tracking-tight text-zinc-900">
                ONDO <span className="text-rose-600">36.5°</span>
              </span>
              <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-600">
                🇯🇵 日本語公式ラウンジ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link
              href={ROUTES.HOME}
              className="rounded-full bg-zinc-900 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800"
            >
              ラウンジへ入場
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-1 text-[12px] font-bold text-rose-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-rose-600" />
            <span>
              在韓日本人（語学堂生・正規/交換留学生）＆ 韓国の大学生 専用
            </span>
          </div>

          <h1 className="mt-5 text-[30px] font-black leading-[1.3] tracking-tight text-zinc-900 sm:text-[38px]">
            韓国キャンパスで出会う、
            <br />
            <span className="text-rose-600">
              顔写真より先に伝わる「会話の温度」
            </span>
          </h1>

          <p className="mt-4 text-[14px] leading-relaxed text-zinc-600 sm:text-[15px]">
            スワイプ型アプリの身バレ不安や、いきなりカカオトークIDを交換するプレッシャーはもう不要です。
            <br />
            <strong>学生認証</strong>を済ませた韓国の大学生と、価値観ノートと24時間ブラインドチャットで安心に出会えます。
          </p>
        </section>

        {/* 2 Dedicated Japanese Student Tracks (Separated: KLI vs Degree/Exchange) */}
        <section className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Card 1: Japanese KLI Students (어학당 학생) */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-extrabold text-rose-700">
                  <BookOpen className="h-3.5 w-3.5" />
                  Track A · 語学堂留学生
                </span>
                <span className="text-[12px] font-bold text-zinc-400">
                  首都圏62校対応
                </span>
              </div>

              <h2 className="mt-3 text-[20px] font-black text-zinc-900">
                🇯🇵 日本人 語学堂生 専用トラック
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                ソウル（34校）・京畿（24校）・仁川（4校）の<strong>大学付属韓国語学堂・言語教育院</strong>に在学中の日本人学生向けトラックです。
              </p>

              <ul className="mt-4 space-y-2 text-[12px] font-medium text-zinc-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    延世・梨花・西江・弘益・高麗・漢陽など62校の語学堂から選択
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    現在の級（1級〜6級・正規/短期課程）を設定可能
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    語学堂の学生証・在学証明書を運営チームが確認（承認後に写真は即削除）
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Button
                size="lg"
                fullWidth
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() =>
                  router.push("/join?lang=ja&track=KLI_JP")
                }
              >
                語学堂生として登録を始める →
              </Button>
            </div>
          </div>

          {/* Card 2: Japanese Degree / Exchange Students (대학교 정규·교환 유학생) */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-indigo-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[12px] font-extrabold text-indigo-700">
                  <Globe2 className="h-3.5 w-3.5" />
                  Track B · 正規・交換留学生
                </span>
                <span className="text-[12px] font-bold text-zinc-400">
                  ソウル・京畿・仁川78大学対応
                </span>
              </div>

              <h2 className="mt-3 text-[20px] font-black text-zinc-900">
                🇯🇵 日本人 大学留学生 専用トラック
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                韓国の大学の<strong>正規学部生（本科生）・交換留学生・大学院生</strong>として在学中の日本人留学生向けトラックです。
              </p>

              <ul className="mt-4 space-y-2 text-[12px] font-medium text-zinc-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>
                    正規学部留学・交換留学・大学院留学の区分を明確に表示
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>
                    在学中の大学名と専攻（学科）を登録＆同じ大学の学生除外も可能
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>
                    大学の公式ウェブメール（6桁コード即時承認）または学生証・在学証明書で認証可能
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Button
                size="lg"
                fullWidth
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() =>
                  router.push("/join?lang=ja&track=INTL_JP")
                }
              >
                大学・交換留学生として登録を始める →
              </Button>
            </div>
          </div>
        </section>

        {/* How ONDO Works in Japanese */}
        <section className="mt-10 rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8">
          <h3 className="text-center text-[19px] font-black text-zinc-900">
            ONDO 36.5° が日本人留学生に選ばれる3つの理由
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FAF9F6] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="mt-3 text-[15px] font-extrabold text-zinc-900">
                1. 100% 学生証認証済みの安心感
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">
                サクラやダミー会員はゼロ。韓国の大学生と日本人留学生（語学堂・大学）のみが学生認証を経て参加しています。
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAF9F6] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="mt-3 text-[15px] font-extrabold text-zinc-900">
                2. 5往復の会話後にカカオトークID公開
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">
                マッチング直後に個人連絡先が晒されることはありません。24時間ブラインドチャットでお互いに5回以上会話した時だけカカオトークIDが開きます。
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAF9F6] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h4 className="mt-3 text-[15px] font-extrabold text-zinc-900">
                3. 細かい身長区間・理想条件の複数選択
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">
                希望する相手の身長（5cm刻み・複数選択可）、年齢、生活エリア、MBTI、喫煙有無まで細かく設定できます。
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-[13px] font-bold text-zinc-800 shadow-2xs hover:bg-stone-50"
          >
            トップページへ戻る →
          </Link>
        </div>
      </main>
    </div>
  );
}
