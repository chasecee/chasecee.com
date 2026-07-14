#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import urllib.request
from pathlib import Path

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
VARIANTS_DIR = ROOT / "src/components/logo/variants"
MORPH_PATH = VARIANTS_DIR / "morphData.js"
FONTS_DIR = Path("/tmp/logo-fonts")
POINTS = 128
VIEW_W, VIEW_H = 402, 85
TEXT = "CHASE CEE"
TARGET_W, TARGET_H = 360, 68

# Append-only. Existing variants stay as canonical morph targets.
NEW_FONTS = [
    (
        "patuaOne",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/patuaone/PatuaOne-Regular.ttf",
        None,
    ),
    (
        "arvoBold",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/arvo/Arvo-Bold.ttf",
        None,
    ),
    (
        "zillaSlab",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/zillaslab/ZillaSlab-Bold.ttf",
        None,
    ),
    (
        "bowlbyOne",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/bowlbyone/BowlbyOne-Regular.ttf",
        None,
    ),
]


def flatten(commands, matrix):
    a, b, c, d, e, f = matrix
    transform = lambda p: (a * p[0] + c * p[1] + e, b * p[0] + d * p[1] + f)
    result, current = [], []
    position = start = (0.0, 0.0)
    for operation, args in commands:
        if operation == "moveTo":
            if current:
                result.append(current)
            position = start = args[0]
            current = [transform(position)]
        elif operation == "lineTo":
            position = args[0]
            current.append(transform(position))
        elif operation == "curveTo":
            p0, (p1, p2, p3) = position, args
            for index in range(1, 33):
                t = index / 32
                u = 1 - t
                current.append(
                    transform(
                        (
                            u**3 * p0[0]
                            + 3 * u * u * t * p1[0]
                            + 3 * u * t * t * p2[0]
                            + t**3 * p3[0],
                            u**3 * p0[1]
                            + 3 * u * u * t * p1[1]
                            + 3 * u * t * t * p2[1]
                            + t**3 * p3[1],
                        )
                    )
                )
            position = p3
        elif operation == "qCurveTo":
            points = list(args)
            if points and points[-1] is None:
                points[-1] = start
            p0 = position
            for index, control in enumerate(points):
                if control is None:
                    continue
                following = points[index + 1] if index < len(points) - 1 else None
                end = (
                    ((control[0] + following[0]) / 2, (control[1] + following[1]) / 2)
                    if following
                    else control
                )
                for step in range(1, 25):
                    t = step / 24
                    u = 1 - t
                    current.append(
                        transform(
                            (
                                u * u * p0[0] + 2 * u * t * control[0] + t * t * end[0],
                                u * u * p0[1] + 2 * u * t * control[1] + t * t * end[1],
                            )
                        )
                    )
                p0 = end
            position = p0
        elif operation in ("closePath", "endPath"):
            if current:
                result.append(current)
                current = []
            position = start
    if current:
        result.append(current)
    return [contour for contour in result if len(contour) > 2]


def area(contour):
    return abs(
        sum(
            contour[i][0] * contour[(i + 1) % len(contour)][1]
            - contour[(i + 1) % len(contour)][0] * contour[i][1]
            for i in range(len(contour))
        )
        / 2
    )


def center(contour):
    return (
        sum(p[0] for p in contour) / len(contour),
        sum(p[1] for p in contour) / len(contour),
    )


def sample(contour):
    closed = contour + [contour[0]]
    lengths = [math.dist(a, b) for a, b in zip(closed, closed[1:])]
    total = sum(lengths)
    if total == 0:
        return [closed[0]] * POINTS
    result, segment, consumed = [], 0, 0
    for index in range(POINTS):
        target = total * index / POINTS
        while segment < len(lengths) - 1 and consumed + lengths[segment] < target:
            consumed += lengths[segment]
            segment += 1
        start, end = closed[segment], closed[segment + 1]
        progress = (target - consumed) / lengths[segment] if lengths[segment] else 0
        result.append(
            (
                start[0] + (end[0] - start[0]) * progress,
                start[1] + (end[1] - start[1]) * progress,
            )
        )
    return result


def align(contour, target):
    best = None
    for points in (contour, [contour[0], *reversed(contour[1:])]):
        for shift in range(POINTS):
            rotated = points[shift:] + points[:shift]
            score = sum(math.dist(point, goal) ** 2 for point, goal in zip(rotated, target))
            if best is None or score < best[0]:
                best = (score, rotated)
    return best[1]


