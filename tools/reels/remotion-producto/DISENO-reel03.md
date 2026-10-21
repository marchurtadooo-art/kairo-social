# Reel 03 · Cuadrantes en un clic — diseño y plan de rodaje

Modo: creación libre autónoma (Marc: "Sí, decídelo tú"). Producto real (app de cuadrantes que KAIRO hizo para un hotel de Palma), datos 100 % ficticios.

## 0 · Brief de producto

- **Qué es**: web app de cuadrantes de turnos para hoteles. Genera la semana con un solver respetando convenio, descansos y mínimos de cobertura; cuando hay una baja, propone quién cubre y qué cuesta cada opción (el sistema propone, la persona decide); al publicar, avisa por correo a cada empleado y cada uno ve su horario en el móvil.
- **Para quién es el vídeo**: directores/as de hotel y responsables de RR. HH. en Mallorca (seguidores de @kairoai.es). Objetivo: que vean un producto real funcionando y pidan una auditoría.
- **Mensaje**: "Los turnos dejan de salir de un Excel: un clic, la baja se resuelve con criterio y a cada uno le llega su horario. +30 h al mes recuperadas (caso real)."
- **Cifra**: Marc confirma 30–50 h/mes → se usa "+30 h al mes" (límite inferior, defendible).
- **Formato**: Reel 9:16, 1080×1920, 30 fps, 36 s (18 compases de 2 s a 120 BPM), español.
- **Audio**: música propia tranquila (music_chill, 18 compases; Marc rechazó la enérgica por "de anuncio"). SFX discretos.

## Tabla requisito → decisión

| Requisito | Decisión |
|---|---|
| No sacar el nombre del hotel ni datos reales | Páginas `/demo` en copia local con "Hotel Demo", 10 empleados inventados, semana 26 oct–1 nov 2026. Nada se sube al repo del cliente. Etiqueta fija "Producto real · datos ficticios". |
| "Enseñándolo, un pequeño onboarding" | Recorrido en 3 pasos del flujo real (generar → bajas → publicar) más el resultado en el móvil del empleado. Capturas reales de la app (Playwright, 2x). |
| Reel captativo | Gancho con pregunta-dolor en 0–4 s; cada paso con titular grande; cifra final con odómetro; CTA. |
| Coherencia con la serie | Mismo marco que el Reel 02 (K · KAIRO AI arriba izquierda, píldora mono arriba derecha, fondo void, Geist + acento eléctrico/violeta, CTA "Solicita una auditoría →"). El Reel 02 cuenta la historia del mismo caso; este enseña el producto. |
| Diálogo de publicar | Se ocultan en la captura los dos avisos internos (modo prueba / no reintentar): son notas de operación para la clienta, no aportan al espectador y uno expone una limitación interna. El resto del diálogo es el real. |

## 1 · Dirección visual (elegida)

