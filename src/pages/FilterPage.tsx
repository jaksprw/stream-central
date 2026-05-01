import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { discover, getGenres, getWatchProviders, img, type Genre, type Movie, type Provider } from "@/lib/tmdb";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Filter as FilterIcon, X, ChevronDown } from "lucide-react";

const SORTS = [
  { value: "popularity.desc", label: "Popularity ↓" },
  { value: "popularity.asc", label: "Popularity ↑" },
  { value: "vote_average.desc", label: "Rating ↓" },
  { value: "vote_average.asc", label: "Rating ↑" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "primary_release_date.asc", label: "Oldest" },
  { value: "revenue.desc", label: "Revenue ↓" },
];

const LANGUAGES = [
  { code: "", name: "Any" }, { code: "en", name: "English" }, { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" }, { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" }, { code: "bn", name: "Bengali" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese" }, { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }, { code: "de", name: "German" }, { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" }, { code: "pt", name: "Portuguese" }, { code: "tr", name: "Turkish" },
];

const REGIONS = ["IN", "US", "GB", "CA", "AU", "DE", "FR", "JP", "KR", "BR", "MX", "ES", "IT"];

export default function FilterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [type, setType] = useState<"movie" | "tv">((searchParams.get("type") as any) || "movie");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get("g")?.split(",").filter(Boolean).map(Number) || []
  );
  const [selectedProviders, setSelectedProviders] = useState<number[]>(
    searchParams.get("p")?.split(",").filter(Boolean).map(Number) || []
  );
  const [language, setLanguage] = useState(searchParams.get("lang") || "");
  const [region, setRegion] = useState(searchParams.get("r") || "IN");
  const [yearFrom, setYearFrom] = useState(searchParams.get("yf") || "");
  const [yearTo, setYearTo] = useState(searchParams.get("yt") || "");
  const [minRating, setMinRating] = useState(searchParams.get("vg") || "");
  const [sort, setSort] = useState(searchParams.get("s") || "popularity.desc");
  const [showFilters, setShowFilters] = useState(true);

  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load genres + providers when type/region changes
  useEffect(() => {
    getGenres(type).then(r => setGenres(r.genres));
  }, [type]);

  useEffect(() => {
    getWatchProviders(type, region).then(r => {
      const list = (r.results || []) as any[];
      list.sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999));
      setProviders(list.slice(0, 40));
    });
  }, [type, region]);

  const filters = useMemo(() => {
    const f: any = {
      sort_by: sort,
      with_original_language: language || undefined,
      with_genres: selectedGenres.length ? selectedGenres.join(",") : undefined,
      with_watch_providers: selectedProviders.length ? selectedProviders.join("|") : undefined,
      watch_region: selectedProviders.length ? region : undefined,
      "vote_average.gte": minRating ? Number(minRating) : undefined,
      "vote_count.gte": 30,
    };
    if (type === "movie") {
      if (yearFrom) f["primary_release_date.gte"] = `${yearFrom}-01-01`;
      if (yearTo) f["primary_release_date.lte"] = `${yearTo}-12-31`;
    } else {
      if (yearFrom) f["first_air_date.gte"] = `${yearFrom}-01-01`;
      if (yearTo) f["first_air_date.lte"] = `${yearTo}-12-31`;
    }
    return f;
  }, [type, sort, language, selectedGenres, selectedProviders, region, minRating, yearFrom, yearTo]);

  const load = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const r = await discover(type, { ...filters, page: p });
      setItems(prev => reset ? r.results : [...prev, ...r.results]);
      setHasMore(r.page < r.total_pages);
    } finally { setLoading(false); }
  }, [type, filters]);

  // Reset & reload when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
    load(1, true);
    // sync URL
    const sp: Record<string, string> = { type };
    if (selectedGenres.length) sp.g = selectedGenres.join(",");
    if (selectedProviders.length) sp.p = selectedProviders.join(",");
    if (language) sp.lang = language;
    if (region !== "IN") sp.r = region;
    if (yearFrom) sp.yf = yearFrom;
    if (yearTo) sp.yt = yearTo;
    if (minRating) sp.vg = minRating;
    if (sort !== "popularity.desc") sp.s = sort;
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedGenres, selectedProviders, language, region, yearFrom, yearTo, minRating, sort]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const n = page + 1;
    setPage(n);
    load(n);
  }, [page, loading, load]);

  const lastRef = useInfiniteScroll(loadMore, hasMore, loading);

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleProvider = (id: number) => {
    setSelectedProviders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const reset = () => {
    setSelectedGenres([]); setSelectedProviders([]); setLanguage("");
    setYearFrom(""); setYearTo(""); setMinRating(""); setSort("popularity.desc");
  };

  const activeCount =
    selectedGenres.length + selectedProviders.length +
    (language ? 1 : 0) + (yearFrom ? 1 : 0) + (yearTo ? 1 : 0) + (minRating ? 1 : 0);

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-primary" /> Discover
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-xs text-foreground"
        >
          Filters {activeCount > 0 && <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeCount}</span>}
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-4">
        {(["movie", "tv"] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t === "movie" ? "Movies" : "TV Shows"}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 space-y-4">
          {/* Sort + Language + Region + Year + Rating */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Field label="Sort by">
              <select value={sort} onChange={e => setSort(e.target.value)} className="filter-select">
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={language} onChange={e => setLanguage(e.target.value)} className="filter-select">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Region">
              <select value={region} onChange={e => setRegion(e.target.value)} className="filter-select">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Year from">
              <input type="number" min={1900} max={2030} value={yearFrom} onChange={e => setYearFrom(e.target.value)} placeholder="2000" className="filter-select" />
            </Field>
            <Field label="Year to">
              <input type="number" min={1900} max={2030} value={yearTo} onChange={e => setYearTo(e.target.value)} placeholder="2026" className="filter-select" />
            </Field>
            <Field label="Min rating">
              <select value={minRating} onChange={e => setMinRating(e.target.value)} className="filter-select">
                <option value="">Any</option>
                {[5, 6, 7, 7.5, 8, 8.5, 9].map(v => <option key={v} value={v}>{v}+</option>)}
              </select>
            </Field>
          </div>

          {/* Genres */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {genres.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedGenres.includes(g.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Providers */}
          {providers.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Watch Providers ({region})</p>
              <div className="flex flex-wrap gap-2">
                {providers.map(p => (
                  <button
                    key={p.provider_id}
                    onClick={() => toggleProvider(p.provider_id)}
                    title={p.provider_name}
                    className={`relative w-10 h-10 rounded-lg overflow-hidden ring-2 transition-all ${
                      selectedProviders.includes(p.provider_id) ? "ring-primary scale-105" : "ring-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img(p.logo_path, "w92")} alt={p.provider_name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeCount > 0 && (
            <button onClick={reset} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters ({activeCount})
            </button>
          )}
        </div>
      )}

      {/* Results */}
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
      {!loading && !items.length && (
        <p className="text-muted-foreground text-center mt-12">No results match your filters.</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
