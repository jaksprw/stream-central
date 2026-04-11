export interface Server {
  name: string;
  type: "tmdb" | "imdb";
  url: string;
  url_tv: string;
}

export const servers: Server[] = [
  { name: "VidNest", type: "tmdb", url: "https://vidnest.fun/movie/{tmdb_id}", url_tv: "https://vidnest.fun/tv/{tmdb_id}/{season}/{episode}" },
  { name: "AutoEmbed", type: "imdb", url: "https://watch-v2.autoembed.app/api/hdmovies/embed?type=movie&id={imdb_id}", url_tv: "https://watch-v2.autoembed.app/api/hdmovies/embed?type=tv&id={imdb_id}&s={season}&e={episode}" },
  { name: "VidSrc TW", type: "tmdb", url: "https://vidsrc.tw/embed/movie/{tmdb_id}", url_tv: "https://vidsrc.tw/embed/tv/{tmdb_id}/{season}/{episode}" },
  { name: "VixSrc", type: "tmdb", url: "https://vixsrc.to/movie/{tmdb_id}", url_tv: "https://vixsrc.to/tv/{tmdb_id}/{season}/{episode}" },
  { name: "MoviesAPI", type: "tmdb", url: "https://moviesapi.club/movie/{tmdb_id}", url_tv: "https://moviesapi.club/tv/{tmdb_id}-{season}-{episode}" },
  { name: "VidLink", type: "tmdb", url: "https://vidlink.pro/movie/{tmdb_id}", url_tv: "https://vidlink.pro/tv/{tmdb_id}/{season}/{episode}" },
  { name: "VideoEasy API", type: "tmdb", url: "https://player.videasy.net/movie/{tmdb_id}", url_tv: "https://player.videasy.net/tv/{tmdb_id}/{season}/{episode}" },
  { name: "VidSrc VIP", type: "tmdb", url: "https://vidsrc.vip/embed/movie/{tmdb_id}", url_tv: "https://vidsrc.vip/embed/tv/{tmdb_id}/{season}/{episode}" },
  { name: "2Embed", type: "tmdb", url: "https://www.2embed.cc/embed/{tmdb_id}", url_tv: "https://www.2embed.cc/embedtv/{tmdb_id}&s={season}&e={episode}" },
  { name: "EmbedSU", type: "tmdb", url: "https://embed.su/embed/movie/{tmdb_id}", url_tv: "https://embed.su/embed/tv/{tmdb_id}/{season}/{episode}" },
  { name: "MultiEmbed", type: "tmdb", url: "https://multiembed.mov/?video_id={tmdb_id}&tmdb=1", url_tv: "https://multiembed.mov/?video_id={tmdb_id}&tmdb=1&s={season}&e={episode}" },
  { name: "RiveStream", type: "tmdb", url: "https://rivestream.org/embed?type=movie&id={tmdb_id}", url_tv: "https://rivestream.org/embed?type=tv&id={tmdb_id}&season={season}&episode={episode}" },
  { name: "Hexa", type: "tmdb", url: "https://hexa.watch/watch/movie/{tmdb_id}", url_tv: "https://hexa.watch/watch/tv/{tmdb_id}/{season}/{episode}" },
];

export function getServerUrl(server: Server, opts: { tmdbId: number; imdbId?: string; season?: number; episode?: number; isTV?: boolean }): string {
  const { tmdbId, imdbId, season, episode, isTV } = opts;
  let url = isTV ? server.url_tv : server.url;
  url = url.replace("{tmdb_id}", String(tmdbId));
  url = url.replace("{imdb_id}", imdbId || "");
  url = url.replace("{season}", String(season || 1));
  url = url.replace("{episode}", String(episode || 1));
  return url;
}
