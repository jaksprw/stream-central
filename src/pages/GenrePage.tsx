import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { discoverByGenre, type Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function GenrePage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Genre";
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [settings] = useSettings();

  const load = useCallback(async (p: number, reset = false) => {
    if (!id || !type) return;
    setLoading(true);
    try {
      const r = await discoverByGenre(type as "movie" | "tv", Number(id), p, settings.language || undefined);
      setItems(prev => reset ? r.results : [...prev, ...r.results]);
      setHasMore(r.page < r.total_pages);
    } finally { setLoading(false); }
  }, [type, id, settings.language]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    load(1, true);
  }, [type, id, load]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const n = page + 1;
    setPage(n);
    load(n);
  }, [page, loading, load]);

  const lastRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-6">{name} - {type === "movie" ? "Movies" : "TV Shows"}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <div key={`${item.id}-${i}`} ref={i === items.length - 1 ? lastRef : undefined}>
            <PostCard item={item} type={type as "movie" | "tv"} />
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
