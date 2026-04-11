import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { search, type Movie } from "@/lib/tmdb";

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

  const loadMore = () => {
    const n = page + 1;
    setPage(n);
    search(q, n).then(r => {
      setResults(prev => [...prev, ...r.results.filter((i: any) => i.media_type !== "person")]);
      setHasMore(r.page < r.total_pages);
    });
  };

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <form onSubmit={handleSearch} className="mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & TV shows..."
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </form>
      {loading ? (
        <p className="text-muted-foreground text-center">Searching...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map(item => (
              <PostCard key={item.id} item={item} />
            ))}
          </div>
          {!results.length && q && <p className="text-muted-foreground text-center mt-8">No results found.</p>}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button onClick={loadMore} className="bg-muted text-foreground px-6 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors">Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
