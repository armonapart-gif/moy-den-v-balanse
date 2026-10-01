import type {Caption} from './types';
import {LAYOUT} from '../theme/tokens';

export type Chunk = {words: Caption[]; start: number; end: number; lines: Caption[][]};

const SENTENCE_END = /[.!?…»]+$/;

/** Группирует слова в короткие блоки субтитров: до ~30 знаков, не больше 2 строк. */
export const buildChunks = (caps: Caption[], sceneEnd: number): Chunk[] => {
  const chunks: Caption[][] = [];
  let cur: Caption[] = [];
  const len = (ws: Caption[]) => ws.map((w) => w.text).join(' ').length;
  caps.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    const gap = prev ? w.start - prev.end : 0;
    const prevEnds = prev && SENTENCE_END.test(prev.text);
    const prevComma = prev && /[,:;—]$/.test(prev.text) && len(cur) >= 12;
    if (cur.length && (len([...cur, w]) > LAYOUT.subtitleMaxChars || cur.length >= 5 || gap > 0.55 || prevEnds || prevComma)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
    if (i === caps.length - 1) chunks.push(cur);
  });
  return chunks.map((words, i) => {
    const next = chunks[i + 1];
    const last = words[words.length - 1];
    const start = words[0].start;
    const end = next && next[0].start - last.end < 0.45 ? next[0].start : Math.min(sceneEnd, last.end + 0.35);
    // две строки, если блок длинный
    const total = len(words);
    let lines: Caption[][] = [words];
    if (total > 20 && words.length > 1) {
      let best = 1;
      let bestDiff = Infinity;
      for (let k = 1; k < words.length; k++) {
        const d = Math.abs(len(words.slice(0, k)) - len(words.slice(k)));
        if (d < bestDiff) {
          bestDiff = d;
          best = k;
        }
      }
      lines = [words.slice(0, best), words.slice(best)];
    }
    return {words, start, end, lines};
  });
};

export const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
