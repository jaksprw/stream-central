import { useEffect, useState, useCallback } from "react";
import PostCard from "@/components/PostCard";
import { getPopular, getTrending, type Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

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
    setItems([]);
    load(1, true);
  }, [type, tab, load]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, loading, load]);

  const lastRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-4">{type === "movie" ? "Movies" : "TV Shows"}</h1>
      <div className="flex gap-2 mb-6">
        {(["popular", "trending"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <div key={`${item.id}-${i}`} ref={i === items.length - 1 ? lastRef : undefined}>
            <PostCard item={item} type={type} />
          </div>
        ))}
      </div>
      {loading && (
        <div className="flex justify-center mt-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
