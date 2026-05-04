
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Servers
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'tmdb',
  url TEXT NOT NULL,
  url_tv TEXT NOT NULL,
  is_download BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view enabled servers" ON public.servers FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage servers" ON public.servers FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ads
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot TEXT NOT NULL,
  name TEXT NOT NULL,
  html TEXT,
  image_url TEXT,
  click_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view enabled ads" ON public.ads FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage ads" ON public.ads FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default servers (new list provided by user)
INSERT INTO public.servers (name, type, url, url_tv, is_download, sort_order) VALUES
('Vidify','tmdb','https://vidify.top/embed/movie/{tmdb_id}','https://vidify.top/embed/tv/{tmdb_id}/{season}/{episode}',false,1),
('Change Server If Not Playing','tmdb','https://autoembed.co/movie/tmdb/{tmdb_id}','https://autoembed.co/tv/tmdb/{tmdb_id}-{season}-{episode}',false,2),
('vid vip','imdb','https://vidrock.net/movie/{imdb_id}','https://vidrock.net/tv/{imdb_id}/{season}/{episode}',false,3),
('MoviesAPI','tmdb','https://moviesapi.club/movie/{tmdb_id}','https://moviesapi.club/tv/{tmdb_id}-{season}-{episode}',false,4),
('VidLink','tmdb','https://vidlink.pro/movie/{tmdb_id}','https://vidlink.pro/tv/{tmdb_id}/{season}/{episode}',false,5),
('VidSrcXyz','tmdb','https://vidsrc.xyz/embed/movie/{tmdb_id}','https://vidsrc.xyz/embed/tv/{tmdb_id}/{season}/{episode}',false,6),
('SmashyStream','tmdb','https://player.smashy.stream/movie/{tmdb_id}','https://player.smashy.stream/tv/{tmdb_id}?s={season}&e={episode}',false,7),
('VidEasy (4K)','tmdb','https://player.videasy.net/movie/{tmdb_id}?color=8834ec','https://player.videasy.net/tv/{tmdb_id}/{season}/{episode}?color=8834ec',false,8),
('Vidora','tmdb','https://vidora.su/movie/{tmdb_id}','https://vidora.su/tv/{tmdb_id}/{season}/{episode}',false,9),
('VidSrcCC','tmdb','https://vidsrc.cc/v2/embed/movie/{tmdb_id}?autoPlay=false','https://vidsrc.cc/v2/embed/tv/{tmdb_id}/{season}/{episode}?autoPlay=false',false,10),
('StreamFlix','tmdb','https://watch.streamflix.one/movie/{tmdb_id}/watch?server=1','https://watch.streamflix.one/tv/{tmdb_id}/watch?server=1&season={season}&episode={episode}',false,11),
('NebulaFlix','tmdb','https://nebulaflix.stream/movie?mt={tmdb_id}&server=1','https://nebulaflix.stream/show?st={tmdb_id}&season={season}&episode={episode}&server=1',false,12),
('VidZee','tmdb','https://player.vidzee.wtf/embed/movie/{tmdb_id}','https://player.vidzee.wtf/embed/tv/{tmdb_id}/{season}/{episode}',false,13),
('Spenflix','tmdb','https://spencerdevs.xyz/movie/{tmdb_id}','https://spencerdevs.xyz/tv/{tmdb_id}/{season}/{episode}',false,14),
('Frembed (FR)','tmdb','https://frembed.icu/api/film.php?id={tmdb_id}','https://frembed.icu/api/serie.php?id={tmdb_id}&sa={season}&epi={episode}',false,15),
('UEmbed (premium)','tmdb','https://uembed.site/?id={tmdb_id}&apikey=thisisforsurenotapremiumkey_right?','https://uembed.site/?id={tmdb_id}&season={season}&episode={episode}&apikey=thisisforsurenotapremiumkey_right?',false,16),
('VidSrc Download (Direct)','tmdb','https://dl.vidsrc.vip/movie/{tmdb_id}','https://dl.vidsrc.vip/tv/{tmdb_id}/{season}/{episode}',true,17),
('BunnyDDL (Multi Quality)','tmdb','https://bunnyddl.termsandconditionshere.workers.dev/movie/{tmdb_id}','https://bunnyddl.termsandconditionshere.workers.dev/tv/{tmdb_id}/{season}/{episode}',true,18);

-- Trigger to auto-assign first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
