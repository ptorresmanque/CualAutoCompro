#!/usr/bin/env python3
"""
Genera el set completo de assets de favicon que produciría favicongenerator.net
a partir de un SVG fuente. Produce: favicon.ico (16/32/48), PNGs por tamaño,
apple-touch-icon.png y site.webmanifest.

Uso: python3 scripts/generate-favicon.py
Salida: archivos en apps/frontend/public/

Por qué este script existe:
- favicongenerator.net es un web tool (sin API pública).
- El SVG fuente (`public/favicon.svg`) es el contrato visual.
- Este script lo rasteriza en los tamaños que Angular necesita en
  index.html y que esperan los browsers / Apple touch / PWA manifests.
- Determinístico: regenerable desde CI o localmente.

Dependencias: Pillow (PIL). En macOS: `pip3 install Pillow` o vía brew.
"""
from __future__ import annotations

import io
import struct
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

# Colores del sistema "Pizarra Digital" (ver tailwind.config.js)
INK = (15, 23, 42)        # slate-900 — texto principal
ACCENT = (30, 64, 175)    # blue-700  — engine (acento)
PAPER = (255, 255, 255)   # cards / surface

# Tamaños a generar (lo que favicongenerator.net produce + extras PWA)
SIZES_PNG = [16, 32, 48, 96, 180, 192, 512]
ICO_SIZES = [16, 32, 48]

# Brand mark: "c." — el mismo que usa top-nav-bar.component.html
BRAND_TEXT = "c."

# Buscar una fuente bold sans-serif disponible en el sistema.
FONT_CANDIDATES = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def find_font() -> str:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return path
    print("ERROR: no se encontró ninguna fuente bold en el sistema.", file=sys.stderr)
    print("Candidatos buscados:", *FONT_CANDIDATES, sep="\n  ", file=sys.stderr)
    sys.exit(1)


def draw_mark(size: int, font_path: str) -> Image.Image:
    """Dibuja el brand mark `c.` centrado en una imagen cuadrada."""
    img = Image.new("RGBA", (size, size), (*PAPER, 255))
    draw = ImageDraw.Draw(img)

    # Tamaño de fuente: ~75% del canvas para que el punto "." tenga aire
    font_size = int(size * 0.72)
    font = ImageFont.truetype(font_path, font_size)

    # Medir el texto y centrarlo
    bbox = draw.textbbox((0, 0), BRAND_TEXT, font=font, anchor="lt")
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    x = (size - text_w) / 2 - bbox[0]
    # Baseline nudge: los fonts suelen dejar más espacio arriba que abajo
    y = (size - text_h) / 2 - bbox[1] - size * 0.04

    draw.text((x, y), BRAND_TEXT, font=font, fill=ACCENT)
    return img


def save_png(img: Image.Image, path: Path) -> None:
    img.save(path, format="PNG", optimize=True)
    print(f"  ✓ {path.name} ({img.size[0]}x{img.size[1]})")


def write_ico(images: list[Image.Image], path: Path) -> None:
    """
    Empaqueta múltiples PNGs dentro de un .ico multi-resolución.
    Formato ICO: header (6 bytes) + N directorios (16 bytes c/u) + N PNG blobs.
    """
    buf = io.BytesIO()
    for img in images:
        img.save(buf, format="PNG")
    png_bytes_list = [b.getvalue() for b in [io.BytesIO(img.tobytes()) for img in []]]  # noqa
    # Re-encode via in-memory PNG para asegurar formato PNG-in-ICO (Win Vista+)
    png_blobs = []
    for img in images:
        b = io.BytesIO()
        img.save(b, format="PNG")
        png_blobs.append(b.getvalue())

    n = len(images)
    header = struct.pack("<HHH", 0, 1, n)
    offset = 6 + 16 * n

    entries = b""
    for img, blob in zip(images, png_blobs):
        w = img.size[0]
        h = img.size[1]
        # 0 = 256, los bytes guardan el tamaño real
        w_byte = 0 if w >= 256 else w
        h_byte = 0 if h >= 256 else h
        entry = struct.pack(
            "<BBBBHHII",
            w_byte, h_byte, 0, 0, 1, 32, len(blob), offset,
        )
        entries += entry
        offset += len(blob)

    path.write_bytes(header + entries + b"".join(png_blobs))
    print(f"  ✓ {path.name} (ICO multi-resolución: {[i.size[0] for i in images]})")


def write_manifest(public_dir: Path) -> None:
    manifest = {
        "name": "cualautocompro",
        "short_name": "cualautocompro",
        "description": "Comparador de autos nuevos en Chile",
        "icons": [
            {
                "src": "/android-chrome-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
            },
            {
                "src": "/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
            },
        ],
        "theme_color": "#1E40AF",
        "background_color": "#FFFFFF",
        "display": "standalone",
        "lang": "es-CL",
    }
    path = public_dir / "site.webmanifest"
    import json
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"  ✓ {path.name}")


def main() -> None:
    font_path = find_font()
    print(f"Fuente: {font_path}")
    print(f"Destino: {PUBLIC_DIR}")

    images_by_size: dict[int, Image.Image] = {}
    for size in SIZES_PNG:
        images_by_size[size] = draw_mark(size, font_path)

    print("\nPNGs:")
    save_png(images_by_size[16], PUBLIC_DIR / "favicon-16x16.png")
    save_png(images_by_size[32], PUBLIC_DIR / "favicon-32x32.png")
    save_png(images_by_size[96], PUBLIC_DIR / "favicon-96x96.png")
    save_png(images_by_size[180], PUBLIC_DIR / "apple-touch-icon.png")
    save_png(images_by_size[192], PUBLIC_DIR / "android-chrome-192x192.png")
    save_png(images_by_size[512], PUBLIC_DIR / "android-chrome-512x512.png")

    print("\nICO:")
    write_ico(
        [images_by_size[s] for s in ICO_SIZES],
        PUBLIC_DIR / "favicon.ico",
    )

    print("\nManifest:")
    write_manifest(PUBLIC_DIR)

    print("\nListo. Recordá referenciar todos los assets en index.html.")


if __name__ == "__main__":
    main()