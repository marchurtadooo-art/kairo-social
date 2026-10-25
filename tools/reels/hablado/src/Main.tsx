// Vídeo hablado estilo "explicador": la cara de Marc pasa entre pantalla completa, tarjeta inferior (pantalla partida),
// tarjeta pequeña arriba o desaparece, y cada idea lleva su animación de interfaz. Subtítulos de 1–3 palabras en la costura.
import React from 'react';
import { AbsoluteFill, Audio, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { E, lerp, seg } from './lib/m';
import { loadFonts, K } from './theme';
import { FPS, WORDS } from './lib/timing';
import { SCENES, Scene, Layout, TOTAL } from './script';
import { GFX, chatSendAt, ctaOkAt } from './gfx/scenes';
import { C } from './gfx/kit';
import CONFIG from './config.json';
import TRACK_RAW from './face-track.json';
import PEAKS from './sfx-peaks.json';

loadFonts();

type Rect = { x: number; y: number; w: number; h: number; r: number; srcH: number; o: number };
const RECTS: Record<Layout, Rect> = {
  full: { x: 0, y: 0, w: 1080, h: 1920, r: 0, srcH: 1920, o: 1 },
  split: { x: 0, y: 1240, w: 1080, h: 680, r: 48, srcH: 900, o: 1 },
  pip: { x: 300, y: 150, w: 480, h: 560, r: 36, srcH: 1040, o: 1 },
  gfx: { x: 360, y: 220, w: 360, h: 420, r: 30, srcH: 1040, o: 0 },
};
// zona de la animación según la composición (deja libres los 220 px de arriba de Instagram)
const PANEL: Record<Layout, { x: number; y: number; w: number; h: number } | null> = {
  full: { x: 90, y: 1170, w: 900, h: 420 },
  split: { x: 36, y: 300, w: 1008, h: 820 },
  pip: { x: 36, y: 900, w: 1008, h: 640 },
  gfx: { x: 36, y: 330, w: 1008, h: 1100 },
};
const T = 10; // frames de transición entre composiciones

const sceneAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (f >= SCENES[k].from) i = k;
  return i;
};
const mix = (a: Rect, b: Rect, p: number): Rect => ({
  x: lerp(p, a.x, b.x), y: lerp(p, a.y, b.y), w: lerp(p, a.w, b.w), h: lerp(p, a.h, b.h), r: lerp(p, a.r, b.r),
  srcH: Math.exp(lerp(p, Math.log(a.srcH), Math.log(b.srcH))), o: lerp(p, a.o, b.o),
});
const rectAt = (f: number): Rect => {
  const i = sceneAt(f);
  const cur = RECTS[SCENES[i].layout];
  if (i === 0) return cur;
  const prev = RECTS[SCENES[i - 1].layout];
  return mix(prev, cur, seg(f, SCENES[i].from, SCENES[i].from + T, E.cam));
};

