import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { img, imgLow } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { useSettings } from "@/lib/store";

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
      <div className="hero-gradient-overlay absolute inset-0" />
      <div className="hero-gradient-left absolute inset-0" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16 pb-8 sm:pb-12">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-2 max-w-2xl line-clamp-2" style={{ fontSize: "clamp(0.7rem, 2vw, 1.5rem)" }}>
          {title}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg line-clamp-2 mb-4 hidden sm:block">
          {item.overview}
        </p>
        <div className="flex gap-2">
          <Link
            to={`/${mediaType}/${item.id}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>

      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-sm p-2 rounded-full hover:bg-background/70 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-sm p-2 rounded-full hover:bg-background/70 transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.slice(0, 10).map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-foreground/30"}`} />
        ))}
      </div>
    </div>
  );
}
