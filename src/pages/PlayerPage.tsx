import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getDetail, getSeasonDetail, img, type MovieDetail, type Episode } from "@/lib/tmdb";
import { servers, getServerUrl } from "@/lib/servers";
import { toggleWatchlist, isInWatchlist } from "@/lib/store";
import ContentSlider from "@/components/ContentSlider";
import { getTrending, type Movie } from "@/lib/tmdb";
import { Heart, ChevronDown, Server, Shield } from "lucide-react";

export default function PlayerPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const season = Number(searchParams.get("s")) || 1;
  const episode = Number(searchParams.get("e")) || 1;
  const mediaType = type as "movie" | "tv";

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [selectedServer, setSelectedServer] = useState(0);
  const [sandboxOn, setSandboxOn] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(season);

  useEffect(() => {
    if (!id) return;
    getDetail(mediaType, Number(id)).then(d => {
      setDetail(d);
      setInWatchlist(isInWatchlist(d.id, mediaType));
    });
    getTrending("movie", "week").then(r => setTrending(r.results));
    window.scrollTo(0, 0);
  }, [id, type]);

  useEffect(() => {
    if (mediaType === "tv" && id) {
      getSeasonDetail(Number(id), season).then(s => setEpisodes(s.episodes));
    }
  }, [id, season, type]);

  if (!detail) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const title = detail.title || detail.name || "";
  const imdbId = detail.imdb_id || detail.external_ids?.imdb_id;
  const server = servers[selectedServer];
  const iframeSrc = getServerUrl(server, { tmdbId: detail.id, imdbId, season, episode, isTV: mediaType === "tv" });

  const handleWatchlist = () => {
    const added = toggleWatchlist(detail.id, mediaType);
    setInWatchlist(added);
  };

  return (
    <div className="pb-20">
      {/* Player */}
      <div className="w-full aspect-video bg-background relative">
        {sandboxOn ? (
          <iframe
            src={iframeSrc}
            className="w-full h-full"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          />
        ) : (
          <iframe
            src={iframeSrc}
            className="w-full h-full"
            allowFullScreen
          />
        )}
      </div>

      <div className="px-4 sm:px-8 mt-4">
        {/* Server selector */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">Servers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {servers.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSelectedServer(i)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${i === selectedServer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sandbox toggle + Watchlist */}
        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sandbox</span>
            <button
              onClick={() => setSandboxOn(!sandboxOn)}
              className={`w-10 h-5 rounded-full transition-colors relative ${sandboxOn ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${sandboxOn ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
          <button onClick={handleWatchlist} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${inWatchlist ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <Heart className={`w-4 h-4 ${inWatchlist ? "fill-primary" : ""}`} />
            {inWatchlist ? "In Watchlist" : "Watchlist"}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-foreground mb-1">{title}</h1>
        {mediaType === "tv" && <p className="text-sm text-muted-foreground mb-4">Season {season}, Episode {episode}</p>}

        {/* TV Seasons & Episodes */}
        {mediaType === "tv" && detail.seasons && (
          <div className="mb-8 space-y-2">
            {detail.seasons.filter(s => s.season_number > 0).map(s => (
              <div key={s.id} className="bg-card rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    setOpenSeason(openSeason === s.season_number ? null : s.season_number);
                    if (openSeason !== s.season_number) {
                      getSeasonDetail(detail.id, s.season_number).then(r => setEpisodes(r.episodes));
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{s.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openSeason === s.season_number ? "rotate-180" : ""}`} />
                </button>
                {openSeason === s.season_number && (
                  <div className="px-4 pb-3 space-y-1">
                    {episodes.map(ep => (
                      <Link
                        key={ep.id}
                        to={`/watch/tv/${detail.id}?s=${ep.season_number}&e=${ep.episode_number}`}
                        className={`block px-3 py-2 rounded text-sm transition-colors ${ep.season_number === season && ep.episode_number === episode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                      >
                        E{ep.episode_number}. {ep.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Trending */}
        <ContentSlider title="Trending Movies" items={trending} type="movie" />
      </div>
    </div>
  );
}
