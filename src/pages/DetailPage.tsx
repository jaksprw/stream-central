import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getDetail, getSeasonDetail, img, imgLow, type MovieDetail, type Episode } from "@/lib/tmdb";
import { toggleWatchlist, isInWatchlist, useSettings } from "@/lib/store";
import ContentSlider from "@/components/ContentSlider";
import { Play, Heart, Share2, Star, Clock, Calendar, ChevronDown, ExternalLink } from "lucide-react";

export default function DetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(1);
  const [settings] = useSettings();

  const mediaType = type as "movie" | "tv";

  useEffect(() => {
    if (!id) return;
    getDetail(mediaType, Number(id)).then(d => {
      setDetail(d);
      setInWatchlist(isInWatchlist(d.id, mediaType));
      if (mediaType === "tv" && d.seasons?.length) {
        const first = d.seasons.find(s => s.season_number > 0)?.season_number || 1;
        setSelectedSeason(first);
        setOpenSeason(first);
        getSeasonDetail(d.id, first).then(s => setEpisodes(s.episodes));
      }
    });
    window.scrollTo(0, 0);
  }, [id, type]);

  const loadSeason = (num: number) => {
    if (!detail) return;
    setSelectedSeason(num);
    setOpenSeason(openSeason === num ? null : num);
    getSeasonDetail(detail.id, num).then(s => setEpisodes(s.episodes));
  };

  const handleWatchlist = () => {
    if (!detail) return;
    const added = toggleWatchlist(detail.id, mediaType);
    setInWatchlist(added);
  };

  const handleShare = () => {
    navigator.share?.({ title: detail?.title || detail?.name, url: window.location.href })
      .catch(() => navigator.clipboard.writeText(window.location.href));
  };

  if (!detail) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const title = detail.title || detail.name || "";
  const bgSrc = settings.dataSaver ? img(detail.backdrop_path, "w780") : img(detail.backdrop_path, "original");
  const logo = detail.images?.logos?.find(l => l.iso_639_1 === "en" || !l.iso_639_1)?.file_path;
  const trailer = detail.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
  const trailers = detail.videos?.results?.filter(v => v.site === "YouTube") || [];
  const cast = detail.credits?.cast?.slice(0, 20) || [];
  const similar = detail.similar?.results || [];
  const recommendations = detail.recommendations?.results || [];
  const imdbId = detail.imdb_id || detail.external_ids?.imdb_id;

  return (
    <div className="pb-20">
      {/* Hero backdrop */}
      <div className="relative w-full aspect-video max-h-[70vh]">
        <img src={bgSrc} alt={title} className="w-full h-full object-cover" />
        <div className="hero-gradient-overlay absolute inset-0" />
        {/* Poster + Logo */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex items-end gap-4">
          <img src={img(detail.poster_path, "w342")} alt={title} className="hidden sm:block w-28 md:w-36 rounded-lg shadow-lg -mb-12 relative z-10" />
          <div className="flex-1 mb-2">
            {logo ? (
              <img src={img(logo, "w300")} alt={title} className="max-w-[150px] h-auto mb-2" />
            ) : (
              <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-1">{title}</h1>
            )}
            {detail.tagline && <p className="text-muted-foreground text-sm italic">{detail.tagline}</p>}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-4 sm:px-8 mt-4 sm:mt-16">
        <h1 className="text-xl font-bold text-foreground mb-3">{title}</h1>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {trailer && (
            <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Play className="w-4 h-4" /> Watch Trailer
            </a>
          )}
          <Link to={`/watch/${mediaType}/${detail.id}`} className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
            <Play className="w-4 h-4" /> Watch Now
          </Link>
          <button onClick={handleWatchlist} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inWatchlist ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <Heart className={`w-4 h-4 ${inWatchlist ? "fill-primary" : ""}`} /> {inWatchlist ? "In Watchlist" : "Watchlist"}
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm hover:text-foreground transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-foreground text-sm leading-relaxed mb-4">{detail.overview}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {detail.vote_average > 0 && (
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" />{detail.vote_average.toFixed(1)}</span>
              )}
              {detail.runtime > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{detail.runtime} min</span>}
              {(detail.release_date || detail.first_air_date) && (
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{(detail.release_date || detail.first_air_date)?.split("-")[0]}</span>
              )}
            </div>
          </div>
          <div className="text-sm space-y-2">
            {detail.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.genres.map(g => (
                  <Link key={g.id} to={`/genre/${mediaType}/${g.id}?name=${g.name}`} className="bg-muted px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
            {detail.spoken_languages?.length > 0 && (
              <p className="text-muted-foreground">Language: {detail.spoken_languages.map(l => l.english_name).join(", ")}</p>
            )}
            {detail.status && <p className="text-muted-foreground">Status: {detail.status}</p>}
          </div>
        </div>

        {/* Anchors */}
        <div className="flex gap-3 mb-8 overflow-x-auto slider-container text-sm">
          {cast.length > 0 && <a href="#cast" className="text-primary hover:text-primary/80 whitespace-nowrap">Cast</a>}
          {mediaType === "tv" && <a href="#seasons" className="text-primary hover:text-primary/80 whitespace-nowrap">Seasons</a>}
          {trailers.length > 0 && <a href="#trailers" className="text-primary hover:text-primary/80 whitespace-nowrap">Trailers</a>}
          {similar.length > 0 && <a href="#related" className="text-primary hover:text-primary/80 whitespace-nowrap">Related</a>}
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section id="cast" className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cast</h2>
            <div className="flex gap-3 overflow-x-auto slider-container pb-2">
              {cast.map(c => (
                <Link key={c.id} to={`/actor/${c.id}`} className="flex-shrink-0 w-20 text-center group">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-muted">
                    <img src={img(c.profile_path, "w185")} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <p className="text-xs text-foreground mt-1 truncate group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Seasons & Episodes (TV) */}
        {mediaType === "tv" && detail.seasons && (
          <section id="seasons" className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Seasons & Episodes</h2>
            <div className="space-y-2">
              {detail.seasons.filter(s => s.season_number > 0).map(season => (
                <div key={season.id} className="bg-card rounded-lg overflow-hidden">
                  <button
                    onClick={() => loadSeason(season.season_number)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span>{season.name} ({season.episode_count} episodes)</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSeason === season.season_number ? "rotate-180" : ""}`} />
                  </button>
                  {openSeason === season.season_number && selectedSeason === season.season_number && (
                    <div className="px-4 pb-3 space-y-2">
                      {episodes.map(ep => (
                        <Link
                          key={ep.id}
                          to={`/watch/tv/${detail.id}?s=${ep.season_number}&e=${ep.episode_number}`}
                          className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-28 aspect-video rounded overflow-hidden bg-muted flex-shrink-0">
                            <img src={img(ep.still_path, "w300")} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              E{ep.episode_number}. {ep.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ep.overview}</p>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              {ep.runtime && <span>{ep.runtime}min</span>}
                              {ep.vote_average > 0 && <span>⭐ {ep.vote_average.toFixed(1)}</span>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trailers */}
        {trailers.length > 0 && (
          <section id="trailers" className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Trailers & Videos</h2>
            <div className="flex gap-3 overflow-x-auto slider-container pb-2">
              {trailers.slice(0, 6).map(v => (
                <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noopener" className="flex-shrink-0 w-64 group">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                    <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/30 group-hover:bg-background/10 transition-colors">
                      <Play className="w-10 h-10 text-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{v.name}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {recommendations.length > 0 && (
          <section id="related">
            <ContentSlider title="Recommended" items={recommendations} type={mediaType} />
          </section>
        )}
        {similar.length > 0 && (
          <ContentSlider title="Similar" items={similar} type={mediaType} />
        )}
      </div>
    </div>
  );
}
