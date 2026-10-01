import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {RichLine, fitFont} from '../components/RichLine';
import {SafeGuides} from '../components/SafeGuides';
import type {QuoteScene} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, TEXT_SHADOW} from '../theme/tokens';

/** Одна сильная фраза крупным текстом. */
export const QuoteStory: React.FC<{scene: QuoteScene; guides?: boolean}> = ({scene, guides}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const size = fitFont(scene.quote, LAYOUT.contentWidth, 128);
  const a = (at: number) => interpolate(t, [at, at + 0.6], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT_FAMILY, fontWeight: 700, color: COLORS.cream, textShadow: TEXT_SHADOW, textAlign: 'center'}}>
        <div style={{width: LAYOUT.contentWidth}}>
          {scene.quote.map((l, i) => (
            <div key={i} style={{fontSize: size, lineHeight: 0.98, opacity: a(0.15 + i * 0.3), transform: `translateY(${(1 - a(0.15 + i * 0.3)) * 16}px)`}}>
              <RichLine text={l} accent={scene.accent} />
            </div>
          ))}
          {scene.author && <div style={{marginTop: 48, fontSize: 40, letterSpacing: 4, textTransform: 'uppercase', opacity: a(0.15 + scene.quote.length * 0.3 + 0.3) * 0.85}}>{scene.author}</div>}
        </div>
      </AbsoluteFill>
      {guides && <SafeGuides />}
    </AbsoluteFill>
  );
};
