// Palabras (tiempos del audio ya recortado) y resolución de "anclas": una escena empieza en la primera palabra
// de la frase que la ancla. Así el mismo guion sirve para cualquier toma: si cambia el ritmo, las escenas siguen a la voz.
import words from '../words.json';

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = words as Word[];
export const FPS = 30;
export const fr = (s: number) => Math.round(s * FPS);

const norm = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

/** segundo en que empieza la frase `phrase` (a partir de `after`), o null */
export const findPhrase = (phrase: string, after = 0): number | null => {
  const target = norm(phrase).split(' ');
  const toks = WORDS.map((w) => norm(w.w));
  for (let i = 0; i < toks.length; i++) {
    if (WORDS[i].s < after - 0.01) continue;
    let ok = true;
    for (let k = 0; k < target.length; k++) {
      const t = toks[i + k];
      if (t === undefined || !(t === target[k] || (k === target.length - 1 && t.startsWith(target[k])))) { ok = false; break; }
    }
    if (ok) return WORDS[i].s;
  }
  return null;
};

export const TOTAL_S = WORDS.length ? WORDS[WORDS.length - 1].e + 0.6 : 10;
