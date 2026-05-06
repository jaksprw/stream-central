import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { discover, getWatchProviders, img, type Movie, type Provider } from "@/lib/tmdb";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Film, Tv } from "lucide-react";

export default function ProviderArchivePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get("region") || "IN";
  const type = (searchParams.get("type") as "movie" | "tv") || "movie";

  const [provider, setProvider] = useState<Provider | null>(null);
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWatchProviders(type, region).then(r => {
      const found = (r.results as unknown as Provider[]).find((p) => String(p.provider_id) === id);
      if (found) setProvider(found);
    });
  }, [id, type, region]);

  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [id, type, region]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    discover(type, {
      with_watch_providers: id,
      watch_region: region,
      sort_by: "popularity.desc",
      page,
    }).then(r => {
      setItems(prev => page === 1 ? r.results : [...prev, ...r.results]);
      setTotalPages(r.total_pages);
    }).finally(() => setLoading(false));
  }, [id, type, region, page]);

  const sentinelRef = useInfiniteScroll({
    hasMore: page < totalPages && !loading,
    onLoadMore: () => setPage(p => p + 1),
  });

  const setParam = (k: string, v: string) => {
    const sp = new URLSearchParams(searchParams);
    sp.set(k, v);
    setSearchParams(sp);
  };

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {provider && (
          <img src={img(provider.logo_path, "w185")} alt={provider.provider_name} className="w-16 h-16 rounded-2xl shadow-lg" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {provider?.provider_name || "Provider"}
          </h1>
          <p className="text-xs text-muted-foreground">Available titles · {region}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setParam("type", "movie")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${type === "movie" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Film className="w-4 h-4" /> Movies
        </button>
        <button
          onClick={() => setParam("type", "tv")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${type === "tv" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Tv className="w-4 h-4" /> TV Shows
        </button>
        <select value={region} onChange={e => setParam("region", e.target.value)} className="bg-muted border border-border rounded-full px-3 py-1.5 text-sm text-foreground outline-none ml-auto">
          {["IN","US","GB","CA","AU","DE","FR","JP","KR","BR"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <AdSlot slot="archive_top" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.map((m, i) => <PostCard key={`${m.id}-${i}`} item={m} type={type} />)}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">No titles found.</p>
      )}
      <div ref={sentinelRef} className="h-12" />
    </div>
  );
}
