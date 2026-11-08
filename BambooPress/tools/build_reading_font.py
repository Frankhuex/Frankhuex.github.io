#!/usr/bin/env python3
"""Build the BambooPress reading font from the full Noto Serif SC variable TTF."""

import argparse
import json
import unicodedata
from pathlib import Path
from tempfile import TemporaryDirectory

from fontTools import subset
from fontTools.ttLib import TTFont


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="full NotoSerifSC[wght].ttf")
    args = parser.parse_args()
    output = root / "fonts" / "reading-serif.woff"

    # Keep basic Latin and the ideographic space used for two-character indents.
    characters = set(range(0x20, 0x7F)) | {0x3000}
    # Retain legacy characters for search text and links.
    characters.update(map(ord, "\u00a0→⋯垦州拴航"))
    for book in sorted((root / "books").glob("*.json")):
        for text in strings(json.loads(book.read_text(encoding="utf-8"))):
            characters.update(ord(char) for char in text if char.isprintable())

    with TTFont(args.source, recalcTimestamp=False) as font:
        available = set(font.getBestCmap())
        missing_han = [
            chr(code) for code in sorted(characters - available)
            if unicodedata.name(chr(code), "").startswith("CJK ")
        ]
        if missing_han:
            parser.error("source font lacks required Han characters: " + "".join(missing_han))
        if "fvar" not in font or not any(
            axis.axisTag == "wght" and axis.minValue <= 200 and axis.maxValue >= 900
            for axis in font["fvar"].axes
        ):
            parser.error("source font must provide variable weights 200–900")

        options = subset.Options()
        options.name_IDs = ["*"]
        builder = subset.Subsetter(options=options)
        builder.populate(unicodes=characters & available)
        builder.subset(font)
        font.flavor = "woff"
        with TemporaryDirectory(dir=output.parent) as directory:
            candidate = Path(directory) / output.name
            font.save(candidate)
            candidate.replace(output)

    print(f"{output.name}: {len(characters & available)} characters, {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
