import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { getPopular, getTrending, type Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";

interface Props {
  type: "movie" | "tv";
}

export default function ArchivePage({ type }: Props) {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<"popular" | "trending">("popular");
  const [settings] = useSettings();

  const load = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const r = tab === "popular"
        ? await getPopular(type, p, settings.language || undefined)
        : await getTrending(type, "week");
      setItems(prev => reset ? r.results : [...prev, ...r.results]);
      setHasMore(r.page < r.total_pages);
    } finally {
      setLoading(false);
    }
  }, [type, tab, settings.language]);

  useEffect(() => {
    setPage(1);
    load(1, true);
  }, [type, tab, load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-4">{type === "movie" ? "Movies" : "TV Shows"}</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("popular")}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === "popular" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Popular
        </button>
        <button
          onClick={() => setTab("trending")}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === "trending" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Trending
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <PostCard key={item.id} item={item} type={type} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button onClick={loadMore} disabled={loading} className="bg-muted text-foreground px-6 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors disabled:opacity-50">
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
