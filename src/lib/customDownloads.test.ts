import { describe, expect, it } from "vitest";
import { filterCustomDownloads, type CustomDownload } from "./customDownloads";

const sampleDownloads: CustomDownload[] = [
  { id: "all", tmdb_id: 1, media_type: "tv", season: null, episode: null, label: "All episodes", url: "https://example.com/all", quality: "1080p", size: "1GB", sort_order: 1, enabled: true },
  { id: "s1e1", tmdb_id: 1, media_type: "tv", season: 1, episode: 1, label: "S1E1", url: "https://example.com/s1e1", quality: "1080p", size: "500MB", sort_order: 2, enabled: true },
  { id: "s1e2", tmdb_id: 1, media_type: "tv", season: 1, episode: 2, label: "S1E2", url: "https://example.com/s1e2", quality: "720p", size: "300MB", sort_order: 3, enabled: true },
  { id: "s2e1", tmdb_id: 1, media_type: "tv", season: 2, episode: 1, label: "S2E1", url: "https://example.com/s2e1", quality: "1080p", size: "600MB", sort_order: 4, enabled: true },
];

describe("filterCustomDownloads", () => {
  it("returns all downloads when no season or episode filter is provided", () => {
    expect(filterCustomDownloads(sampleDownloads, "tv")).toHaveLength(4);
  });

  it("keeps generic downloads and matches the selected season", () => {
    const filtered = filterCustomDownloads(sampleDownloads, "tv", 1);

    expect(filtered.map(item => item.id)).toEqual(["all", "s1e1", "s1e2"]);
  });

  it("matches the exact episode when both season and episode are selected", () => {
    const filtered = filterCustomDownloads(sampleDownloads, "tv", 1, 2);

    expect(filtered.map(item => item.id)).toEqual(["all", "s1e2"]);
  });

  it("removes duplicate download links with the same URL and label", () => {
    const duplicates = [
      ...sampleDownloads,
      { ...sampleDownloads[1], id: "dup-1" },
      { ...sampleDownloads[1], id: "dup-2", quality: "1080p" },
    ];

    expect(filterCustomDownloads(duplicates, "tv", 1, 1).map(item => item.id)).toEqual(["all", "s1e1"]);
  });
});
