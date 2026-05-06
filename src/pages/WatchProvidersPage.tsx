import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { img, type Provider } from "@/lib/tmdb";

const API_KEY = "fed86956458f19fb45cdd382b6e6de83";

interface ProviderData {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export default function WatchProvidersPage() {
  const [movieProviders, setMovieProviders] = useState<ProviderData[]>([]);
  const [tvProviders, setTvProviders] = useState<ProviderData[]>([]);
  const [tab, setTab] = useState<"movie" | "tv">("movie");
  const [region, setRegion] = useState("IN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${API_KEY}&watch_region=${region}`).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/watch/providers/tv?api_key=${API_KEY}&watch_region=${region}`).then(r => r.json()),
    ]).then(([m, t]) => {
      setMovieProviders(m.results || []);
      setTvProviders(t.results || []);
    }).finally(() => setLoading(false));
  }, [region]);

  const providers = tab === "movie" ? movieProviders : tvProviders;

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-2">Watch Providers</h1>
      <p className="text-sm text-muted-foreground mb-6">Available streaming services in your region</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("movie")}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === "movie" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            Movies
          </button>
          <button
            onClick={() => setTab("tv")}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === "tv" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            TV Shows
          </button>
        </div>
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
        >
          <option value="IN">India</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="JP">Japan</option>
          <option value="KR">South Korea</option>
          <option value="BR">Brazil</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {providers.map(p => (
            <Link
              key={p.provider_id}
              to={`/provider/${p.provider_id}?type=${tab}&region=${region}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg ring-1 ring-border/40 group-hover:ring-2 group-hover:ring-primary group-hover:shadow-primary/30 group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all">
                <img
                  src={img(p.logo_path, "w185")}
                  alt={p.provider_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center truncate w-full group-hover:text-foreground transition-colors">{p.provider_name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
