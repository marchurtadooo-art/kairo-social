// Piezas comunes de las animaciones de interfaz (estética KAIRO: void, tarjetas carbón, acento eléctrico, etiquetas mono).
import React from 'react';
import { E, lerp, seg } from '../lib/m';
import { K } from '../theme';

export type Box = { x: number; y: number; w: number; h: number };
export type GfxProps = { f: number; dur: number; box: Box; props?: Record<string, unknown>; eyebrow?: string };

export const C = {
  card: '#11131f',
  card2: '#171a29',
  line: 'rgba(255,255,255,.10)',
  line2: 'rgba(255,255,255,.18)',
  text: '#f3f4fb',
  mist: '#b5b9cc',
  dim: '#7f8399',
  electric: '#4b5cf0',
  soft: '#a9b4ff',
  violet: '#8a4dff',
  bad: '#ff5c6c',
  warn: '#f2b84f',
  good: '#46d39a',
};

/** entrada estándar de un elemento: sube 24 px y aparece */
export const enter = (f: number, at: number, d = 10) => {
  const p = seg(f, at, at + d, E.cam);
  return { opacity: seg(f, at, at + d * 0.6), transform: `translateY(${lerp(p, 26, 0)}px) scale(${lerp(p, 0.96, 1)})` };
};
export const pop = (f: number, at: number, d = 9, s = 1.7) => {
  const p = seg(f, at, at + d, (u) => E.outBack(u, s));
  return { opacity: seg(f, at, at + 3), transform: `scale(${lerp(p, 0.4, 1)})` };
};

export const Card: React.FC<{ style?: React.CSSProperties; glow?: number; children?: React.ReactNode }> = ({ style, glow = 0, children }) => (
  <div
    style={{
      background: C.card, border: `1.5px solid ${glow > 0 ? `rgba(110,124,255,${0.35 + 0.5 * glow})` : C.line}`, borderRadius: 26,
      boxShadow: `0 24px 60px rgba(0,0,0,.45)${glow > 0 ? `, 0 0 ${50 * glow}px rgba(75,92,240,${0.45 * glow})` : ''}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 22, color = C.mist, style }) => (
  <span style={{ fontFamily: K.mono, fontSize: size, letterSpacing: '.06em', color, ...style }}>{children}</span>
);

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'electric' | 'bad' | 'good' | 'warn' | 'dim'; style?: React.CSSProperties }> = ({ children, tone = 'electric', style }) => {
  const col = { electric: C.soft, bad: C.bad, good: C.good, warn: C.warn, dim: C.mist }[tone];
  const bg = { electric: 'rgba(75,92,240,.16)', bad: 'rgba(255,92,108,.14)', good: 'rgba(70,211,154,.14)', warn: 'rgba(242,184,79,.14)', dim: 'rgba(255,255,255,.06)' }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: K.mono, fontSize: 21, letterSpacing: '.08em', textTransform: 'uppercase', color: col, background: bg, border: `1.5px solid ${col}55`, borderRadius: 999, padding: '7px 16px', ...style }}>
      {children}
    </span>
  );
};

/** etiqueta de escena "// TEXTO" escrita letra a letra con cursor */
export const Eyebrow: React.FC<{ f: number; text: string; x: number; y: number }> = ({ f, text, x, y }) => {
  const full = `// ${text.toUpperCase()}`;
  const n = Math.min(full.length, Math.floor(Math.max(0, f - 2) * 1.4));
  const cursorOn = Math.floor(f / 8) % 2 === 0 || n < full.length;
  return (
    <div style={{ position: 'absolute', left: x, top: y, fontFamily: K.mono, fontSize: 26, letterSpacing: '.12em', color: C.soft, whiteSpace: 'nowrap' }}>
      {full.slice(0, n)}
      <span style={{ display: 'inline-block', width: 14, height: 26, marginLeft: 4, verticalAlign: '-4px', background: C.soft, opacity: cursorOn ? 1 : 0 }} />
    </div>
  );
};

/** sello girado tipo pegatina */
export const Stamp: React.FC<{ f: number; at: number; text: string; tone?: 'bad' | 'electric' | 'warn'; rot?: number; style?: React.CSSProperties }> = ({ f, at, text, tone = 'bad', rot = -8, style }) => {
  if (f < at) return null;
  const p = seg(f, at, at + 8, (u) => E.outBack(u, 2.2));
  const bg = { bad: C.bad, electric: C.electric, warn: C.warn }[tone];
  return (
    <div style={{
      position: 'absolute', fontFamily: K.sans, fontWeight: 700, fontSize: 64, letterSpacing: '-0.01em', color: tone === 'warn' ? '#1a1306' : '#fff',
      background: bg, borderRadius: 18, padding: '10px 30px 12px', transform: `rotate(${rot}deg) scale(${lerp(p, 2.2, 1)})`, opacity: seg(f, at, at + 3),
      boxShadow: `0 18px 50px ${bg}66`, ...style,
    }}>{text}</div>
  );
};

type IconName = 'globe' | 'cart' | 'calendar' | 'building' | 'lock' | 'unlock' | 'server' | 'shield' | 'alert' | 'check' | 'send' | 'message' | 'code' | 'spark' | 'user';
const PATHS: Record<IconName, React.ReactNode> = {
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 8H6.3" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10.5 20.5v-4h3v4" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  unlock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" /></>,
  server: <><rect x="4" y="4" width="16" height="7" rx="2" /><rect x="4" y="13" width="16" height="7" rx="2" /><path d="M8 7.5h.01M8 16.5h.01" /></>,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M8.8 12.2l2.2 2.2 4.4-4.4" /></>,
  alert: <><path d="M12 4l9 16H3l9-16z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  send: <><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" /></>,
  message: <><path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" /></>,
  code: <><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" /></>,
  spark: <><path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M5.6 18.4l3.5-3.5M14.9 9.1l3.5-3.5" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" /></>,
};
export const Icon: React.FC<{ name: IconName; size?: number; color?: string; stroke?: number; style?: React.CSSProperties }> = ({ name, size = 40, color = C.text, stroke = 1.8, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {PATHS[name]}
  </svg>
);

/** baldosa de icono con brillo (como el "hub" de la referencia, con la K de KAIRO) */
export const Tile: React.FC<{ size?: number; glow?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 96, glow = 1, children, style }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.26, background: C.card2, border: `1.5px solid rgba(110,124,255,${0.3 + 0.5 * glow})`,
    display: 'grid', placeItems: 'center', boxShadow: `0 0 ${60 * glow}px rgba(75,92,240,${0.5 * glow})`, ...style,
  }}>{children}</div>
);

export const KMark: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <span style={{ fontFamily: K.serif, fontSize: size, color: C.text, lineHeight: 1, paddingTop: size * 0.06 }}>K</span>
);

/** escenario de una animación: etiqueta "// ..." encima del contenido, el bloque centrado en la zona y escalado
 *  para llenar el panel como en la referencia (contenido diseñado a ~900 px de ancho, escala por defecto 1.15). */
export const Stage: React.FC<{ f: number; box: Box; eyebrow?: string; scale?: number; width?: number; children: React.ReactNode }> = ({ f, box, eyebrow, scale: want = 1.15, width = 900, children }) => {
  const scale = Math.min(want, (box.w - 16) / width); // nunca se sale de la zona por los lados
  return (
  <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
      {eyebrow ? <div style={{ alignSelf: 'flex-start', position: 'relative', height: 30, width: '100%' }}><Eyebrow f={f} text={eyebrow} x={4} y={0} /></div> : null}
      {children}
    </div>
  </div>
  );
};
