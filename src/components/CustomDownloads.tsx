import { Download } from "lucide-react";
import { useCustomDownloads } from "@/lib/customDownloads";

interface Props {
  tmdbId: number;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
}

export default function CustomDownloads({ tmdbId, mediaType, season, episode }: Props) {
  const items = useCustomDownloads(tmdbId, mediaType, season, episode);
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Download className="w-5 h-5 text-primary" /> Download Links
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map(d => (
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
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.label}</p>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                {d.quality && <span className="bg-muted px-1.5 py-0.5 rounded">{d.quality}</span>}
                {d.size && <span>{d.size}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
