import { useState, useEffect, useCallback } from "react";

// Watchlist
export function getWatchlist(): { id: number; type: "movie" | "tv" }[] {
  try {
    return JSON.parse(localStorage.getItem("watchlist") || "[]");
  } catch { return []; }
}

export function toggleWatchlist(id: number, type: "movie" | "tv"): boolean {
  const list = getWatchlist();
  const idx = list.findIndex(i => i.id === id && i.type === type);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem("watchlist", JSON.stringify(list));
    return false;
  }
  list.push({ id, type });
  localStorage.setItem("watchlist", JSON.stringify(list));
  return true;
}

export function isInWatchlist(id: number, type: "movie" | "tv"): boolean {
  return getWatchlist().some(i => i.id === id && i.type === type);
}

// Liked
export function getLiked(): { id: number; type: "movie" | "tv" }[] {
  try {
    return JSON.parse(localStorage.getItem("liked") || "[]");
  } catch { return []; }
}

export function toggleLiked(id: number, type: "movie" | "tv"): boolean {
  const list = getLiked();
  const idx = list.findIndex(i => i.id === id && i.type === type);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem("liked", JSON.stringify(list));
    return false;
  }
  list.push({ id, type });
  localStorage.setItem("liked", JSON.stringify(list));
  return true;
}

export function isLiked(id: number, type: "movie" | "tv"): boolean {
  return getLiked().some(i => i.id === id && i.type === type);
}

// Profile
export interface UserProfile {
  name: string;
  avatar: string; // base64 or URL
}

export function getProfile(): UserProfile {
  try {
    return { name: "User", avatar: "", ...JSON.parse(localStorage.getItem("profile") || "{}") };
  } catch { return { name: "User", avatar: "" }; }
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem("profile", JSON.stringify(p));
  window.dispatchEvent(new Event("profile-changed"));
}

// Settings
export interface Settings {
  language: string;
  dataSaver: boolean;
}

export function getSettings(): Settings {
  try {
    return { language: "", dataSaver: false, ...JSON.parse(localStorage.getItem("settings") || "{}") };
  } catch { return { language: "", dataSaver: false }; }
}

export function saveSettings(s: Settings) {
  localStorage.setItem("settings", JSON.stringify(s));
  window.dispatchEvent(new Event("settings-changed"));
}

export function useSettings(): [Settings, (s: Settings) => void] {
  const [settings, setSettings] = useState(getSettings);
  useEffect(() => {
    const handler = () => setSettings(getSettings());
    window.addEventListener("settings-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("settings-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  const update = useCallback((s: Settings) => {
    saveSettings(s);
    setSettings(s);
  }, []);
  return [settings, update];
}
