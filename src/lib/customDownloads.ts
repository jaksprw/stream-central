import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomDownload {
  id: string;
  tmdb_id: number;
  media_type: string;
  season: number | null;
  episode: number | null;
  label: string;
  url: string;
  quality: string | null;
  size: string | null;
  sort_order: number;
  enabled: boolean;
}

function dedupeDownloads(items: CustomDownload[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.url.trim().toLowerCase()}|${item.label.trim().toLowerCase()}|${item.quality || ""}|${item.size || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterCustomDownloads(items: CustomDownload[], mediaType: "movie" | "tv", season?: number, episode?: number) {
  const list = dedupeDownloads(items);
  if (mediaType !== "tv") return list;

  if (season == null && episode == null) return items;

  return list.filter(item => {
    const isGenericLink = item.season == null && item.episode == null;

    if (season != null && episode != null) {
      return isGenericLink || (item.season === season && item.episode === episode);
    }

    if (season != null) {
      return isGenericLink || item.season === season;
    }

    return isGenericLink;
  });
}

export function useCustomDownloads(tmdbId: number, mediaType: "movie" | "tv", season?: number, episode?: number) {
  const [items, setItems] = useState<CustomDownload[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    let cancelled = false;
    const q = supabase.from("custom_downloads").select("*").eq("tmdb_id", tmdbId).eq("media_type", mediaType).eq("enabled", true).order("sort_order");

    q.then(({ data }) => {
      if (cancelled) return;
      const list = (data || []) as CustomDownload[];
      setItems(filterCustomDownloads(list, mediaType, season, episode));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tmdbId, mediaType, season, episode]);

  return { items, loading };
}
