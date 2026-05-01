import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PostCard from "./PostCard";
import type { Movie } from "@/lib/tmdb";

interface Props {
  title: string;
  items: Movie[];
  type?: "movie" | "tv";
  showMoreLink?: string;
}

export default function ContentSlider({ title, items, type, showMoreLink }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!items.length) return null;

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
        {items.map(item => (
          <PostCard key={item.id} item={item} type={type} slider />
        ))}
      </div>
    </section>
  );
}
