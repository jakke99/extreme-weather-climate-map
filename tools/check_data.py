#!/usr/bin/env python3
"""
Checks data/stories.geojson before uploading.

    python3 tools/check_data.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "stories.geojson"

EVENT_TYPES = {"heat", "drought", "wildfire", "heavy_rain", "flood", "storm", "supercell", "ice_snow", "other"}
WEST, SOUTH, EAST, NORTH = -45, 22, 65, 84  # rough box around Europe incl. Iceland/Svalbard


def decimals(x):
    s = repr(float(x))
    return 0 if s.endswith(".0") else len(s.split(".")[1])


def main():
    errors, notes = [], []

    try:
        data = json.loads(DATA.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"invalid JSON in {DATA.name}, line {e.lineno} col {e.colno}: {e.msg}")
        return 1

    try:
        from PIL import Image
    except ImportError:
        Image = None
        notes.append("Pillow not installed, skipping image checks")

    for n, f in enumerate(data.get("features", []), start=1):
        p = f.get("properties") or {}
        name = f"#{n} ({p.get('place', '?')})"

        coords = (f.get("geometry") or {}).get("coordinates")
        if not isinstance(coords, list) or len(coords) != 2:
            errors.append(f"{name}: coordinates should be [lon, lat]")
        else:
            lon, lat = coords
            if not (WEST <= lon <= EAST and SOUTH <= lat <= NORTH):
                errors.append(f"{name}: {coords} is outside Europe - order is [lon, lat]")
            if decimals(lon) > 2 or decimals(lat) > 2:
                notes.append(f"{name}: round coordinates to 2 decimals")

        for field in ("place", "event_type", "month", "story"):
            if not p.get(field):
                errors.append(f"{name}: '{field}' is missing")

        if p.get("event_type") and p["event_type"] not in EVENT_TYPES:
            errors.append(f"{name}: unknown event_type '{p['event_type']}'")

        if p.get("month") and not re.fullmatch(r"\d{4}(-(0[1-9]|1[0-2]))?", str(p["month"])):
            errors.append(f"{name}: month should look like 2024-07")

        if "SAMPLE" in str(p.get("title", "")):
            notes.append(f"{name}: still a sample entry")

        img = p.get("image")
        if img and "upload_images" in img:
            errors.append(f"{name}: points to the original in upload_images, use the web_images version")
        elif img and not img.startswith("http"):
            path = ROOT / img
            if not path.exists():
                errors.append(f"{name}: image {img} not found")
            elif Image:
                with Image.open(path) as im:
                    if len(im.getexif()) or im.info.get("exif"):
                        errors.append(f"{name}: {img} still has metadata, run prepare_photo.py")
                if path.stat().st_size > 600 * 1024:
                    notes.append(f"{name}: {img} is quite big")

        for a in p.get("articles") or []:
            if not str(a.get("url", "")).startswith(("http://", "https://")):
                errors.append(f"{name}: article url must start with http(s)://")

    # web images that no entry uses (harmless, but they still get published)
    used = {(f.get("properties") or {}).get("image") for f in data.get("features", [])}
    for path in sorted((ROOT / "images" / "web_images").glob("*.webp")):
        if path.relative_to(ROOT).as_posix() not in used:
            notes.append(f"{path.name} is not used by any entry")

    for x in notes:
        print("note: ", x)
    for x in errors:
        print("ERROR:", x)

    total = len(data.get("features", []))
    if errors:
        print(f"\n{len(errors)} error(s) in {total} entries")
        return 1
    print(f"\nok, {total} entries")
    return 0


if __name__ == "__main__":
    sys.exit(main())
