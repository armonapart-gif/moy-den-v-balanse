import {continueRender, delayRender, staticFile} from 'remotion';

// Шрифт лежит в public/fonts (Oswald Bold 700, кириллица и латиница) — никаких обращений в сеть при рендере.
let loaded = false;
export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  const handle = delayRender('Загрузка шрифта Oswald');
  const faces = [
    new FontFace('Oswald', `url(${staticFile('fonts/Oswald-700-cyrillic.woff2')})`, {
      weight: '700',
      unicodeRange: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
    }),
    new FontFace('Oswald', `url(${staticFile('fonts/Oswald-700-latin.woff2')})`, {
      weight: '700',
      unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    }),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => fs.forEach((f) => (document.fonts as unknown as {add(f: FontFace): void}).add(f)))
    .catch((e) => console.error('Шрифт не загрузился', e))
    .finally(() => continueRender(handle));
};
