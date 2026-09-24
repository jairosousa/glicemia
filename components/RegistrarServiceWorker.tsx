"use client";

import { useEffect } from "react";

/** Registra public/sw.js — necessário para o prompt de instalação (PROJECT.md F10). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
