// effects/radial-ripple-phone-chips (RadialRipplePhoneChips.tsx) en versión oscura KAIRO:
// 4 círculos concéntricos con respiración desfasada (escala 1±0.06, 1,5 ciclos, desfase 1,7 rad),
// móvil con sombra de apoyo y pantalla en auto-scroll LINEAL, dos chips con pop outBack (0.8→1, 0.12 de la ventana)
// izquierdo antes que derecho, y flotación ±px que entra gradualmente tras el pop.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { E, lerp, seg } from '../lib/m';
import { K } from '../theme';

const RSZ = [1260, 990, 720, 472]; // 560/440/320/210 de la demo × 2,25 (480 → 1080)
const RCOL = ['#1c1f35', '#181a2d', '#141625', '#10121d']; // del más contrastado (fuera) al más cercano al fondo

export const PhoneScene: React.FC<{
  f: number; from: number; dur: number; // ventana de la carta (t = 0..1)
  enter: number; // 0..1 entrada del móvil
  exit: number; // 0..1 salida
  chipL: { at: number; text: string };
  chipR: { at: number; text: string };
}> = ({ f, from, dur, enter, exit, chipL, chipR }) => {
  const t = (f - from) / dur;
  const vis = Math.min(enter, 1 - exit);
  if (vis <= 0) return null;
  const cyRings = 996;
  const PW = 480, PH = 980, BEZ = 14; // móvil (termina en y≈1486, por encima del indicador de pasos)
  const sw = PW - 2 * BEZ;
  const zoomScreen = sw / 390; // captura 390 px CSS de ancho
  const scroll = seg(t, 0.08, 0.98) * 96; // lineal (auto-scroll, no "dedo")
  const chip = (at: number, ph: number): React.CSSProperties => {
    const p = seg(f, at, at + 20, (x) => E.outBack(x));
    const fl = Math.sin(t * Math.PI * 2 * 2 + ph) * 5 * seg(f, at + 20, at + 50);
    return { opacity: seg(f, at, at + 13), transform: `scale(${lerp(p, 0.8, 1)}) translateY(${fl}px)` };
  };
  const chipBase: React.CSSProperties = {
    position: 'absolute', padding: '22px 34px', borderRadius: 999, background: 'oklch(55.5% .243 268.8)', color: '#ffffff',
    fontFamily: K.sans, fontWeight: 600, fontSize: 34, whiteSpace: 'nowrap', boxShadow: '0 18px 44px rgba(0,0,0,.45), 0 0 40px oklch(55.5% .243 268.8 / .35)',
    display: 'flex', alignItems: 'center', gap: 14,
  };
  const dot = (c: string) => <span style={{ width: 14, height: 14, borderRadius: 7, background: c, display: 'inline-block' }} />;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {RSZ.map((size, i) => (
        <div key={i} style={{
          position: 'absolute', left: 540 - size / 2, top: cyRings - size / 2, width: size, height: size, borderRadius: '50%',
          background: RCOL[i], opacity: vis, transform: `scale(${(1 + 0.06 * Math.sin(t * Math.PI * 2 * 1.5 + i * 1.7)) * lerp(enter, 0.85, 1)})`,
        }} />
      ))}
      <div style={{
        position: 'absolute', left: 540 - PW / 2, top: 506, width: PW, height: PH, borderRadius: 64, background: '#191a22',
        boxShadow: '0 50px 110px rgba(0,0,0,.6), inset 0 0 0 2px rgba(255,255,255,.08)', opacity: seg(enter, 0, 0.12) * (1 - seg(exit, 0.7, 1)),
        transform: `translateY(${lerp(enter, 260, 0) + lerp(exit, 0, -40)}px) scale(${lerp(exit, 1, 0.92)})`,
      }}>
        <div style={{ position: 'absolute', left: BEZ, top: BEZ, width: sw, height: PH - 2 * BEZ, borderRadius: 52, overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 390, zoom: zoomScreen, transform: `translateY(${44 - scroll / zoomScreen}px)` }}>
            <Img src={staticFile('textures/movil-mis-turnos.png')} style={{ width: 390, height: 844, display: 'block' }} />
          </div>
          {/* isla */}
          <div style={{ position: 'absolute', left: sw / 2 - 62, top: 14, width: 124, height: 34, borderRadius: 17, background: '#0d0e13' }} />
        </div>
      </div>
      <div style={{ ...chipBase, top: 1226, right: 1080 - 610, ...chip(chipL.at, 0), opacity: (chip(chipL.at, 0).opacity as number) * (1 - exit) }}>{dot('#ffffff')}{chipL.text}</div>
      <div style={{ ...chipBase, top: 1336, left: 470, ...chip(chipR.at, 1.8), opacity: (chip(chipR.at, 1.8).opacity as number) * (1 - exit) }}>{dot('#A9D08E')}{chipR.text}</div>
    </div>
  );
};
