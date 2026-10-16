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
Objetivo: tener a la gente informada y consciente de que automatizar ya no puede esperar. Se busca el dolor real de una empresa y se explica cómo se resuelve, sin vender humo y sin hacer la pelota.

Dos tipos de noticia, alternándolos:
1. **Dato / tendencia** (como la N.º 001): estudios, adopción, costes, regulación práctica. Maqueta con `hero` + `datos`.
2. **Impacto / titular**: noticias grandes que la gente comenta (caída de un proveedor de IA, un modelo que supera una prueba relevante, un lanzamiento que cambia precios, un fallo sonado de una empresa por usar mal la IA…). Maqueta con `entradilla` (+ `datos` si los hay).

En los dos tipos, preferiblemente `problema` + `solucion`: el problema real que la noticia pone sobre la mesa, con un ejemplo concreto de empresa ("si tu atención al cliente depende de…"), y cómo se resuelve en la práctica. Si la noticia no da para un problema claro, usa `lectura`.

Reglas:
- Noticia de IA de los últimos 2–3 días. Verificada en fuente primaria o medio fiable; nunca solo en un agregador. La fuente va en el póster y en el texto.
- Hechos exactos: nada de inflar cifras, ni alarmismo, ni titulares que la fuente no sostiene.
- No repetir temas de los últimos pósters (ver carpetas anteriores).
- Texto del post: gancho con la noticia → el problema con un ejemplo real de empresa → cómo se resuelve (lo que hacemos en KAIRO, sin promesas) → pregunta al lector → fuente → "Más en kairoai.es (enlace en la bio)" → 5–7 hashtags con #KAIROinforma.

### Publicar
1. Commit y push del póster a `main`.
2. URL pública (jsDelivr, fijada al commit): `https://cdn.jsdelivr.net/gh/marchurtadooo-art/kairo-social@<sha>/<ruta>/poster.jpg`. Comprobar que responde 200 con `image/jpeg`.
3. Registro en el data store de Make 220303 (cola), clave `AAAA-MM-noticia-NNN`, `tipo: foto`, `media: [{media_type: IMAGE, image_url}]`, `caption`, `fecha_publicacion` (ISO UTC) y `estado` (`borrador` hasta aprobación; `aprobado` cuando se pueda publicar).
4. El escenario "KAIRO Instagram - Publicador" (id 7983371) publica los `aprobado` cuya fecha ya ha llegado (cada hora, 08:00–21:00 Madrid).

## Fuentes tipográficas
Geist, JetBrains Mono y Playfair Display (licencia SIL Open Font License), desde Fontsource.
