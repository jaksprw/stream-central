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

export function useCustomDownloads(tmdbId: number, mediaType: "movie" | "tv", season?: number, episode?: number) {
  const [items, setItems] = useState<CustomDownload[]>([]);
  useEffect(() => {
    if (!tmdbId) return;
    let q = supabase.from("custom_downloads").select("*").eq("tmdb_id", tmdbId).eq("media_type", mediaType).eq("enabled", true).order("sort_order");
    q.then(({ data }) => {
      let list = (data || []) as CustomDownload[];
      if (mediaType === "tv" && season != null && episode != null) {
        list = list.filter(d => (d.season == null && d.episode == null) || (d.season === season && d.episode === episode));
      }
      setItems(list);
    });
  }, [tmdbId, mediaType, season, episode]);
  return items;
}
