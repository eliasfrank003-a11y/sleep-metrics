#!/usr/bin/env python3
"""
Render the app icon: a clock face with the sleep window cut out of it.

The face carries no numbers and no hands. The only thing it says is which
fraction of the twenty-four hours is spent asleep, drawn as a plain sector -
bordeaux from 22:00 round to 06:30, the waking three and a half hours in a
grey-white. Straight radial edges on purpose: a rounded wedge would read as a
progress ring, and this is a proportion rather than a progress.

    python3 scripts/makeicon.py

Writes favicon.svg, icon-192.png, icon-512.png and apple-touch-icon.png into
public/. Not run at build time - the icon changes about once.
"""
import colorsys
import math
import pathlib

from PIL import Image, ImageDraw

SS = 4  # supersample factor, for a clean edge on the circle and the two cuts
CANVAS = 1024
BACKGROUND = (0, 0, 0)

# The bordeaux is --primary from src/index.css in its dark form; if that moves,
# move this with it.
SLEEP_HSL = (348, 60, 44)
# The waking hours. Warm rather than neutral so it reads as the same family as
# the bordeaux rather than as a hole in the disc.
WAKING = (0xD9, 0xD6, 0xD4)

# The window the face describes, in hours on a 12-hour dial.
SLEEP_FROM = 22.0
SLEEP_TO = 6.5

# Diameter as a fraction of the canvas, matched to the bar width in the sibling
# apps' icons so the family sits at one optical size on a home screen.
RADIUS = 0.322


def rgb(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return (round(r * 255), round(g * 255), round(b * 255))


def angle(hour):
    """Clock hour to drawing degrees: 0 deg is 3 o'clock and they run clockwise."""
    return (hour % 12) * 30.0 - 90.0


def draw(px):
    img = Image.new("RGB", (px, px), BACKGROUND)
    d = ImageDraw.Draw(img)
    r = RADIUS * px
    c = px / 2.0
    box = [c - r, c - r, c + r, c + r]

    # The whole face is waking; the sleep window is then cut into it. Drawn this
    # way round because the two sectors have to share an edge exactly, and two
    # pieslices meeting at an angle leave a hairline of background between them.
    d.ellipse(box, fill=WAKING)
    start = angle(SLEEP_FROM)
    end = angle(SLEEP_TO)
    if end <= start:
        end += 360.0
    d.pieslice(box, start, end, fill=rgb(*SLEEP_HSL))
    return img


def png(px):
    """Draw oversized and downsample, which is cheaper than antialiasing by hand."""
    return draw(px * SS).resize((px, px), Image.LANCZOS)


def svg():
    r = RADIUS * CANVAS
    c = CANVAS / 2.0

    def point(deg):
        rad = math.radians(deg)
        return (c + r * math.cos(rad), c + r * math.sin(rad))

    start = angle(SLEEP_FROM)
    end = angle(SLEEP_TO)
    if end <= start:
        end += 360.0
    x0, y0 = point(start)
    x1, y1 = point(end)
    large = 1 if (end - start) > 180 else 0
    sleep = rgb(*SLEEP_HSL)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" '
        f'viewBox="0 0 {CANVAS} {CANVAS}">\n'
        f'  <rect width="{CANVAS}" height="{CANVAS}" fill="#000000"/>\n'
        f'  <circle cx="{c:g}" cy="{c:g}" r="{r:g}" fill="#{WAKING[0]:02x}{WAKING[1]:02x}{WAKING[2]:02x}"/>\n'
        f'  <path d="M {c:g} {c:g} L {x0:.1f} {y0:.1f} '
        f'A {r:g} {r:g} 0 {large} 1 {x1:.1f} {y1:.1f} Z" '
        f'fill="#{sleep[0]:02x}{sleep[1]:02x}{sleep[2]:02x}"/>\n'
        f"</svg>\n"
    )


def main():
    out = pathlib.Path(__file__).resolve().parent.parent / "public"
    out.mkdir(exist_ok=True)
    png(192).save(out / "icon-192.png")
    png(512).save(out / "icon-512.png")
    # iOS applies its own rounding, so this one stays a full square.
    png(180).save(out / "apple-touch-icon.png")
    (out / "favicon.svg").write_text(svg())
    print(f"wrote 4 files to {out}")


if __name__ == "__main__":
    main()
