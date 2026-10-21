// Utilidades de movimiento (puras, deterministas). Curvas tomadas de las demos de video-shotcraft.
import { Easing, interpolate } from 'remotion';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

export const E = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  // cámara KAIRO: arranque decidido, llegada muy suave
  cam: Easing.bezier(0.16, 1, 0.3, 1),
  glide: Easing.bezier(0.33, 0, 0.15, 1),
  // cámara tranquila: arranque suave (sin salto de velocidad) y llegada larga
  camSoft: Easing.bezier(0.45, 0, 0.15, 1),
};

/** progreso 0..1 entre los frames a y b con curva */
export const seg = (f: number, a: number, b: number, ease: (t: number) => number = E.linear) =>
  ease(clamp01((f - a) / (b - a)));

export const fade = (f: number, inA: number, inB: number, outA?: number, outB?: number) => {
  let v = seg(f, inA, inB);
  if (outA !== undefined && outB !== undefined) v *= 1 - seg(f, outA, outB);
  return v;
};

export type Cam = { cx: number; cy: number; zoom: number };
export type CamKey = Cam & { f: number; ease?: (t: number) => number };

/** interpola claves de cámara; cada tramo usa la curva de la clave de llegada */
export const camAt = (f: number, keys: CamKey[]): Cam => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) {
      const t = interpolate(f, [a.f, b.f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const e = (b.ease ?? E.glide)(t);
      // zoom en espacio logarítmico: velocidad de acercamiento constante a la vista
      return { cx: lerp(e, a.cx, b.cx), cy: lerp(e, a.cy, b.cy), zoom: Math.exp(lerp(e, Math.log(a.zoom), Math.log(b.zoom))) };
    }
  }
  return keys[keys.length - 1];
};

/** escala la cámara m veces alrededor del punto de página P (P se queda quieto en pantalla) */
export const punchAbout = (c: Cam, px: number, py: number, m: number): Cam => ({
  cx: px + (c.cx - px) / m,
  cy: py + (c.cy - py) / m,
  zoom: c.zoom * m,
});
