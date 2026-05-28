import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { Tv, X, Search } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  logo_url: string | null;
  stream_url: string;
  category: string | null;
}

export default function LiveTVPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState<Channel | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    supabase.from("live_tv_channels").select("*").eq("enabled", true).order("sort_order").then(({ data }) => {
      setChannels((data || []) as Channel[]);
    });
  }, []);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    const video = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    const url = active.stream_url;
    const isHls = /\.m3u8(\?|$)/i.test(url);
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = url;
    }
    video.play().catch(() => {});
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [active]);

  const categories = Array.from(new Set(channels.map(c => c.category).filter(Boolean))) as string[];
  const filtered = channels.filter(c =>
    (!query || c.name.toLowerCase().includes(query.toLowerCase())) &&
    (!category || c.category === category)
  );

  return (
    <div className="px-4 sm:px-8 py-6 pb-32">
      <h1 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Tv className="w-6 h-6 text-primary" /> Live TV
      </h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search channels..." className="filter-select pl-9 w-full" />
        </div>
        {categories.length > 0 && (
          <select value={category} onChange={e => setCategory(e.target.value)} className="filter-select max-w-xs">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {!channels.length && (
        <p className="text-muted-foreground text-sm text-center py-12">No live channels yet. Admin can add via Admin → Live TV.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(c => (
          <button key={c.id} onClick={() => setActive(c)} className={`glass-panel p-3 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all ${active?.id === c.id ? "ring-2 ring-primary" : ""}`}>
            <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain" loading="lazy" /> : <Tv className="w-8 h-8 text-muted-foreground" />}
            </div>
            <p className="text-xs text-foreground text-center truncate w-full">{c.name}</p>
            {c.category && <span className="text-[9px] text-muted-foreground">{c.category}</span>}
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel !rounded-t-2xl !rounded-b-none border-b-0 p-3 md:bottom-0 md:left-auto md:right-4 md:w-96">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {active.logo_url && <img src={active.logo_url} alt={active.name} className="w-8 h-8 rounded object-contain bg-muted" />}
              <p className="text-sm font-medium text-foreground truncate">{active.name}</p>
            </div>
            <button onClick={() => setActive(null)} className="p-1 hover:bg-muted rounded-full" aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <video ref={videoRef} controls autoPlay playsInline className="w-full aspect-video rounded-lg bg-black" />
        </div>
      )}
    </div>
  );
}
