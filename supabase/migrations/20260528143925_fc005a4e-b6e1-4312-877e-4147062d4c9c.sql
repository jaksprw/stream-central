
CREATE TABLE public.custom_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  season integer,
  episode integer,
  label text NOT NULL,
  url text NOT NULL,
  quality text,
  size text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_custom_downloads_lookup ON public.custom_downloads(tmdb_id, media_type);
GRANT SELECT ON public.custom_downloads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_downloads TO authenticated;
GRANT ALL ON public.custom_downloads TO service_role;
ALTER TABLE public.custom_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view enabled downloads" ON public.custom_downloads FOR SELECT USING (enabled = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage downloads" ON public.custom_downloads FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.live_tv_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  stream_url text NOT NULL,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_tv_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_tv_channels TO authenticated;
GRANT ALL ON public.live_tv_channels TO service_role;
ALTER TABLE public.live_tv_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view enabled channels" ON public.live_tv_channels FOR SELECT USING (enabled = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage channels" ON public.live_tv_channels FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  meta_description text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_pages TO authenticated;
GRANT ALL ON public.custom_pages TO service_role;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view enabled pages" ON public.custom_pages FOR SELECT USING (enabled = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage pages" ON public.custom_pages FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
