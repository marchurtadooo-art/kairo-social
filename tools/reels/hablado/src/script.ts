// Guion de montaje del vídeo hablado "PHP: el fallo que encontró una IA".
// Cada escena se ancla a la frase con la que empieza; la composición y la animación se eligen aquí.
import { findPhrase, fr, TOTAL_S } from './lib/timing';

export type Layout = 'full' | 'split' | 'pip' | 'gfx';
export type GfxName =
  | 'WebGrid' | 'CodeScan' | 'LockServer' | 'PatchCard' | 'Counter' | 'AlertCards' | 'OldSite' | 'ChatCompose' | 'CtaKeyword';

export type SceneDef = { at: string; layout: Layout; gfx?: GfxName; eyebrow?: string; props?: Record<string, unknown>; lead?: number };
export type Scene = SceneDef & { from: number; to: number }; // frames

export const SCENES_DEF: SceneDef[] = [
  { at: 'Una inteligencia artificial', layout: 'full' },
  { at: 'en el sistema', layout: 'split', gfx: 'WebGrid', eyebrow: '8 de cada 10 webs' },
  { at: 'Tiendas online', layout: 'split', gfx: 'WebGrid', eyebrow: 'Funcionan con PHP', props: { labels: true } },
  { at: 'Una empresa de ciberseguridad', layout: 'pip', gfx: 'CodeScan', eyebrow: 'Lo encontró una IA' },
  { at: 'Con ellos', layout: 'split', gfx: 'LockServer', eyebrow: 'Sin contraseña' },
  { at: 'El día 21', layout: 'split', gfx: 'PatchCard', eyebrow: 'Parche de urgencia' },
  { at: 'Pero en menos', layout: 'gfx', gfx: 'Counter', eyebrow: 'Intentos de ataque' },
  { at: 'Estados Unidos', layout: 'split', gfx: 'AlertCards', eyebrow: 'Aviso oficial' },
  { at: 'El problema', layout: 'full' },
  { at: 'las hizo una agencia', layout: 'split', gfx: 'OldSite', eyebrow: 'El problema real' },
  { at: 'Así que haz esto', layout: 'pip', gfx: 'ChatCompose', eyebrow: 'Haz esto hoy' },
  { at: 'Y si quieres saber', layout: 'full', gfx: 'CtaKeyword', props: { keyword: 'WEB' } },
];

const LEAD = 0.12; // la escena entra un pelín antes que la palabra
export const SCENES: Scene[] = (() => {
  let last = 0;
  const starts = SCENES_DEF.map((d, i) => {
    const t = i === 0 ? 0 : findPhrase(d.at, last);
    const s = t === null ? last + 3 : Math.max(0, t - (d.lead ?? LEAD));
    last = t ?? last + 3;
    return s;
  });
  return SCENES_DEF.map((d, i) => ({ ...d, from: fr(starts[i]), to: fr(i + 1 < starts.length ? starts[i + 1] : TOTAL_S) }));
})();

export const TOTAL = fr(TOTAL_S);
