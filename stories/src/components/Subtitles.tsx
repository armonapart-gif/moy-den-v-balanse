import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildChunks, capitalizeFirst} from '../lib/captions';
import type {Caption} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, TEXT_SHADOW} from '../theme/tokens';

/**
 * Постоянный компонент субтитров.
 * Блок 1–2 короткие строки, нижняя safe zone Instagram, очень сдержанная анимация (мягкое появление).
 * Слова с accent=true подсвечиваются оранжевым. Тайминги слов приходят из данных (транскрипт).
 */
export const Subtitles: React.FC<{captions: Caption[]; hiddenRanges?: Array<[number, number]>}> = ({captions, hiddenRanges = []}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => buildChunks(captions, durationInFrames / fps), [captions, durationInFrames, fps]);
  const idx = chunks.findIndex((c) => t >= c.start - 0.02 && t < c.end);
  if (idx < 0) return null;
  if (hiddenRanges.some(([a, b]) => t >= a && t < b)) return null;
  const chunk = chunks[idx];
  const localF = (t - chunk.start) * fps;
  const appear = interpolate(localF, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const rise = (1 - appear) * 10;
  const firstOverall = idx === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: LAYOUT.subtitleBottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `0 ${(1080 - LAYOUT.contentWidth) / 2}px`,
        opacity: appear,
        transform: `translateY(${rise}px)`,
        fontFamily: FONT_FAMILY,
        fontWeight: 700,
        fontSize: LAYOUT.subtitleSize,
        lineHeight: 1.04,
        color: COLORS.cream,
        textAlign: 'center',
        textShadow: TEXT_SHADOW,
        letterSpacing: 0.4,
      }}
    >
      {chunk.lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {line.map((w, wi) => {
            const text = firstOverall && li === 0 && wi === 0 ? capitalizeFirst(w.text) : w.text;
            return (
              <span key={wi} style={{color: w.accent ? COLORS.orange : COLORS.cream}}>
                {text}
                {wi < line.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
