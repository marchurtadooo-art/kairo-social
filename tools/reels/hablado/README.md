# Plantilla «hablado» · vídeos de Marc hablando a cámara

Edición estilo explicador para Reels y TikTok (1080×1920, 30 fps). La cara de Marc pasa entre cuatro composiciones, cada idea lleva su animación de interfaz con la estética KAIRO, y los subtítulos van de 1 a 3 palabras. Está hecha con Remotion 4.0.484.

## Composiciones

| layout | qué se ve |
|---|---|
| `full` | cara a pantalla completa con un empuje lento; subtítulos a media altura |
| `split` | animación arriba y tarjeta de la cara abajo (esquinas superiores redondeadas); subtítulos en la costura |
| `pip` | cara pequeña arriba y animación debajo |
| `gfx` | sólo la animación |

Hay transición de 10 frames entre composiciones, con swoosh. La etiqueta `// TEXTO` se escribe letra a letra encima de cada animación.

## Flujo con una grabación real

```bash
# 1) unir clips, normalizar (HDR HLG/PQ → SDR BT.709 neutro), transcribir con Vosk
python3 build/prepare.py transcribe toma1.mp4 toma2.mp4
# 2) alinear con el guion: subtítulos con el texto exacto y lista de palabras fuera de guion (repeticiones, tomas falsas)
python3 build/prepare.py align guion.txt
# 3) cortar: quita los índices elegidos, aprieta pausas, limpia la voz (−16 LUFS) y sigue la cara
python3 build/prepare.py cut --drop 96-151,165-315
# 4) ajustar src/script.ts (frase de anclaje, composición, animación y etiqueta de cada escena) y revisar
./qa.sh v1 120 400 800 1200
# 5) render A (sin música) y B (con música), −14 LUFS, y copia ≤19 MB para la cola de Make
./finish.sh nombre-del-video
```

- `work/transcript.txt` lista las palabras con su índice y su tiempo. Ahí se eligen los cortes.
- `src/words.json` guarda los tiempos ya remapeados al montaje. Las escenas se anclan a frases del guion con `findPhrase`.
- `src/face-track.json` guarda el centro de la cara suavizado, para grabaciones andando. Si va vacío, el encuadre es fijo (`config.face`).
- `src/config.json` → `placeholder: true` usa `public/media/placeholder.mp4` en bucle, para diseñar sin grabación.

## Añadir una animación

1. Crea el componente en `src/gfx/scenes.tsx` con la firma `({ f, dur, box, props, eyebrow }) => <Stage …>…</Stage>`.
2. Regístralo en `GFX` y en el tipo `GfxName` de `script.ts`.
3. Añade sus golpes de sonido en `CUES` (`src/Main.tsx`). Los golpes se alinean por su pico (`sfx-peaks.json`); los sonidos continuos llevan `dur` y no se desplazan.

`Stage` centra el bloque (diseñado a 900 px), lo escala hasta 1,15× sin salirse de la zona y pone la etiqueta justo encima.

## Lo que no está en el repositorio

- **`node_modules`:** se instala con `npm ci`.
- **`public/media/`:** grabaciones de Marc. Son personales y no van en un repo público.
- **`public/audio/bgm.wav`:** música original sin derechos de terceros, generada con `tools/reels/music_chill.py` (o `music.py`).
- **`public/audio/sfx/`:** sonidos de la biblioteca de video-shotcraft (`assets/audio/sfx/<categoría>/`), Mixkit con licencia verificada en su `ATTRIBUTION.md`. La licencia de Mixkit no permite redistribuirlos sueltos, así que se copian de la biblioteca a `public/audio/sfx/`:
  - bass-hit-short, click-camera, data-compute, hitech-touch-magnet, pop-electric, switch-click-quick, switch-tap, swoosh-quick
  - typewriter-digital, typewriter-hit-soft, ui-message-pop, ui-notify-tech, ui-select-click, ui-success-soft
- **Modelo de voz Vosk:** español small, `vosk-model-small-es-0.3`.
- **Modelo de cara:** `build/models/haarcascade_frontalface_default.xml`, de opencv/opencv `data/haarcascades`, licencia Intel/BSD. Sí está incluido.

## Reglas de contenido (KAIRO)

- No salen clientes con nombre, precios, datos de contacto de terceros ni analíticas. Todo eso se difumina.
- No se usan testimonios inventados. Las recreaciones se marcan como tales.
- No se publica sin el OK de Marc.
