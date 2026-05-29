import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useCustomDownloads } from "@/lib/customDownloads";
import { getSeasonDetail, type Episode } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  tmdbId: number;
  mediaType: "movie" | "tv";
  availableSeasons?: Array<{ season_number: number; name?: string }>;
}

export default function CustomDownloads({ tmdbId, mediaType, availableSeasons = [] }: Props) {
  const [downloadMode, setDownloadMode] = useState<"all" | "season" | "episode">("all");
  const [selectedSeason, setSelectedSeason] = useState<number>(availableSeasons[0]?.season_number ?? 1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | undefined>();
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    if (availableSeasons.length && !availableSeasons.some(item => item.season_number === selectedSeason)) {
      setSelectedSeason(availableSeasons[0].season_number);
    }
  }, [availableSeasons, selectedSeason]);

  useEffect(() => {
    if (mediaType !== "tv" || !selectedSeason) return;

    getSeasonDetail(tmdbId, selectedSeason).then(detail => {
      setSeasonEpisodes(detail.episodes || []);
      if (!detail.episodes?.length) {
        setSelectedEpisode(undefined);
        return;
      }
      setSelectedEpisode(current => current ?? detail.episodes[0].episode_number);
    });
  }, [mediaType, selectedSeason, tmdbId]);

  const seasonFilter = downloadMode === "all" ? undefined : selectedSeason;
  const episodeFilter = downloadMode === "episode" ? selectedEpisode : undefined;
  const { items, loading } = useCustomDownloads(tmdbId, mediaType, seasonFilter, episodeFilter);

  if (!items.length && !loading) return null;
  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" /> Download Links
        </h2>
        {mediaType === "tv" && (
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Unlimited" },
              { key: "season", label: "Season" },
              { key: "episode", label: "Episode" },
            ].map(button => (
              <button
                key={button.key}
                type="button"
                onClick={() => setDownloadMode(button.key as "all" | "season" | "episode")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${downloadMode === button.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {mediaType === "tv" && downloadMode !== "all" && (
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            value={selectedSeason}
            onChange={event => setSelectedSeason(Number(event.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm"
          >
            {availableSeasons.map(season => (
              <option key={season.season_number} value={season.season_number}>{season.name || `Season ${season.season_number}`}</option>
            ))}
          </select>
          {downloadMode === "episode" && (
            <select
              value={selectedEpisode ?? ""}
              onChange={event => setSelectedEpisode(Number(event.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm"
            >
              {seasonEpisodes.map(episode => (
                <option key={episode.id} value={episode.episode_number}>Episode {episode.episode_number}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <article key={idx} className="glass-panel p-3 animate-fade-in">
              <Skeleton className="h-10 w-10 rounded-lg animate-shimmer" />
              <Skeleton className="mt-3 h-4 w-3/4 animate-shimmer" />
              <Skeleton className="mt-2 h-3 w-1/3 animate-shimmer" />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map(d => {
          const context = [d.season != null ? `Season ${d.season}` : null, d.episode != null ? `Episode ${d.episode}` : null].filter(Boolean).join(" · ");
          return (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener"
              className="glass-panel flex items-center gap-3 px-4 py-3 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.label || "Download Link"}</p>
                <p className="text-[11px] text-muted-foreground">{context || "Download"}</p>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground mt-1">
                  {d.quality && <span className="bg-muted px-1.5 py-0.5 rounded">{d.quality}</span>}
                  {d.size && <span className="bg-muted/70 px-1.5 py-0.5 rounded">{d.size}</span>}
                </div>
              </div>
            </a>
          );
          })}
        </div>
      )}
    </section>
  );
}
