# Volcano Data Sources

Where volcano-related data actually comes from, which of our pipelines are primary vs. re-publishers, and what's currently wired up vs. orphaned.

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `VolcanoDataManager` (static import) | `webservices.volcano.si.edu/geoserver/GVP-VOTW/ows` (Smithsonian GVP WFS) | __Primary__ | manual (`npm run import`) | `/api/geohazardwatch/search`, VolcanoInfobox/List/Search/Map plugins |
| `HansDataManager` | `volcanoes.usgs.gov/hans-public/api` | __Primary__ | 10 min | `US Volcano Alerts (USGS HANS)` page |
| `vona` (ngdpbase `feeds` addon) | `volcanoes.usgs.gov/hans-public/api/notice/getVonasWithinLastYear` | __Primary__ — same USGS API family as HANS, different endpoint (VONA notices, not alert levels) | 30 min | __nowhere__ — orphaned config, see Known Issues |
| `va-sigmets` (ngdpbase `feeds` addon) | `aviationweather.gov/api/data/isigmet` (FAA/NWS) | __Primary__, independent of the USGS sources | 20 min | __nowhere__ — orphaned config, see Known Issues |
| `vaac-advisories` (ngdpbase `feeds` addon, since geohazardwatch#141) | `ospo.noaa.gov/products/atmosphere/vaac/archive.html` (NOAA OSPO, Washington VAAC) | __Primary__ — direct from the actual issuing authority | 15 min | `/view/alerts` (`VaacAdvisoriesPlugin`, since geohazardwatch#159) and `geohazardwatch-plugins.md` demo |
| `volcanodiscovery-activity` (ngdpbase `feeds` addon) | `volcanodiscovery.com/volcanonews.rss` | __Re-publisher__ — see Provenance below | 30 min | `/view/volcano-activity` — VAAC-shaped items excluded since geohazardwatch#159 (see `/view/alerts` instead); original eruption news and daily digest only |
| FIRMS/VIIRS (via `FirmsHotspotsPlugin`) | `firms.modaps.eosdis.nasa.gov` (NASA FIRMS) | __Primary__ — satellite thermal anomalies, joined against the volcano catalog at render time | 60 min | only `geohazardwatch-plugins.md` demo |

## Configuration: `vaac-advisories`

Migrated off the addon's own bespoke fetch/parse/schedule code (`import-vaac.js`, `VaacDataManager`) onto the generic ngdpbase `feeds` addon's `xml-index` adapter (geohazardwatch#141, unblocked by ngdpbase#912 and ngdpbase#989). `VaacAdvisoriesPlugin.js` now only reads `FeedManager.getRecords('vaac-advisories')` — no import script, no manager, no admin refresh button, same as the FIRMS/VIIRS pipeline above.

Enable the `feeds` addon and declare the source in the instance `app-custom-config.json`, then restart:

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources.vaac-advisories.adapter": "xml-index",
  "ngdpbase.addons.feeds.sources.vaac-advisories.url": "https://www.ospo.noaa.gov/products/atmosphere/vaac/archive.html",
  "ngdpbase.addons.feeds.sources.vaac-advisories.linkPattern": "xml_files/.*\\.xml$",
  "ngdpbase.addons.feeds.sources.vaac-advisories.type": "Event",
  "ngdpbase.addons.feeds.sources.vaac-advisories.recordIdField": "__itemUrl",
  "ngdpbase.addons.feeds.sources.vaac-advisories.dedupeBy": "volcanoName",
  "ngdpbase.addons.feeds.sources.vaac-advisories.maxAgeHours": 48,
  "ngdpbase.addons.feeds.sources.vaac-advisories.intervalMinutes": 15,
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.volcanoName": "meteorologicalInformation.VolcanicAshAdvisory.volcano.EruptingVolcano.name",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.region": "meteorologicalInformation.VolcanicAshAdvisory.stateOrRegion",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.advisoryNumber": "meteorologicalInformation.VolcanicAshAdvisory.advisoryNumber",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.issueTimeUtc": "meteorologicalInformation.VolcanicAshAdvisory.issueTime.gml:TimeInstant.gml:timePosition",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.ashCloudTopFl": "meteorologicalInformation.VolcanicAshAdvisory.observation.VolcanicAshObservedOrEstimatedConditions.ashCloud.VolcanicAshCloudObservedOrEstimated.ashCloudExtent.aixm:AirspaceVolume.aixm:upperLimit.#text",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.directionOfMotionDeg": "meteorologicalInformation.VolcanicAshAdvisory.observation.VolcanicAshObservedOrEstimatedConditions.ashCloud.VolcanicAshCloudObservedOrEstimated.directionOfMotion.#text",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.speedOfMotionKt": "meteorologicalInformation.VolcanicAshAdvisory.observation.VolcanicAshObservedOrEstimatedConditions.ashCloud.VolcanicAshCloudObservedOrEstimated.speedOfMotion.#text",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.remarks": "meteorologicalInformation.VolcanicAshAdvisory.remarks",
  "ngdpbase.addons.feeds.sources.vaac-advisories.map.sourceXmlUrl": "__itemUrl"
}
```

Every `map` path was verified against a live, currently-active advisory (FUEGO, 2026-07-28), not guessed from the XSD — each XML file's real root is `MeteorologicalBulletin > meteorologicalInformation > VolcanicAshAdvisory`, one level deeper than a bare `VolcanicAshAdvisory` root would suggest. `dedupeBy`/`maxAgeHours` replace the "most recent per volcano, discard if not reissued within 48h" logic that used to live in `import-vaac.js`'s own HTML-index parsing — see [ngdpbase's FeedManager docs](https://github.com/jwilleke/ngdpbase/blob/master/docs/managers/FeedManager.md#record-shaping--dedupeby--maxagehours-989).

__One field the generic adapter can't map__: each advisory's `<name>` tag embeds the volcano's GVP catalog number directly — e.g. `FUEGO 342090` — with no separate tag to point `map` at. The `xml`/`xml-index` adapters only do structural dot-path extraction (`getByPath`), not string transforms, so `volcanoName` above resolves to the raw combined string. `VaacAdvisoriesPlugin.js` splits it into display name + GVP number at render time instead — see the plugin's own doc comment for why that's the right layer for it (feed-specific string interpretation, not something a generic adapter should carry).

## Provenance: VolcanoDiscovery re-publishes NOAA's own VAAC bulletins

Confirmed directly (not inferred from format): NOAA OSPO's Washington VAAC archive listed a Popocatépetl advisory issued __24 Jul 2026, 1321 UTC__ (`FVXX25_20260724_1321.xml`). The same DTG (`20260724/1321Z`) and product code (`FVXX25`) appear verbatim inside the `description` of the corresponding `volcanodiscovery-activity` RSS item. VolcanoDiscovery isn't originating that content — it's mirroring the NOAA bulletin, wrapped in its own headline/HTML.

Practical effect: for ash-advisory content, __the real source is NOAA OSPO's Washington VAAC__, which this addon fetches directly via the ngdpbase `feeds` addon's `vaac-advisories` source (see Configuration below). As of geohazardwatch#159, `/view/volcano-activity` excludes VAAC-shaped items (`DataFeed`'s `exclude='summary~VAAC:|VA ADVISORY|DTG:'`) and the structured, GVP-matched original is surfaced publicly on `/view/alerts` via `VaacAdvisoriesPlugin` instead.

VolcanoDiscovery does carry genuine unique content nothing else has: original eruption narratives and the "Volcanoes Today" daily digest. It shouldn't be dropped — just not treated as the primary source for advisory data.

## Known issues / follow-ups

- __geohazardwatch#155__ (closed, superseded by #159) — originally proposed extracting embedded GVP volcano number + real VAAC DTG from `volcanodiscovery-activity`'s description text (the "build a parser" fix). Resolved instead by relocating: VAAC-shaped items are filtered out of Volcano Activity and the real structured pipeline (`VaacAdvisoriesPlugin`) is surfaced on Alerts.
- Residual case from #155/#159: digest-style items ("Volcanoes Today: Etna, Fuego, Krakatau...") name multiple volcanoes in one item — not VAAC-shaped, so they stay on Volcano Activity, still not GVP-linkable per-volcano without `VolcanoDataManager.search()`-based fuzzy matching. Low priority, not filed.
- `vona` and `va-sigmets` are configured, actively polling their upstream APIs every 20–30 minutes, and registered with `CatalogManager` — but no page anywhere renders them. Either wire them up or stop polling for nothing.
- geohazardwatch#6 (deferred) — additional volcanic thermal monitoring sources (MIROVA / MODVOLC / MOUNTS), complementary to the FIRMS/VIIRS proximity join already in place.
