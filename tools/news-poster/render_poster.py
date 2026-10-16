"""Render a "KAIRO AI Informa" news poster (1080x1350 JPEG, Instagram 4:5) from a JSON file.

Usage: python3 tools/news-poster/render_poster.py <poster.json> <out.jpg>

poster.json fields (required: numero, fecha, categoria, titular, fuente):
  numero      "001"                      issue number
  fecha       "17.10.2026"               publication date
  categoria   "Empresa · España"         short tag (e.g. "Última hora", "Herramientas", "Regulación · UE")
  titular     headline; wrap 1-3 key words in <em>…</em> for the gradient highlight
  entradilla  optional, 1-2 sentences under the headline (useful for impact news without figures)
  hero        optional {"valor": 60, "sufijo": "%", "texto": "..."}  valor 0-100 with sufijo "%" draws a ring;
              otherwise {"valor": "3×", "texto": "..."} shows a big figure. Needs 1-2 "datos" beside it.
  datos       optional, 0-2 items [{"valor": "6%", "texto": "..."}]
  problema    optional, the real pain this news reveals for a company, as a concrete example (1-2 sentences)
  solucion    optional, how it is solved in practice, without overselling (1-2 sentences)
  lectura     used when problema/solucion are absent: what it means for a company (1-2 sentences)
  fuente      outlet + date (+ original source if different); must be verifiable

Layouts:
  data news    -> hero + datos (+ problema/solucion or lectura)
  impact news  -> entradilla (+ optional datos) + problema + solucion
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
    # keep <em> highlights, escape everything else
    return html.escape(str(s)).replace("&lt;em&gt;", "<em>").replace("&lt;/em&gt;", "</em>")


def stat(d):
    return f'<div class="stat"><div class="v">{esc(d["valor"])}</div><div class="t">{esc(d["texto"])}</div></div>'


datos = data.get("datos", [])[:2]
hero = data.get("hero")
data_block = ""
if hero:
    if hero.get("sufijo") == "%" and isinstance(hero["valor"], (int, float)) and 0 <= hero["valor"] <= 100:
        r = 90
        c = 2 * 3.14159265 * r
        filled = c * hero["valor"] / 100
        val = f'{hero["valor"]:g}'.replace(".", ",")
        visual = (
            '<div class="ring"><svg viewBox="0 0 210 210">'
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="oklch(55.5% .243 268.8)"/>'
            '<stop offset="1" stop-color="oklch(57.4% .258 294.9)"/></linearGradient></defs>'
            f'<circle cx="105" cy="105" r="{r}" fill="none" stroke="oklch(100% 0 0 / .08)" stroke-width="16"/>'
            f'<circle cx="105" cy="105" r="{r}" fill="none" stroke="url(#g)" stroke-width="16" stroke-linecap="round" '
            f'stroke-dasharray="{filled:.1f} {c:.1f}"/></svg>'
            f'<div class="val">{val}%</div></div>'
        )
    else:
        visual = f'<div class="big">{esc(hero["valor"])}{esc(hero.get("sufijo", ""))}</div>'
    data_block = (f'<div class="data"><div class="hero">{visual}<div class="txt">{esc(hero["texto"])}</div></div>'
                  f'<div class="side">{"".join(stat(d) for d in datos)}</div></div>')
elif datos:
    cls = "stats-row one" if len(datos) == 1 else "stats-row"
    data_block = f'<div class="{cls}">{"".join(stat(d) for d in datos)}</div>'

if data.get("problema") and data.get("solucion"):
    insight_block = (f'<div class="ps"><div class="box prob"><div class="k">El problema</div><div class="t">{esc(data["problema"])}</div></div>'
                     f'<div class="box sol"><div class="k">Cómo se resuelve</div><div class="t">{esc(data["solucion"])}</div></div></div>')
else:
    insight_block = (f'<div class="insight"><div class="k">Qué significa para tu empresa</div>'
                     f'<div class="t">{esc(data.get("lectura", ""))}</div></div>')

entradilla_block = f'<p class="lead">{esc(data["entradilla"])}</p>' if data.get("entradilla") else ""

title_len = len(data["titular"].replace("<em>", "").replace("</em>", ""))
if not hero:  # more room for the headline in impact layouts
    headline_size = "80px" if title_len <= 60 else ("68px" if title_len <= 85 else "60px")
else:
    headline_size = "74px" if title_len <= 70 else ("66px" if title_len <= 95 else "58px")

page_html = Template((here / "template.html").read_text(encoding="utf-8")).substitute(
    numero=esc(data["numero"]), fecha=esc(data["fecha"]), categoria=esc(data["categoria"]),
    titular=esc(data["titular"]), headline_size=headline_size, entradilla_block=entradilla_block,
    data_block=data_block, insight_block=insight_block, fuente=esc(data["fuente"]),
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
