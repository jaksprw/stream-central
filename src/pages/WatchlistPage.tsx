import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWatchlist } from "@/lib/store";
import { getDetail, img, type MovieDetail } from "@/lib/tmdb";
import PostCard from "@/components/PostCard";

export default function WatchlistPage() {
  const [items, setItems] = useState<{ detail: MovieDetail; type: "movie" | "tv" }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = getWatchlist();
    if (!list.length) { setLoading(false); return; }
    Promise.all(
      list.map(async i => {
        const detail = await getDetail(i.type, i.id);
        return { detail, type: i.type };
      })
    ).then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Watchlist</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Your watchlist is empty. Browse and add movies or TV shows!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(i => (
            <PostCard key={i.detail.id} item={i.detail as any} type={i.type} />
          ))}
        </div>
      )}
    </div>
  );
}
