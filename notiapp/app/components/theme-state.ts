"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const eventName = "notiapp:theme-change";

function getTheme(): Theme {
  return window.localStorage.getItem("notiapp-theme") === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("notiapp-theme", next);
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event(eventName));
  }
  return { theme, toggleTheme };
}
