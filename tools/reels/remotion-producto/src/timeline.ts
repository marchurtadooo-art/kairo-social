// Única fuente de verdad del tiempo. 30 fps, música a 120 BPM → compás = 60 f, tiempo = 15 f.
// Todo lo demás (subtítulos, cámara, SFX) se escribe relativo a SHOTS.
export const FPS = 30;
export const BAR = 60;
export const W = 1080;
export const H = 1920;

export const SHOTS = {
  hook: { from: 0, dur: 2 * BAR }, //       0–120  gancho
  generar: { from: 2 * BAR, dur: 3 * BAR }, // 120–300  un clic → semana hecha
  baja: { from: 5 * BAR, dur: 4 * BAR }, //    300–540  baja → propuesta → decides tú
  publicar: { from: 9 * BAR, dur: 2.5 * BAR }, // 540–690 diálogo publicar
  movil: { from: 11.5 * BAR, dur: 2.5 * BAR }, // 690–840 le llega al móvil
  cifra: { from: 14 * BAR, dur: 2 * BAR }, //   840–960  +30 h al mes
  cierre: { from: 16 * BAR, dur: 2 * BAR }, //  960–1080 marca + CTA
};
export const TOTAL = SHOTS.cierre.from + SHOTS.cierre.dur; // 1080 f = 36 s

// Eventos clave (frames absolutos, derivados)
const g = SHOTS.generar.from;
const b = SHOTS.baja.from;
const p = SHOTS.publicar.from;
export const EV = {
  cardIn: 6,
  // S2 — cursor-performance (tiempos de la demo: entrada 30 f, hover 10 f, punch 12 f, hold 20 f)
  genCursorIn: g + 6,
  genClick: g + 46,
  genPull: g + 70, // tras el punch-in, la cámara se aleja a plano general (42 f)
  genReveal: g + 106, // barrido de revelado EN PLANO GENERAL (40 f)
  // S3
  bajaPatch: b + 24, // las dos celdas de Marta pasan a IT (parche local, sin doble exposición)
  bajaRing: b + 40,
  bajaSwap: b + 60, // cambio a la captura "baja" con la cámara cerrada (región idéntica)
  opciones: b + 98, // se despliega el panel de propuestas
  elegida: b + 176, // la responsable marca a Lucía
  // S4
  pubCursorIn: p + 32,
  pubClick: p + 72,
  // S5
  cardOut: SHOTS.movil.from - 34, // la tarjeta sale del todo (22 f) antes de que entre el móvil
  phoneIn: SHOTS.movil.from - 12,
  chipL: SHOTS.movil.from + 37,
  chipR: SHOTS.movil.from + 67,
  // S6 odómetro
  odo: SHOTS.cifra.from + 10, // entra cuando el móvil ya se ha ido
  // S7
  outroIn: SHOTS.cierre.from - 4,
};

// Subtítulos (blur-slide). **palabra** = acento degradado de marca.
// d = retraso por línea (la 2.ª línea de S2 entra con el barrido que escribe la semana)
export type Cap = { from: number; to: number; h: string[]; s?: string; d?: number[]; sd?: number }; // sd = retraso propio del subtítulo
export const CAPS: Cap[] = [
  // arranca 8 f antes del inicio: en el frame 0 ya se está leyendo la primera palabra (portada/autoplay)
  { from: SHOTS.hook.from - 8, to: SHOTS.generar.from - 4, h: ['¿Los turnos de tu hotel', 'aún salen de un **Excel**?'] },
  {
    from: SHOTS.generar.from + 6, to: SHOTS.baja.from, h: ['Un clic.', 'Y la semana, **hecha**.'],
    d: [0, 92], sd: 102, s: 'Con convenio, descansos y mínimos de cobertura.',
  },
  { from: SHOTS.baja.from + 8, to: EV.opciones - 6, h: ['¿Una baja de', '**última hora**?'] },
  {
    from: EV.opciones, to: SHOTS.publicar.from - 6, h: ['Te propone', 'quién **cubre**.'],
    s: 'Y lo que cuesta cada opción. Decides tú.',
  },
  {
    from: SHOTS.publicar.from + 6, to: SHOTS.movil.from - 8, h: ['Lo revisas', 'y lo **publicas**.'],
    s: 'Un correo a cada persona del equipo.',
  },
  { from: SHOTS.movil.from, to: SHOTS.cifra.from - 8, h: ['Y a cada uno le llega', '**su horario**.'] },
];

// Antetítulo de paso (onboarding) sobre el titular, fuera de la zona tapada por la interfaz de Reels
export const KICKERS = [
  { n: '1', label: 'Generar', from: SHOTS.generar.from + 2, to: SHOTS.baja.from - 6 },
  { n: '2', label: 'Bajas', from: SHOTS.baja.from + 2, to: SHOTS.publicar.from - 6 },
  { n: '3', label: 'Publicar', from: SHOTS.publicar.from + 2, to: SHOTS.cifra.from - 8 },
];
