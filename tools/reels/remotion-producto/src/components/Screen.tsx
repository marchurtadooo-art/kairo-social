// Tarjeta-pantalla con cámara 2.5D sobre capturas reales (derivado de PageCam de video-shotcraft).
// El aumento se aplica con CSS `zoom` (rasterizado a tamaño final → texto nítido, aesthetic Q2):
// translate = (vw/2)/zoom − cx, igual que PageCam pero con viewport parametrizable (tarjeta 9:16).
import React from 'react';
import { Img, staticFile } from 'remotion';
import { Cam } from '../lib/m';
import { K } from '../theme';

export const PAGE_W = 1920;
export const PAGE_H = 1080;

export type Layer = {
  src: string;
  opacity?: number;
  reveal?: number; // 0..1 → recorta la capa desde arriba (barrido de "se genera")
};

export type CardPose = {
  x: number; y: number; w: number; h: number;
  rotX?: number; scale?: number; opacity?: number; dy?: number;
  persp?: number; perspY?: number; // perspectiva del encuadre completo (tilt-reveal)
};

export const Screen: React.FC<{
  cam: Cam;
  pose: CardPose;
  layers: Layer[];
  children?: React.ReactNode; // overlays en coordenadas de página (px CSS)
  glow?: number; // 0..1 intensidad del halo eléctrico
}> = ({ cam, pose, layers, children, glow = 0.35 }) => {
  const { x, y, w, h, rotX = 0, scale = 1, opacity = 1, dy = 0, persp = 2200, perspY = 50 } = pose;
  const z = cam.zoom;
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: persp, perspectiveOrigin: `50% ${perspY}%`, opacity }}>
      <div
        style={{
          position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 34, overflow: 'hidden', background: '#ffffff',
          // orden de la demo TiltReveal: translateY → scale → rotateX, pivote en el borde superior
          transform: `translateY(${dy}px) scale(${scale}) rotateX(${rotX}deg)`,
          transformOrigin: '50% 0%', backfaceVisibility: 'hidden',
          boxShadow: `0 0 0 1.5px ${K.hairline}, 0 40px 120px rgba(0,0,0,.6), 0 0 90px oklch(55.5% .243 268.8 / ${0.28 * glow})`,
        }}
      >
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: PAGE_W, height: PAGE_H,
            zoom: z,
            transform: `translate(${w / 2 / z - cam.cx}px, ${h / 2 / z - cam.cy}px)`,
            transformOrigin: '0 0',
          }}
        >
          {layers.map((l, i) =>
            (l.opacity ?? 1) <= 0.001 || (l.reveal ?? 1) <= 0.0001 ? null : (
              <Img
                key={l.src + i}
                src={staticFile(l.src)}
                style={{
                  position: 'absolute', left: 0, top: 0, width: PAGE_W, height: PAGE_H,
                  opacity: l.opacity ?? 1,
                  clipPath: l.reveal !== undefined && l.reveal < 1 ? `inset(0 0 ${(1 - l.reveal) * 100}% 0)` : undefined,
                }}
              />
            ),
          )}
          {children}
        </div>
        {/* filete interior para que el blanco de la UI no "sangre" sobre el void */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 34, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

/** Línea luminosa del barrido (una única luz protagonista; recortada por la tarjeta) */
export const SweepLine: React.FC<{ reveal: number; zoom: number }> = ({ reveal, zoom }) => {
  if (reveal <= 0 || reveal >= 1) return null;
  const yy = reveal * PAGE_H;
  const a = Math.sin(Math.PI * reveal);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, width: PAGE_W, top: yy - 120 / zoom, height: 120 / zoom,
        background: 'linear-gradient(180deg, rgba(120,132,255,0) 0%, rgba(120,132,255,.16) 100%)', opacity: a }} />
      <div style={{ position: 'absolute', left: 0, width: PAGE_W, top: yy - 1.5 / zoom, height: 3 / zoom,
        background: 'linear-gradient(90deg, rgba(110,120,255,0), oklch(62% .22 268.8) 20%, oklch(64% .24 294.9) 80%, rgba(110,120,255,0))',
        boxShadow: `0 0 ${18 / zoom}px oklch(60% .24 268.8)`, opacity: a }} />
    </>
  );
};
