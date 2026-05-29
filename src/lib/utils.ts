import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uniqueById<T extends { id: number; media_type?: string }>(items: T[], fallbackType?: string) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.media_type || fallbackType || "movie"}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
