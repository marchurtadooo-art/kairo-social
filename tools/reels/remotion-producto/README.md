# Reels de producto con capturas reales (Remotion)

Plantilla usada en el Post 03 (herramienta de cuadrantes). Sirve para enseñar cualquier producto web de KAIRO en 9:16 con su propia interfaz.

## Cómo funciona
- Capturas reales de la app a 2x/3x (Playwright) con **datos ficticios**, en `public/textures/` + `layout.json` con las cajas de los botones. El script de captura vive con cada proyecto (no se sube aquí: apunta al código del cliente).
- `src/timeline.ts`: única fuente de tiempos (30 fps, compás de 60 f a 120 BPM). Subtítulos, antetítulos de paso y eventos salen de aquí.
- `src/components/Screen.tsx`: tarjeta-pantalla con cámara 2.5D (CSS `zoom` → texto nítido).
- `Cursor.tsx` (cursor con clic y onda), `Headline.tsx` (titulares blur-slide), `Phone.tsx` (móvil con ondas y chips), `Odometer.tsx` (cifra), `Chrome.tsx` (marco KAIRO y cierre con CTA).
- `src/sfx.ts`: SFX con el pico clavado al frame de la acción (compensa el retardo AAC medido). Los archivos de sonido no se suben: salen de la librería video-shotcraft (`assets/audio/sfx`, licencia libre Mixkit).
- Música: `../music_chill.py` con `MUSIC_BARS=18` → 36 s → `public/audio/bgm.wav`.

## Producción
```bash
npm ci
./qa.sh v1 0 120 300 600 900          # fotogramas sueltos + hoja de contacto
npx remotion render src/index.ts Reel03 out/con.mp4 --crf=12 --pixel-format=yuv420p --color-space=bt709
npx remotion render src/index.ts Reel03 out/sin.mp4 --crf=12 --pixel-format=yuv420p --color-space=bt709 --props=props-nobgm.json
./finalize.sh out/con.mp4 out/sin.mp4 out/final.mp4 out/final-sin-musica.mp4   # −14 LUFS, etiquetas bt709
```
Límite: ≤19 MB por archivo (jsDelivr no sirve más de 20 MB).

`DISENO-reel03.md` es el diseño completo del Post 03 (brief, decisiones, storyboard, desviaciones y revisión).
