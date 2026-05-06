import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { invalidateAdsCache, AD_SLOTS } from "@/lib/ads";
import { invalidateSiteSettings } from "@/lib/siteSettings";
import { Plus, Trash2, Save, LogOut, Server as ServerIcon, Megaphone, Settings as SettingsIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface ServerRow { id: string; name: string; type: string; url: string; url_tv: string; is_download: boolean; enabled: boolean; sort_order: number }
interface AdRow { id: string; slot: string; name: string; html: string | null; image_url: string | null; click_url: string | null; enabled: boolean; sort_order: number }
interface SettingRow { key: string; value: string | null }

const SETTING_KEYS = ["site_title", "site_logo", "telegram_url", "header_html", "footer_html"];

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"servers" | "ads" | "settings">("servers");
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("servers").select("*").order("sort_order").then(({ data }) => setServers((data || []) as ServerRow[]));
    supabase.from("ads").select("*").order("sort_order").then(({ data }) => setAds((data || []) as AdRow[]));
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

  // --- Servers ---
  const addServer = () => setServers([{ id: `new-${Date.now()}`, name: "New Server", type: "tmdb", url: "", url_tv: "", is_download: false, enabled: true, sort_order: servers.length + 1 }, ...servers]);
  const updateServer = (id: string, patch: Partial<ServerRow>) => setServers(servers.map(s => s.id === id ? { ...s, ...patch } : s));
  const saveServer = async (s: ServerRow) => {
    const isNew = s.id.startsWith("new-");
    const payload = { name: s.name, type: s.type, url: s.url, url_tv: s.url_tv, is_download: s.is_download, enabled: s.enabled, sort_order: s.sort_order };
    if (isNew) {
      const { data, error } = await supabase.from("servers").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setServers(servers.map(x => x.id === s.id ? (data as ServerRow) : x));
    } else {
      const { error } = await supabase.from("servers").update(payload).eq("id", s.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
  };
  const deleteServer = async (s: ServerRow) => {
    if (!confirm("Delete server?")) return;
    if (!s.id.startsWith("new-")) await supabase.from("servers").delete().eq("id", s.id);
    setServers(servers.filter(x => x.id !== s.id));
  };

  // --- Ads ---
  const addAd = () => setAds([{ id: `new-${Date.now()}`, slot: "home_top", name: "New Ad", html: "", image_url: "", click_url: "", enabled: true, sort_order: ads.length + 1 }, ...ads]);
  const updateAd = (id: string, patch: Partial<AdRow>) => setAds(ads.map(a => a.id === id ? { ...a, ...patch } : a));
  const saveAd = async (a: AdRow) => {
    const isNew = a.id.startsWith("new-");
    const payload = { slot: a.slot, name: a.name, html: a.html || null, image_url: a.image_url || null, click_url: a.click_url || null, enabled: a.enabled, sort_order: a.sort_order };
    if (isNew) {
      const { data, error } = await supabase.from("ads").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setAds(ads.map(x => x.id === a.id ? (data as AdRow) : x));
    } else {
      const { error } = await supabase.from("ads").update(payload).eq("id", a.id);
      if (error) return toast.error(error.message);
    }
    invalidateAdsCache();
    toast.success("Saved");
  };
  const deleteAd = async (a: AdRow) => {
    if (!confirm("Delete ad?")) return;
    if (!a.id.startsWith("new-")) await supabase.from("ads").delete().eq("id", a.id);
    setAds(ads.filter(x => x.id !== a.id));
    invalidateAdsCache();
  };

  // --- Settings ---
  const saveSetting = async (key: string) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value: settings[key] || "" });
    if (error) return toast.error(error.message);
    invalidateSiteSettings();
    toast.success(`${key} saved`);
  };

  // --- Password ---
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Password updated");
  };

  const tabs = [
    { id: "servers" as const, label: "Servers", icon: ServerIcon, count: servers.length },
    { id: "ads" as const, label: "Ads", icon: Megaphone, count: ads.length },
    { id: "settings" as const, label: "Settings", icon: SettingsIcon, count: 0 },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" /> {t.label} {t.count > 0 && <span className="text-xs bg-muted px-1.5 rounded">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "servers" && (
        <div className="space-y-3">
          <button onClick={addServer} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Server
          </button>
          {servers.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={s.name} onChange={e => updateServer(s.id, { name: e.target.value })} placeholder="Name" className="filter-select" />
                <select value={s.type} onChange={e => updateServer(s.id, { type: e.target.value })} className="filter-select">
                  <option value="tmdb">tmdb</option>
                  <option value="imdb">imdb</option>
                </select>
                <input type="number" value={s.sort_order} onChange={e => updateServer(s.id, { sort_order: Number(e.target.value) })} placeholder="Order" className="filter-select" />
              </div>
              <input value={s.url} onChange={e => updateServer(s.id, { url: e.target.value })} placeholder="Movie URL (with {tmdb_id})" className="filter-select" />
              <input value={s.url_tv} onChange={e => updateServer(s.id, { url_tv: e.target.value })} placeholder="TV URL (with {tmdb_id}/{season}/{episode})" className="filter-select" />
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={s.enabled} onChange={e => updateServer(s.id, { enabled: e.target.checked })} /> Enabled</label>
                <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={s.is_download} onChange={e => updateServer(s.id, { is_download: e.target.checked })} /> Download</label>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => saveServer(s)} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs hover:bg-primary/90"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => deleteServer(s)} className="inline-flex items-center gap-1 bg-destructive/20 text-destructive px-3 py-1.5 rounded-md text-xs hover:bg-destructive/30"><Trash2 className="w-3 h-3" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ads" && (
        <div className="space-y-3">
          <button onClick={addAd} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Ad
          </button>
          <p className="text-xs text-muted-foreground">Available slots: {AD_SLOTS.join(", ")}</p>
          {ads.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={a.name} onChange={e => updateAd(a.id, { name: e.target.value })} placeholder="Name" className="filter-select" />
                <select value={a.slot} onChange={e => updateAd(a.id, { slot: e.target.value })} className="filter-select">
                  {AD_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={a.sort_order} onChange={e => updateAd(a.id, { sort_order: Number(e.target.value) })} placeholder="Order" className="filter-select" />
              </div>
              <textarea value={a.html || ""} onChange={e => updateAd(a.id, { html: e.target.value })} placeholder="Ad HTML / JS code (banner script etc.)" rows={3} className="filter-select font-mono text-xs" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={a.image_url || ""} onChange={e => updateAd(a.id, { image_url: e.target.value })} placeholder="Image URL (alternative)" className="filter-select" />
                <input value={a.click_url || ""} onChange={e => updateAd(a.id, { click_url: e.target.value })} placeholder="Click URL" className="filter-select" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={a.enabled} onChange={e => updateAd(a.id, { enabled: e.target.checked })} /> Enabled</label>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => saveAd(a)} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs hover:bg-primary/90"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => deleteAd(a)} className="inline-flex items-center gap-1 bg-destructive/20 text-destructive px-3 py-1.5 rounded-md text-xs hover:bg-destructive/30"><Trash2 className="w-3 h-3" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-3 max-w-xl">
          {SETTING_KEYS.map(k => (
            <div key={k} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">{k.replace(/_/g, " ")}</label>
              {k.endsWith("_html") ? (
                <textarea value={settings[k] || ""} onChange={e => setSettings({ ...settings, [k]: e.target.value })} rows={4} className="filter-select font-mono text-xs" placeholder={k === "header_html" ? "Analytics, meta, schema scripts..." : "Footer copyright, links HTML..."} />
              ) : (
                <input value={settings[k] || ""} onChange={e => setSettings({ ...settings, [k]: e.target.value })} className="filter-select" placeholder={k === "site_logo" ? "https://... (image URL)" : k === "telegram_url" ? "https://t.me/yourchannel" : ""} />
              )}
              <button onClick={() => saveSetting(k)} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs hover:bg-primary/90"><Save className="w-3 h-3" /> Save</button>
            </div>
          ))}

          {/* Change password */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="filter-select" />
            <button onClick={changePassword} disabled={pwLoading} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs hover:bg-primary/90 disabled:opacity-50">
              <Save className="w-3 h-3" /> {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </div>

          <Link to="/" className="block text-xs text-primary hover:underline pt-4">← Back to site</Link>
        </div>
      )}
    </div>
  );
}
