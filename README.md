# Extreme Weather and Climate Change Map

A map of extreme weather and climate impacts that people around me have experienced in Europe, from Portugal up to Svalbard.
Each point is a short story, usually with a photo and links to news coverage of the event.

It's a static site: no server, no database, no cookies, no tracking. All entries live in one GeoJSON file.

Built with [MapLibre GL JS](https://maplibre.org) and [OpenStreetMap](https://www.openstreetmap.org/copyright) data via [OpenFreeMap](https://openfreemap.org).

## What's where

```
index.html, style.css, map.js   the site (settings are at the top of map.js)
data/stories.geojson            all entries
images/upload_images/           original photos, stay local (.gitignore)
images/web_images/              processed photos that go online
tools/                          two small Python helpers
vendor/maplibre-gl/             MapLibre, bundled
```

There's one test entry in the data ("test, extreme heat in Leipzig 2026") so the map isn't empty. Delete it once real entries are in.

## Run it locally

You just need Python 3. In the project folder:

```
python3 -m http.server 8002
```

Then open http://localhost:8002. `Ctrl + C` stops it.

Double-clicking `index.html` won't work, the browser blocks loading the data file that way.

## Add an entry

The photo helper needs Pillow (`pip install pillow`, plus `pillow-heif` for iPhone photos).

1. Put the original photo in `images/upload_images/`.
2. Run `python3 tools/prepare_photo.py`. It writes a smaller copy without metadata (no GPS etc.) to `images/web_images/`.
3. Add a feature to `data/stories.geojson`:

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [12.37, 51.34] },
  "properties": {
    "place": "Leipzig",
    "event_type": "heat",
    "month": "2026-07",
    "title": "…",
    "title_en": "…",
    "story": "…",
    "story_en": "…",
    "image": "images/web_images/<name>.webp",
    "image_alt": "…",
    "image_alt_en": "…",
    "image_credit": "…",
    "articles": [
      { "title": "…", "url": "https://…", "source": "…" }
    ]
  }
}
```

4. Run `python3 tools/check_data.py` to catch typos before pushing.

A few notes on the fields:
- coordinates are `[lon, lat]`, rounded to 2 decimals
- `event_type` is one of `heat`, `drought`, `wildfire`, `heavy_rain`, `flood`, `storm`, `supercell`, `ice_snow`, `other`
- `month` is `YYYY-MM` or just `YYYY`
- the `_en` fields are optional, otherwise the English view shows the German text

## Publish

Push to a public GitHub repo and turn on GitHub Pages (Settings → Pages, branch `main`, root folder).

## License

Code is MIT. The stories and photos belong to the people who shared them.
