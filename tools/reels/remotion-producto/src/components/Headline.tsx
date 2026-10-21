// typography/blur-slide adaptado a 9:16: y + blur + opacity atados al MISMO progreso p (outCubic),
// stagger por palabra ≈3.5 f (titular) / ≈2.5 f (subtítulo), subtítulo solapado 32 f con el titular.
// Parámetros de la demo escalados por tamaño de letra (dy = 40/34·fs, blur = 10/34·fs).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { E, lerp, seg } from '../lib/m';
import { K } from '../theme';
import { CAPS, Cap, KICKERS } from '../timeline';

const HFS = 80;
const SFS = 40;
const WORD_WIN = 20; // 0.32 × 64 f
const H_GAP = 3.5; // carta: >8 palabras → 0.035 de ventana ≈ 2.3 f
const H_GAP_LONG = 2.3;
const S_GAP = 2.5;
const S_DELAY = 32;
const DY_H = (40 / 34) * HFS;
const DY_S = (26 / 40) * DY_H; // relación titular/subtítulo de la demo (40 vs 26)
const BLUR = (10 / 34) * HFS;
const OUT = 8;

type Tok = { w: string; hl: boolean };
const tokens = (line: string): Tok[] => {
  const out: Tok[] = [];
  let hl = false;
  for (const raw of line.split(' ')) {
    let w = raw;
    const starts = w.startsWith('**');
    if (starts) { w = w.slice(2); hl = true; }
    const ends = w.includes('**');
    w = w.replace('**', '');
    out.push({ w, hl });
    if (ends) hl = false;
  }
  return out;
};

const Word: React.FC<{ t: Tok; p: number; dy: number; blur: number }> = ({ t, p, dy, blur }) => (
  <span
    style={{
      display: 'inline-block',
      opacity: p,
      transform: `translateY(${lerp(p, dy, 0)}px)`,
      filter: p < 0.999 ? `blur(${(1 - p) * blur}px)` : undefined,
      ...(t.hl
        ? { backgroundImage: K.hl, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 6 }
        : null),
    }}
  >
    {t.w}
  </span>
);

const OneCap: React.FC<{ c: Cap; f: number }> = ({ c, f }) => {
  if (f < c.from || f > c.to + OUT) return null;
  const out = seg(f, c.to, c.to + OUT, E.inOutQuad);
  const nWords = c.h.reduce((n, l) => n + l.split(' ').length, 0);
  const gap = nWords > 8 ? H_GAP_LONG : H_GAP;
  const lastDelay = c.d ? c.d[c.d.length - 1] : 0;
  let k = 0;
  return (
    <div
      style={{
        position: 'absolute', left: 72, right: 72, top: 312,
        opacity: 1 - out, transform: `translateY(${-24 * out}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      <div style={{ fontFamily: K.sans, fontWeight: 600, fontSize: HFS, lineHeight: 1.06, letterSpacing: '-0.035em', color: K.white }}>
        {c.h.map((line, li) => (
          <div key={li} style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.24em' }}>
            {tokens(line).map((t, i) => {
              const a = c.from + (c.d ? c.d[li] : 0) + (c.d ? i : k) * gap;
              const p = seg(f, a, a + WORD_WIN, E.outCubic);
              k++;
              return <Word key={i} t={t} p={p} dy={DY_H} blur={BLUR} />;
            })}
          </div>
        ))}
      </div>
      {c.s ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', marginTop: 20, fontFamily: K.sans, fontWeight: 400, fontSize: SFS, lineHeight: 1.3, color: K.mist }}>
          {tokens(c.s).map((t, i) => {
            const a = c.from + (c.sd ?? lastDelay + S_DELAY) + i * S_GAP;
            return <Word key={i} t={t} p={seg(f, a, a + WORD_WIN, E.outCubic)} dy={DY_S} blur={BLUR} />;
          })}
        </div>
      ) : null}
    </div>
  );
};

const Kicker: React.FC<{ f: number; n: string; label: string; from: number; to: number }> = ({ f, n, label, from, to }) => {
  const p = seg(f, from, from + 16, E.outCubic) * (1 - seg(f, to, to + OUT, E.inOutQuad));
  if (p <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 72, top: 254, display: 'flex', alignItems: 'center', gap: 16, opacity: p,
      transform: `translateY(${(1 - seg(f, from, from + 16, E.outCubic)) * 14}px)`, fontFamily: K.mono, fontSize: 32, letterSpacing: '.06em' }}>
      <span style={{ color: K.electricSoft }}>PASO {n}/3</span>
      <span style={{ width: 28, height: 2, background: K.hairline, display: 'inline-block' }} />
      <span style={{ color: K.white, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
};

export const Headlines: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {KICKERS.map((k) => (
        <Kicker key={k.n} f={f} {...k} />
      ))}
      {CAPS.map((c, i) => (
        <OneCap key={i} c={c} f={f} />
      ))}
    </>
  );
};
