#!/usr/bin/env python3
"""
Render the app icon: a thin 24-hour ring with the sleep window drawn on it.

A full day round once, not twelve hours round twice - so a sleep window that
crosses midnight is one continuous arc instead of a shape that wraps and reads
as two. The dial is oriented the way a day feels rather than the way a clock is
built: midnight at the bottom, noon at the top, 06:00 at the left and 18:00 at
the right, so the night sits along the bottom of the ring.

No numbers, no hands, and the middle is empty. The only thing the ring says is
which arc of the day is spent asleep, in bordeaux, with the waking hours in
grey-white. The arc ends are square cuts across the ring rather than round caps,
because it marks a boundary between two parts of a whole and not the end of a
bar.

    python3 scripts/makeicon.py

Writes favicon.svg, icon-192.png, icon-512.png and apple-touch-icon.png into
public/. Not run at build time - the icon changes about once.
"""
import colorsys
import math
import pathlib

from PIL import Image, ImageDraw

SS = 4  # supersample factor, for a clean edge on a ring this thin
CANVAS = 1024
BACKGROUND = (0, 0, 0)

# The bordeaux is --primary from src/index.css in its dark form; if that moves,
# move this with it.
SLEEP_HSL = (348, 60, 44)
# The waking hours. Warm rather than neutral so it reads as the same family as
# the bordeaux rather than as a gap in the ring.
WAKING = (0xD9, 0xD6, 0xD4)

# The window the ring describes, in hours on a 24-hour day.
SLEEP_FROM = 22.0
SLEEP_TO = 6.5

# Outer edge and thickness, as fractions of the canvas. The ring is deliberately
# a hairline against its own diameter - about 6% - which is what stops it
# reading as a pie chart with a hole punched in it.
OUTER = 0.332
THICKNESS = 0.043


def rgb(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return (round(r * 255), round(g * 255), round(b * 255))


def angle(hour):
    """
    Hour of the day to drawing degrees, where 0 is 3 o'clock and they run
    clockwise.

    Anchored so 06:00 lands at the 9 o'clock position and 18:00 at the 3
    o'clock position, which puts midnight at the bottom and noon at the top.
    """
    return 180.0 + (hour - 6.0) * 15.0


def _box(px, radius):
    c = px / 2.0
    r = radius * px
    return [c - r, c - r, c + r, c + r]


def draw(px):
    img = Image.new("RGB", (px, px), BACKGROUND)
    d = ImageDraw.Draw(img)

    outer = _box(px, OUTER)
    inner = _box(px, OUTER - THICKNESS)

    start = angle(SLEEP_FROM)
    end = angle(SLEEP_TO)
    if end <= start:
        end += 360.0

    # Filled disc, sleep window cut into it, then the middle punched back out to
    # the page. Done in that order because it gives both arcs one shared radial
    # edge - drawing two arcs with a width instead leaves a hairline of
    # background between them where they meet.
    d.ellipse(outer, fill=WAKING)
    d.pieslice(outer, start, end, fill=rgb(*SLEEP_HSL))
    d.ellipse(inner, fill=BACKGROUND)
    return img


def png(px):
    """Draw oversized and downsample, which is cheaper than antialiasing by hand."""
    return draw(px * SS).resize((px, px), Image.LANCZOS)


def svg():
    c = CANVAS / 2.0
    w = THICKNESS * CANVAS
    # Stroked from the centre line of the ring, so the radius is the mid-radius.
    r = (OUTER * CANVAS) - w / 2.0

    start = angle(SLEEP_FROM)
    end = angle(SLEEP_TO)
    if end <= start:
        end += 360.0

    def point(deg):
        rad = math.radians(deg)
        return (c + r * math.cos(rad), c + r * math.sin(rad))

    x0, y0 = point(start)
    x1, y1 = point(end)
    large = 1 if (end - start) > 180 else 0
    sleep = "#%02x%02x%02x" % rgb(*SLEEP_HSL)
    waking = "#%02x%02x%02x" % WAKING
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" '
        f'viewBox="0 0 {CANVAS} {CANVAS}">\n'
        f'  <rect width="{CANVAS}" height="{CANVAS}" fill="#000000"/>\n'
        f'  <circle cx="{c:g}" cy="{c:g}" r="{r:g}" fill="none" '
        f'stroke="{waking}" stroke-width="{w:g}"/>\n'
        f'  <path d="M {x0:.1f} {y0:.1f} A {r:g} {r:g} 0 {large} 1 {x1:.1f} {y1:.1f}" '
        f'fill="none" stroke="{sleep}" stroke-width="{w:g}" stroke-linecap="butt"/>\n'
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
