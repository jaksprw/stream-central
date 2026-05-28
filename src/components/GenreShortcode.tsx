import { useEffect, useState } from "react";
import ContentSlider from "@/components/ContentSlider";
import { discoverByGenre, getTrending, getPopular, type Movie } from "@/lib/tmdb";

interface Props {
  genreId?: number;
  type?: "movie" | "tv";
  title?: string;
  source?: "genre" | "trending" | "popular";
}

export function GenreSlider({ genreId, type = "movie", title, source = "genre" }: Props) {
  const [items, setItems] = useState<Movie[]>([]);
  useEffect(() => {
    if (source === "trending") getTrending(type, "week").then(r => setItems(r.results));
    else if (source === "popular") getPopular(type, 1).then(r => setItems(r.results));
    else if (genreId) discoverByGenre(type, genreId).then(r => setItems(r.results));
  }, [genreId, type, source]);
  return <ContentSlider title={title || ""} items={items} type={type} />;
}

/** Parse [genre id=28 type=movie title="Action"] / [trending type=tv] / [popular type=movie] shortcodes */
export function renderShortcodes(html: string): { html: string; widgets: { token: string; props: Props }[] } {
  const widgets: { token: string; props: Props }[] = [];
  const out = html.replace(/\[(genre|trending|popular)([^\]]*)\]/g, (_m, kind, attrs) => {
    const props: Props = { source: kind as Props["source"] };
    const r = /(\w+)=("([^"]*)"|(\S+))/g;
    let m: RegExpExecArray | null;
    while ((m = r.exec(attrs))) {
      const k = m[1]; const v = m[3] ?? m[4];
      if (k === "id") props.genreId = Number(v);
      else if (k === "type") props.type = v as "movie" | "tv";
      else if (k === "title") props.title = v;
    }
    const token = `__WIDGET_${widgets.length}__`;
    widgets.push({ token, props });
    return `<div data-widget="${token}"></div>`;
  });
  return { html: out, widgets };
}
