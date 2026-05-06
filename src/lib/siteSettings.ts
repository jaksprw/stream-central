import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_title: string;
  site_logo: string;
  telegram_url: string;
  footer_html: string;
  header_html: string;
}

const defaults: SiteSettings = {
  site_title: "CineStream",
  site_logo: "",
  telegram_url: "",
  footer_html: "",
  header_html: "",
};

let cache: SiteSettings | null = null;
let cachePromise: Promise<SiteSettings> | null = null;

export function fetchSiteSettings(): Promise<SiteSettings> {
  if (cache) return Promise.resolve(cache);
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const { data } = await supabase.from("site_settings").select("*");
    const merged = { ...defaults };
    (data || []).forEach((r: { key: string; value: string | null }) => {
      if (r.key in merged) (merged as Record<string, string>)[r.key] = r.value || "";
    });
    cache = merged;
    return cache;
  })();
  return cachePromise;
}

export function invalidateSiteSettings() {
  cache = null;
  cachePromise = null;
  window.dispatchEvent(new Event("site-settings-changed"));
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(cache || defaults);
  useEffect(() => {
    let alive = true;
    fetchSiteSettings().then(s => { if (alive) setSettings(s); });
    const h = () => fetchSiteSettings().then(s => { if (alive) setSettings(s); });
    window.addEventListener("site-settings-changed", h);
    return () => { alive = false; window.removeEventListener("site-settings-changed", h); };
  }, []);
  return settings;
}
