import { useEffect, useState, useCallback } from "react";
import PostCard from "@/components/PostCard";
import ContentSlider from "@/components/ContentSlider";
import { getPopular, getTrending, getTopRated, getNowPlaying, getGenres, discoverByGenre, type Movie, type Genre } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Props {
  type: "movie" | "tv";
}

type Tab = "popular" | "trending" | "top_rated" | "now" | "genres";

export default function ArchivePage({ type }: Props) {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<Tab>("popular");
  const [settings] = useSettings();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreSections, setGenreSections] = useState<{ genre: Genre; items: Movie[] }[]>([]);

  const load = useCallback(async (p: number, reset = false) => {
    if (tab === "genres") return;
    setLoading(true);
    try {
      let r;
      if (tab === "popular") r = await getPopular(type, p, settings.language || undefined);
      else if (tab === "trending") r = await getTrending(type, "week");
      else if (tab === "top_rated") r = await getTopRated(type, p);
      else r = await getNowPlaying(type, p);
      setItems(prev => reset ? r.results : [...prev, ...r.results]);
      setHasMore(r.page < r.total_pages);
    } finally { setLoading(false); }
  }, [type, tab, settings.language]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    if (tab !== "genres") load(1, true);
  }, [type, tab, load]);

  // Load all genres + a row each (lazy chunk)
  useEffect(() => {
    if (tab !== "genres") return;
    if (genres.length === 0) {
      getGenres(type).then(r => setGenres(r.genres));
      return;
    }
    setGenreSections([]);
    const lang = settings.language || undefined;
    let cancelled = false;
    (async () => {
      const out: { genre: Genre; items: Movie[] }[] = [];
      for (const g of genres) {
        const r = await discoverByGenre(type, g.id, 1, lang);
        if (cancelled) return;
        if (r.results.length) {
          out.push({ genre: g, items: r.results });
          setGenreSections([...out]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [tab, genres, type, settings.language]);

  const loadMore = useCallback(() => {
    if (loading || tab === "genres") return;
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, loading, load, tab]);

  const lastRef = useInfiniteScroll(loadMore, hasMore, loading);

  const tabs: { id: Tab; label: string }[] = [
    { id: "popular", label: "Popular" },
    { id: "trending", label: "Trending" },
    { id: "top_rated", label: "Top Rated" },
    { id: "now", label: type === "movie" ? "Now Playing" : "Airing Today" },
    { id: "genres", label: "By Genre" },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-4">{type === "movie" ? "Movies" : "TV Shows"}</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto slider-container">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "genres" ? (
        <div className="-mx-4 sm:-mx-8">
          {genreSections.map(s => (
            <ContentSlider
              key={s.genre.id}
              title={s.genre.name}
              items={s.items}
              type={type}
              showMoreLink={`/genre/${type}/${s.genre.id}?name=${encodeURIComponent(s.genre.name)}`}
            />
          ))}
          {genreSections.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
