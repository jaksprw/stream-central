import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  slot: string;
  name: string;
  html: string | null;
  image_url: string | null;
  click_url: string | null;
  enabled: boolean;
  sort_order: number;
}

let cache: Ad[] | null = null;
let cachePromise: Promise<Ad[]> | null = null;

export function fetchAds(): Promise<Ad[]> {
  if (cache) return Promise.resolve(cache);
  if (cachePromise) return cachePromise;
  cachePromise = supabase
    .from("ads")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .then(({ data }) => {
      cache = (data || []) as Ad[];
      return cache;
    });
  return cachePromise;
}

export function invalidateAdsCache() {
  cache = null;
  cachePromise = null;
}

export function useAds(slot: string) {
  const [ads, setAds] = useState<Ad[]>([]);
  useEffect(() => {
    fetchAds().then(all => setAds(all.filter(a => a.slot === slot)));
  }, [slot]);
  return ads;
}

export const AD_SLOTS = [
  "header",
  "home_top",
  "home_middle",
  "home_bottom",
  "detail_top",
  "detail_bottom",
  "player_top",
  "player_bottom",
  "sidebar",
  "footer",
] as const;
