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
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-md ring-1 ring-border/40 transition-all duration-300 group-hover:ring-primary/60 group-hover:shadow-primary/20 group-hover:shadow-xl group-hover:-translate-y-0.5">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary/95 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
