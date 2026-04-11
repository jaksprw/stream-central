const API_KEY = "fed86956458f19fb45cdd382b6e6de83";
const BASE = "https://api.themoviedb.org/3";

export const IMG_BASE = "https://image.tmdb.org/t/p";

export function img(path: string | null | undefined, size = "w500"): string {
  if (!path) return "/placeholder.svg";
  return `${IMG_BASE}/${size}${path}`;
}

export function imgLow(path: string | null | undefined, size = "w200"): string {
  return img(path, size);
}

async function get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: string;
  original_language?: string;
}

export interface MovieDetail extends Movie {
  tagline: string;
  runtime: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  imdb_id?: string;
  status: string;
  revenue: number;
  budget: number;
  spoken_languages: { english_name: string; iso_639_1: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  images?: { logos: { file_path: string; iso_639_1: string | null }[] };
  videos?: { results: Video[] };
  credits?: { cast: Cast[]; crew: Cast[] };
  similar?: { results: Movie[] };
  recommendations?: { results: Movie[] };
  'watch/providers'?: { results: Record<string, { flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[] }> };
  external_ids?: { imdb_id: string; };
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Cast {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  known_for_department?: string;
  job?: string;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: Movie[];
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  also_known_as?: string[];
  images?: { profiles: { file_path: string }[] };
  combined_credits?: { cast: Movie[] };
}

export interface PageResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Trending
export const getTrending = (type: "movie" | "tv" | "all" = "all", time: "day" | "week" = "week") =>
  get<PageResult<Movie>>(`/trending/${type}/${time}`);

// Popular
export const getPopular = (type: "movie" | "tv", page = 1, lang?: string) =>
  get<PageResult<Movie>>(`/${type}/popular`, { page, ...(lang ? { with_original_language: lang } : {}) });

// Top Rated
export const getTopRated = (type: "movie" | "tv", page = 1) =>
  get<PageResult<Movie>>(`/${type}/top_rated`, { page });

// Now Playing / Airing Today
export const getNowPlaying = (type: "movie" | "tv", page = 1) =>
  get<PageResult<Movie>>(type === "movie" ? "/movie/now_playing" : "/tv/airing_today", { page });

// Detail
export const getDetail = (type: "movie" | "tv", id: number) =>
  get<MovieDetail>(`/${type}/${id}`, { append_to_response: "images,videos,credits,similar,recommendations,watch/providers,external_ids" });

// Season detail
export const getSeasonDetail = (tvId: number, seasonNum: number) =>
  get<{ episodes: Episode[] }>(`/tv/${tvId}/season/${seasonNum}`);

// Search
export const search = (query: string, page = 1) =>
  get<PageResult<Movie>>("/search/multi", { query, page });

// Genres
export const getGenres = (type: "movie" | "tv") =>
  get<{ genres: Genre[] }>(`/genre/${type}/list`);

// Discover by genre
export const discoverByGenre = (type: "movie" | "tv", genreId: number, page = 1, lang?: string) =>
  get<PageResult<Movie>>(`/discover/${type}`, { with_genres: genreId, page, sort_by: "popularity.desc", ...(lang ? { with_original_language: lang } : {}) });

// Person detail
export const getPersonDetail = (id: number) =>
  get<Person>(`/person/${id}`, { append_to_response: "images,combined_credits" });

// Search person
export const searchPerson = (query: string, page = 1) =>
  get<PageResult<Person>>("/search/person", { query, page });

// Popular persons
export const getPopularPersons = (page = 1) =>
  get<PageResult<Person>>("/person/popular", { page });

// Collection
export const getCollection = (id: number) =>
  get<{ id: number; name: string; overview: string; parts: Movie[] }>(`/collection/${id}`);

// Watch providers
export const getWatchProviders = (type: "movie" | "tv") =>
  get<{ results: Provider[] }>(`/watch/providers/${type}`, { watch_region: "US" });