def load_font(ident, url, weight):
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    path = FONTS_DIR / f"{ident}.ttf"
    if not path.exists():
        urllib.request.urlretrieve(url, path)
    font = TTFont(path)
    if weight is not None:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    return font


def render_font(ident, url, weight):
    font = load_font(ident, url, weight)
    glyph_set = font.getGlyphSet()
    cmap = font["cmap"].getBestCmap()
    hmtx = font["hmtx"]
    upm = font["head"].unitsPerEm
    cursor = 0.0
    raw = []
    all_points = []
    for character in TEXT:
        if character == " ":
            cursor += upm * 0.35
            continue
        name = cmap[ord(character)]
        pen = RecordingPen()
        glyph_set[name].draw(pen)
        raw.append((name, pen.value, cursor))
        local = flatten(pen.value, (1, 0, 0, -1, cursor, 0))
        all_points.extend(point for contour in local for point in contour)
        cursor += hmtx[name][0]

    min_x = min(p[0] for p in all_points)
    max_x = max(p[0] for p in all_points)
    min_y = min(p[1] for p in all_points)
    max_y = max(p[1] for p in all_points)
    scale = min(TARGET_W / (max_x - min_x), TARGET_H / (max_y - min_y))
    fitted_w = (max_x - min_x) * scale
    fitted_h = (max_y - min_y) * scale
    tx = (VIEW_W - fitted_w) / 2 - min_x * scale
    ty = (VIEW_H - fitted_h) / 2 - min_y * scale

    contours = []
    paths = []
    for name, commands, offset in raw:
        matrix = (scale, 0, 0, -scale, tx + offset * scale, ty)
        shaped = sorted(flatten(commands, matrix), key=area, reverse=True)
        contours.append(shaped)
        svg_pen = SVGPathPen(glyph_set)
        glyph_set[name].draw(TransformPen(svg_pen, matrix))
        paths.append(svg_pen.getCommands())
    return contours, paths


def canonical_slots(variants):
    slots = []
    for glyph_index in range(8):
        glyph = variants[0]["glyphs"][glyph_index]
        stride = POINTS * 2
        glyph_slots = []
        for offset in range(0, len(glyph), stride):
            points = [
                (glyph[offset + i], glyph[offset + i + 1]) for i in range(0, stride, 2)
            ]
            glyph_slots.append(points)
        slots.append(glyph_slots)
    return slots


def write_svg(ident, paths):
    body = "".join(
        f'<path d="{path}" fill="currentColor" fill-rule="evenodd"/>' for path in paths
    )
    (VARIANTS_DIR / f"{ident}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_W} {VIEW_H}">{body}</svg>\n'
    )


def main():
    source = MORPH_PATH.read_text()
    variants = json.loads(source.split("export const MORPH_VARIANTS = ", 1)[1].rsplit(";", 1)[0])
    point_count = int(source.split("MORPH_POINT_COUNT = ", 1)[1].split(";", 1)[0])
    if point_count != POINTS:
        raise SystemExit(f"expected {POINTS} points, found {point_count}")

    existing = {variant["id"] for variant in variants}
    slots = canonical_slots(variants)
    added = []

    for ident, url, weight in NEW_FONTS:
        if ident in existing:
            print("skip existing", ident)
            continue
        contours, paths = render_font(ident, url, weight)
        glyphs = []
        for glyph_index, glyph_slots in enumerate(slots):
            shaped = contours[glyph_index]
            flat = []
            for slot, target in enumerate(glyph_slots):
                if slot < len(shaped):
                    points = align(sample(shaped[slot]), target)
                else:
                    origin = center(target)
                    points = [origin] * POINTS
                flat.extend(round(value, 2) for point in points for value in point)
            glyphs.append(flat)
        variants.append({"id": ident, "paths": paths, "glyphs": glyphs})
        write_svg(ident, paths)
        added.append(ident)
        print(
            ident,
            "contours",
            [len(c) for c in contours],
            "slots",
            [len(s) for s in slots],
        )

    cycle_ms = int(source.split("MORPH_CYCLE_MS = ", 1)[1].split(";", 1)[0])
    MORPH_PATH.write_text(
        f"export const MORPH_POINT_COUNT = {POINTS};\n"
        f"export const MORPH_CYCLE_MS = {cycle_ms};\n\n"
        "export const MORPH_VARIANTS = "
        + json.dumps(variants, separators=(",", ":"))
        + ";\n"
    )
    print("wrote", MORPH_PATH, "variants", len(variants), "added", added)


if __name__ == "__main__":
    main()
