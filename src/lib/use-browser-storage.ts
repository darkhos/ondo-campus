"use client";

import { useSyncExternalStore } from "react";

// 브라우저 저장값을 화면 상태로 복사하지 않고 그대로 구독해서 읽는 훅들.
// 정적 빌드(서버) 단계에서는 null / "" 을 돌려주고, 브라우저에서 실제 값으로 바뀜.

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ondo-auth-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ondo-auth-change", onChange);
  };
}

function subscribeNothing() {
  return () => {};
}

const getNull = () => null;
const getEmpty = () => "";

function readItem(storage: "localStorage" | "sessionStorage", key: string) {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

export function useLocalStorageItem(key: string): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => readItem("localStorage", key),
    getNull
  );
}

export function useSessionStorageItem(key: string): string | null {
  return useSyncExternalStore(
    subscribeNothing,
    () => readItem("sessionStorage", key),
    getNull
  );
}

/** 처음 열었을 때 주소의 ?쿼리 문자열 */
export function useInitialSearch(): string {
  return useSyncExternalStore(
    subscribeNothing,
    () => window.location.search,
    getEmpty
  );
}

export function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
