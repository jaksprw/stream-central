import { Link } from "react-router-dom";
import { img, imgLow } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { Play } from "lucide-react";

interface Props {
  item: Movie;
  type?: "movie" | "tv";
  /** When true, the card has a fixed width suitable for horizontal sliders. */
  slider?: boolean;
}

export default function PostCard({ item, type, slider = false }: Props) {
  const [settings] = useSettings();
  const mediaType = type || item.media_type || (item.title ? "movie" : "tv");
  const title = item.title || item.name || "";
  const imgSrc = settings.dataSaver
    ? imgLow(item.backdrop_path, "w300")
    : img(item.backdrop_path, "w780");

  const wrapperClass = slider
    ? "group block flex-shrink-0 w-44 sm:w-52 md:w-60"
    : "group block w-full";

  return (
    <Link to={`/${mediaType}/${item.id}`} className={wrapperClass} aria-label={title}>
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted/40 ring-1 ring-white/10 shadow-[0_8px_30px_-8px_hsl(240_30%_2%/0.6)] transition-all duration-500 group-hover:ring-primary/70 group-hover:shadow-[0_18px_50px_-10px_hsl(265_90%_50%/0.55)] group-hover:-translate-y-1">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Holographic sheen */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(115deg,transparent_30%,hsl(0_0%_100%/0.18)_50%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/50 scale-90 group-hover:scale-100 transition-transform ring-1 ring-white/30">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
