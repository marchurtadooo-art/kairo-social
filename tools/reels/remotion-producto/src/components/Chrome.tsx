// Marco de la serie KAIRO (idéntico al Reel 02): marca arriba-izquierda, píldora mono arriba-derecha,
// indicador de pasos del onboarding y cierre con CTA.
import React from 'react';
import { E, fade, lerp, seg } from '../lib/m';
import { K } from '../theme';

export const Brand: React.FC<{ f: number; hideFrom: number }> = ({ f, hideFrom }) => {
  const o = 1 - seg(f, hideFrom, hideFrom + 10); // visible desde el frame 0
  if (o <= 0) return null;
  return (
    <>
      <div style={{ position: 'absolute', top: 150, left: 72, display: 'flex', alignItems: 'center', gap: 16, opacity: o }}>
        <div style={{ width: 58, height: 58, border: `1.5px solid ${K.hairline}`, borderRadius: 14, display: 'grid', placeItems: 'center',
          fontFamily: K.serif, fontSize: 38, paddingTop: 2, background: 'rgba(12,13,22,.75)', color: K.white }}>K</div>
        <div style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 25, letterSpacing: '.02em', color: K.white }}>KAIRO AI</div>
      </div>
      <div style={{ position: 'absolute', top: 160, right: 72, fontFamily: K.mono, fontSize: 22, color: K.mist, border: `1.5px solid ${K.hairline}`,
        borderRadius: 999, padding: '8px 18px', background: 'rgba(12,13,22,.6)', opacity: o }}>
        Producto real · datos ficticios
      </div>
    </>
  );
};

export const Outro: React.FC<{ f: number; from: number }> = ({ f, from }) => {
  const r = f - from;
  if (r < 0) return null;
  const bg = seg(r, 0, 16, E.inOutQuad);
  const mk = seg(r, 8, 26, (x) => E.outBack(x, 1.2));
  const lines = [['¿Cuántas', 'horas'], ['se', 'lleva', 'tu', '**cuadrante**'], ['cada', 'mes?']];
  const wp = (i: number) => seg(r, 16 + i * 3.5, 16 + i * 3.5 + 20, E.outCubic);
  const cta = seg(r, 50, 70, E.outCubic);
  const url = seg(r, 58, 76, E.outCubic);
  const disc = seg(r, 66, 84, E.outCubic);
  const DY = (40 / 34) * 86;
  const BL = (10 / 34) * 86;
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: bg,
      background: `radial-gradient(900px 800px at 90% 0%, oklch(55.5% .243 268.8 / .25), transparent 70%),
        radial-gradient(800px 700px at 0% 100%, oklch(57.4% .258 294.9 / .15), transparent 70%), ${K.void}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 84px 160px',
    }}>
      <div style={{ width: 92, height: 92, border: `1.5px solid ${K.hairline}`, borderRadius: 22, display: 'grid', placeItems: 'center',
        fontFamily: K.serif, fontSize: 62, paddingTop: 4, background: K.carbon, color: K.white, opacity: seg(r, 8, 16), transform: `scale(${lerp(mk, 0.86, 1)})`, transformOrigin: '0 50%' }}>K</div>
      <div style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 86, lineHeight: 1.05, letterSpacing: '-0.035em', marginTop: 54, color: K.white }}>
        {lines.map((ln, li) => (
          <div key={li} style={{ display: 'flex', columnGap: '0.24em' }}>
            {ln.map((w, wi) => {
              const p = wp(lines.slice(0, li).reduce((n, l) => n + l.length, 0) + wi);
              const hl = w.startsWith('**');
              return (
                <span key={wi} style={{ display: 'inline-block', opacity: p, transform: `translateY(${lerp(p, DY, 0)}px)`, filter: p < 0.999 ? `blur(${(1 - p) * BL}px)` : undefined,
                  ...(hl ? { backgroundImage: K.hl, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 6 } : null) }}>
                  {w.replace(/\*\*/g, '')}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ alignSelf: 'flex-start', marginTop: 60, background: K.electric, color: 'white', fontFamily: K.sans, fontWeight: 600, fontSize: 40,
        padding: '28px 46px', borderRadius: 999, boxShadow: '0 0 70px oklch(55.5% .243 268.8 / .5)', opacity: cta, transform: `translateY(${(1 - cta) * 30}px)` }}>
        Solicita una auditoría →
      </div>
      <div style={{ fontFamily: K.mono, fontSize: 34, marginTop: 36, color: K.white, opacity: url }}>kairoai.es</div>
      <div style={{ fontFamily: K.mono, fontSize: 28, color: K.mist, marginTop: 56, lineHeight: 1.5, opacity: disc }}>
        Producto desarrollado por KAIRO AI<br />para un hotel de Palma.<br />Nombres y datos de la demo, ficticios.
      </div>
    </div>
  );
};
