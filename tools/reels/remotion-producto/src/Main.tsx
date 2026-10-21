import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { Screen, SweepLine, Layer, PAGE_H, PAGE_W } from './components/Screen';
import { CursorPerformance, punchFactor } from './components/Cursor';
import { Headlines } from './components/Headline';
import { PhoneScene } from './components/Phone';
import { Odometer } from './components/Odometer';
import { Brand, Outro } from './components/Chrome';
import { E, camAt, punchAbout, seg, lerp, CamKey } from './lib/m';
import { K, loadFonts } from './theme';
import { EV, SHOTS } from './timeline';
import { SFX } from './sfx';

loadFonts();

export const BGM_VOLUME = 0.42;
const tex = (n: string) => `textures/${n}.png`;
const CARD = { x: 72, y: 590, w: 936, h: 900 };

// Botones reales (layout.json, px CSS). El clic cae en la esquina inferior derecha para no tapar el rótulo.
const BTN_GEN = { x: 987.3, y: 677.5, w: 169.5, h: 32, plate: '#ffffff', radius: 7, src: tex('vacio') };
const CLICK_GEN = { x: BTN_GEN.x + BTN_GEN.w * 0.86, y: BTN_GEN.y + BTN_GEN.h * 0.82 };
const BTN_PUB = { x: 1017.2, y: 611.5, w: 182.8, h: 32, plate: '#fafafa', radius: 7, src: tex('dialogo-publicar') };
const CLICK_PUB = { x: BTN_PUB.x + BTN_PUB.w * 0.88, y: BTN_PUB.y + BTN_PUB.h * 0.82 };
const IT_BOX = { x: 812.7, y: 529, w: 301.7, h: 64 };
const RADIO = { x: 293.5, y: 722.5 };
const PANEL_TOP = 600 / PAGE_H; // por encima de esta línea "baja" y "baja-opciones" son idénticas

const g = SHOTS.generar.from, b = SHOTS.baja.from, p = SHOTS.publicar.from;
const S = E.camSoft;
const CAM: CamKey[] = [
  // S1 estado vacío centrado ("No hay cuadrante para esta semana")
  { f: 0, cx: 1072, cy: 590, zoom: 1.45 },
  { f: g, cx: 1072, cy: 598, zoom: 1.5, ease: E.inOutQuad },
  // S2 acercamiento al botón mientras entra el cursor
  { f: EV.genClick - 6, cx: 1072, cy: 676, zoom: 1.9, ease: S },
  { f: EV.genPull, cx: 1072, cy: 676, zoom: 1.9 },
  // plano general de la parrilla completa (nombres a domingo)
  { f: EV.genPull + 42, cx: 916, cy: 560, zoom: 0.69, ease: S },
  { f: b + 2, cx: 916, cy: 548, zoom: 0.7 },
  // S3 encuadre de Marta con nombres y fechas
  { f: b + 46, cx: 688, cy: 462, zoom: 1.02, ease: S },
  { f: EV.opciones - 2, cx: 690, cy: 464, zoom: 1.03 },
  // panel de propuestas a zoom de lectura
  { f: EV.opciones + 48, cx: 468, cy: 845, zoom: 2.3, ease: S },
  { f: EV.elegida, cx: 466, cy: 846, zoom: 2.32 },
  { f: p - 1, cx: 462, cy: 848, zoom: 2.4 },
  // S4 diálogo de publicar completo (sin punch-in: no se recorta)
  { f: p, cx: 960, cy: 545, zoom: 1.6 },
  { f: p + 34, cx: 960, cy: 540, zoom: 1.72, ease: S },
  { f: SHOTS.movil.from, cx: 960, cy: 540, zoom: 1.75 },
];

const camFor = (f: number) => {
  let c = camAt(f, CAM);
  if (f >= EV.genCursorIn && f < EV.genPull + 42) {
    // punch-in de la carta (1→1.4) y vuelta fundida con el alejamiento al plano general
    const m = f < EV.genPull ? punchFactor(f, EV.genCursorIn, 1.4, false) : lerp(S(seg(f, EV.genPull, EV.genPull + 42)), 1.4, 1);
    c = punchAbout(c, CLICK_GEN.x, CLICK_GEN.y, m);
  }
  return c;
};

const layersFor = (f: number): Layer[] => {
  if (f >= p) return [{ src: tex('dialogo-publicar') }];
  if (f < EV.genReveal + 40) {
    return [{ src: tex('vacio') }, { src: tex('generado'), reveal: seg(f, EV.genReveal, EV.genReveal + 40, E.inOutQuad) }];
  }
  if (f < EV.bajaSwap) return [{ src: tex('generado') }];
  if (f < EV.opciones) return [{ src: tex('baja') }];
  // el panel se despliega hacia abajo: solo cambia lo que está por debajo de PANEL_TOP
  const wipe = lerp(seg(f, EV.opciones, EV.opciones + 22, E.outCubic), PANEL_TOP, 1);
  return [
    { src: tex('baja'), opacity: f < EV.opciones + 22 ? 1 : 0 },
    // cambio de estado instantáneo (como en la app): sin fundido, no se superponen placeholder y motivo
    { src: tex('baja-opciones'), reveal: wipe, opacity: f < EV.elegida ? 1 : 0 },
    { src: tex('baja-elegida'), opacity: f < EV.elegida ? 0 : 1 },
  ];
};

