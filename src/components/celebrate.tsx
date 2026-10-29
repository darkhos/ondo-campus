"use client";

import React, { useEffect, useState } from "react";

// 꽃가루 조각: 매번 같은 모양이 나오도록 순서 번호로 위치·색·지연을 정함
const CONFETTI_COLORS = ["#e11d48", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#0ea5e9"];
const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 10) * 70,
  duration: 1500 + ((i * 53) % 900),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 4) * 2,
  rotate: (i * 47) % 360,
  round: i % 3 === 0,
}));

/** 화면 위에서 꽃가루가 떨어지고 가운데에 축하 문구가 뜨는 효과 (화면을 가리지 않음) */
export function ConfettiBurst({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-live="polite">
      {CONFETTI_PIECES.map((p, i) => (
        <span
          key={i}
          className="ondo-confetti absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? "9999px" : "2px",
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              "--ondo-confetti-rotate": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="absolute inset-x-0 top-[38%] flex justify-center px-6">
        <div className="ondo-pop rounded-3xl border border-rose-100 bg-white/95 px-6 py-4 text-center shadow-xl backdrop-blur-sm">
          <p className="text-[17px] font-black text-zinc-900">{title}</p>
          {subtitle && <p className="mt-1 text-[13px] font-semibold text-zinc-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/** 버튼 위로 하트가 떠오르는 효과 */
export function HeartBurst() {
  return (
    <span className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="ondo-heart-float absolute text-[20px]"
          style={{ animationDelay: `${i * 140}ms`, marginLeft: `${(i - 1) * 26}px` }}
        >
          💗
        </span>
      ))}
    </span>
  );
}

function readStartedAt(key: string): number | null {
  try {
    const v = Number(window.localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * 조건이 처음 참이 되는 순간에만 한 번 보여 주는 축하 효과.
 * 시작한 시각을 기기에 기록해 두어, 화면이 새로 그려져도 남은 시간만큼 이어서 보여 주고
 * 새로고침하거나 다시 들어와도 같은 축하는 다시 나오지 않음.
 */
export function useCelebrateOnce(key: string, active: boolean, durationMs = 2800): boolean {
  const [done, setDone] = useState(() => {
    const startedAt = readStartedAt(key);
    return startedAt !== null && Date.now() - startedAt >= durationMs;
  });
  const show = active && !done;
  useEffect(() => {
    if (!show) return;
    let startedAt = readStartedAt(key);
    if (startedAt === null) {
      startedAt = Date.now();
      try {
        window.localStorage.setItem(key, String(startedAt));
      } catch {
        // ignore
      }
    }
    const remaining = Math.max(0, durationMs - (Date.now() - startedAt));
    const id = window.setTimeout(() => setDone(true), remaining);
    return () => window.clearTimeout(id);
  }, [show, key, durationMs]);
  return show;
}
