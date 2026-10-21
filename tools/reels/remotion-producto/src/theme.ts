// Tokens de marca KAIRO AI (mismos valores que el Reel 02) + carga determinista de fuentes.
import { continueRender, delayRender, staticFile } from 'remotion';

export const K = {
  void: '#0b0c14',
  ink: '#05060b',
  carbon: '#12131d',
  electric: 'oklch(55.5% .243 268.8)',
  electricSoft: 'oklch(78% .13 268.8)',
  violet: 'oklch(57.4% .258 294.9)',
  mist: 'oklch(78% .03 271.7)',
  white: 'oklch(97% .012 276.3)',
  hairline: 'oklch(100% 0 0 / .14)',
  hl: 'linear-gradient(90deg, oklch(66% .2 268.8), oklch(68% .22 294.9))',
  sans: '"Geist", sans-serif',
  mono: '"JBMono", monospace',
  serif: '"Playfair", serif',
};

const FONTS: [string, string, string][] = [
  ['Geist', 'fonts/geist-sans-latin-400-normal.woff2', '400'],
  ['Geist', 'fonts/geist-sans-latin-500-normal.woff2', '500'],
  ['Geist', 'fonts/geist-sans-latin-600-normal.woff2', '600'],
  ['Geist', 'fonts/geist-sans-latin-700-normal.woff2', '700'],
  ['JBMono', 'fonts/jetbrains-mono-latin-400-normal.woff2', '400'],
  ['JBMono', 'fonts/jetbrains-mono-latin-500-normal.woff2', '500'],
  ['Playfair', 'fonts/playfair-display-latin-500-normal.woff2', '500'],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('fuentes KAIRO', { timeoutInMilliseconds: 120000, retries: 2 });
  Promise.all(
    FONTS.map(([fam, src, weight]) => {
      const ff = new FontFace(fam, `url(${staticFile(src)}) format('woff2')`, { weight });
      return ff.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};
