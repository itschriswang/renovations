#!/usr/bin/env python3
"""
Subset and convert the two self-hosted typefaces to woff2.

Run:  python3 scripts/build-fonts.py

Sources are fetched once into scripts/.font-cache/ and are not committed.
The woff2 output IS committed, so a fresh clone does not need network access
or Python to build the site.

  Display : Big Shoulders Display (SIL OFL 1.1, Patric King) - variable 100-900
  Text    : Schibsted Grotesk     (SIL OFL 1.1, Schibsted)   - variable 400-900
"""

import pathlib
import sys
import urllib.request

from fontTools.subset import main as subset_main

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".font-cache"
OUT = ROOT / "public" / "fonts"

GF = "https://raw.githubusercontent.com/google/fonts/main/ofl"

FONTS = [
    {
        "name": "big-shoulders-display-variable",
        "url": f"{GF}/bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf",
        "cache": "BigShouldersDisplay-Variable.ttf",
        # Keep the weight axis so one file covers 100-900.
        "extra": ["--drop-tables+=DSIG"],
    },
    {
        "name": "schibsted-grotesk-variable",
        "url": f"{GF}/schibstedgrotesk/SchibstedGrotesk%5Bwght%5D.ttf",
        "cache": "SchibstedGrotesk-Variable.ttf",
        # Keep the weight axis intact so one file covers 400-900.
        "extra": ["--drop-tables+=DSIG"],
    },
]

# Basic Latin + Latin-1 Supplement covers the whole site plus the units and
# symbols we actually use: degree, superscript two (m2), multiplication sign
# (3.6 x 4.2 m), and accented characters that turn up in surnames.
# The additions are typographic punctuation we set deliberately.
UNICODES = ",".join(
    [
        "U+0020-007E",  # basic latin
        "U+00A0-00FF",  # latin-1 supplement (deg, sup2, multiply, accents)
        "U+2010-2015",  # hyphens and dashes
        "U+2018-201A",  # single quotes
        "U+201C-201E",  # double quotes
        "U+2022",  # bullet
        "U+2026",  # ellipsis
        "U+2032-2033",  # prime, double prime
        "U+2039-203A",  # single guillemets
        "U+2192",  # rightwards arrow
        "U+2212",  # minus sign
    ]
)

FEATURES = "kern,liga,clig,calt,tnum,onum,frac,ss01,ss02"


def fetch(url: str, dest: pathlib.Path) -> None:
    if dest.exists():
        print(f"  cached  {dest.name}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  fetch   {dest.name}")
    req = urllib.request.Request(url, headers={"User-Agent": "stonelane-build"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for font in FONTS:
        src = CACHE / font["cache"]
        fetch(font["url"], src)
        dest = OUT / f"{font['name']}.woff2"
        args = [
            str(src),
            f"--unicodes={UNICODES}",
            f"--layout-features={FEATURES}",
            "--flavor=woff2",
            "--desubroutinize",
            "--no-hinting",
            f"--output-file={dest}",
        ] + font["extra"]
        subset_main(args)
        before = src.stat().st_size / 1024
        after = dest.stat().st_size / 1024
        print(f"  subset  {dest.name}: {before:.0f} kB -> {after:.1f} kB woff2")
    return 0


if __name__ == "__main__":
    sys.exit(main())
