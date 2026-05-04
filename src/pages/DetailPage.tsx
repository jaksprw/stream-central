import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getDetail, getSeasonDetail, img, imgLow, type MovieDetail, type Episode } from "@/lib/tmdb";
import { toggleWatchlist, isInWatchlist, toggleLiked, isLiked, useSettings } from "@/lib/store";
import ContentSlider from "@/components/ContentSlider";
import { Play, Heart, Share2, Star, Clock, Calendar, ChevronDown, Bookmark, ThumbsUp, Info } from "lucide-react";

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const mediaType = location.pathname.startsWith("/tv") ? "tv" : "movie" as "movie" | "tv";
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLikedState] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(1);
  const [settings] = useSettings();
  const [showFullOverview, setShowFullOverview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDetail(null);
    getDetail(mediaType, Number(id)).then(d => {
      setDetail(d);
      setInWatchlist(isInWatchlist(d.id, mediaType));
      setLikedState(isLiked(d.id, mediaType));
      if (mediaType === "tv" && d.seasons?.length) {
        const first = d.seasons.find(s => s.season_number > 0)?.season_number || 1;
        setSelectedSeason(first);
        setOpenSeason(first);
        getSeasonDetail(d.id, first).then(s => setEpisodes(s.episodes));
      }
    });
    window.scrollTo(0, 0);
  }, [id, mediaType]);

  const loadSeason = (num: number) => {
    if (!detail) return;
    setSelectedSeason(num);
    setOpenSeason(openSeason === num ? null : num);
    getSeasonDetail(detail.id, num).then(s => setEpisodes(s.episodes));
  };

  const handleWatchlist = () => {
    if (!detail) return;
    setInWatchlist(toggleWatchlist(detail.id, mediaType));
  };

  const handleLike = () => {
    if (!detail) return;
    setLikedState(toggleLiked(detail.id, mediaType));
  };

  const handleShare = async () => {
    const shareData = { title: detail?.title || detail?.name || "Watch", text: detail?.overview || "", url: window.location.href };
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share(shareData);
        return;
      }
    } catch { /* user cancelled or unsupported */ }
    try {
      await navigator.clipboard.writeText(window.location.href);
      const { toast } = await import("sonner");
      toast.success("Link copied to clipboard");
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  };

  if (!detail) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const title = detail.title || detail.name || "";
  const bgSrc = settings.dataSaver ? img(detail.backdrop_path, "w780") : img(detail.backdrop_path, "original");
  const logo = detail.images?.logos?.find(l => l.iso_639_1 === "en" || !l.iso_639_1)?.file_path;
  const trailer = detail.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
  const trailers = detail.videos?.results?.filter(v => v.site === "YouTube") || [];
  const cast = detail.credits?.cast?.slice(0, 20) || [];
  const directors = detail.credits?.crew?.filter(c => c.job === "Director") || [];
  const similar = detail.similar?.results || [];
  const recommendations = detail.recommendations?.results || [];
  const year = (detail.release_date || detail.first_air_date)?.split("-")[0];

  return (
    <div className="pb-20">
      {/* Hero backdrop - full width, video aspect ratio */}
      <div className="relative w-full aspect-video max-h-[75vh]">
        <img src={bgSrc} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Content overlay - desktop/tablet only */}
        <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12">
          <div className="flex items-end gap-4 sm:gap-6">
            {/* Poster */}
            <img
              src={img(detail.poster_path, "w342")}
              alt={title}
              className="w-28 md:w-36 lg:w-44 rounded-xl shadow-2xl -mb-16 relative z-10 border border-border/20"
            />
            <div className="flex-1 mb-2">
              {logo ? (
                <img src={img(logo, "w300")} alt={title} className="max-w-[150px] h-auto mb-3 drop-shadow-lg" />
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 drop-shadow-lg">{title}</h1>
              )}
              {detail.tagline && (
                <p className="text-muted-foreground text-sm italic mb-3">{detail.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                {detail.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500 font-medium">
                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                    {detail.vote_average.toFixed(1)}
                  </span>
                )}
                {year && <span>{year}</span>}
                {detail.runtime > 0 && <span>{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m</span>}
                {detail.number_of_seasons && <span>{detail.number_of_seasons} Seasons</span>}
                {detail.status && (
                  <span className="bg-muted/80 px-2 py-0.5 rounded text-xs">{detail.status}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-8 md:px-12 mt-4 sm:mt-20">
        {/* Mobile poster + logo/title side-by-side */}
        <div className="sm:hidden flex items-start gap-3 mb-4 -mt-20 relative z-10">
          <img src={img(detail.poster_path, "w185")} alt={title} className="w-24 rounded-lg shadow-2xl border border-border/20 flex-shrink-0" />
          <div className="flex-1 min-w-0 pt-2">
            {logo ? (
              <img src={img(logo, "w300")} alt={title} className="max-w-[140px] h-auto mb-2 drop-shadow-lg" />
            ) : (
              <h1 className="text-lg font-bold text-foreground line-clamp-2">{title}</h1>
            )}
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              {detail.vote_average > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-500">
                  <Star className="w-3 h-3 fill-yellow-500" />{detail.vote_average.toFixed(1)}
                </span>
              )}
              {year && <span>{year}</span>}
              {detail.runtime > 0 && <span>{detail.runtime}min</span>}
              {detail.number_of_seasons && <span>{detail.number_of_seasons} Seasons</span>}
            </div>
          </div>
        </div>

        {/* Action buttons - icon only */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            to={`/watch/${mediaType}/${detail.id}`}
            aria-label="Watch now"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Play className="w-5 h-5 fill-current" />
          </Link>
          {trailer && (
            <a
              href={`https://www.youtube.com/watch?v=${trailer.key}`}
              target="_blank"
              rel="noopener"
              aria-label="Trailer"
              className="inline-flex items-center justify-center bg-secondary text-secondary-foreground p-2.5 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Play className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={handleWatchlist}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className={`inline-flex items-center justify-center p-2.5 rounded-lg transition-colors ${
              inWatchlist ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`w-5 h-5 ${inWatchlist ? "fill-primary" : ""}`} />
          </button>
          <button
            onClick={handleLike}
            aria-label={liked ? "Unlike" : "Like"}
            className={`inline-flex items-center justify-center p-2.5 rounded-lg transition-colors ${
              liked ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share"
            className="inline-flex items-center justify-center bg-muted text-muted-foreground p-2.5 rounded-lg hover:text-foreground transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Overview */}
        <div className="mb-6">
          <p className={`text-foreground/90 text-sm leading-relaxed ${!showFullOverview ? "line-clamp-3" : ""}`}>
            {detail.overview}
          </p>
          {detail.overview && detail.overview.length > 200 && (
            <button onClick={() => setShowFullOverview(!showFullOverview)} className="text-primary text-xs mt-1 hover:text-primary/80">
              {showFullOverview ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3 text-sm">
            {detail.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.genres.map(g => (
                  <Link
                    key={g.id}
                    to={`/genre/${mediaType}/${g.id}?name=${g.name}`}
                    className="bg-muted hover:bg-muted/80 px-3 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
            {directors.length > 0 && (
              <p className="text-muted-foreground">
                <span className="text-foreground/70">Director:</span> {directors.map(d => d.name).join(", ")}
              </p>
            )}
            {detail.spoken_languages?.length > 0 && (
              <p className="text-muted-foreground">
                <span className="text-foreground/70">Language:</span> {detail.spoken_languages.map(l => l.english_name).join(", ")}
              </p>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {detail.production_companies?.length > 0 && (
              <p className="text-muted-foreground">
                <span className="text-foreground/70">Production:</span> {detail.production_companies.map(p => p.name).join(", ")}
              </p>
            )}
            {detail.budget > 0 && (
              <p className="text-muted-foreground">
                <span className="text-foreground/70">Budget:</span> ${(detail.budget / 1_000_000).toFixed(0)}M
              </p>
            )}
            {detail.revenue > 0 && (
              <p className="text-muted-foreground">
                <span className="text-foreground/70">Revenue:</span> ${(detail.revenue / 1_000_000).toFixed(0)}M
              </p>
            )}
          </div>
        </div>

        {/* Section anchors */}
        <div className="flex gap-4 mb-8 overflow-x-auto slider-container text-sm border-b border-border pb-2">
          {cast.length > 0 && <a href="#cast" className="text-muted-foreground hover:text-primary whitespace-nowrap transition-colors pb-2">Cast</a>}
          {mediaType === "tv" && <a href="#seasons" className="text-muted-foreground hover:text-primary whitespace-nowrap transition-colors pb-2">Seasons</a>}
          {trailers.length > 0 && <a href="#trailers" className="text-muted-foreground hover:text-primary whitespace-nowrap transition-colors pb-2">Videos</a>}
          {similar.length > 0 && <a href="#related" className="text-muted-foreground hover:text-primary whitespace-nowrap transition-colors pb-2">Related</a>}
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section id="cast" className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cast</h2>
            <div className="flex gap-3 overflow-x-auto slider-container pb-2">
              {cast.map(c => (
                <Link key={c.id} to={`/actor/${c.id}`} className="flex-shrink-0 w-20 text-center group">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary transition-all">
                    <img src={img(c.profile_path, "w185")} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <p className="text-xs text-foreground mt-1.5 truncate group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.character}</p>
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
                <div key={season.id} className="bg-card rounded-xl overflow-hidden border border-border/50">
                  <button
                    onClick={() => loadSeason(season.season_number)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {season.poster_path && (
                        <img src={img(season.poster_path, "w92")} alt={season.name} className="w-10 h-14 rounded object-cover" />
                      )}
                      <div className="text-left">
                        <span className="font-medium">{season.name}</span>
                        <p className="text-xs text-muted-foreground">{season.episode_count} episodes</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openSeason === season.season_number ? "rotate-180" : ""}`} />
                  </button>
                  {openSeason === season.season_number && selectedSeason === season.season_number && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/30">
                      {episodes.map(ep => (
                        <Link
                          key={ep.id}
                          to={`/watch/tv/${detail.id}?s=${ep.season_number}&e=${ep.episode_number}`}
                          className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-28 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                            <img src={img(ep.still_path, "w300")} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-foreground fill-foreground" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors font-medium">
                              E{ep.episode_number}. {ep.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ep.overview}</p>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              {ep.runtime && <span>{ep.runtime}min</span>}
                              {ep.vote_average > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  {ep.vote_average.toFixed(1)}
                                </span>
                              )}
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
              {trailers.slice(0, 8).map(v => (
                <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noopener" className="flex-shrink-0 w-64 sm:w-72 group">
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
                    <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 group-hover:bg-background/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 truncate">{v.name}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

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
  );
}
