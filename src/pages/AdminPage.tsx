import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { invalidateAdsCache, AD_SLOTS } from "@/lib/ads";
import { invalidateSiteSettings, SETTING_GROUPS, type SiteSettings } from "@/lib/siteSettings";
import {
  Plus, Trash2, Save, LogOut, Server as ServerIcon, Megaphone, Settings as SettingsIcon,
  KeyRound, Download, Tv, FileText, Search, Home, Menu, X, LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

interface ServerRow { id: string; name: string; type: string; url: string; url_tv: string; is_download: boolean; enabled: boolean; sort_order: number }
interface AdRow { id: string; slot: string; name: string; html: string | null; image_url: string | null; click_url: string | null; enabled: boolean; sort_order: number }
interface DownloadRow { id: string; tmdb_id: number; media_type: string; season: number | null; episode: number | null; label: string; url: string; quality: string | null; size: string | null; sort_order: number; enabled: boolean }
interface ChannelRow { id: string; name: string; logo_url: string | null; stream_url: string; category: string | null; sort_order: number; enabled: boolean }
interface PageRow { id: string; slug: string; title: string; content_html: string; meta_description: string | null; enabled: boolean }
interface SettingRow { key: string; value: string | null }

type TabId =
  | "dashboard" | "servers" | "ads" | "downloads" | "live_tv" | "pages"
  | "site_identity" | "seo" | "analytics" | "structured_data" | "social"
  | "push_ads" | "razorpay" | "upi" | "player" | "custom_css" | "password";

const SIDEBAR: { group: string; items: { id: TabId; label: string; icon: typeof Home }[] }[] = [
  {
    group: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Content",
    items: [
      { id: "servers", label: "Servers", icon: ServerIcon },
      { id: "downloads", label: "Custom Downloads", icon: Download },
      { id: "live_tv", label: "Live TV", icon: Tv },
      { id: "pages", label: "Custom Pages", icon: FileText },
      { id: "ads", label: "Ads Manager", icon: Megaphone },
    ],
  },
  {
    group: "Settings",
    items: [
      { id: "site_identity", label: "Site Identity", icon: SettingsIcon },
      { id: "seo", label: "SEO Settings", icon: SettingsIcon },
      { id: "analytics", label: "Analytics & Verification", icon: SettingsIcon },
      { id: "structured_data", label: "Structured Data", icon: SettingsIcon },
      { id: "social", label: "Social Links", icon: SettingsIcon },
      { id: "push_ads", label: "Push & Custom HTML", icon: SettingsIcon },
      { id: "razorpay", label: "Razorpay Payments", icon: SettingsIcon },
      { id: "upi", label: "UPI Payments", icon: SettingsIcon },
      { id: "player", label: "Player", icon: SettingsIcon },
      { id: "custom_css", label: "Custom CSS", icon: SettingsIcon },
      { id: "password", label: "Change Password", icon: KeyRound },
    ],
  },
];

const TAB_TO_GROUP_TITLE: Partial<Record<TabId, string>> = {
  site_identity: "Site Identity",
  seo: "SEO Settings",
  analytics: "Analytics & Verification",
  structured_data: "Structured Data (JSON-LD)",
  social: "Social Links",
  push_ads: "Push Notifications & Custom HTML",
  razorpay: "Razorpay Payment Settings",
  upi: "UPI Payment Settings",
  player: "Player",
  custom_css: "Custom CSS",
};

const TMDB_API_KEY = "fed86956458f19fb45cdd382b6e6de83";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [servers, setServers] = useState<ServerRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("servers").select("*").order("sort_order").then(({ data }) => setServers((data || []) as ServerRow[]));
    supabase.from("ads").select("*").order("sort_order").then(({ data }) => setAds((data || []) as AdRow[]));
    supabase.from("custom_downloads").select("*").order("sort_order").then(({ data }) => setDownloads((data || []) as DownloadRow[]));
    supabase.from("live_tv_channels").select("*").order("sort_order").then(({ data }) => setChannels((data || []) as ChannelRow[]));
    supabase.from("custom_pages").select("*").order("created_at", { ascending: false }).then(({ data }) => setPages((data || []) as PageRow[]));
    supabase.from("site_settings").select("*").then(({ data }) => {
      const m: Record<string, string> = {};
      (data || []).forEach((r: SettingRow) => { m[r.key] = r.value || ""; });
      setSettings(m);
    });
  }, [isAdmin]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-foreground font-semibold">Access denied</p>
      <p className="text-sm text-muted-foreground">Your account is not an admin.</p>
      <button onClick={() => supabase.auth.signOut()} className="text-xs text-primary hover:underline">Sign out</button>
    </div>
  );

  // ----- Helpers -----
  const saveSetting = async (key: string) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value: settings[key] || "" });
    if (error) return toast.error(error.message);
    invalidateSiteSettings();
    toast.success(`${key} saved`);
  };
  const saveSettingsGroup = async (keys: string[]) => {
    const rows = keys.map(k => ({ key: k, value: settings[k] || "" }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    if (error) return toast.error(error.message);
    invalidateSiteSettings();
    toast.success("Saved");
  };

  // ----- Render content -----
  const groupForTab = TAB_TO_GROUP_TITLE[tab];
  const settingGroup = groupForTab ? SETTING_GROUPS.find(g => g.title === groupForTab) : null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 z-40 w-64 h-screen overflow-y-auto glass-panel !rounded-none border-y-0 border-l-0 transition-transform`}>
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold text-gradient">← Site</Link>
          <button className="md:hidden p-1" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></button>
        </div>
        <nav className="p-3 space-y-4">
          {SIDEBAR.map(group => (
            <div key={group.group}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map(it => (
                  <button
                    key={it.id}
                    onClick={() => { setTab(it.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${tab === it.id ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  >
                    <it.icon className="w-3.5 h-3.5" />
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 mt-4">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-30 glass-panel !rounded-none border-x-0 border-t-0 px-4 h-12 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="text-sm font-semibold">Admin</span>
          <span />
        </header>

        <div className="p-4 sm:p-6 max-w-5xl pb-20">
          <p className="text-xs text-muted-foreground mb-4">Signed in as {user.email}</p>

          {tab === "dashboard" && <Dashboard servers={servers} ads={ads} downloads={downloads} channels={channels} pages={pages} />}

          {tab === "servers" && <ServersTab rows={servers} setRows={setServers} />}
          {tab === "ads" && <AdsTab rows={ads} setRows={setAds} />}
          {tab === "downloads" && <DownloadsTab rows={downloads} setRows={setDownloads} />}
          {tab === "live_tv" && <LiveTVTab rows={channels} setRows={setChannels} />}
          {tab === "pages" && <PagesTab rows={pages} setRows={setPages} />}

          {settingGroup && (
            <SettingsForm
              group={settingGroup}
              settings={settings}
              setSettings={setSettings}
              onSave={() => saveSettingsGroup(settingGroup.fields.map(f => f.key))}
              onSaveOne={saveSetting}
            />
          )}

          {tab === "password" && <PasswordTab />}
        </div>
      </main>
    </div>
  );
}

// ============= Dashboard =============
function Dashboard({ servers, ads, downloads, channels, pages }: { servers: any[]; ads: any[]; downloads: any[]; channels: any[]; pages: any[] }) {
  const stats = [
    { label: "Servers", value: servers.length, icon: ServerIcon },
    { label: "Ads", value: ads.length, icon: Megaphone },
    { label: "Downloads", value: downloads.length, icon: Download },
    { label: "Live Channels", value: channels.length, icon: Tv },
    { label: "Custom Pages", value: pages.length, icon: FileText },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gradient mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass-panel p-4">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= Servers =============
function ServersTab({ rows, setRows }: { rows: ServerRow[]; setRows: (r: ServerRow[]) => void }) {
  const add = () => setRows([{ id: `new-${Date.now()}`, name: "New Server", type: "tmdb", url: "", url_tv: "", is_download: false, enabled: true, sort_order: rows.length + 1 }, ...rows]);
  const upd = (id: string, p: Partial<ServerRow>) => setRows(rows.map(s => s.id === id ? { ...s, ...p } : s));
  const save = async (s: ServerRow) => {
    const isNew = s.id.startsWith("new-");
    const payload = { name: s.name, type: s.type, url: s.url, url_tv: s.url_tv, is_download: s.is_download, enabled: s.enabled, sort_order: s.sort_order };
    if (isNew) {
      const { data, error } = await supabase.from("servers").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setRows(rows.map(x => x.id === s.id ? (data as ServerRow) : x));
    } else {
      const { error } = await supabase.from("servers").update(payload).eq("id", s.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
  };
  const del = async (s: ServerRow) => {
    if (!confirm("Delete?")) return;
    if (!s.id.startsWith("new-")) await supabase.from("servers").delete().eq("id", s.id);
    setRows(rows.filter(x => x.id !== s.id));
  };
  return (
    <Section title="Servers" onAdd={add}>
      {rows.map(s => (
        <div key={s.id} className="glass-panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={s.name} onChange={e => upd(s.id, { name: e.target.value })} placeholder="Name" className="filter-select" />
            <select value={s.type} onChange={e => upd(s.id, { type: e.target.value })} className="filter-select">
              <option value="tmdb">tmdb</option><option value="imdb">imdb</option>
            </select>
            <input type="number" value={s.sort_order} onChange={e => upd(s.id, { sort_order: Number(e.target.value) })} placeholder="Order" className="filter-select" />
          </div>
          <input value={s.url} onChange={e => upd(s.id, { url: e.target.value })} placeholder="Movie URL ({tmdb_id})" className="filter-select" />
          <input value={s.url_tv} onChange={e => upd(s.id, { url_tv: e.target.value })} placeholder="TV URL ({tmdb_id}/{season}/{episode})" className="filter-select" />
          <RowActions enabled={s.enabled} onEnabledChange={v => upd(s.id, { enabled: v })} onSave={() => save(s)} onDelete={() => del(s)}>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={s.is_download} onChange={e => upd(s.id, { is_download: e.target.checked })} /> Download</label>
          </RowActions>
        </div>
      ))}
    </Section>
  );
}

// ============= Ads =============
function AdsTab({ rows, setRows }: { rows: AdRow[]; setRows: (r: AdRow[]) => void }) {
  const add = () => setRows([{ id: `new-${Date.now()}`, slot: "home_top", name: "New Ad", html: "", image_url: "", click_url: "", enabled: true, sort_order: rows.length + 1 }, ...rows]);
  const upd = (id: string, p: Partial<AdRow>) => setRows(rows.map(a => a.id === id ? { ...a, ...p } : a));
  const save = async (a: AdRow) => {
    const isNew = a.id.startsWith("new-");
    const payload = { slot: a.slot, name: a.name, html: a.html || null, image_url: a.image_url || null, click_url: a.click_url || null, enabled: a.enabled, sort_order: a.sort_order };
    if (isNew) {
      const { data, error } = await supabase.from("ads").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setRows(rows.map(x => x.id === a.id ? (data as AdRow) : x));
    } else {
      const { error } = await supabase.from("ads").update(payload).eq("id", a.id);
      if (error) return toast.error(error.message);
    }
    invalidateAdsCache();
    toast.success("Saved");
  };
  const del = async (a: AdRow) => {
    if (!confirm("Delete?")) return;
    if (!a.id.startsWith("new-")) await supabase.from("ads").delete().eq("id", a.id);
    setRows(rows.filter(x => x.id !== a.id));
    invalidateAdsCache();
  };
  return (
    <Section title="Ads Manager" onAdd={add} hint={`Slots: ${AD_SLOTS.join(", ")}`}>
      {rows.map(a => (
        <div key={a.id} className="glass-panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={a.name} onChange={e => upd(a.id, { name: e.target.value })} placeholder="Name" className="filter-select" />
            <select value={a.slot} onChange={e => upd(a.id, { slot: e.target.value })} className="filter-select">
              {AD_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" value={a.sort_order} onChange={e => upd(a.id, { sort_order: Number(e.target.value) })} placeholder="Order" className="filter-select" />
          </div>
          <textarea value={a.html || ""} onChange={e => upd(a.id, { html: e.target.value })} placeholder="HTML / JS ad code" rows={3} className="filter-select font-mono text-xs" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={a.image_url || ""} onChange={e => upd(a.id, { image_url: e.target.value })} placeholder="Image URL" className="filter-select" />
            <input value={a.click_url || ""} onChange={e => upd(a.id, { click_url: e.target.value })} placeholder="Click URL" className="filter-select" />
          </div>
          <RowActions enabled={a.enabled} onEnabledChange={v => upd(a.id, { enabled: v })} onSave={() => save(a)} onDelete={() => del(a)} />
        </div>
      ))}
    </Section>
  );
}

// ============= Custom Downloads =============
function DownloadsTab({ rows, setRows }: { rows: DownloadRow[]; setRows: (r: DownloadRow[]) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState("");
  const searchTmdb = async () => {
    if (!query.trim()) return;
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const j = await r.json();
    setResults((j.results || []).filter((x: any) => x.media_type !== "person").slice(0, 10));
  };
  const addFromTmdb = (item: any) => {
    setRows([{ id: `new-${Date.now()}`, tmdb_id: item.id, media_type: item.media_type === "tv" ? "tv" : "movie", season: null, episode: null, label: `${item.title || item.name} Download`, url: "", quality: "1080p", size: "", sort_order: rows.length + 1, enabled: true }, ...rows]);
    setResults([]); setQuery("");
  };
  const addBlank = () => setRows([{ id: `new-${Date.now()}`, tmdb_id: 0, media_type: "movie", season: null, episode: null, label: "New Download", url: "", quality: "", size: "", sort_order: rows.length + 1, enabled: true }, ...rows]);
  const upd = (id: string, p: Partial<DownloadRow>) => setRows(rows.map(d => d.id === id ? { ...d, ...p } : d));
  const save = async (d: DownloadRow) => {
    const isNew = d.id.startsWith("new-");
    const payload = { tmdb_id: d.tmdb_id, media_type: d.media_type, season: d.season, episode: d.episode, label: d.label, url: d.url, quality: d.quality, size: d.size, sort_order: d.sort_order, enabled: d.enabled };
    if (isNew) {
      const { data, error } = await supabase.from("custom_downloads").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setRows(rows.map(x => x.id === d.id ? (data as DownloadRow) : x));
    } else {
      const { error } = await supabase.from("custom_downloads").update(payload).eq("id", d.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
  };
  const del = async (d: DownloadRow) => {
    if (!confirm("Delete?")) return;
    if (!d.id.startsWith("new-")) await supabase.from("custom_downloads").delete().eq("id", d.id);
    setRows(rows.filter(x => x.id !== d.id));
  };
  const importBulkDownloads = async () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (!lines.length) return toast.error("Paste at least one download entry first.");

    const parsed = lines.map((line, index) => {
      const [tmdbIdRaw = "", mediaType = "movie", seasonRaw = "", episodeRaw = "", label = "", url = "", quality = "", size = ""] = line.split("|");
      const tmdb_id = Number(tmdbIdRaw);
      return {
        tmdb_id: Number.isFinite(tmdb_id) ? tmdb_id : 0,
        media_type: mediaType || "movie",
        season: seasonRaw ? Number(seasonRaw) : null,
        episode: episodeRaw ? Number(episodeRaw) : null,
        label: label || `Download ${index + 1}`,
        url: url.trim(),
        quality: quality || null,
        size: size || null,
        sort_order: rows.length + index + 1,
        enabled: true,
      };
    });

    const invalid = parsed.find(item => !item.tmdb_id || !item.url);
    if (invalid) return toast.error("Each row needs a valid TMDB ID and URL.");

    const { data, error } = await supabase.from("custom_downloads").insert(parsed).select();
    if (error) return toast.error(error.message);

    setRows([...(data as DownloadRow[]), ...rows]);
    setBulkText("");
    toast.success(`Imported ${parsed.length} download link${parsed.length > 1 ? "s" : ""}.`);
  };
  return (
    <Section title="Custom Downloads" onAdd={addBlank}>
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Search TMDB and attach download links</p>
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchTmdb()} placeholder="Search movie / TV..." className="filter-select flex-1" />
          <button onClick={searchTmdb} className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs inline-flex items-center gap-1"><Search className="w-3 h-3" /> Search</button>
        </div>
        {results.length > 0 && (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map(r => (
              <button key={r.id} onClick={() => addFromTmdb(r)} className="w-full text-left flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg">
                {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} className="w-8 h-12 rounded" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.title || r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.media_type} · TMDB {r.id} · {(r.release_date || r.first_air_date || "").split("-")[0]}</p>
                </div>
                <Plus className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bulk add downloads</h3>
            <p className="text-[11px] text-muted-foreground">Format: tmdb_id|movie|season|episode|label|url|quality|size</p>
          </div>
          <button onClick={importBulkDownloads} className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs">Import rows</button>
        </div>
        <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5} placeholder="12345|tv|1|1|S1E1 1080p|https://example.com/file.mp4|1080p|1.2GB" className="filter-select font-mono text-xs" />
      </div>

      {rows.map(d => (
        <div key={d.id} className="glass-panel p-4 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="number" value={d.tmdb_id} onChange={e => upd(d.id, { tmdb_id: Number(e.target.value) })} placeholder="TMDB ID" className="filter-select" />
            <select value={d.media_type} onChange={e => upd(d.id, { media_type: e.target.value })} className="filter-select">
              <option value="movie">movie</option><option value="tv">tv</option>
            </select>
            <input type="number" value={d.season ?? ""} onChange={e => upd(d.id, { season: e.target.value ? Number(e.target.value) : null })} placeholder="Season (TV)" className="filter-select" />
            <input type="number" value={d.episode ?? ""} onChange={e => upd(d.id, { episode: e.target.value ? Number(e.target.value) : null })} placeholder="Episode (TV)" className="filter-select" />
          </div>
          <input value={d.label} onChange={e => upd(d.id, { label: e.target.value })} placeholder="Label (eg: 1080p BluRay)" className="filter-select" />
          <input value={d.url} onChange={e => upd(d.id, { url: e.target.value })} placeholder="Download URL" className="filter-select" />
          <div className="grid grid-cols-2 gap-2">
            <input value={d.quality || ""} onChange={e => upd(d.id, { quality: e.target.value })} placeholder="Quality (1080p)" className="filter-select" />
            <input value={d.size || ""} onChange={e => upd(d.id, { size: e.target.value })} placeholder="Size (2.1GB)" className="filter-select" />
          </div>
          <RowActions enabled={d.enabled} onEnabledChange={v => upd(d.id, { enabled: v })} onSave={() => save(d)} onDelete={() => del(d)} />
        </div>
      ))}
    </Section>
  );
}

// ============= Live TV =============
function LiveTVTab({ rows, setRows }: { rows: ChannelRow[]; setRows: (r: ChannelRow[]) => void }) {
  const [m3u, setM3u] = useState("");
  const add = () => setRows([{ id: `new-${Date.now()}`, name: "New Channel", logo_url: "", stream_url: "", category: "", sort_order: rows.length + 1, enabled: true }, ...rows]);
  const upd = (id: string, p: Partial<ChannelRow>) => setRows(rows.map(c => c.id === id ? { ...c, ...p } : c));
  const save = async (c: ChannelRow) => {
    const isNew = c.id.startsWith("new-");
    const payload = { name: c.name, logo_url: c.logo_url, stream_url: c.stream_url, category: c.category, sort_order: c.sort_order, enabled: c.enabled };
    if (isNew) {
      const { data, error } = await supabase.from("live_tv_channels").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setRows(rows.map(x => x.id === c.id ? (data as ChannelRow) : x));
    } else {
      const { error } = await supabase.from("live_tv_channels").update(payload).eq("id", c.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
  };
  const del = async (c: ChannelRow) => {
    if (!confirm("Delete?")) return;
    if (!c.id.startsWith("new-")) await supabase.from("live_tv_channels").delete().eq("id", c.id);
    setRows(rows.filter(x => x.id !== c.id));
  };

  const importM3U = async () => {
    let text = m3u.trim();
    if (!text) return;
    // If URL given, fetch it
    if (/^https?:\/\//.test(text) && !text.includes("\n")) {
      try { const r = await fetch(text); text = await r.text(); }
      catch { return toast.error("Could not fetch M3U URL (CORS)"); }
    }
    const lines = text.split(/\r?\n/);
    const parsed: Omit<ChannelRow, "id">[] = [];
    let cur: Partial<ChannelRow> = {};
    for (const ln of lines) {
      if (ln.startsWith("#EXTINF")) {
        const nameMatch = ln.split(",").slice(1).join(",").trim();
        const logo = /tvg-logo="([^"]+)"/.exec(ln)?.[1] || "";
        const group = /group-title="([^"]+)"/.exec(ln)?.[1] || "";
        cur = { name: nameMatch || "Channel", logo_url: logo, category: group };
      } else if (ln.trim() && !ln.startsWith("#")) {
        cur.stream_url = ln.trim();
        parsed.push({ name: cur.name || "Channel", logo_url: cur.logo_url || "", stream_url: cur.stream_url, category: cur.category || "", sort_order: 0, enabled: true });
        cur = {};
      }
    }
    if (!parsed.length) return toast.error("No channels parsed");
    const { data, error } = await supabase.from("live_tv_channels").insert(parsed).select();
    if (error) return toast.error(error.message);
    setRows([...((data as ChannelRow[]) || []), ...rows]);
    setM3u("");
    toast.success(`Imported ${parsed.length} channels`);
  };

  return (
    <Section title="Live TV Channels" onAdd={add}>
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground">Paste M3U playlist (text or URL) to bulk import</p>
        <textarea value={m3u} onChange={e => setM3u(e.target.value)} rows={4} placeholder="#EXTM3U ... or https://.../playlist.m3u" className="filter-select font-mono text-xs" />
        <button onClick={importM3U} className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs">Import M3U</button>
      </div>
      {rows.map(c => (
        <div key={c.id} className="glass-panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={c.name} onChange={e => upd(c.id, { name: e.target.value })} placeholder="Channel name" className="filter-select" />
            <input value={c.category || ""} onChange={e => upd(c.id, { category: e.target.value })} placeholder="Category" className="filter-select" />
            <input type="number" value={c.sort_order} onChange={e => upd(c.id, { sort_order: Number(e.target.value) })} placeholder="Order" className="filter-select" />
          </div>
          <input value={c.logo_url || ""} onChange={e => upd(c.id, { logo_url: e.target.value })} placeholder="Logo URL" className="filter-select" />
          <input value={c.stream_url} onChange={e => upd(c.id, { stream_url: e.target.value })} placeholder="Stream URL (.m3u8 or .mp4)" className="filter-select" />
          <RowActions enabled={c.enabled} onEnabledChange={v => upd(c.id, { enabled: v })} onSave={() => save(c)} onDelete={() => del(c)} />
        </div>
      ))}
    </Section>
  );
}

// ============= Custom Pages =============
function PagesTab({ rows, setRows }: { rows: PageRow[]; setRows: (r: PageRow[]) => void }) {
  const add = () => setRows([{ id: `new-${Date.now()}`, slug: "new-page", title: "New Page", content_html: "", meta_description: "", enabled: true }, ...rows]);
  const upd = (id: string, p: Partial<PageRow>) => setRows(rows.map(x => x.id === id ? { ...x, ...p } : x));
  const save = async (p: PageRow) => {
    const isNew = p.id.startsWith("new-");
    const payload = { slug: p.slug, title: p.title, content_html: p.content_html, meta_description: p.meta_description, enabled: p.enabled };
    if (isNew) {
      const { data, error } = await supabase.from("custom_pages").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setRows(rows.map(x => x.id === p.id ? (data as PageRow) : x));
    } else {
      const { error } = await supabase.from("custom_pages").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", p.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
  };
  const del = async (p: PageRow) => {
    if (!confirm("Delete?")) return;
    if (!p.id.startsWith("new-")) await supabase.from("custom_pages").delete().eq("id", p.id);
    setRows(rows.filter(x => x.id !== p.id));
  };
  return (
    <Section title="Custom Pages" onAdd={add} hint='Use shortcodes like [genre id=28 type=movie title="Action"], [trending type=tv], [popular type=movie]'>
      {rows.map(p => (
        <div key={p.id} className="glass-panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={p.title} onChange={e => upd(p.id, { title: e.target.value })} placeholder="Title" className="filter-select" />
            <input value={p.slug} onChange={e => upd(p.id, { slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })} placeholder="slug" className="filter-select" />
          </div>
          <input value={p.meta_description || ""} onChange={e => upd(p.id, { meta_description: e.target.value })} placeholder="Meta description" className="filter-select" />
          <textarea value={p.content_html} onChange={e => upd(p.id, { content_html: e.target.value })} placeholder="HTML content + shortcodes" rows={6} className="filter-select font-mono text-xs" />
          <p className="text-[10px] text-muted-foreground">URL: /page/{p.slug}</p>
          <RowActions enabled={p.enabled} onEnabledChange={v => upd(p.id, { enabled: v })} onSave={() => save(p)} onDelete={() => del(p)} />
        </div>
      ))}
    </Section>
  );
}

// ============= Settings forms =============
function SettingsForm({ group, settings, setSettings, onSave, onSaveOne }: {
  group: typeof SETTING_GROUPS[0];
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
  onSave: () => void;
  onSaveOne: (key: string) => void;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gradient mb-4">{group.title}</h1>
      <div className="space-y-3 max-w-2xl">
        {group.fields.map(f => (
          <div key={f.key} className="glass-panel p-4 space-y-2">
            <label className="text-sm font-medium text-foreground">{f.label}</label>
            {f.type === "textarea" || f.type === "html" || f.type === "css" ? (
              <textarea
                value={settings[f.key] || ""}
                onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                rows={f.type === "css" ? 8 : 4}
                className="filter-select font-mono text-xs"
                placeholder={f.placeholder}
              />
            ) : (
              <input
                value={settings[f.key] || ""}
                onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="filter-select"
              />
            )}
            <button onClick={() => onSaveOne(f.key as string)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <Save className="w-3 h-3" /> Save field
            </button>
          </div>
        ))}
        <button onClick={onSave} className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
          <Save className="w-4 h-4" /> Save all in {group.title}
        </button>
      </div>
    </div>
  );
}

// ============= Password =============
function PasswordTab() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (pw.length < 6) return toast.error("Min 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  };
  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-gradient mb-4">Change Password</h1>
      <div className="glass-panel p-4 space-y-3">
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password (min 6)" className="filter-select" />
        <button onClick={submit} disabled={loading} className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
          <KeyRound className="w-4 h-4" /> {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ============= Helpers =============
function Section({ title, onAdd, hint, children }: { title: string; onAdd?: () => void; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gradient">{title}</h1>
        {onAdd && (
          <button onClick={onAdd} className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function RowActions({ enabled, onEnabledChange, onSave, onDelete, children }: { enabled: boolean; onEnabledChange: (v: boolean) => void; onSave: () => void; onDelete: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm flex-wrap">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={enabled} onChange={e => onEnabledChange(e.target.checked)} /> Enabled
      </label>
      {children}
      <div className="ml-auto flex gap-2">
        <button onClick={onSave} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
        <button onClick={onDelete} className="bg-destructive/20 text-destructive px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
      </div>
    </div>
  );
}
