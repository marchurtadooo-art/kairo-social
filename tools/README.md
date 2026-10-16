# Herramientas de KAIRO AI para Instagram

## Póster "KAIRO AI Informa" (noticia cada 2 días)

```
pip install playwright pillow   # Chromium ya suele estar instalado; si no: playwright install chromium
python3 tools/news-poster/render_poster.py AAAA-MM/noticia-NNN/poster.json AAAA-MM/noticia-NNN/poster.jpg
```

- Formato: 1080×1350 JPEG (4:5), el que acepta Instagram para foto por API.
- Campos de `poster.json`: ver la cabecera de `render_poster.py`. Ejemplo real: `2026-10/noticia-001/`.
- Si el script avisa `OVERFLOW`, acorta titular o textos y vuelve a renderizar.
- Cada noticia lleva `poster.json`, `poster.jpg` y `caption.txt` en su carpeta.

### Criterios editoriales
- Noticia de IA de los últimos 2–3 días, útil o interesante para empresas (mejor si afecta a España/UE o a pymes).
- Verificada en una fuente primaria o en un medio fiable; nunca solo en un agregador. La fuente va en el póster y en el texto.
- Tono KAIRO: datos, sin hype, sin alarmismo. "Qué significa para tu empresa" en 1–2 frases.
- No repetir temas de los últimos pósters (ver carpetas anteriores).
- Texto del post: gancho con el dato, contexto, lectura de KAIRO, pregunta, fuente, "Más en kairoai.es (enlace en la bio)", 5–7 hashtags con #KAIROinforma.

### Publicar
1. Commit y push del póster a `main`.
2. URL pública (jsDelivr, fijada al commit): `https://cdn.jsdelivr.net/gh/marchurtadooo-art/kairo-social@<sha>/<ruta>/poster.jpg`. Comprobar que responde 200 con `image/jpeg`.
3. Registro en el data store de Make 220303 (cola), clave `AAAA-MM-noticia-NNN`, `tipo: foto`, `media: [{media_type: IMAGE, image_url}]`, `caption`, `fecha_publicacion` (ISO UTC) y `estado` (`borrador` hasta aprobación; `aprobado` cuando se pueda publicar).
4. El escenario "KAIRO Instagram - Publicador" (id 7983371) publica los `aprobado` cuya fecha ya ha llegado (cada hora, 08:00–21:00 Madrid).

## Fuentes tipográficas
Geist, JetBrains Mono y Playfair Display (licencia SIL Open Font License), desde Fontsource.
