import { useEffect, useMemo, useState } from "react";
import HeroSlider from "@/components/HeroSlider";
import ContentSlider from "@/components/ContentSlider";
import { getTrending, getPopular, getNowPlaying, getGenres, discoverByGenre, type Movie, type Genre } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import AdSlot from "@/components/AdSlot";
import { uniqueById } from "@/lib/utils";

const POPULAR_GENRE_IDS_MOVIE = [28, 35, 27, 878, 10749, 16, 53, 99, 18, 10751];
const INITIAL_GENRE_LIMIT = 5;

export default function HomePage() {
  const [hero, setHero] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [genreSections, setGenreSections] = useState<{ genre: Genre; items: Movie[] }[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [settings] = useSettings();

  const trendingHighlights = useMemo(() => uniqueById([...trendingMovies, ...trendingTV], undefined), [trendingMovies, trendingTV]);

  useEffect(() => {
    setLoadingSections(true);
    const lang = settings.language || undefined;

    Promise.all([
      getTrending("all", "week").then(r => setHero(r.results.slice(0, 10))),
      getTrending("movie", "week").then(r => setTrendingMovies(r.results)),
      getTrending("tv", "week").then(r => setTrendingTV(r.results)),
      getPopular("movie", 1, lang).then(r => setPopularMovies(r.results)),
      getPopular("tv", 1, lang).then(r => setPopularTV(r.results)),
      getNowPlaying("movie").then(r => setNowPlaying(r.results)),
      getGenres("movie").then(async ({ genres }) => {
        const popularGenres = uniqueById(genres.filter(g => POPULAR_GENRE_IDS_MOVIE.includes(g.id)), "movie");
        const initialGenres = popularGenres.slice(0, INITIAL_GENRE_LIMIT);
        const sections = await Promise.all(initialGenres.map(async genre => {
          const r = await discoverByGenre("movie", genre.id, 1, lang);
          return { genre, items: uniqueById(r.results, "movie") };
        }));
        setGenreSections(sections);

        const remaining = await Promise.all(popularGenres.slice(INITIAL_GENRE_LIMIT).map(async genre => {
          const r = await discoverByGenre("movie", genre.id, 1, lang);
          return { genre, items: uniqueById(r.results, "movie") };
        }));
        setGenreSections(prev => uniqueById([...(prev || []), ...remaining] as any, "movie"));
      })
    ]).finally(() => setLoadingSections(false));
  }, [settings.language]);

  return (
    <div className="pb-20">
      <HeroSlider items={hero} />
      <div className="px-4 sm:px-8"><AdSlot slot="home_top" /></div>
      <ContentSlider title="Trending Now" items={trendingHighlights} loading={loadingSections} showMoreLink="/archive" />
      <ContentSlider title="Trending Movies" items={trendingMovies} type="movie" loading={loadingSections} showMoreLink="/movies" />
      <ContentSlider title="Trending TV Shows" items={trendingTV} type="tv" loading={loadingSections} showMoreLink="/tv" />
      <ContentSlider title="Popular Movies" items={popularMovies} type="movie" loading={loadingSections} showMoreLink="/movies" />
      <div className="px-4 sm:px-8"><AdSlot slot="home_middle" /></div>
      <ContentSlider title="Popular TV Shows" items={popularTV} type="tv" loading={loadingSections} showMoreLink="/tv" />
      <ContentSlider title="Now Playing" items={nowPlaying} type="movie" loading={loadingSections} showMoreLink="/movies" />
      {genreSections.map(s => (
        <ContentSlider
          key={s.genre.id}
          title={s.genre.name}
          items={s.items}
          type="movie"
          loading={loadingSections}
          showMoreLink={`/genre/movie/${s.genre.id}?name=${s.genre.name}`}
        />
      ))}
      <div className="px-4 sm:px-8"><AdSlot slot="home_bottom" /></div>
    </div>
  );
}