export const Main: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const cam = camFor(f);

  // overhead-camera-moves A · tilt-reveal (TiltReveal.tsx): hold 25 f con la franja superior a −80°,
  // 43 f de subida out-cubic con sobrepaso [−80, 2.6, −0.9, 0], escala 3.2→1, translateY 200→0, perspectiva 600→1200
  const HOLD = 25, MOVE = 43;
  const rotX = interpolate(f, [HOLD, HOLD + MOVE, HOLD + MOVE + 4, HOLD + MOVE + 8], [-80, 2.6, -0.9, 0],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tp = seg(f, HOLD, HOLD + MOVE, Easing.out(Easing.cubic));
  const exit = seg(f, EV.cardOut, EV.cardOut + 22, Easing.in(Easing.cubic));
  const pose = {
    ...CARD,
    rotX,
    scale: lerp(tp, 3.2, 1) * lerp(exit, 1, 0.92),
    dy: lerp(tp, 200, 0) + lerp(exit, 0, -40),
    persp: lerp(tp, 600, 1200) + 1000 * seg(f, HOLD + MOVE + 8, HOLD + MOVE + 30),
    perspY: lerp(tp, (CARD.y + 0.05 * CARD.h) / 19.2, (CARD.y + 0.4 * CARD.h) / 19.2),
    opacity: 1 - exit,
  };
  const reveal = seg(f, EV.genReveal, EV.genReveal + 40, E.inOutQuad);

  const patch = seg(f, EV.bajaPatch, EV.bajaPatch + 2); // aparece de golpe (sin fantasma de la celda anterior)
  const pop = seg(f, EV.bajaPatch, EV.bajaPatch + 8, E.outCubic);
  const ring = seg(f, EV.bajaRing, EV.bajaRing + 12, E.outCubic) * (1 - seg(f, EV.opciones - 4, EV.opciones + 6));
  const rr = f - EV.elegida;

  return (
    <AbsoluteFill style={{ background: K.void, fontFamily: K.sans }}>
      {/* fondo: luz de marca muy baja */}
      <AbsoluteFill style={{ background: `radial-gradient(1100px 900px at 100% 0%, oklch(55.5% .243 268.8 / .16), transparent 70%),
        radial-gradient(900px 900px at 0% 100%, oklch(57.4% .258 294.9 / .10), transparent 70%)` }} />

      {exit < 1 ? (
        <Screen cam={cam} pose={pose} layers={layersFor(f)}>
          <SweepLine reveal={reveal} zoom={cam.zoom} />
          {f < EV.genReveal + 40 ? (
            <CursorPerformance f={f} start={EV.genCursorIn} click={CLICK_GEN} btn={BTN_GEN} baseZoom={1.9}
              fadeOutAt={EV.genPull} coverY={reveal * PAGE_H} />
          ) : null}
          {/* la baja: solo las dos celdas de Marta cambian (parche de la captura "baja") */}
          {patch > 0 && f < EV.bajaSwap ? (
            <div style={{ position: 'absolute', left: IT_BOX.x, top: IT_BOX.y, width: IT_BOX.w, height: IT_BOX.h, overflow: 'hidden',
              opacity: patch, transform: `scale(${lerp(pop, 1.06, 1)})`, transformOrigin: '50% 50%' }}>
              <Img src={staticFile(tex('baja'))} style={{ position: 'absolute', left: -IT_BOX.x, top: -IT_BOX.y, width: PAGE_W, height: PAGE_H, maxWidth: 'none' }} />
            </div>
          ) : null}
          {ring > 0 ? (
            <div style={{ position: 'absolute', left: IT_BOX.x - 7, top: IT_BOX.y - 7, width: IT_BOX.w + 14, height: IT_BOX.h + 14, borderRadius: 13,
              border: '3px solid oklch(55.5% .243 268.8)', boxShadow: '0 0 18px oklch(55.5% .243 268.8 / .55)',
              opacity: ring, transform: `scale(${lerp(ring, 1.06, 1)})` }} />
          ) : null}
          {rr >= 0 && rr < 22 ? (
            <div style={{ position: 'absolute', left: RADIO.x - (8 + rr * 1.6), top: RADIO.y - (8 + rr * 1.6), width: 16 + rr * 3.2, height: 16 + rr * 3.2,
              borderRadius: '50%', border: `${interpolate(rr, [0, 20], [2, 0.8], { extrapolateRight: 'clamp' })}px solid oklch(55.5% .243 268.8)`,
              opacity: interpolate(rr, [0, 22], [0.9, 0], { easing: Easing.linear, extrapolateRight: 'clamp' }) }} />
          ) : null}
          {f >= p ? (
            <CursorPerformance f={f} start={EV.pubCursorIn} click={CLICK_PUB} btn={BTN_PUB} baseZoom={1.72} fadeOutAt={EV.cardOut - 6} />
          ) : null}
        </Screen>
      ) : null}

      <PhoneScene f={f} from={SHOTS.movil.from} dur={SHOTS.movil.dur}
        enter={seg(f, EV.phoneIn, EV.phoneIn + 40, S)} exit={seg(f, SHOTS.cifra.from - 18, SHOTS.cifra.from + 4, E.inOutQuad)}
        chipL={{ at: EV.chipL, text: 'Aviso por correo' }} chipR={{ at: EV.chipR, text: 'Su semana, en el móvil' }} />

      <Odometer f={f} start={EV.odo} exit={seg(f, EV.outroIn + 2, EV.outroIn + 16)} />

      <Headlines />
      <Brand f={f} hideFrom={EV.outroIn} />
      <Outro f={f} from={EV.outroIn} />

      {bgm ? <Audio src={staticFile('audio/bgm.wav')} volume={BGM_VOLUME} /> : null}
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur ?? 90} layout="none">
          <Audio src={staticFile(`audio/sfx/${s.src}`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
