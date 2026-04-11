import { useState, useEffect, useRef } from "react";
import { useSettings, getProfile, saveProfile, getWatchlist, getLiked, type UserProfile } from "@/lib/store";
import { getDetail, img, type MovieDetail } from "@/lib/tmdb";
import PostCard from "@/components/PostCard";
import { User, Globe, Zap, Heart, Bookmark, Edit3, Camera } from "lucide-react";

const languages = [
  { code: "", name: "All Languages" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
];

type Tab = "settings" | "watchlist" | "liked";

export default function ProfilePage() {
  const [settings, updateSettings] = useSettings();
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [watchlistItems, setWatchlistItems] = useState<{ detail: MovieDetail; type: "movie" | "tv" }[]>([]);
  const [likedItems, setLikedItems] = useState<{ detail: MovieDetail; type: "movie" | "tv" }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "watchlist") {
      setLoading(true);
      const list = getWatchlist();
      if (!list.length) { setLoading(false); return; }
      Promise.all(list.map(async i => {
        const detail = await getDetail(i.type, i.id);
        return { detail, type: i.type };
      })).then(setWatchlistItems).finally(() => setLoading(false));
    } else if (activeTab === "liked") {
      setLoading(true);
      const list = getLiked();
      if (!list.length) { setLoading(false); return; }
      Promise.all(list.map(async i => {
        const detail = await getDetail(i.type, i.id);
        return { detail, type: i.type };
      })).then(setLikedItems).finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newProfile = { ...profile, avatar: reader.result as string };
      setProfile(newProfile);
      saveProfile(newProfile);
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = () => {
    const newProfile = { ...profile, name: nameInput.trim() || "User" };
    setProfile(newProfile);
    saveProfile(newProfile);
    setEditingName(false);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "settings", label: "Settings", icon: <User className="w-4 h-4" /> },
    { key: "watchlist", label: "Watchlist", icon: <Bookmark className="w-4 h-4" /> },
    { key: "liked", label: "Liked", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 pb-20 max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-5 h-5 text-foreground" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameSave()}
                className="bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button onClick={handleNameSave} className="text-xs text-primary hover:text-primary/80">Save</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
              <button onClick={() => { setEditingName(true); setNameInput(profile.name); }}>
                <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {getWatchlist().length} Watchlist · {getLiked().length} Liked
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Original Language Filter</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Filter content by original language across the entire app.</p>
            <select
              value={settings.language}
              onChange={e => updateSettings({ ...settings, language: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Data Saver</h2>
                  <p className="text-xs text-muted-foreground">Load lower resolution images to save data.</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ ...settings, dataSaver: !settings.dataSaver })}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.dataSaver ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${settings.dataSaver ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watchlist tab */}
      {activeTab === "watchlist" && (
        <div>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : watchlistItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Your watchlist is empty.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchlistItems.map(i => (
                <PostCard key={i.detail.id} item={i.detail as any} type={i.type} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liked tab */}
      {activeTab === "liked" && (
        <div>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : likedItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No liked items yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {likedItems.map(i => (
                <PostCard key={i.detail.id} item={i.detail as any} type={i.type} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
