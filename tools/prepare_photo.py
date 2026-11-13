#!/usr/bin/env python3
"""
Turns the originals in images/upload_images/ into web versions in images/web_images/:
fixes rotation, scales down to max 1600 px, saves as WebP without any metadata
(no GPS, camera, date).

    python3 tools/prepare_photo.py            # all new photos in upload_images
    python3 tools/prepare_photo.py --force    # redo all of them
    python3 tools/prepare_photo.py <file>     # just one photo

Needs Pillow (pip install pillow). iPhone HEIC photos also need pillow-heif.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UPLOAD = ROOT / "images" / "upload_images"
WEB = ROOT / "images" / "web_images"

MAX_SIDE = 1600
QUALITY = 80
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}


def web_name(src):
    # "IMG 1234 Istanbul.PNG" -> "img-1234-istanbul.webp"
    stem = re.sub(r"[^a-z0-9]+", "-", src.stem.lower()).strip("-")
    return WEB / f"{stem}.webp"


def convert(src, dst):
    if src.suffix.lower() in (".heic", ".heif"):
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
        except ImportError:
            print(f"skipped {src.name}: HEIC needs pillow-heif (pip install pillow-heif)")
            return False

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # apply rotation before the metadata is gone
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        # copy only the pixels into a fresh image, so nothing else comes along
        clean = Image.new(im.mode, im.size)
        clean.paste(im)
        dst.parent.mkdir(parents=True, exist_ok=True)
        clean.save(dst, "WEBP", quality=QUALITY, method=6)

    with Image.open(dst) as check:
        if len(check.getexif()):
            print(f"warning: {dst.name} still has metadata!")
            return False

    rel = dst.relative_to(ROOT).as_posix()
    print(f"{src.name} -> {rel} ({clean.size[0]}x{clean.size[1]}, {dst.stat().st_size // 1024} KB)")
    return True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv

    if args:
        files = [Path(a) for a in args]
    else:
        files = sorted(p for p in UPLOAD.iterdir() if p.suffix.lower() in EXTENSIONS)
        if not files:
            print(f"no photos in {UPLOAD.relative_to(ROOT)}/")
            return 0

    done = 0
    for src in files:
        dst = web_name(src)
        if dst.exists() and not force:
            print(f"{src.name}: already done ({dst.name})")
            continue
        done += convert(src, dst)

    print(f"\n{done} photo(s) converted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
