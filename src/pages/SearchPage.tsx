import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { search, type Movie } from "@/lib/tmdb";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setResults([]);
    search(q, 1).then(r => {
      setResults(r.results.filter((i: any) => i.media_type !== "person"));
      setHasMore(r.page < r.total_pages);
      setPage(1);
    }).finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  const loadMore = useCallback(() => {
    if (loading || !q) return;
    const n = page + 1;
    setPage(n);
    search(q, n).then(r => {
      setResults(prev => [...prev, ...r.results.filter((i: any) => i.media_type !== "person")]);
      setHasMore(r.page < r.total_pages);
    });
  }, [page, loading, q]);

  const lastRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <form onSubmit={handleSearch} className="mb-6 relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & TV shows..."
          className="w-full bg-muted border border-border rounded-xl pl-12 pr-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </form>
      {loading && !results.length ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {results.map((item, i) => (
              <div key={`${item.id}-${i}`} ref={i === results.length - 1 ? lastRef : undefined}>
                <PostCard item={item} />
              </div>
            ))}
          </div>
          {!results.length && q && <p className="text-muted-foreground text-center mt-12">No results found for "{q}"</p>}
        </>
      )}
    </div>
  );
}
