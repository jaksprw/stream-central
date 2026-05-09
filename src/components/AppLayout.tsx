import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Home, Film, Tv, User, Menu, X, Heart, ChevronDown, Compass, Layers, SlidersHorizontal, Send, Shield } from "lucide-react";
import { getGenres, type Genre } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import AdSlot from "@/components/AdSlot";
import { useSiteSettings } from "@/lib/siteSettings";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/tv", icon: Tv, label: "TV Shows" },
  { to: "/filter", icon: SlidersHorizontal, label: "Filter" },
  { to: "/providers", icon: Layers, label: "Providers" },
  { to: "/profile", icon: User, label: "Profile" },
];

const mobileNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/tv", icon: Tv, label: "TV" },
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
  }, [site.site_title]);

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
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    location.pathname === n.to
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/30">
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
