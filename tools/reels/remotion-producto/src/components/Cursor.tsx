// interaction/input-trigger-moves · A cursor-performance (CursorPerformancePunchIn.tsx), en espacio de página:
// cursor por Bézier cúbica desde abajo-izquierda con sobrepaso de muñeca (t→1.05 en f24, vuelta en 6 f),
// hover 4 f, clic con hundimiento del botón (0.94) + onda (Ø out-cubic 22 f / opacidad lineal 26 f, desacopladas)
// y punch-in 1→1.4 que aplica la cámara (ver punchFactor). Cursor y botón viven en la misma capa (sin deriva).
import React from 'react';
import { Img, interpolate, Easing, staticFile } from 'remotion';
import { PAGE_H, PAGE_W } from './Screen';

const T = { inEnd: 30, click: 40, punchEnd: 52, holdEnd: 72, backEnd: 90 };

// trayectoria de la demo (lienzo 1920) relativa al punto de clic
const REL = { p0: [-1485, 832], p1: [-845, 907], p2: [130, 392] };

export type Btn = { x: number; y: number; w: number; h: number; plate: string; radius?: number; src: string };

/** factor de punch-in de la demo para un clic que ocurre en `start + 40` */
export const punchFactor = (f: number, start: number, peak = 1.4, back = true) => {
  const r = f - start;
  if (r < T.holdEnd || !back) {
    return interpolate(r, [T.click, T.punchEnd], [1, peak], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  }
  return interpolate(r, [T.holdEnd, T.backEnd], [peak, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
};

export const CursorPerformance: React.FC<{
  f: number;
  start: number; // frame en que el cursor empieza a entrar (clic = start + 40)
  click: { x: number; y: number };
  btn: Btn;
  baseZoom: number; // zoom de cámara típico del plano → tamaño visual constante del cursor/onda
  scaleK?: number; // escala lienzo-demo → tarjeta (936/1920)
  fadeOutAt?: number;
  coverY?: number; // y de página por encima de la cual el botón ya está tapado (barrido de revelado)
}> = ({ f, start, click, btn, baseZoom, scaleK = 936 / 1920, fadeOutAt, coverY = 0 }) => {
  const r = f - start;
  if (r < 0) return null;
  const k = scaleK / baseZoom; // px demo → px de página
  const P0 = { x: click.x + REL.p0[0] * k, y: click.y + REL.p0[1] * k };
  const P1 = { x: click.x + REL.p1[0] * k, y: click.y + REL.p1[1] * k };
  const P2 = { x: click.x + REL.p2[0] * k, y: click.y + REL.p2[1] * k };
  const P3 = click;
  const t = r < 24
    ? interpolate(r, [0, 24], [0, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
    : interpolate(r, [24, T.inEnd], [1.05, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const u = 1 - t;
  const cx = u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x;
  const cy = u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y;
  const dip = interpolate(r, [T.click, T.click + 2, T.click + 6], [0, 3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) / baseZoom;

  const lift = interpolate(r, [T.inEnd, T.inEnd + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const press = interpolate(r, [T.click, T.click + 2, T.click + 6], [1, 0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hoverScale = 1 + 0.05 * lift;

  const rippleAlive = r >= T.click && r < T.click + 26;
  const rd = interpolate(r, [T.click, T.click + 22], [60, 380], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) * k * 1.35;
  const rop = interpolate(r, [T.click, T.click + 26], [0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rbw = interpolate(r, [T.click, T.click + 22], [9, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * k * 1.35;

  const out = fadeOutAt !== undefined ? interpolate(f, [fadeOutAt, fadeOutAt + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const cs = 56 / baseZoom; // cursor ≈56 px en pantalla
  const bs = hoverScale * press;
  const showBtn = lift > 0 && out > 0;

  return (
    <>
      {showBtn ? (
        <>
          {/* placa de fondo bajo el botón recortado: el original no asoma al hundirse */}
          <div style={{ position: 'absolute', left: btn.x - 4, top: btn.y - 4, width: btn.w + 8, height: btn.h + 8, background: btn.plate, opacity: out,
            clipPath: coverY > btn.y - 4 ? `inset(${Math.min(btn.h + 8, coverY - (btn.y - 4))}px 0 0 0)` : undefined }} />
          <div
            style={{
              position: 'absolute', left: btn.x, top: btn.y, width: btn.w, height: btn.h, overflow: 'hidden',
              borderRadius: btn.radius ?? 6, transform: `scale(${bs})`, transformOrigin: '50% 50%',
              boxShadow: `0 ${6 * lift}px ${16 * lift}px rgba(20,22,40,${0.22 * lift})`,
              clipPath: coverY > btn.y ? `inset(${Math.min(btn.h, coverY - btn.y)}px 0 0 0)` : undefined,
              opacity: coverY >= btn.y + btn.h ? 0 : 1,
            }}
          >
            <Img src={staticFile(btn.src)} style={{ position: 'absolute', left: -btn.x, top: -btn.y, width: PAGE_W, height: PAGE_H, maxWidth: 'none' }} />
            {/* hover: aclarado del botón oscuro (visible sobre fondo oscuro, regla de la carta) */}
            <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.13 * lift})` }} />
          </div>
        </>
      ) : null}
      {rippleAlive ? (
        <div style={{ position: 'absolute', left: click.x - rd / 2, top: click.y - rd / 2, width: rd, height: rd, borderRadius: '50%',
          border: `${rbw}px solid oklch(55.5% .243 268.8)`, opacity: rop * out }} />
      ) : null}
      <svg width={cs} height={cs} viewBox="0 0 28 28"
        style={{ position: 'absolute', left: cx - (cs * 2) / 28, top: cy + dip - cs / 28, opacity: out,
          filter: `drop-shadow(0 ${4 / baseZoom}px ${7 / baseZoom}px rgba(0,0,0,0.4))`, overflow: 'visible' }}>
        <path d="M2 1 L2 23 L8 17.5 L11.5 25 L15.5 23.2 L12 15.8 L20 15 Z" fill="#ffffff" stroke="#1b1d2b" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};
