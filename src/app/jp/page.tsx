"use client";

import React, { useEffect } from "react";
import RootPage from "@/app/page";
import { setAppLocale, useAppLocale } from "@/lib/i18n";

export default function JapaneseDedicatedPage() {
  const [, updateLocale] = useAppLocale();

  useEffect(() => {
    setAppLocale("ja");
    updateLocale("ja");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RootPage />;
}
