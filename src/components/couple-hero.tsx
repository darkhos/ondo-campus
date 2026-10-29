"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/reveal";

/**
 * 첫 화면 커플 그림: 두 사람이 대화를 주고받을 때마다 가운데 하트 온도가 올라가
 * 5번째 대화에서 36.5°가 되면 서로 바라보며 "카톡 공개" — 온도 서비스 흐름을 그대로 보여 줌.
 * 직접 그린 벡터 그림이라 저작권 걱정이 없고, 마우스·손가락을 따라 눈이 움직이며 누르면 다시 재생.
 */

const MSGS_KO = ["안녕하세요!", "반가워요 😊", "주말에 뭐 해요?", "전시 보러 가요!", "저도 좋아해요"];
const MSGS_JA = ["こんにちは！", "よろしくね😊", "週末なにしてる？", "展示を見に行くよ！", "私も好き！"];

const SKIN = "#F5D5C2";
const SKIN_SHADE = "#EBC0A8";
const INK = "#1c1917";
const BLUSH = "#fb7185";

// 말풍선 너비를 글자 수로 대략 계산
const bubbleWidth = (text: string) => Math.min(132, Math.max(64, Array.from(text).length * 10.6 + 20));

export function CoupleHero({ isJa }: { isJa: boolean }) {
  const reduceMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);
  const [look, setLook] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLButtonElement | null>(null);

  // 대화 5번을 차례로 재생 (처음 열 때 한 번, 누르면 다시)
  useEffect(() => {
    if (reduceMotion) return;
    const timers = [0, 1, 2, 3, 4, 5].map((s, i) =>
      window.setTimeout(() => setStep(s), i === 0 ? 0 : 450 + (i - 1) * 1000)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [runId, reduceMotion]);

  const shown = reduceMotion ? 5 : step;
  const done = shown >= 5;
  const msgs = isJa ? MSGS_JA : MSGS_KO;
  const temp = ((36.5 * shown) / 5).toFixed(1);
  const fill = shown / 5; // 하트 안 채움 비율

  // 눈동자: 마우스·손가락 방향을 보거나, 대화 중에는 휴대폰을, 끝나면 서로를 봄
  const pupil = (side: "m" | "f") => {
    if (look) return { dx: look.x * 2.4, dy: look.y * 1.8 };
    if (done) return { dx: side === "m" ? 2.2 : -2.2, dy: -0.6 };
    return { dx: side === "m" ? 0.8 : -0.8, dy: 1.6 };
  };
  const pm = pupil("m");
  const pf = pupil("f");

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    setLook({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  };

  const maleMsgIdx = shown >= 5 ? 4 : shown >= 3 ? 2 : shown >= 1 ? 0 : -1;
  const femaleMsgIdx = shown >= 4 ? 3 : shown >= 2 ? 1 : -1;
  const lastSpeaker = shown === 0 ? null : shown % 2 === 1 ? "m" : "f";

  return (
    <button
      ref={wrapRef}
      type="button"
      onClick={() => {
        setStep(0);
        setRunId((n) => n + 1);
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setLook(null)}
      aria-label={
        isJa
          ? "二人が会話を重ねるたびに温度が上がり、36.5°でカカオIDが公開されるイラスト。押すともう一度再生します。"
          : "두 사람이 대화를 주고받을 때마다 온도가 올라가 36.5°가 되면 카톡 아이디가 공개되는 그림. 누르면 다시 재생해요."
      }
      className="group relative mx-auto block w-full max-w-[420px] cursor-pointer select-none rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-400"
    >
      <svg viewBox="0 0 360 206" className="h-auto w-full" aria-hidden>
        <defs>
          <radialGradient id="ondo-hero-glow" cx="50%" cy="58%" r="60%">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0" />
          </radialGradient>
          <clipPath id="ondo-heart-clip">
            <path d="M180 140 C150 118 146 96 160 86 C170 79 178 84 180 92 C182 84 190 79 200 86 C214 96 210 118 180 140 Z" />
          </clipPath>
        </defs>

        {/* 배경 빛 */}
        <ellipse cx="180" cy="120" rx="178" ry="96" fill="url(#ondo-hero-glow)" />
        <ellipse cx="95" cy="200" rx="46" ry="6" fill="#e7e5e4" />
        <ellipse cx="265" cy="200" rx="46" ry="6" fill="#e7e5e4" />

        {/* ── 남학생 ── */}
        <g className="ondo-breathe" style={{ animationDelay: "0s" }}>
          <g
            style={{
              transform: `rotate(${done ? 4 : 0}deg)`,
              transformOrigin: "95px 120px",
              transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* 후드티 */}
            <path d="M58 206 C58 156 70 126 95 126 C120 126 132 156 132 206 Z" fill="#334155" />
            <path d="M80 128 C86 140 104 140 110 128" fill="none" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="90" y1="138" x2="89" y2="152" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="100" y1="138" x2="101" y2="152" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" />
            {/* 목·머리 */}
            <rect x="88" y="108" width="14" height="20" rx="6" fill={SKIN_SHADE} />
            <circle cx="69" cy="92" r="4.5" fill={SKIN} />
            <circle cx="121" cy="92" r="4.5" fill={SKIN} />
            <circle cx="95" cy="88" r="26" fill={SKIN} />
            <path d="M68 86 C66 61 83 52 97 53 C113 53 126 63 122 85 C118 73 107 68 93 70 C82 71 74 77 68 86 Z" fill="#2b2118" />
            <path d="M84 62 C92 56 104 57 110 63" fill="none" stroke="#3b2d22" strokeWidth="2" strokeLinecap="round" />
            {/* 눈 */}
            <g style={{ transform: `translate(${pm.dx}px, ${pm.dy}px)`, transition: "transform 0.25s ease-out" }}>
              <circle cx="86" cy="91" r="2.7" fill={INK} />
              <circle cx="104" cy="91" r="2.7" fill={INK} />
            </g>
            <path d="M81 84 Q86 82 90 84" fill="none" stroke="#2b2118" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M100 84 Q104 82 109 84" fill="none" stroke="#2b2118" strokeWidth="1.6" strokeLinecap="round" />
            {/* 볼·입 */}
            <ellipse cx="80" cy="100" rx="5" ry="3" fill={BLUSH} style={{ opacity: 0.15 + fill * 0.45, transition: "opacity 0.5s" }} />
            <ellipse cx="110" cy="100" rx="5" ry="3" fill={BLUSH} style={{ opacity: 0.15 + fill * 0.45, transition: "opacity 0.5s" }} />
            <path
              d={done ? "M88 102 Q95 110 102 102" : "M89 103 Q95 107 101 103"}
              fill="none"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transition: "d 0.4s" }}
            />
            {/* 휴대폰 든 손 */}
            <rect x="99" y="150" width="17" height="27" rx="3.5" fill="#18181b" />
            <rect x="101" y="153" width="13" height="20" rx="2" fill={lastSpeaker === "m" ? "#fda4af" : "#3f3f46"} style={{ transition: "fill 0.3s" }} />
            <ellipse cx="99" cy="166" rx="6" ry="7" fill={SKIN} />
            <ellipse cx="116" cy="168" rx="5" ry="6" fill={SKIN} />
          </g>
        </g>

        {/* ── 여학생 ── */}
        <g className="ondo-breathe" style={{ animationDelay: "-1.6s" }}>
          <g
            style={{
              transform: `rotate(${done ? -4 : 0}deg)`,
              transformOrigin: "265px 120px",
              transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* 뒷머리 */}
            <path d="M236 90 C233 59 249 48 266 48 C285 48 299 60 296 90 L299 130 C291 135 283 131 281 122 L251 122 C249 131 241 135 233 130 Z" fill="#5b3a29" />
            {/* 가디건·티 */}
            <path d="M228 206 C228 156 240 126 265 126 C290 126 302 156 302 206 Z" fill="#fda4af" />
            <path d="M252 128 L265 150 L278 128 Z" fill="#fff7ed" />
            <circle cx="265" cy="164" r="1.8" fill="#f43f5e" />
            <circle cx="265" cy="178" r="1.8" fill="#f43f5e" />
            {/* 목·머리 */}
            <rect x="258" y="108" width="14" height="20" rx="6" fill={SKIN_SHADE} />
            <circle cx="241" cy="93" r="4.2" fill={SKIN} />
            <circle cx="289" cy="93" r="4.2" fill={SKIN} />
            <circle cx="265" cy="89" r="25" fill={SKIN} />
            {/* 앞머리 */}
            <path d="M239 86 C240 66 254 57 267 58 C282 58 293 68 292 86 C283 75 271 71 258 75 C250 77 244 81 239 86 Z" fill="#6b4532" />
            <circle cx="287" cy="70" r="3" fill="#fb7185" />
            {/* 눈 */}
            <g style={{ transform: `translate(${pf.dx}px, ${pf.dy}px)`, transition: "transform 0.25s ease-out" }}>
              <circle cx="256" cy="92" r="2.7" fill={INK} />
              <circle cx="274" cy="92" r="2.7" fill={INK} />
            </g>
            {/* 부드러운 눈썹 */}
            <path d="M250 85 Q255 82.5 260 84.5" fill="none" stroke="#6b4532" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M270 84.5 Q275 82.5 280 85" fill="none" stroke="#6b4532" strokeWidth="1.6" strokeLinecap="round" />
            {/* 볼·입 */}
            <ellipse cx="250" cy="101" rx="5" ry="3" fill={BLUSH} style={{ opacity: 0.2 + fill * 0.5, transition: "opacity 0.5s" }} />
            <ellipse cx="280" cy="101" rx="5" ry="3" fill={BLUSH} style={{ opacity: 0.2 + fill * 0.5, transition: "opacity 0.5s" }} />
            <path
              d={done ? "M258 103 Q265 111 272 103" : "M259 104 Q265 108 271 104"}
              fill="none"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transition: "d 0.4s" }}
            />
            {/* 휴대폰 든 손 */}
            <rect x="244" y="150" width="17" height="27" rx="3.5" fill="#18181b" />
            <rect x="246" y="153" width="13" height="20" rx="2" fill={lastSpeaker === "f" ? "#fda4af" : "#3f3f46"} style={{ transition: "fill 0.3s" }} />
            <ellipse cx="261" cy="166" rx="6" ry="7" fill={SKIN} />
            <ellipse cx="244" cy="168" rx="5" ry="6" fill={SKIN} />
          </g>
        </g>

        {/* ── 가운데 온도 하트 ── */}
        <g key={done ? "heart-done" : "heart"} className={done ? "ondo-svg-pop" : undefined}>
          <path
            d="M180 140 C150 118 146 96 160 86 C170 79 178 84 180 92 C182 84 190 79 200 86 C214 96 210 118 180 140 Z"
            fill="#fff"
            stroke="#fda4af"
            strokeWidth="2"
          />
          <g clipPath="url(#ondo-heart-clip)">
            <rect
              x="140"
              y={140 - 60 * fill}
              width="80"
              height="62"
              fill="#f43f5e"
              style={{ transition: "y 0.7s cubic-bezier(0.16,1,0.3,1)" }}
            />
          </g>
          <text
            x="180"
            y="160"
            textAnchor="middle"
            fontSize="13"
            fontWeight="900"
            fill={done ? "#e11d48" : "#71717a"}
            style={{ fontFamily: "inherit", transition: "fill 0.3s" }}
          >
            {temp}°
          </text>
        </g>

        {/* 대화 진행 점 (5개) */}
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={164 + i * 8}
              cy={172}
              r="2.4"
              fill={i < shown ? "#f43f5e" : "#e7e5e4"}
              style={{ transition: "fill 0.3s" }}
            />
          ))}
        </g>

        {/* 카톡 공개 순간 */}
        {done && (
          <g className="ondo-svg-pop" key={`done-${runId}`}>
            <rect x="140" y="182" width="80" height="20" rx="10" fill="#FEE500" />
            <text x="180" y="196" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#18181b" style={{ fontFamily: "inherit" }}>
              {isJa ? "カカオID公開 💌" : "카톡 공개 💌"}
            </text>
            {[
              [150, 76],
              [212, 72],
              [196, 60],
            ].map(([x, y], i) => (
              <text
                key={i}
                x={x}
                y={y}
                fontSize="11"
                className="ondo-svg-sparkle"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                ✨
              </text>
            ))}
          </g>
        )}

        {/* 말풍선: 각자 마지막으로 보낸 메시지 */}
        {maleMsgIdx >= 0 && (
          <g key={`m-${maleMsgIdx}-${runId}`} className="ondo-svg-pop" style={{ transformOrigin: "60px 50px" }}>
            <rect x="34" y="18" width={bubbleWidth(msgs[maleMsgIdx])} height="26" rx="13" fill={lastSpeaker === "m" ? "#18181b" : "#fff"} stroke="#e7e5e4" />
            <path d="M62 43 L70 52 L74 43 Z" fill={lastSpeaker === "m" ? "#18181b" : "#fff"} />
            <text x={34 + bubbleWidth(msgs[maleMsgIdx]) / 2} y="35" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={lastSpeaker === "m" ? "#fff" : "#3f3f46"} style={{ fontFamily: "inherit" }}>
              {msgs[maleMsgIdx]}
            </text>
          </g>
        )}
        {femaleMsgIdx >= 0 && (
          <g key={`f-${femaleMsgIdx}-${runId}`} className="ondo-svg-pop" style={{ transformOrigin: "300px 50px" }}>
            <rect x={326 - bubbleWidth(msgs[femaleMsgIdx])} y="18" width={bubbleWidth(msgs[femaleMsgIdx])} height="26" rx="13" fill={lastSpeaker === "f" ? "#e11d48" : "#fff"} stroke="#fecdd3" />
            <path d="M298 43 L290 52 L286 43 Z" fill={lastSpeaker === "f" ? "#e11d48" : "#fff"} />
            <text x={326 - bubbleWidth(msgs[femaleMsgIdx]) / 2} y="35" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={lastSpeaker === "f" ? "#fff" : "#3f3f46"} style={{ fontFamily: "inherit" }}>
              {msgs[femaleMsgIdx]}
            </text>
          </g>
        )}
      </svg>
      <span className="pointer-events-none absolute right-2 bottom-1 rounded-full bg-white/80 px-2 py-0.5 text-[10.5px] font-semibold text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        {isJa ? "タップでもう一度" : "눌러서 다시 보기"}
      </span>
    </button>
  );
}
