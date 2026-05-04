import { supabase } from "@/integrations/supabase/client";

export interface Server {
  id?: string;
  name: string;
  type: "tmdb" | "imdb" | string;
  url: string;
  url_tv: string;
  is_download?: boolean;
  enabled?: boolean;
  sort_order?: number;
}

// Fallback (used if DB unavailable)
export const fallbackServers: Server[] = [
  { name: "Vidify", type: "tmdb", url: "https://vidify.top/embed/movie/{tmdb_id}", url_tv: "https://vidify.top/embed/tv/{tmdb_id}/{season}/{episode}" },
  { name: "MoviesAPI", type: "tmdb", url: "https://moviesapi.club/movie/{tmdb_id}", url_tv: "https://moviesapi.club/tv/{tmdb_id}-{season}-{episode}" },
  { name: "VidLink", type: "tmdb", url: "https://vidlink.pro/movie/{tmdb_id}", url_tv: "https://vidlink.pro/tv/{tmdb_id}/{season}/{episode}" },
];

export async function fetchServers(): Promise<Server[]> {
  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return fallbackServers;
  return data as Server[];
}

export function getServerUrl(server: Server, opts: { tmdbId: number; imdbId?: string; season?: number; episode?: number; isTV?: boolean }): string {
  const { tmdbId, imdbId, season, episode, isTV } = opts;
  let url = isTV ? server.url_tv : server.url;
  url = url.replace(/\{tmdb_id\}/g, String(tmdbId));
  url = url.replace(/\{imdb_id\}/g, imdbId || "");
  url = url.replace(/\{season\}/g, String(season || 1));
  url = url.replace(/\{episode\}/g, String(episode || 1));
  return url;
}

// kept for compatibility with old imports
export const servers = fallbackServers;
