// data/odometer-digit-roll (OdometerDigitRoll.tsx): cada dígito es una tira 0–9 ×2 que gira a 0,85 filas/f,
// frena desde 20+i·7 f en 16 f out-cubic hasta +0,5 fila (sobrepaso) y vuelve en 6 f; 2 estelas (0.25/0.12)
// con compuerta de velocidad; al bloquear todo: pulso de tinta + escala 1.035 en 8 f, etiqueta entra después.
// Valores reales: "+30 h" → dígitos 3 y 0. "+" y "h" no ruedan.
import React from 'react';
import { interpolate, interpolateColors, Easing } from 'remotion';
import { K } from '../theme';
import { seg, E } from '../lib/m';

const FS = 300;
const ROW = 320;
const DW = 206; // el "0" de Geist 600 a 300 px mide ≈196 px
const SPIN = 0.85;
const DIGITS = [3, 0];

const posAt = (f: number, i: number): number => {
  const d = DIGITS[i];
  const s = 20 + i * 7;
  const p0 = SPIN * s;
  const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
  if (f < s) return SPIN * Math.max(f, 0);
  if (f < s + 16) return interpolate(f, [s, s + 16], [p0, T + 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  if (f < s + 22) return interpolate(f, [s + 16, s + 22], [T + 0.5, T], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return T;
};
export const ODO_LOCKS = [20 + 22, 27 + 22]; // frames relativos de cada "clac"

const glyph: React.CSSProperties = {
  height: ROW, lineHeight: `${ROW}px`, textAlign: 'center', fontSize: FS, fontWeight: 600,
  fontVariantNumeric: 'tabular-nums', fontFamily: K.sans, letterSpacing: '-0.04em',
};

const Strip: React.FC<{ pos: number; color: string; opacity?: number; dy?: number }> = ({ pos, color, opacity = 1, dy = 0 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: DW, transform: `translateY(${-(pos % 10) * ROW + dy}px)`, opacity }}>
    {Array.from({ length: 20 }).map((_, k) => (
      <div key={k} style={{ ...glyph, width: DW, color }}>{k % 10}</div>
    ))}
  </div>
);

const Reel: React.FC<{ r: number; i: number; color: string }> = ({ r, i, color }) => {
  const pos = posAt(r, i);
  const speed = Math.abs(pos - posAt(r - 1, i));
  const gate = interpolate(speed, [0.06, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'relative', width: DW, height: ROW, overflow: 'hidden' }}>
      {gate > 0.001 && (
        <>
          <Strip pos={pos} color={color} opacity={0.25 * gate} dy={ROW * 0.5} />
          <Strip pos={pos} color={color} opacity={0.12 * gate} dy={-ROW * 0.5} />
        </>
      )}
      <Strip pos={pos} color={color} />
    </div>
  );
};

export const Odometer: React.FC<{ f: number; start: number; exit: number }> = ({ f, start, exit }) => {
  const r = f - start;
  if (r < -6 || exit >= 1) return null;
  const L = ODO_LOCKS[1];
  // pulso: blanco → eléctrico suave → blanco (en fondo oscuro "más tinta" = más luz)
  // pulso de la carta ("más tinta" en fondo claro) → en fondo oscuro, más luz: base algo apagada → blanco puro + halo
  const ink = interpolateColors(r, [L, L + 4, L + 8], ['#dfe2f2', '#ffffff', '#dfe2f2']);
  const glow = interpolate(r, [L, L + 4, L + 8], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ps = interpolate(r, [L, L + 4, L + 8], [1, 1.035, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const enter = seg(r, -6, 6, E.outCubic);
  const lab = seg(r, L + 3, L + 21, E.outCubic);
  const lab2 = seg(r, L + 11, L + 29, E.outCubic);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: enter * (1 - exit), filter: exit > 0 ? `blur(${exit * 12}px)` : undefined }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', alignItems: 'center',
        transform: `scale(${ps})`, transformOrigin: '540px 160px', color: ink, textShadow: `0 0 ${40 * glow}px oklch(78% .13 268.8 / ${0.8 * glow})` }}>
        <div style={{ ...glyph, width: 170, color: ink }}>+</div>
        <Reel r={r} i={0} color={ink} />
        <Reel r={r} i={1} color={ink} />
        <div style={{ ...glyph, width: 40 }} />
        <div style={{ ...glyph, color: ink }}>h</div>
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 900, textAlign: 'center', opacity: lab, transform: `translateY(${(1 - lab) * 30}px)` }}>
        <div style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 84, letterSpacing: '-0.035em', lineHeight: 1.05,
          backgroundImage: K.hl, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 8 }}>al mes</div>
        <div style={{ fontFamily: K.sans, fontSize: 40, lineHeight: 1.3, color: K.mist, marginTop: 26 }}>que ya no se van en hacer cuadrantes.</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1170, display: 'flex', justifyContent: 'center', opacity: lab2 }}>
        <div style={{ fontFamily: K.mono, fontSize: 32, color: K.white, border: `1.5px solid ${K.hairline}`, borderRadius: 999, padding: '12px 26px', background: 'rgba(18,19,29,.7)' }}>
          Caso real · hotel en Palma
        </div>
      </div>
    </div>
  );
};
