import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/lib/tmdb";
import { uniqueById } from "@/lib/utils";

interface Props {
  title: string;
  items: Movie[];
  type?: "movie" | "tv";
  showMoreLink?: string;
  loading?: boolean;
}

export default function ContentSlider({ title, items, type, showMoreLink, loading = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!items.length && !loading) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 sm:px-8 mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {showMoreLink && (
            <Link to={showMoreLink} className="text-xs text-primary hover:text-primary/80 transition-colors">
              Show More
            </Link>
          )}
          <button onClick={() => scroll(-1)} className="p-1 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => scroll(1)} className="p-1 rounded-full hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 px-4 sm:px-8 overflow-x-auto slider-container">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <article key={idx} className="flex-shrink-0 w-44 sm:w-52 md:w-60 animate-fade-in">
                <Skeleton className="aspect-video w-full rounded-[4px] animate-shimmer" />
                <Skeleton className="mt-2 h-4 w-3/4 animate-shimmer" />
                <Skeleton className="mt-1.5 h-3 w-1/2 animate-shimmer" />
              </article>
            ))
          : uniqueById(items, type).map(item => (
              <PostCard key={item.id} item={item} type={type} slider />
            ))}
      </div>
    </section>
  );
}
