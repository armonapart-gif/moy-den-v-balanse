import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Overlay} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, TEXT_SHADOW} from '../theme/tokens';
import {RichLine, fitFont} from './RichLine';

const ease = Easing.out(Easing.cubic);

/** Крупная смысловая надпись прямо на видео: без плашек, только тень и мягкое появление. */
export const OverlayText: React.FC<{overlay: Overlay}> = ({overlay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {start, end, variant, lines, accent} = overlay;
  if (t < start || t > end) return null;

  const fadeIn = interpolate(t, [start, start + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const fadeOut = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(fadeIn, fadeOut);
  const settle = interpolate(t, [start, start + 0.6], [0.965, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const width = LAYOUT.contentWidth;

  if (variant === 'label') {
    return (
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.labelTop,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: COLORS.cream,
          textShadow: TEXT_SHADOW,
        }}
      >
        {lines.join(' ')}
      </div>
    );
  }

  const maxSize = variant === 'quote' ? 104 : variant === 'stack' ? 124 : 128;
  const size = fitFont(lines, width, maxSize);
  const top = variant === 'quote' ? LAYOUT.overlayTop + 60 : LAYOUT.overlayTop;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: LAYOUT.contentWidth ? (1080 - width) / 2 : 0,
        width,
        textAlign: 'center',
        opacity: variant === 'stack' ? 1 : opacity,
        transform: `scale(${settle})`,
        fontFamily: FONT_FAMILY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: 1,
        color: COLORS.cream,
        textShadow: '0 3px 22px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.5)',
      }}
    >
      {lines.map((line, i) => {
        // «stack»: строки появляются по очереди
        const lineStart = variant === 'stack' ? start + i * 0.55 : start;
        const lineIn = variant === 'stack' ? interpolate(t, [lineStart, lineStart + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}) : 1;
        const out = variant === 'stack' ? fadeOut : 1;
        return (
          <div key={i} style={{whiteSpace: 'nowrap', opacity: Math.min(lineIn, out), transform: variant === 'stack' ? `translateY(${(1 - lineIn) * 14}px)` : undefined}}>
            <RichLine text={line} accent={accent} />
          </div>
        );
      })}
    </div>
  );
};
