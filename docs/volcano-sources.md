# Volcano Data Sources

Where volcano-related data actually comes from, which of our pipelines are primary vs. re-publishers, and what's currently wired up vs. orphaned.

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `VolcanoDataManager` (static import) | `webservices.volcano.si.edu/geoserver/GVP-VOTW/ows` (Smithsonian GVP WFS) | **Primary** | manual (`npm run import`) | `/api/geohazardwatch/search`, VolcanoInfobox/List/Search/Map plugins |
| `HansDataManager` | `volcanoes.usgs.gov/hans-public/api` | **Primary** | 10 min | `US Volcano Alerts (USGS HANS)` page |
| `vona` (ngdpbase `feeds` addon) | `volcanoes.usgs.gov/hans-public/api/notice/getVonasWithinLastYear` | **Primary** — same USGS API family as HANS, different endpoint (VONA notices, not alert levels) | 30 min | **nowhere** — orphaned config, see Known Issues |
| `va-sigmets` (ngdpbase `feeds` addon) | `aviationweather.gov/api/data/isigmet` (FAA/NWS) | **Primary**, independent of the USGS sources | 20 min | **nowhere** — orphaned config, see Known Issues |
| `VaacDataManager` (addon's own) | `ospo.noaa.gov/products/atmosphere/vaac/archive.html` (NOAA OSPO, Washington VAAC) | **Primary** — direct from the actual issuing authority | 30 min | only `geohazardwatch-plugins.md` (internal demo page), not real content |
| `volcanodiscovery-activity` (ngdpbase `feeds` addon) | `volcanodiscovery.com/volcanonews.rss` | **Re-publisher** — see Provenance below | 30 min | `/view/volcano-activity` — the only volcano-activity content the public actually sees |
| FIRMS/VIIRS (via `FirmsHotspotsPlugin`) | `firms.modaps.eosdis.nasa.gov` (NASA FIRMS) | **Primary** — satellite thermal anomalies, joined against the volcano catalog at render time | 60 min | only `geohazardwatch-plugins.md` demo |

## Provenance: VolcanoDiscovery re-publishes NOAA's own VAAC bulletins

Confirmed directly (not inferred from format): NOAA OSPO's Washington VAAC archive listed a Popocatépetl advisory issued **24 Jul 2026, 1321 UTC** (`FVXX25_20260724_1321.xml`). The same DTG (`20260724/1321Z`) and product code (`FVXX25`) appear verbatim inside the `description` of the corresponding `volcanodiscovery-activity` RSS item. VolcanoDiscovery isn't originating that content — it's mirroring the NOAA bulletin, wrapped in its own headline/HTML.

Practical effect: for ash-advisory content, **the real source is NOAA OSPO's Washington VAAC**, which this addon already fetches directly via `VaacDataManager` — just not on any page anyone sees. The one page that *is* public (`/view/volcano-activity`) shows a third party's second-hand copy of data we already have first-hand, structured, and (per `VaacDataManager`'s own doc comment) already matched to GVP volcano numbers.

VolcanoDiscovery does carry genuine unique content nothing else has: original eruption narratives and the "Volcanoes Today" daily digest. It shouldn't be dropped — just not treated as the primary source for advisory data.

## Known issues / follow-ups

- **geohazardwatch#155** — extract embedded GVP volcano number + real VAAC DTG from `volcanodiscovery-activity`'s description text (the "build a parser" fix). Given the provenance finding above, the better fix for the advisory subset may be surfacing `VaacAdvisoriesPlugin` directly instead of parsing a re-publisher's copy — not yet filed as a separate issue.
- `vona` and `va-sigmets` are configured, actively polling their upstream APIs every 20–30 minutes, and registered with `CatalogManager` — but no page anywhere renders them. Either wire them up or stop polling for nothing.
- `VaacAdvisoriesPlugin` / `VaacDataManager` already does the GVP-matching and real-date work #155 wants, but is only used on the internal plugin-demo page.
- geohazardwatch#6 (deferred) — additional volcanic thermal monitoring sources (MIROVA / MODVOLC / MOUNTS), complementary to the FIRMS/VIIRS proximity join already in place.
