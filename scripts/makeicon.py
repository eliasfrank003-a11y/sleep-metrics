#!/usr/bin/env python3
"""
Render the app icon: a thin clock face with the sleep window drawn on the rim.

Twelve hours round once, read like any clock: 12 at the top, 3 at the right, 6
at the bottom, 9 at the left. The sleep window runs from 22:00 - the 10 o'clock
position - clockwise past midnight to 06:30, which sits just left of the bottom.
The waking hours take the rest of the rim in grey-white.

No numbers, no hands, and the middle is empty. The arc ends are square cuts
across the band rather than round caps, because they mark a boundary between two
parts of a whole and not the end of a bar.

    python3 scripts/makeicon.py
    python3 scripts/makeicon.py --debug   # ticks and hour labels, to check the maths

Writes favicon.svg, icon-192.png, icon-512.png and apple-touch-icon.png into
public/. Not run at build time - the icon changes about once.
"""
import colorsys
import hashlib
import math
import pathlib
import re
import sys

from PIL import Image, ImageDraw, ImageFont

SS = 4  # supersample factor, for a clean edge on a band this thin
CANVAS = 1024
BACKGROUND = (0, 0, 0)

# The bordeaux is --primary from src/index.css in its dark form; if that moves,
# move this with it.
SLEEP_HSL = (348, 60, 44)
# The waking hours. Warm rather than neutral so it reads as the same family as
# the bordeaux rather than as a gap in the ring.
WAKING = (0xD9, 0xD6, 0xD4)

# The window the face describes, as times of day on a 24-hour clock. They are
# reduced onto the 12-hour dial by angle() below.
SLEEP_FROM = 22.0
SLEEP_TO = 6.5

# ---------------------------------------------------------------------------
# Shared icon spec, in 1024-pixel canvas units. The same three numbers appear in
# sleep-metrics, movement-metrics and recalibration, and the point of them is
# that the four tiles read as one family sitting next to each other on a home
# screen. Change one, change all of them.
#
#   ground   black
#   STROKE   76   every line, band and bar is this thick
#   EXTENT  665   the mark's longer dimension, ~65% of the tile
#
# Caps are fully round wherever a line simply stops. The exception is the sleep
# dial, where the two arcs are cut square: there they divide one shared ring
# rather than terminate, and a round cap would claim an end that is not there.
# ---------------------------------------------------------------------------
STROKE = 76
EXTENT = 665

# Diameter is EXTENT, so the dial covers the same share of the tile as the marks
# in the sibling apps; the band is the shared stroke.
OUTER = (EXTENT / 2) / 1024
THICKNESS = STROKE / 1024


def rgb(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return (round(r * 255), round(g * 255), round(b * 255))


def angle(hour):
    """
    Time of day to drawing degrees, where 0 is 3 o'clock and they run clockwise.

    A 12-hour dial: each hour is 30 degrees, and the -90 puts 12 o'clock at the
    top where a clock has it. 22:00 reduces to the 10 o'clock position (210) and
    06:30 to just left of the bottom (105).
    """
    return (hour % 12) * 30.0 - 90.0


def _box(px, radius):
    c = px / 2.0
    r = radius * px
    return [c - r, c - r, c + r, c + r]


def sweep():
    """Start and end of the sleep arc in drawing degrees, end always after start."""
    start = angle(SLEEP_FROM)
    end = angle(SLEEP_TO)
    if end <= start:
        end += 360.0
    return start, end


def draw(px, debug=False):
    img = Image.new("RGB", (px, px), BACKGROUND)
    d = ImageDraw.Draw(img)

    outer = _box(px, OUTER)
    inner = _box(px, OUTER - THICKNESS)
    start, end = sweep()

    # Filled disc, sleep window cut into it, then the middle punched back out to
    # the page. Done in that order because it gives both arcs one shared radial
    # edge - drawing two arcs with a width instead leaves a hairline of
    # background between them where they meet.
    d.ellipse(outer, fill=WAKING)
    d.pieslice(outer, start, end, fill=rgb(*SLEEP_HSL))
    d.ellipse(inner, fill=BACKGROUND)

    if debug:
        _annotate(d, px)
    return img


def _annotate(d, px):
    """Hour ticks and labels, so the arc ends can be checked against a real dial."""
    c = px / 2.0
    font = ImageFont.load_default(size=max(10, px // 40))
    for h in range(12):
        a = math.radians(angle(h))
        r1, r2 = OUTER * px + 4, OUTER * px + 14
        d.line(
            [c + r1 * math.cos(a), c + r1 * math.sin(a),
             c + r2 * math.cos(a), c + r2 * math.sin(a)],
            fill=(90, 90, 90), width=max(1, px // 340),
        )
        rl = OUTER * px + 34
        label = str(12 if h == 0 else h)
        d.text((c + rl * math.cos(a), c + rl * math.sin(a)), label,
               fill=(150, 150, 150), font=font, anchor="mm")
    for hour, colour in ((SLEEP_FROM, (0, 200, 255)), (SLEEP_TO, (0, 255, 120))):
        a = math.radians(angle(hour))
        d.line([c, c, c + (OUTER * px) * math.cos(a), c + (OUTER * px) * math.sin(a)],
               fill=colour, width=max(1, px // 300))


def png(px, debug=False):
    """Draw oversized and downsample, which is cheaper than antialiasing by hand."""
    return draw(px * SS, debug).resize((px, px), Image.LANCZOS)


def svg():
    c = CANVAS / 2.0
    w = THICKNESS * CANVAS
    # Stroked from the centre line of the band, so this is the mid-radius.
    r = (OUTER * CANVAS) - w / 2.0
    start, end = sweep()

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


def stamp(public, root):
    """
    Version the icon URLs so that a changed icon actually reaches the phone.

    iOS caches the home-screen icon per URL, in a store that outlives clearing
    Safari's website data - so replacing the bytes behind apple-touch-icon.png
    changes nothing at all, and "Add to Home Screen" goes on offering the old
    picture indefinitely. (The share sheet reads the favicon instead, which is
    why the two previews can disagree and the share sheet is the one telling
    the truth.)

    Stamping the file's own hash into the query string gives the icon a new URL
    whenever, and only when, the image actually changes.
    """
    digest = hashlib.sha256((public / "apple-touch-icon.png").read_bytes()).hexdigest()[:8]

    index = root / "index.html"
    html = index.read_text()
    html = re.sub(
        r'(href="[^"]*apple-touch-icon\.png)(\?v=[0-9a-f]+)?"',
        r'\1?v=' + digest + '"',
        html,
    )
    index.write_text(html)

    for name in ("manifest.webmanifest", "manifest.json"):
        manifest = public / name
        if not manifest.exists():
            continue
        text = manifest.read_text()
        text = re.sub(
            r'("src": "[^"]*icon-\d+\.png)(\?v=[0-9a-f]+)?"',
            r'\1?v=' + digest + '"',
            text,
        )
        manifest.write_text(text)

    return digest


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    if "--debug" in sys.argv:
        out = root / "scripts" / "icon-debug.png"
        png(512, debug=True).save(out)
        print(f"wrote {out}")
        return
    out = root / "public"
    out.mkdir(exist_ok=True)
    png(192).save(out / "icon-192.png")
    png(512).save(out / "icon-512.png")
    # iOS applies its own rounding, so this one stays a full square.
    png(180).save(out / "apple-touch-icon.png")
    (out / "favicon.svg").write_text(svg())
    digest = stamp(out, out.parent)
    print(f"wrote 4 files to {out}, stamped ?v={digest}")


if __name__ == "__main__":
    main()
