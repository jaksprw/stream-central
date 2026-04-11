import { Link } from "react-router-dom";
import { img, imgLow } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";
import { Star, Play } from "lucide-react";

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
      className="group block"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
        {/* Rating badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px]">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-foreground font-medium">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs sm:text-sm text-foreground truncate font-medium">{title}</p>
    </Link>
  );
}
