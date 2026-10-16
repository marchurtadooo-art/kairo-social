"""Upscale a Gemini scene image to 1440 px wide (Lanczos + light sharpen) for the reel."""
import sys
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
w = 1440
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
im.save(dst, "JPEG", quality=94)
print(dst, im.size)
