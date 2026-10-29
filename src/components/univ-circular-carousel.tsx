"use client";

import React, { useEffect, useRef, useState } from "react";

interface UnivCardItem {
  id: string;
  nameKo: string;
  nameJa: string;
  subKo: string;
  subJa: string;
  accent: string;
  badge: string;
  isJp?: boolean;
}

const UNIV_RING_ITEMS: UnivCardItem[] = [
  {
    id: "konkuk",
    nameKo: "건국대학교",
    nameJa: "建国大学",
    subKo: "서울 광진구 · 캠퍼스 인증",
    subJa: "ソウル広津区 · 認証対応",
    accent: "from-emerald-500/15 via-white to-emerald-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "kyunghee",
    nameKo: "경희대학교",
    nameJa: "慶熙大学",
    subKo: "서울·국제 · 캠퍼스 인증",
    subJa: "ソウル・国際 · 認証対応",
    accent: "from-rose-500/15 via-white to-rose-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "korea",
    nameKo: "고려대학교",
    nameJa: "高麗大学",
    subKo: "서울 성북구 · 캠퍼스 인증",
    subJa: "ソウル城北区 · 認証対応",
    accent: "from-red-500/15 via-white to-rose-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "kwangwoon",
    nameKo: "광운대학교",
    nameJa: "光云大学",
    subKo: "서울 노원구 · 캠퍼스 인증",
    subJa: "ソウル芦原区 · 認証対応",
    accent: "from-rose-500/15 via-white to-amber-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "sogang",
    nameKo: "서강대학교",
    nameJa: "西江大学",
    subKo: "서울 마포구 · 캠퍼스 인증",
    subJa: "ソウル麻浦区 · 認証対応",
    accent: "from-rose-500/15 via-white to-orange-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "snu",
    nameKo: "서울대학교",
    nameJa: "ソウル大学",
    subKo: "서울 관악구 · 캠퍼스 인증",
    subJa: "ソウル冠岳区 · 認証対応",
    accent: "from-indigo-500/15 via-white to-sky-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "skku",
    nameKo: "성균관대학교",
    nameJa: "成均館大学",
    subKo: "서울·수원 · 캠퍼스 인증",
    subJa: "ソウル・水原 · 認証対応",
    accent: "from-emerald-500/15 via-white to-amber-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "yonsei",
    nameKo: "연세대학교",
    nameJa: "延世大学",
    subKo: "서울 서대문구 · 캠퍼스 인증",
    subJa: "ソウル西大門区 · 認証対応",
    accent: "from-sky-500/15 via-white to-indigo-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "ewha",
    nameKo: "이화여자대학교",
    nameJa: "梨花女子大学",
    subKo: "서울 서대문구 · 캠퍼스 인증",
    subJa: "ソウル西大門区 · 認証対応",
    accent: "from-emerald-500/15 via-white to-teal-50/60",
    badge: "🌸 CAMPUS",
  },
  {
    id: "chungang",
    nameKo: "중앙대학교",
    nameJa: "中央大学",
    subKo: "서울 동작구 · 캠퍼스 인증",
    subJa: "ソウル銅雀区 · 認証対応",
    accent: "from-indigo-500/15 via-white to-rose-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "hufs",
    nameKo: "한국외국어대학교",
    nameJa: "韓国外国語大学",
    subKo: "서울·글로벌 · 캠퍼스 인증",
    subJa: "ソウル・グローバル · 認証対応",
    accent: "from-teal-500/15 via-white to-sky-50/60",
    badge: "🌏 CAMPUS",
  },
  {
    id: "hanyang",
    nameKo: "한양대학교",
    nameJa: "漢陽大学",
    subKo: "서울 성동구 · 캠퍼스 인증",
    subJa: "ソウル城東区 · 認証対応",
    accent: "from-sky-500/15 via-white to-amber-50/60",
    badge: "🎓 CAMPUS",
  },
  {
    id: "hongik",
    nameKo: "홍익대학교",
    nameJa: "弘益大学",
    subKo: "서울 마포구 · 캠퍼스 인증",
    subJa: "ソウル麻浦区 · 認証対応",
    accent: "from-rose-500/15 via-white to-indigo-50/60",
    badge: "🎨 CAMPUS",
  },
  {
    id: "jp_track",
    nameKo: "일본어학당 · 유학생",
    nameJa: "日本語学堂・留学生",
    subKo: "수도권 62개 어학당 & 78개 대학",
    subJa: "首都圏62語学堂＆78大学対応",
    accent: "from-rose-500/25 via-rose-50 to-amber-50",
    badge: "🇯🇵 GLOBAL",
    isJp: true,
  },
];

