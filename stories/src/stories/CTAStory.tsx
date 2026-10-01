import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {RichLine, fitFont} from '../components/RichLine';
import {SafeGuides} from '../components/SafeGuides';
import type {CtaScene} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, SAFE, TEXT_SHADOW} from '../theme/tokens';

export const CTA_STICKER = {top: 1000, height: 400};

/** Финальная Story: оффер/вопрос + призыв. Место под Question Sticker остаётся свободным. */
export const CTAStory: React.FC<{scene: CtaScene; guides?: boolean}> = ({scene, guides}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const a = (at: number) => interpolate(t, [at, at + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const hSize = fitFont(scene.headline, LAYOUT.contentWidth, 112);
  return (
    <AbsoluteFill style={{opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'})}}>
      <Backdrop />
      <div style={{position: 'absolute', top: SAFE.top + 70, left: (1080 - LAYOUT.contentWidth) / 2, width: LAYOUT.contentWidth, textAlign: 'center', fontFamily: FONT_FAMILY, fontWeight: 700, textShadow: TEXT_SHADOW}}>
        <div style={{fontSize: hSize, lineHeight: 0.98, letterSpacing: 1.5, color: COLORS.cream}}>
          {scene.headline.map((l, i) => (
            <div key={i} style={{opacity: a(0.1 + i * 0.3), transform: `translateY(${(1 - a(0.1 + i * 0.3)) * 16}px)`}}>
              <RichLine text={l} accent={scene.accent} />
            </div>
          ))}
        </div>
        {scene.question && (
          <div style={{marginTop: 56, fontSize: 56, lineHeight: 1.1, letterSpacing: 0.5, color: COLORS.cream, opacity: a(0.9)}}>{scene.question}</div>
        )}
      </div>
      {scene.hint && (
        <div style={{position: 'absolute', bottom: SAFE.bottom + 36, left: (1080 - LAYOUT.contentWidth) / 2, width: LAYOUT.contentWidth, textAlign: 'center', fontFamily: FONT_FAMILY, fontWeight: 700, fontSize: 32, letterSpacing: 3, color: COLORS.orange, opacity: a(1.4) * 0.95, textTransform: 'uppercase', textShadow: TEXT_SHADOW}}>
          {scene.hint}
        </div>
      )}
      {guides && <SafeGuides sticker={{...CTA_STICKER, label: 'место под Question Sticker'}} />}
    </AbsoluteFill>
  );
};
