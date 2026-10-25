#!/bin/bash
# uso: ./qa.sh etiqueta f1 f2 ... → out/qa/<etiqueta>-fNNN.png + hoja de contacto
cd "$(dirname "$0")"
TAG=$1; shift
npx remotion bundle src/index.ts --out-dir build/bundle >/dev/null 2>&1
for F in "$@"; do
  npx remotion still build/bundle Hablado out/qa/$TAG-f$(printf %04d $F).png --frame=$F >/dev/null 2>&1 || echo "fallo $F"
done
python3 - "$TAG" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
tag, frames = sys.argv[1], sys.argv[2:]
ims = [Image.open(f"out/qa/{tag}-f{int(f):04d}.png").convert("RGB").resize((360, 640)) for f in frames]
cols = min(6, len(ims)); rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 370, rows * 670), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, frames)):
    x, y = (i % cols) * 370 + 5, (i // cols) * 670 + 25
    sheet.paste(im, (x, y)); d.text((x, y - 18), f"f{f}", fill=(255, 255, 255))
sheet.save(f"out/qa/{tag}-sheet.jpg", quality=85)
print(f"out/qa/{tag}-sheet.jpg")
PY