export function UniversityCircularCarousel({
  isJa,
  compact = false,
}: {
  isJa: boolean;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(3); // 광운대학교 초기 중앙 포커스

  const stateRef = useRef({
    angle: -3 * (360 / UNIV_RING_ITEMS.length), // 광운대학교(index 3)가 정면(0deg)에 오도록 시작
    velocity: 0,
    targetAngle: null as number | null,
    isDragging: false,
    isHovered: false,
    lastX: 0,
    lastTime: 0,
    dragDistance: 0,
    direction: -1, // 왼쪽 방향으로 회전 (ReactBits Circular Carousel 기본값)
  });

  useEffect(() => {
    let rafId = 0;
    let prevTs = performance.now();
    const count = UNIV_RING_ITEMS.length;
    const stepDeg = 360 / count;
    const driftSpeedDegPerSec = 14; // ReactBits 기본 14°/s

    const updateDOM = (now: number) => {
      const dt = Math.min(0.05, (now - prevTs) / 1000);
      prevTs = now;
      const st = stateRef.current;

      if (!st.isDragging) {
        if (st.targetAngle !== null) {
          const diff = st.targetAngle - st.angle;
          st.angle += diff * Math.min(1, dt * 8);
          if (Math.abs(diff) < 0.15) {
            st.angle = st.targetAngle;
            st.targetAngle = null;
          }
        } else {
          // 관성 감속 (Momentum 0.6) + 기본 드리프트 회전
          if (Math.abs(st.velocity) > 0.5) {
            st.angle += st.velocity * dt;
            st.velocity *= Math.pow(0.08, dt);
          } else {
            st.velocity = 0;
            if (!st.isHovered) {
              st.angle += st.direction * driftSpeedDegPerSec * dt;
            }
          }
        }
      }

      const containerWidth = containerRef.current?.clientWidth ?? 360;
      const isMobile = containerWidth < 500;
      const cardW = compact
        ? isMobile
          ? 136
          : 156
        : isMobile
        ? 150
        : 184;
      const gap = compact ? 14 : isMobile ? 16 : 22;
      // 원기둥 반지름 R = N * (cardW + gap) / (2 * PI)
      const radius = Math.round(((cardW + gap) * count) / (2 * Math.PI));

      let frontIdx = 0;
      let bestCos = -2;

      for (let i = 0; i < count; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const thetaDeg = i * stepDeg + st.angle;
        const thetaRad = (thetaDeg * Math.PI) / 180;
        const cosVal = Math.cos(thetaRad); // +1: 정면, -1: 후면
        const sinVal = Math.sin(thetaRad);

        if (cosVal > bestCos) {
          bestCos = cosVal;
          frontIdx = i;
        }

        // Depth Fade (0.55) & Inner Shade (0.6) — 정면 카드는 선명하고 뒤쪽 카드는 입체적으로 은은해짐
        const depthNorm = (cosVal + 1) / 2; // 0(뒤) ~ 1(앞)
        const opacity = Math.max(0.12, Math.pow(depthNorm, 1.45));
        const scale = 0.84 + depthNorm * 0.18;
        const zIndex = Math.round(depthNorm * 100);
        const isFront = cosVal > 0.94;

        // Cylinder 3D 배치 + 살짝 아래로 내려다보는 Tilt(-5°)
        el.style.width = `${cardW}px`;
        el.style.transform = `translate3d(-50%, -50%, 0px) rotateX(-5deg) rotateY(${thetaDeg.toFixed(
          2
        )}deg) translateZ(${radius}px) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(zIndex);
        el.style.filter =
          cosVal < 0
            ? `brightness(${(0.72 + depthNorm * 0.28).toFixed(2)}) blur(0.6px)`
            : "none";
        el.style.borderColor = isFront
          ? "rgba(225, 29, 72, 0.65)"
          : "rgba(231, 229, 228, 0.95)";
        el.style.boxShadow = isFront
          ? "0 14px 30px -6px rgba(225, 29, 72, 0.18), 0 4px 12px rgba(24, 24, 27, 0.06)"
          : "0 6px 16px rgba(24, 24, 27, 0.05)";
        // 뒷면 카드 클릭 방지
        el.style.pointerEvents = cosVal > -0.15 ? "auto" : "none";
        void sinVal;
      }

      setActiveIndex((prev) => (prev !== frontIdx ? frontIdx : prev));
      rafId = window.requestAnimationFrame(updateDOM);
    };

    rafId = window.requestAnimationFrame(updateDOM);
    return () => window.cancelAnimationFrame(rafId);
  }, [compact]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    st.isDragging = true;
    st.targetAngle = null;
    st.lastX = e.clientX;
    st.lastTime = performance.now();
    st.dragDistance = 0;
    st.velocity = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.isDragging) return;
    const now = performance.now();
    const dx = e.clientX - st.lastX;
    const dt = Math.max(0.008, (now - st.lastTime) / 1000);
    st.dragDistance += Math.abs(dx);
    const degDelta = dx * 0.28;
    st.angle += degDelta;
    st.velocity = (degDelta / dt) * 0.6;
    if (Math.abs(dx) > 1) {
      st.direction = dx > 0 ? 1 : -1;
    }
    st.lastX = e.clientX;
    st.lastTime = now;
  };

  const handlePointerUp = () => {
    stateRef.current.isDragging = false;
  };

  const focusCard = (index: number) => {
    const st = stateRef.current;
    if (st.dragDistance > 8) return; // 드래그 직후 오클릭 방지
    const stepDeg = 360 / UNIV_RING_ITEMS.length;
    const desiredMod = -index * stepDeg;
    // 현재 각도와 가장 가까운 회전 경로 계산
    const diff = ((desiredMod - st.angle + 540) % 360) - 180;
    st.targetAngle = st.angle + diff;
  };

  const activeItem = UNIV_RING_ITEMS[activeIndex] ?? UNIV_RING_ITEMS[0];

  return (
    <div className="select-none">
      {/* 3D Cylinder Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => {
          stateRef.current.isHovered = true;
        }}
        onMouseLeave={() => {
          stateRef.current.isHovered = false;
          stateRef.current.isDragging = false;
        }}
        style={{
          perspective: compact ? "1600px" : "2200px",
          touchAction: "pan-y",
        }}
        className={`relative w-full cursor-grab overflow-hidden active:cursor-grabbing ${
          compact ? "h-[148px] sm:h-[164px]" : "h-[172px] sm:h-[196px]"
        }`}
      >
        {/* 좌우 입체 Depth Fade 마스크 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-[120] w-10 bg-gradient-to-r from-white via-white/70 to-transparent sm:w-16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-[120] w-10 bg-gradient-to-l from-white via-white/70 to-transparent sm:w-16"
        />

        {/* 3D Ring Center Pivot */}
        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative h-full w-full"
        >
          {UNIV_RING_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => focusCard(idx)}
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "visible",
              }}
              className={`absolute top-1/2 left-1/2 flex flex-col justify-between rounded-2xl border bg-gradient-to-br text-left transition-colors ${
                item.accent
              } ${compact ? "h-[104px] p-3" : "h-[118px] p-3.5 sm:h-[128px] sm:p-4"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-tight ${
                    item.isJp
                      ? "bg-rose-600 text-white"
                      : "bg-zinc-900/90 text-white"
                  }`}
                >
                  {item.badge}
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-500/80" />
              </div>

              <div className="min-w-0">
                <p
                  className={`truncate font-black tracking-tight text-zinc-900 ${
                    compact ? "text-[13.5px]" : "text-[14.5px] sm:text-[16px]"
                  }`}
                >
                  {isJa ? item.nameJa : item.nameKo}
                </p>
                <p className="mt-0.5 truncate text-[10.5px] font-semibold text-zinc-500 sm:text-[11px]">
                  {isJa ? item.subJa : item.subKo}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 현재 포커스된 대학 캡션 & 드래그 힌트 */}
      <div className="mt-1 flex items-center justify-center gap-2 text-[11.5px] font-bold text-zinc-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-600">
          ✨ {isJa ? activeItem.nameJa : activeItem.nameKo}
        </span>
        <span className="text-[11px] text-zinc-400">
          {isJa
            ? "· 左右にドラッグまたはクリックして回転"
            : "· 좌우로 밀거나 카드를 눌러 3D로 돌려보세요"}
        </span>
      </div>
    </div>
  );
}
