#!/usr/bin/env python3
"""Generate PWA PNG icons (192, 512, maskable)."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"
OUT.mkdir(exist_ok=True)

BG = (17, 17, 17)
FG = (255, 255, 255)


def find_font(size: int):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    # Maskable: keep critical content inside 80% safe zone
    pad = int(size * 0.18) if maskable else int(size * 0.12)
    inner = size - 2 * pad
    # Two interlocked circles ("pass" rings)
    cy = pad + int(inner * 0.42)
    r = int(inner * 0.20)
    cx1 = pad + int(inner * 0.32)
    cx2 = pad + int(inner * 0.68)
    stroke = max(4, size // 50)
    d.ellipse([cx1 - r, cy - r, cx1 + r, cy + r], outline=FG, width=stroke)
    d.ellipse([cx2 - r, cy - r, cx2 + r, cy + r], outline=FG, width=stroke)
    # PASS text
    font_size = max(12, int(inner * 0.18))
    font = find_font(font_size)
    text = "PASS"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = pad + int(inner * 0.72) - bbox[1]
    d.text((tx, ty), text, fill=FG, font=font)
    # Rounded corners for non-maskable
    if not maskable:
        radius = int(size * 0.22)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        rgba = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        rgba.paste(img, (0, 0), mask)
        return rgba
    return img.convert("RGBA")


for size, name in [(192, "icon-192.png"), (512, "icon-512.png")]:
    img = make_icon(size, maskable=False)
    img.save(OUT / name, "PNG", optimize=True)
    print(f"wrote {name}")

img = make_icon(512, maskable=True)
img.save(OUT / "icon-maskable.png", "PNG", optimize=True)
print("wrote icon-maskable.png")
