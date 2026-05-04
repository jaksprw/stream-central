import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getDetail, getSeasonDetail, img, type MovieDetail, type Episode } from "@/lib/tmdb";
import { fetchServers, getServerUrl, fallbackServers, type Server } from "@/lib/servers";
import { toggleWatchlist, isInWatchlist } from "@/lib/store";
import ContentSlider from "@/components/ContentSlider";
import AdSlot from "@/components/AdSlot";
import { getTrending, type Movie } from "@/lib/tmdb";
import { Heart, ChevronDown, Server as ServerIcon, Shield, Download, Play } from "lucide-react";

export default function PlayerPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const season = Number(searchParams.get("s")) || 1;
  const episode = Number(searchParams.get("e")) || 1;
  const mediaType = type as "movie" | "tv";

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [allServers, setAllServers] = useState<Server[]>(fallbackServers);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tab, setTab] = useState<"stream" | "download">("stream");
  const [sandboxOn, setSandboxOn] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(season);

  useEffect(() => {
    fetchServers().then(s => {
      setAllServers(s);
      const first = s.find(x => !x.is_download);
      if (first) setSelectedId(first.id || first.name);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    getDetail(mediaType, Number(id)).then(d => {
      setDetail(d);
      setInWatchlist(isInWatchlist(d.id, mediaType));
    });
    getTrending("movie", "week").then(r => setTrending(r.results));
    window.scrollTo(0, 0);
  }, [id, type, mediaType]);

  useEffect(() => {
    if (mediaType === "tv" && id) {
      getSeasonDetail(Number(id), season).then(s => setEpisodes(s.episodes));
    }
  }, [id, season, mediaType]);

  if (!detail) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const title = detail.title || detail.name || "";
  const imdbId = detail.imdb_id || detail.external_ids?.imdb_id;
  const streamServers = allServers.filter(s => !s.is_download);
  const downloadServers = allServers.filter(s => s.is_download);
  const visibleServers = tab === "stream" ? streamServers : downloadServers;
  const server = visibleServers.find(s => (s.id || s.name) === selectedId) || visibleServers[0];
  const iframeSrc = server ? getServerUrl(server, { tmdbId: detail.id, imdbId, season, episode, isTV: mediaType === "tv" }) : "";

  const handleWatchlist = () => setInWatchlist(toggleWatchlist(detail.id, mediaType));

  return (
    <div className="pb-20">
      {/* Player */}
      <div className="w-full aspect-video bg-background relative">
        {server && (sandboxOn ? (
          <iframe
            src={iframeSrc}
            className="w-full h-full"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          />
        ) : (
          <iframe src={iframeSrc} className="w-full h-full" allowFullScreen />
        ))}
      </div>

      <div className="px-4 sm:px-8 mt-4">
        <AdSlot slot="player_top" />

        {/* Stream / Download tabs */}
        {downloadServers.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setTab("stream"); const f = streamServers[0]; if (f) setSelectedId(f.id || f.name); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "stream" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <Play className="w-4 h-4" /> Stream
            </button>
            <button
              onClick={() => { setTab("download"); const f = downloadServers[0]; if (f) setSelectedId(f.id || f.name); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "download" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        )}

        {/* Server grid */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ServerIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground font-semibold uppercase tracking-wide">{tab === "download" ? "Download Sources" : "Streaming Servers"}</span>
            <span className="text-xs text-muted-foreground">({visibleServers.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {visibleServers.map((s, i) => {
              const key = s.id || s.name;
              const active = key === selectedId;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedId(key)}
                  className={`group relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                      : "bg-card text-foreground border-border hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-primary-foreground animate-pulse" : "bg-primary/60"}`} />
                  <span className="truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sandbox toggle + Watchlist */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
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

        <AdSlot slot="player_bottom" />

        {/* Trending */}
        <ContentSlider title="Trending Movies" items={trending} type="movie" />
      </div>
    </div>
  );
}
