# Reels de KAIRO AI

Vídeos verticales 1080×1920, 30 fps, H.264 + AAC, listos para la API de Instagram.

## Piezas
- `render_reel.py <carpeta> stills t1 t2 …` → fotogramas de revisión; `render_reel.py <carpeta> video [musica.wav]` → `out/reel-sin-musica.mp4` y `out/reel-final.mp4`. La carpeta debe tener un `reel.html` con `window.setTime(t)`. Duración con `REEL_DURATION` (por defecto 24 s).
- `music_chill.py out.wav` → **música por defecto** (aprobada por Marc el 17/10): 120 BPM a medio tiempo, piano eléctrico, bajo cálido, sin golpes. `MUSIC_CFG='{"ticks":[…],"tick_notes":[…],"fix_ticks":[…],"chime":20.6}'` para los "tic" sincronizados con la animación.
- `music.py` → versión con más energía (la del Reel 01). Marc la encontró "demasiado de anuncio": no usar por defecto.
- `hablado/` → **plantilla de vídeos de Marc hablando a cámara** (Remotion): cara que pasa entre pantalla completa, pantalla partida, tarjeta pequeña o sin cara; animaciones de interfaz por idea, subtítulos de 1–3 palabras y efectos de sonido. Transcribe, corta repeticiones y pausas, sigue la cara si graba andando y entrega a −14 LUFS más una copia ≤19 MB para Make. Instrucciones en `hablado/README.md`.
- `ejemplo-post-02/` → reel de recreación con personajes: `reel.html` (escenas con zoom lento, textos, tarjeta de cuadrante animada, cierre) y `prep.py` (reescala las imágenes de Gemini a 1440 px).

## Proceso de vídeo con personajes
1. Guion de ~24 s en compases de 2 s: problema real → solución KAIRO → resultado → CTA.
2. Imágenes en el Gemini de Marc (Chrome), modo "Crear imagen", 9:16, en la misma conversación para mantener personajes. Personajes fijos: Laura (directora de recepción de hotel, moño castaño, blazer azul marino) y Álex (consultor KAIRO, ~30 años, barba corta, camisa oscura). Estilo: "Ilustración 3D estilizada de animación moderna… estilo propio y original… fondo azul oscuro con acentos violeta y azul eléctrico… espacio libre arriba para texto. Sin texto, sin logotipos."
3. Descargar a tamaño completo (necesita el OK y un clic de Marc), leer desde Descargas, `prep.py`, montar, renderizar, revisar fotogramas.
4. Siempre: "Recreación · caso real" en pantalla y "Personajes ficticios · ilustraciones generadas con IA" en el cierre y en el texto del post.
5. Textos e interfaz en la mitad superior y nunca encima de caras; la franja inferior la tapa Instagram.

Las fuentes (`../fonts`) se cargan desde `tools/fonts`: ajusta las rutas `@font-face` del `reel.html` si cambias la carpeta.
