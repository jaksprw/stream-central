import { Link } from "react-router-dom";
import { img, imgLow } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { Star } from "lucide-react";

interface Props {
  item: Movie;
  type?: "movie" | "tv";
}

export default function PostCard({ item, type }: Props) {
  const [settings] = useSettings();
  const mediaType = type || item.media_type || (item.title ? "movie" : "tv");
  const title = item.title || item.name || "";
  const imgSrc = settings.dataSaver
    ? imgLow(item.backdrop_path, "w300")
    : img(item.backdrop_path, "w780");

  return (
    <Link
      to={`/${mediaType}/${item.id}`}
      className="group flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] lg:w-[300px]"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-foreground">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-sm text-foreground truncate">{title}</p>
    </Link>
  );
}
