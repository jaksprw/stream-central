import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Info } from "lucide-react";
import { img, imgLow } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { useSettings, toggleWatchlist, isInWatchlist } from "@/lib/store";

interface Props {
  items: Movie[];
  autoPlay?: boolean;
}

export default function HeroSlider({ items, autoPlay = true }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [settings] = useSettings();

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % items.length), 6000);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, items.length]);

  if (!items.length) return null;

  const item = items[current];
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const title = item.title || item.name || "";
  const bgSrc = settings.dataSaver ? img(item.backdrop_path, "w780") : img(item.backdrop_path, "original");

  const prev = () => setCurrent(c => (c - 1 + items.length) % items.length);
  const next = () => setCurrent(c => (c + 1) % items.length);

  return (
    <div className="relative w-full aspect-hero overflow-hidden">
      {/* Backdrop */}
      <img
        key={item.id}
        src={bgSrc}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        loading="eager"
      />
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16 pb-10 sm:pb-14">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 max-w-2xl line-clamp-2 drop-shadow-lg">
          {title}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg line-clamp-2 mb-4 hidden sm:block">
          {item.overview}
        </p>
        <div className="flex gap-2 items-center">
          <Link
            to={`/${mediaType}/${item.id}`}
            className="inline-flex items-center gap-2 bg-primary/90 hover:bg-primary text-primary-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            <Info className="w-4 h-4" />
            More details
          </Link>
          <button
            onClick={() => toggleWatchlist(item.id, mediaType as "movie" | "tv")}
            className="w-10 h-10 rounded-full bg-muted/60 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/40 backdrop-blur-sm p-2 rounded-full hover:bg-background/60 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={next} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/40 backdrop-blur-sm p-2 rounded-full hover:bg-background/60 transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.slice(0, 10).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "bg-primary w-6" : "bg-foreground/30 w-1.5"}`}
          />
        ))}
      </div>
    </div>
  );
}
