"""Render a "KAIRO AI Informa" news poster (1080x1350 JPEG, Instagram 4:5) from a JSON file.

Usage: python3 tools/news-poster/render_poster.py <poster.json> <out.jpg>

poster.json fields:
  numero      "001"                      issue number
  fecha       "17.10.2026"               publication date
  categoria   "Empresa · España"         short tag
  titular     headline; wrap 1-3 key words in <em>…</em> for the gradient highlight
  hero        {"valor": 60, "sufijo": "%", "texto": "..."}  valor 0-100 with sufijo "%" draws a ring;
              otherwise {"valor": "3×", "texto": "..."} shows a big figure
  datos       1-2 items [{"valor": "6%", "texto": "..."}]
  lectura     1-2 sentences: what it means for a company (KAIRO's angle, no hype)
  fuente      outlet + date (+ original source if different); must be verifiable
"""
import html
import json
import sys
from pathlib import Path
from string import Template
from playwright.sync_api import sync_playwright
from PIL import Image

here = Path(__file__).resolve().parent
data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
out = Path(sys.argv[2]).resolve()


def esc(s):
    # keep <em> highlights in headlines, escape everything else
    return html.escape(s).replace("&lt;em&gt;", "<em>").replace("&lt;/em&gt;", "</em>")


hero = data["hero"]
if hero.get("sufijo") == "%" and isinstance(hero["valor"], (int, float)) and 0 <= hero["valor"] <= 100:
    r = 90
    c = 2 * 3.14159265 * r
    filled = c * hero["valor"] / 100
    val = f'{hero["valor"]:g}'.replace(".", ",")
    hero_visual = (
        '<div class="ring"><svg viewBox="0 0 210 210">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="oklch(55.5% .243 268.8)"/>'
        '<stop offset="1" stop-color="oklch(57.4% .258 294.9)"/></linearGradient></defs>'
        f'<circle cx="105" cy="105" r="{r}" fill="none" stroke="oklch(100% 0 0 / .08)" stroke-width="16"/>'
        f'<circle cx="105" cy="105" r="{r}" fill="none" stroke="url(#g)" stroke-width="16" stroke-linecap="round" '
        f'stroke-dasharray="{filled:.1f} {c:.1f}"/></svg>'
        f'<div class="val">{val}%</div></div>'
    )
else:
    hero_visual = f'<div class="big">{esc(str(hero["valor"]))}{esc(hero.get("sufijo", ""))}</div>'

datos = "".join(f'<div class="stat"><div class="v">{esc(d["valor"])}</div><div class="t">{esc(d["texto"])}</div></div>'
                for d in data["datos"][:2])

title_len = len(data["titular"].replace("<em>", "").replace("</em>", ""))
headline_size = "74px" if title_len <= 70 else ("66px" if title_len <= 95 else "58px")

page_html = Template((here / "template.html").read_text(encoding="utf-8")).substitute(
    numero=esc(data["numero"]), fecha=esc(data["fecha"]), categoria=esc(data["categoria"]),
    titular=esc(data["titular"]), headline_size=headline_size, hero_visual=hero_visual,
    hero_texto=esc(hero["texto"]), datos=datos, lectura=esc(data["lectura"]), fuente=esc(data["fuente"]),
)
tmp = here / "_render.html"
tmp.write_text(page_html, encoding="utf-8")
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1350})
        pg.goto(tmp.as_uri())
        pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        overflow = pg.evaluate("(() => { const w = document.querySelector('.wrap'); return w.scrollHeight > w.clientHeight + 1; })()")
        png = out.with_suffix(".png")
        pg.screenshot(path=str(png))
        b.close()
    Image.open(png).convert("RGB").save(out, "JPEG", quality=92)
    png.unlink()
finally:
    tmp.unlink(missing_ok=True)
print("poster:", out, "| OVERFLOW: shorten texts" if overflow else "| layout ok")
