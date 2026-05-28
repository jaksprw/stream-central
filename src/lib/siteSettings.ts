import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  // Identity
  site_title: string;
  site_tagline: string;
  site_logo: string;
  site_favicon: string;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_og_image: string;
  // Analytics
  ga4_id: string;
  gtm_id: string;
  fb_pixel: string;
  google_site_verification: string;
  bing_site_verification: string;
  // Structured data
  jsonld_organization: string;
  jsonld_website: string;
  // Social
  telegram_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  twitter_url: string;
  whatsapp_url: string;
  discord_url: string;
  // Push & ads
  onesignal_app_id: string;
  push_html: string;
  // Payments
  razorpay_key_id: string;
  razorpay_key_secret: string;
  upi_id: string;
  upi_name: string;
  upi_qr_url: string;
  // Custom HTML / CSS
  header_html: string;
  footer_html: string;
  custom_css: string;
  // Player
  player_logo_url: string;
}

const defaults: SiteSettings = {
  site_title: "CineStream",
  site_tagline: "",
  site_logo: "",
  site_favicon: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  seo_og_image: "",
  ga4_id: "",
  gtm_id: "",
  fb_pixel: "",
  google_site_verification: "",
  bing_site_verification: "",
  jsonld_organization: "",
  jsonld_website: "",
  telegram_url: "",
  facebook_url: "",
  instagram_url: "",
  youtube_url: "",
  twitter_url: "",
  whatsapp_url: "",
  discord_url: "",
  onesignal_app_id: "",
  push_html: "",
  razorpay_key_id: "",
  razorpay_key_secret: "",
  upi_id: "",
  upi_name: "",
  upi_qr_url: "",
  header_html: "",
  footer_html: "",
  custom_css: "",
  player_logo_url: "",
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

export const SETTING_GROUPS: { title: string; description?: string; fields: { key: keyof SiteSettings; label: string; type: "text" | "textarea" | "css" | "html"; placeholder?: string }[] }[] = [
  {
    title: "Site Identity",
    fields: [
      { key: "site_title", label: "Site Title", type: "text" },
      { key: "site_tagline", label: "Tagline", type: "text" },
      { key: "site_logo", label: "Logo URL", type: "text", placeholder: "https://..." },
      { key: "site_favicon", label: "Favicon URL", type: "text" },
    ],
  },
  {
    title: "SEO Settings",
    fields: [
      { key: "seo_title", label: "Default Meta Title", type: "text" },
      { key: "seo_description", label: "Meta Description", type: "textarea" },
      { key: "seo_keywords", label: "Keywords (comma separated)", type: "text" },
      { key: "seo_og_image", label: "Open Graph Image URL", type: "text" },
    ],
  },
  {
    title: "Analytics & Verification",
    fields: [
      { key: "ga4_id", label: "Google Analytics 4 (G-XXXXXXX)", type: "text" },
      { key: "gtm_id", label: "Google Tag Manager (GTM-XXXX)", type: "text" },
      { key: "fb_pixel", label: "Facebook Pixel ID", type: "text" },
      { key: "google_site_verification", label: "Google Search Console code", type: "text" },
      { key: "bing_site_verification", label: "Bing Verification code", type: "text" },
    ],
  },
  {
    title: "Structured Data (JSON-LD)",
    fields: [
      { key: "jsonld_organization", label: "Organization JSON-LD", type: "textarea", placeholder: '{"@context":"https://schema.org","@type":"Organization",...}' },
      { key: "jsonld_website", label: "Website JSON-LD", type: "textarea" },
    ],
  },
  {
    title: "Social Links",
    fields: [
      { key: "telegram_url", label: "Telegram", type: "text" },
      { key: "facebook_url", label: "Facebook", type: "text" },
      { key: "instagram_url", label: "Instagram", type: "text" },
      { key: "youtube_url", label: "YouTube", type: "text" },
      { key: "twitter_url", label: "Twitter / X", type: "text" },
      { key: "whatsapp_url", label: "WhatsApp", type: "text" },
      { key: "discord_url", label: "Discord", type: "text" },
    ],
  },
  {
    title: "Push Notifications & Custom HTML",
    fields: [
      { key: "onesignal_app_id", label: "OneSignal App ID", type: "text" },
      { key: "push_html", label: "Push / Notification HTML", type: "html" },
      { key: "header_html", label: "Header HTML (analytics, banners)", type: "html" },
      { key: "footer_html", label: "Footer HTML", type: "html" },
    ],
  },
  {
    title: "Razorpay Payment Settings",
    fields: [
      { key: "razorpay_key_id", label: "Razorpay Key ID", type: "text" },
      { key: "razorpay_key_secret", label: "Razorpay Key Secret", type: "text" },
    ],
  },
  {
    title: "UPI Payment Settings",
    fields: [
      { key: "upi_id", label: "UPI ID (eg: name@upi)", type: "text" },
      { key: "upi_name", label: "UPI Name", type: "text" },
      { key: "upi_qr_url", label: "UPI QR Image URL", type: "text" },
    ],
  },
  {
    title: "Player",
    fields: [
      { key: "player_logo_url", label: "Player Watermark Logo URL", type: "text" },
    ],
  },
  {
    title: "Custom CSS",
    fields: [
      { key: "custom_css", label: "Global Custom CSS", type: "css" },
    ],
  },
];
