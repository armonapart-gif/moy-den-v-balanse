import React from 'react';
import {COLORS} from '../theme/tokens';

/** Строка текста; фрагменты из `accent` подсвечиваются оранжевым. */
export const RichLine: React.FC<{text: string; accent?: string[]; accentColor?: string}> = ({text, accent = [], accentColor = COLORS.orange}) => {
  const hits = accent.filter((a) => a && text.includes(a));
  if (!hits.length) return <>{text}</>;
  const pattern = new RegExp(`(${hits.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return (
    <>
      {text.split(pattern).map((part, i) =>
        hits.includes(part) ? (
          <span key={i} style={{color: accentColor}}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

/** Размер шрифта, при котором самая длинная строка помещается в ширину (Oswald Bold, заглавные ≈ 0.6 em с учётом межбуквенного интервала). */
export const fitFont = (lines: string[], maxWidth: number, maxSize: number, factor = 0.6) => {
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.min(maxSize, Math.floor(maxWidth / (longest * factor)));
};
