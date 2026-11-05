"use client";

import { useEffect } from "react";
import {
  recordDailyVisit,
  saveMyKakaoProviderToken,
  supabase,
} from "@/lib/supabase";

/**
 * ONDO 36.5° Anti-Clone & Anti-Scraper Runtime Shield
 * - Blocks right-click context menu & source view shortcuts (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U, Ctrl/Cmd+S)
 * - Blocks image/DOM drag-cloning
 * - Breaks unauthorized iframe mirroring (Frame-busting)
 */
export function SecurityShield() {
  useEffect(() => {
    const isSajuRoute =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/saju");

    let authSub: { subscription: { unsubscribe: () => void } } | null = null;
    if (!isSajuRoute) {
      void recordDailyVisit(false);
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.provider_token) {
            void saveMyKakaoProviderToken(
              session.provider_token,
              session.provider_refresh_token
            );
          }
          if (event === "SIGNED_IN") {
            void recordDailyVisit(true);
          }
        }
      });
      authSub = data;
    }

    // 1. Frame-busting against unauthorized mirror iframes
    try {
      if (window.self !== window.top && window.top) {
        window.top.location.href = window.self.location.href;
      }
    } catch {
      // ignore cross-origin frame access restriction
    }

    // 2. Block contextmenu & dragstart on non-input elements (except downloadable story cards)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("data-allow-save") === "true")
      ) {
        return;
      }
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 3. Block DevTools & Save-Page / View-Source keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (
        e.key === "F12" ||
        (ctrlOrCmd && e.shiftKey && ["I", "J", "C", "K"].includes(key)) ||
        (ctrlOrCmd && ["U", "S"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      authSub?.subscription.unsubscribe();
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