// ── cara (si hay seguimiento de cara —grabación andando— la tarjeta encuadra el centro detectado, ya suavizado)
type TrackPt = { t: number; cx: number; cy: number; size: number };
const TRACK = TRACK_RAW as TrackPt[];
const faceAt = (t: number) => {
  if (CONFIG.placeholder || TRACK.length === 0) return { cx: CONFIG.face.cx, cy: CONFIG.face.cy };
  if (t <= TRACK[0].t) return TRACK[0];
  for (let k = 1; k < TRACK.length; k++) {
    if (t <= TRACK[k].t) {
      const a = TRACK[k - 1], b = TRACK[k], p = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return { cx: lerp(p, a.cx, b.cx), cy: lerp(p, a.cy, b.cy) };
    }
  }
  return TRACK[TRACK.length - 1];
};
const FaceLayer: React.FC = () => {
  const f = useCurrentFrame();
  const r = rectAt(f);
  const s = SCENES[sceneAt(f)];
  const fc = faceAt(f / FPS);
  // empuje lento en pantalla completa
  const push = s.layout === 'full' ? lerp(seg(f, s.from, s.to, E.inOutQuad), 1, 1.06) : 1;
  let scale = Math.max((r.h / r.srcH) * push, r.w / CONFIG.src.w);
  const vw = CONFIG.src.w * scale, vh = CONFIG.src.h * scale;
  let left = r.w / 2 - fc.cx * scale;
  // la cara un poco por encima del centro de la tarjeta (aire para la barbilla y los subtítulos)
  let topY = r.h * 0.45 - fc.cy * scale;
  left = Math.min(0, Math.max(r.w - vw, left));
  topY = Math.min(0, Math.max(r.h - vh, topY));
  if (r.o <= 0.01) return null;
  const radius = s.layout === 'split' && r.y > 1000 ? `${r.r}px ${r.r}px 0 0` : `${r.r}px`;
  const video = (
    <OffthreadVideo src={staticFile(CONFIG.placeholder ? 'media/placeholder.mp4' : CONFIG.faceFile)} muted={CONFIG.placeholder} volume={1}
      style={{ position: 'absolute', left, top: topY, width: vw, height: vh, maxWidth: 'none' }} />
  );
  return (
    <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radius, overflow: 'hidden', opacity: r.o,
      boxShadow: r.r > 1 ? '0 30px 80px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,255,255,.08)' : undefined, background: '#000' }}>
      {CONFIG.placeholder ? <Loop durationInFrames={CONFIG.placeholderLoop}>{video}</Loop> : video}
    </div>
  );
};

// ── subtítulos (1–3 palabras)
type Chunk = { text: string[]; a: number; b: number };
const KEYS = /^(php|ia|web|kairo|millones|contraseña|críticos|ocho|diez|21|openai)$/i;
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: typeof WORDS = [];
  const flush = () => { if (cur.length) out.push({ text: cur.map((w) => w.w), a: cur[0].s, b: cur[cur.length - 1].e }); cur = []; };
  WORDS.forEach((w, i) => {
    cur.push(w);
    const len = cur.map((x) => x.w).join(' ').length;
    const nxt = WORDS[i + 1];
    if (/[.,:;?!…]$/.test(w.w) || cur.length >= 3 || len >= 15 || (nxt && nxt.s - w.e > 0.3)) flush();
  });
  flush();
  return out.map((c, k) => ({ ...c, a: c.a - 0.04, b: k + 1 < out.length && out[k + 1].a - c.b < 0.5 ? out[k + 1].a - 0.06 : c.b + 0.3 }));
})();

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = CHUNKS.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const s = SCENES[sceneAt(f)];
  const r = rectAt(f);
  let y = 1100;
  if (s.layout === 'split') y = r.y - 112;
  else if (s.layout === 'pip') y = r.y + r.h + 46;
  else if (s.layout === 'gfx') y = 1470;
  else if (s.gfx === 'CtaKeyword') y = 1040;
  const p = seg(t * FPS, c.a * FPS, c.a * FPS + 4, (u) => E.outBack(u, 1.6));
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: y, textAlign: 'center', fontFamily: K.sans, fontWeight: 700, fontSize: 66, lineHeight: 1.1,
      letterSpacing: '-0.015em', color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.7), 0 0 3px rgba(0,0,0,.6)', transform: `scale(${lerp(p, 0.9, 1)})` }}>
      {c.text.map((w, i) => (
        <span key={i} style={{ color: KEYS.test(w.replace(/[.,:;?!…¿¡]/g, '')) ? C.soft : '#fff' }}>{w.replace(/[.,:;…]+$/, '')}{i < c.text.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  );
};

// ── animación de la escena
const SceneGfx: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame(); // local a la Sequence
  if (!s.gfx) return null;
  const box = PANEL[s.layout];
  if (!box) return null;
  const Comp = GFX[s.gfx];
  const out = seg(f, s.to - s.from - 5, s.to - s.from, E.inOutQuad);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Comp f={f} dur={s.to - s.from} box={box} props={s.props} eyebrow={s.eyebrow} />
    </AbsoluteFill>
  );
};

