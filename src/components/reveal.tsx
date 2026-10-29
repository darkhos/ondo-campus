"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

// 휴대폰·컴퓨터의 "동작 줄이기" 설정 여부
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** 요소가 화면에 처음 들어왔는지 (한 번 들어오면 계속 true) */
export function useInViewOnce<T extends Element>(
  threshold = 0.15
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      // 오래된 브라우저: 관찰 기능이 없으면 바로 보여 줌
      const id = window.setTimeout(() => setSeen(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);

  return [ref, seen];
}

/** 스크롤해서 화면에 들어오면 살짝 떠오르며 나타나는 감싸개 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** 여러 개를 차례로 나타나게 할 때 쓰는 지연 시간(밀리초) */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const [ref, seen] = useInViewOnce<HTMLElement>();
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={["ondo-reveal", seen && "is-visible", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--ondo-reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
