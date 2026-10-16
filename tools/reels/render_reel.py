"""Render an HTML animation (window.setTime(t)) to an Instagram-ready Reel MP4.

Usage:
  python3 render_reel.py <dir> stills 1.0 5.0 ...      # QA frames as PNG
  python3 render_reel.py <dir> video [music.mp3]        # full render (+ optional music)

Output spec (Instagram Reels via API): 1080x1920, 30 fps, H.264 high, yuv420p,
<=5 Mbps VBR, closed GOP, AAC 48 kHz stereo 128 kbps, moov atom at the front.
"""
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

FPS = 30
DURATION = float(__import__("os").environ.get("REEL_DURATION", "24"))
W, H = 1080, 1920

d = Path(sys.argv[1]).resolve()
mode = sys.argv[2]
html = d / "reel.html"
out = d / "out"
out.mkdir(exist_ok=True)


def open_page(p):
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    page.goto(html.as_uri())
    page.wait_for_load_state("networkidle")
    page.evaluate("document.fonts.ready")
    return browser, page


if mode == "stills":
    with sync_playwright() as p:
        browser, page = open_page(p)
        for ts in sys.argv[3:]:
            page.evaluate(f"setTime({float(ts)})")
            page.screenshot(path=str(out / f"still-{float(ts):05.2f}.png"))
        browser.close()
    sys.exit(0)

music = Path(sys.argv[3]).resolve() if len(sys.argv) > 3 else None
silent = out / "reel-sin-musica.mp4"
enc = subprocess.Popen(
    ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
     "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-pix_fmt", "yuv420p",
     "-b:v", "4200k", "-maxrate", "4800k", "-bufsize", "9600k", "-g", "60", "-keyint_min", "60",
     "-sc_threshold", "0", "-flags", "+cgop", "-r", str(FPS), "-movflags", "+faststart", str(silent)],
    stdin=subprocess.PIPE)
with sync_playwright() as p:
    browser, page = open_page(p)
    n = int(DURATION * FPS)
    for i in range(n):
        page.evaluate(f"setTime({i / FPS})")
        enc.stdin.write(page.screenshot(type="jpeg", quality=95))
    browser.close()
enc.stdin.close()
enc.wait()
print("video:", silent)

if music:
    final = out / "reel-final.mp4"
    fade_start = DURATION - 2.0
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(music),
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
         "-af", f"afade=t=in:st=0:d=0.4,afade=t=out:st={fade_start}:d=2.0,loudnorm=I=-14:TP=-1.5:LRA=11",
         "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
         "-t", str(DURATION), "-movflags", "+faststart", str(final)], check=True)
    print("final:", final)