// ── SFX: transición en cada cambio de composición + golpes propios de cada animación (frames relativos a la escena)
type Cue = { at: number; src: string; vol: number; dur?: number };
const CUES: Record<string, (s: Scene) => Cue[]> = {
  WebGrid: (s) => (s.props?.labels ? [4, 13, 22].map((a) => ({ at: a + 6, src: 'pop-electric.mp3', vol: 0.16 })) : [{ at: 14, src: 'pop-electric.mp3', vol: 0.13 }, { at: 35, src: 'ui-select-click.mp3', vol: 0.22 }]),
  CodeScan: () => [{ at: 8, src: 'hitech-touch-magnet.mp3', vol: 0.16, dur: 50 }, { at: 25, src: 'typewriter-hit-soft.mp3', vol: 0.32 }, { at: 41, src: 'typewriter-hit-soft.mp3', vol: 0.32 }],
  LockServer: () => [{ at: 18, src: 'switch-tap.mp3', vol: 0.2 }, { at: 27, src: 'switch-click-quick.mp3', vol: 0.3 }],
  PatchCard: () => [{ at: 48, src: 'ui-success-soft.mp3', vol: 0.26 }],
  Counter: () => [{ at: 0, src: 'data-compute.mp3', vol: 0.16, dur: 52 }, { at: 46, src: 'bass-hit-short.mp3', vol: 0.3 }],
  AlertCards: () => [{ at: 2, src: 'ui-notify-tech.mp3', vol: 0.18 }, { at: 12, src: 'ui-notify-tech.mp3', vol: 0.18 }, { at: 24, src: 'typewriter-hit-soft.mp3', vol: 0.3 }],
  OldSite: () => [{ at: 34, src: 'typewriter-hit-soft.mp3', vol: 0.32 }],
  ChatCompose: () => [{ at: 10, src: 'typewriter-digital.mp3', vol: 0.18, dur: chatSendAt() - 14 }, { at: chatSendAt(), src: 'click-camera.mp3', vol: 0.3 }, { at: chatSendAt() + 4, src: 'ui-message-pop.mp3', vol: 0.22 }],
  CtaKeyword: (s) => [{ at: 14, src: 'typewriter-digital.mp3', vol: 0.2, dur: 14 }, { at: ctaOkAt(String(s.props?.keyword ?? 'WEB')), src: 'ui-success-soft.mp3', vol: 0.26 }],
};
const SFX: { from: number; src: string; vol: number; dur?: number }[] = (() => {
  const out: { from: number; src: string; vol: number; dur?: number }[] = [];
  const peak = (src: string) => ((PEAKS as Record<string, number[]>)[src]?.[0] ?? 0);
  SCENES.forEach((s, i) => {
    if (i > 0 && s.layout !== SCENES[i - 1].layout) out.push({ from: Math.max(0, s.from + 4 - Math.round(peak('swoosh-quick.mp3'))), src: 'swoosh-quick.mp3', vol: 0.14 });
    // golpes: se alinea su pico con el frame; sonidos continuos (con duración) empiezan tal cual
    if (s.gfx && CUES[s.gfx]) for (const c of CUES[s.gfx](s)) out.push({ from: Math.max(0, s.from + c.at - (c.dur ? 0 : Math.round(peak(c.src)))), src: c.src, vol: c.vol, dur: c.dur });
  });
  return out;
})();

export const Main: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const s = SCENES[sceneAt(f)];
  const box = PANEL[s.layout];
  const glowY = box ? box.y + box.h / 2 : 960;
  return (
    <AbsoluteFill style={{ background: '#07080f' }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% ${glowY}px, rgba(75,92,240,.20), transparent 70%), radial-gradient(700px 600px at 50% 0%, rgba(138,77,255,.08), transparent 70%)` }} />
      <FaceLayer />
      {SCENES.map((sc, i) => (sc.gfx ? (
        <Sequence key={i} from={sc.from} durationInFrames={Math.max(1, sc.to - sc.from)} layout="none"><SceneGfx s={sc} /></Sequence>
      ) : null))}
      <Captions />
      {bgm ? <Audio src={staticFile('audio/bgm.wav')} volume={0.1} /> : null}
      {SFX.map((x, i) => (
        <Sequence key={`s${i}`} from={x.from} durationInFrames={x.dur ?? 60} layout="none"><Audio src={staticFile(`audio/sfx/${x.src}`)} volume={x.vol} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
export { TOTAL };
