"""Generate the app icons (yellow square with a white star). No dependencies.

Run: python3 tools/make_icons.py
"""
import math
import struct
import zlib
from pathlib import Path

BG = (255, 207, 77)
FG = (255, 255, 255)


def star(cx, cy, r_out, r_in, points=5):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = -math.pi / 2 + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def inside(x, y, poly):
    hit = False
    j = len(poly) - 1
    for i, (xi, yi) in enumerate(poly):
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def png(size, path):
    poly = star(size / 2, size * 0.53, size * 0.34, size * 0.14)
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # 2x2 supersampling for smooth edges
            cover = sum(inside(x + dx, y + dy, poly) for dx in (0.25, 0.75) for dy in (0.25, 0.75)) / 4
            row += bytes(round(b + (f - b) * cover) for b, f in zip(BG, FG))
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", raw) + chunk(b"IEND", b""))


out = Path(__file__).resolve().parent.parent / "icons"
for s in (192, 512):
    png(s, out / f"icon-{s}.png")
print("icons written to", out)
