import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GenreSlider, renderShortcodes } from "@/components/GenreShortcode";

interface PageRow {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  meta_description: string | null;
  enabled: boolean;
}

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("custom_pages").select("*").eq("slug", slug).eq("enabled", true).maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setPage(data as PageRow);
      });
  }, [slug]);

  useEffect(() => {
    if (page?.title) document.title = page.title;
  }, [page]);

  if (notFound) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Page not found.</div>;
  if (!page) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const { html, widgets } = renderShortcodes(page.content_html || "");
  const parts = html.split(/(<div data-widget="__WIDGET_\d+__"><\/div>)/);

  return (
    <article className="px-4 sm:px-8 py-8 max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold text-gradient mb-6">{page.title}</h1>
      <div className="prose prose-invert max-w-none text-foreground">
        {parts.map((part, i) => {
          const m = part.match(/data-widget="(__WIDGET_(\d+)__)"/);
          if (m) {
            const w = widgets[Number(m[2])];
            return <GenreSlider key={i} {...w.props} />;
          }
          return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </div>
    </article>
  );
}
