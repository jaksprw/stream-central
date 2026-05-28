import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Home, Film, Tv, User, Menu, X, Heart, ChevronDown, Layers, SlidersHorizontal, Send, Shield, Radio } from "lucide-react";
import { getGenres, type Genre } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import AdSlot from "@/components/AdSlot";
import { useSiteSettings } from "@/lib/siteSettings";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/tv", icon: Tv, label: "TV Shows" },
  { to: "/live-tv", icon: Radio, label: "Live TV" },
  { to: "/filter", icon: SlidersHorizontal, label: "Filter" },
  { to: "/providers", icon: Layers, label: "Providers" },
];

const mobileNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/live-tv", icon: Radio, label: "Live" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const site = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [showMovieGenres, setShowMovieGenres] = useState(false);
  const [showTvGenres, setShowTvGenres] = useState(false);

  useEffect(() => {
    getGenres("movie").then(r => setMovieGenres(r.genres));
    getGenres("tv").then(r => setTvGenres(r.genres));
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (site.site_title) document.title = site.site_title;
    if (site.site_favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = site.site_favicon;
    }
  }, [site.site_title, site.site_favicon]);

  // Inject analytics / verification / structured-data / custom CSS / OneSignal once settings load
  useEffect(() => {
    const added: HTMLElement[] = [];
    const append = (tag: string, attrs: Record<string, string>, text?: string) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      if (text) el.textContent = text;
      (tag === "link" || tag === "meta" ? document.head : document.body).appendChild(el);
      added.push(el);
    };
    if (site.ga4_id) {
      append("script", { src: `https://www.googletagmanager.com/gtag/js?id=${site.ga4_id}`, async: "true" });
      append("script", {}, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.ga4_id}');`);
    }
    if (site.gtm_id) {
      append("script", {}, `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtm_id}');`);
    }
    if (site.fb_pixel) {
      append("script", {}, `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${site.fb_pixel}');fbq('track','PageView');`);
    }
    if (site.google_site_verification) append("meta", { name: "google-site-verification", content: site.google_site_verification });
    if (site.bing_site_verification) append("meta", { name: "msvalidate.01", content: site.bing_site_verification });
    if (site.seo_description) {
      let m = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
      if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); added.push(m); }
      m.content = site.seo_description;
    }
    if (site.seo_keywords) append("meta", { name: "keywords", content: site.seo_keywords });
    if (site.seo_og_image) append("meta", { property: "og:image", content: site.seo_og_image });
    if (site.jsonld_organization) append("script", { type: "application/ld+json" }, site.jsonld_organization);
    if (site.jsonld_website) append("script", { type: "application/ld+json" }, site.jsonld_website);
    if (site.custom_css) append("style", {}, site.custom_css);
    if (site.onesignal_app_id) {
      append("script", { src: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js", defer: "true" });
      append("script", {}, `window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(async function(OneSignal){await OneSignal.init({appId:'${site.onesignal_app_id}'});});`);
    }
    if (site.push_html) {
      const div = document.createElement("div"); div.innerHTML = site.push_html;
      document.body.appendChild(div); added.push(div);
    }
    return () => { added.forEach(el => el.remove()); };
  }, [site.ga4_id, site.gtm_id, site.fb_pixel, site.google_site_verification, site.bing_site_verification, site.seo_description, site.seo_keywords, site.seo_og_image, site.jsonld_organization, site.jsonld_website, site.custom_css, site.onesignal_app_id, site.push_html]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel !rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between px-4 sm:px-8 h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              {site.site_logo ? (
                <img src={site.site_logo} alt={site.site_title} className="h-8 w-auto max-w-[140px] object-contain" />
              ) : (
                <span className="text-gradient">{site.site_title || "CineStream"}</span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    location.pathname === n.to
                      ? "text-primary-foreground bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-40 sm:w-60 outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </form>
            ) : (
              <>
                <Link to="/search" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Search">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </Link>
                <Link to="/filter" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Filter">
                  <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                </Link>
                <Link to="/watchlist" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Watchlist">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                </Link>
                {site.telegram_url && (
                  <a
                    href={site.telegram_url}
                    target="_blank"
                    rel="noopener"
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Telegram"
                  >
                    <Send className="w-5 h-5 text-muted-foreground" />
                  </a>
                )}
              </>
            )}
            <button className="md:hidden p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-14 bg-background/98 backdrop-blur-lg overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  location.pathname === n.to ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                }`}
              >
                <n.icon className="w-5 h-5" />
                {n.label}
              </Link>
            ))}
            <Link to="/watchlist" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted">
              <Heart className="w-5 h-5" /> Watchlist
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-primary hover:bg-muted">
                <Shield className="w-5 h-5" /> Admin
              </Link>
            )}
            <div className="border-t border-border/30 my-3" />
            {/* Movie genres */}
            <button onClick={() => setShowMovieGenres(!showMovieGenres)} className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted">
              <span className="flex items-center gap-3"><Film className="w-5 h-5" />Movie Genres</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMovieGenres ? "rotate-180" : ""}`} />
            </button>
            {showMovieGenres && (
              <div className="pl-8 space-y-0.5 max-h-60 overflow-y-auto">
                {movieGenres.map(g => (
                  <Link key={g.id} to={`/genre/movie/${g.id}?name=${g.name}`} className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50">
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
            {/* TV genres */}
            <button onClick={() => setShowTvGenres(!showTvGenres)} className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted">
              <span className="flex items-center gap-3"><Tv className="w-5 h-5" />TV Genres</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTvGenres ? "rotate-180" : ""}`} />
            </button>
            {showTvGenres && (
              <div className="pl-8 space-y-0.5 max-h-60 overflow-y-auto">
                {tvGenres.map(g => (
                  <Link key={g.id} to={`/genre/tv/${g.id}?name=${g.name}`} className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50">
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="pt-14">
        {site.header_html && <div dangerouslySetInnerHTML={{ __html: site.header_html }} />}
        <AdSlot slot="header" />
        {children}
        <AdSlot slot="footer" />
        {site.footer_html && <div className="mt-8 px-4 sm:px-8 py-6 border-t border-border/30 text-center text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: site.footer_html }} />}
      </main>

      {/* Bottom mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel !rounded-none border-x-0 border-b-0">
        <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {mobileNav.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
                location.pathname === n.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <n.icon className="w-5 h-5" />
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