"Pantalla iluminada sobre el void de KAIRO": la UI clara del producto (sus propios colores de turno: M #F4B183, T #A9D08E, N #A6A6A6, P #E2EFDA, IT #FFFF00) flota como una tarjeta-pantalla sobre el fondo oscuro de la marca, con cámara 2.5D dentro de la tarjeta. La tipografía y el color de rótulos son los de KAIRO (no se inventa estética nueva).

Tokens:
- Fondo `--void oklch(12.4% .013 273.4)` ≈ #0b0c14, superficie `--carbon` ≈ #12131d, eléctrico #4b5cf0 (oklch 55.5% .243 268.8), eléctrico suave #a9b4ff, violeta #8a4dff, texto #f3f4fb, niebla #b5b9cc, filete blanco 14 %.
- Tipos: Geist 600 (titulares 80 px, interlineado 1.06, tracking −0.035em), Geist 400 (subtítulos 40 px), JetBrains Mono (antetítulo de paso 32 px, etiquetas ≥28 px), Inter (lo que trae la propia UI).
- Tarjeta-pantalla: 936×900 px (x 72, y 590), radio 34, filete blanco 14 %, sombra 0 40px 120px rgba(0,0,0,.55) + halo eléctrico 0 0 0 1px.
- Movimiento: preset "profesional de confianza" ajustado a calma: duración principal ~24 f, entradas bezier(0.16,1,0.3,1) para cámara, sin rebote salvo donde hay aterrizaje (chips outBack, odómetro sobre-paso medio dígito). Nada de shake (Q3).

Styleframe: se omite el HTML aparte; el marco ya está validado y publicado en el Reel 02 (misma marca) y la UI es captura real. Se valida con stills de Remotion en cada plano.

## 2 · Funciones → planos (cartas)

| Función | Carta / variante | Por qué |
|---|---|---|
| Gancho / producto vacío | `camera/overhead-camera-moves` A (tilt-reveal) adaptado a la tarjeta + `typography/blur-slide` | Un solo protagonista entrando (Q5), titular por defecto profesional |
| Generar con un clic | `interaction/input-trigger-moves` A (cursor-performance) + revelado por barrido | El clic es el gatillo; el cuadrante "se escribe" de arriba abajo |
| Baja → propuesta → decides tú | PageCam: empuje a las celdas IT, paneo al panel de propuestas, cambio de estado real (Lucía elegida) | Movimiento de cámara motivado, no otra animación-protagonista |
| Publicar y avisar | `input-trigger-moves` A (2.º y último uso, ≤2 por pieza) | Segundo gatillo de párrafo |
| Le llega al móvil | `effects/radial-ripple-phone-chips` (en versión oscura) | Plano "esto es" del móvil, con dos chips |
| Cifra | `data/odometer-digit-roll` "+30 h" | Cifra estrella a pantalla completa, una sola vez |
| Cierre | Cierre de marca de la serie (K + pregunta + CTA + web), blur-slide | Coherencia con Reel 02; hold ≥1 s (R1) |

## 3 · Storyboard final (v3, 30 fps, compás = 60 f)

| # | Tiempo | Plano | Movimiento clave |
|---|---|---|---|
| S1 | 0–4 s (0–120) | Gancho "¿Los turnos de tu hotel / aún salen de un Excel?" (visible desde el frame 0) — la tarjeta con la semana vacía hace tilt-reveal (franja a −80° 25 f → sube 43 f con sobrepaso) y queda quieta ≥35 f | tilt-reveal según TiltReveal.tsx |
| S2 | 4–10 s (120–300) | "PASO 1/3 · GENERAR" · "Un clic." — acercamiento al botón, cursor + clic + punch-in 1.4 → alejamiento a plano general (parrilla completa, nombres a domingo) → barrido de 40 f que escribe la semana; entra "Y la semana, hecha." + "Con convenio, descansos y mínimos de cobertura." | cursor-performance + barrido en plano general |
| S3 | 10–18 s (300–540) | "PASO 2/3 · BAJAS" · "¿Una baja de última hora?" — encuadre de Marta con nombres y fechas; solo sus dos celdas pasan a IT (parche local), anillo; "Te propone quién cubre." · "Y lo que cuesta cada opción. Decides tú." — el panel se despliega hacia abajo (recorte, sin fundido de páginas) y la cámara baja a zoom 2.3 sobre las dos opciones; cambio de estado instantáneo a "Lucía marcada + motivo" (captura real de ese estado) | cámara suave (arranque sin salto) |
| S4 | 18–23 s (540–690) | "PASO 3/3 · PUBLICAR" · "Lo revisas y lo publicas." · "Un correo a cada persona del equipo." — diálogo completo; cursor pulsa "Sí, publicar y avisar a 10" sin punch-in | cursor-performance (2.º uso, sin acercamiento) |
| S5 | 23–28 s (690–840) | "Y a cada uno le llega su horario." — la tarjeta sale del todo y después entra el móvil ("Mis turnos" de Joan), ondas, chips eléctricos "Aviso por correo" / "Su semana, en el móvil" | radial-ripple-phone-chips |
| S6 | 28–32 s (840–960) | "+30 h" odómetro · "al mes" · "que ya no se van en hacer cuadrantes." · "Caso real · hotel en Palma" | odometer-digit-roll |
| S7 | 32–36 s (960–1080) | K + "¿Cuántas horas / se lleva tu cuadrante / cada mes?" + "Solicita una auditoría →" + kairoai.es + aviso | blur-slide; todo quieto desde f1040 (≈1,3 s, ≥1 s de R1) |

Sonido: música tranquila a 0,42 (sin batería en S1 y en el cierre); 17 SFX con el pico clavado al frame de la acción (src/sfx.ts). Desfase de audio medido por correlación (Remotion 4.0.484, AAC 48 kHz, mp4): +1,28 f para todos los SFX, compensado en `at()` de sfx.ts; además, en el render v3 los SFX que empiezan a partir de ~f880 salían +2,1 f más tarde (causa sin identificar en el ensamblado de audio), compensado con −2 f para picos ≥ f840 y verificado de nuevo sobre el render final (ver tabla de verificación al final). Mezcla con música: +7,2 dB y limitador → ≈ −14 LUFS, ≈ −1,2 dBTP. Sin música: misma ganancia recortada al pico disponible, sin limitador.

Exportación: H.264 yuv420p, CRF 12, etiquetas bt709 (primaries/transfer/matrix) en el flujo; ≤19 MB por el límite de 20 MB de jsDelivr.

## Desviaciones conscientes (aesthetic-rules / cartas)

- **S1 música tranquila, no tech-house** (S1 de aesthetic-rules): decisión explícita de Marc, la enérgica le pareció "de anuncio".
- **Cierre tranquilo, no "foto de familia" de máxima energía** (Q8): coherencia con el cierre de la serie (Reel 02) y con el tono calmado pedido.
- **Chips sobre el móvil** (radial-ripple, "已知坑" de la posición): en 9:16 no caben a los lados del móvil; se colocan sobre la zona vacía inferior de la pantalla y el bisel, con fondo eléctrico para contrastar.
- **Segundo clic sin punch-in**: el acercamiento recortaba el diálogo; la carta permite dos usos del cursor, se conserva la gramática (trayectoria, hover, hundimiento, onda) sin el empuje.
- **Marca y píldora en los 220 px superiores**: igual que el Reel 02 aprobado (marco de la serie).
- **Capturas retocadas**: ocultos los avisos internos del diálogo de publicar y la nota de RR. HH. de la vista móvil (menciona la herramienta del cliente); corregida la errata "semana Semana del…" del diálogo (se avisa a Marc para corregirla en el producto).

Revisión: informe independiente v2 en review/informe.md (APTO CON CAMBIOS) → cambios en v3; segunda revisión independiente en review/informe-v3.md (APTO CON CAMBIOS: N1–N8, N13–N14) → cambios en v4.

Pendientes aceptados (menores): franja del tilt ilegible en f0–f24 (es la naturaleza del plano a −80°); recortes en los bordes de la tarjeta (pie de página, última línea del panel); la parrilla muestra 9 de 10 filas (la 10.ª queda bajo el scroll de la propia app); guion/raya distintos en fechas entre diálogo y móvil (detalle de la app).
