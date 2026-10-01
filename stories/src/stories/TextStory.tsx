import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {RichLine, fitFont} from '../components/RichLine';
import {SafeGuides} from '../components/SafeGuides';
import type {TextScene} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, SAFE, TEXT_SHADOW} from '../theme/tokens';

const ease = Easing.out(Easing.cubic);
const appear = (t: number, at: number, dur = 0.55) => interpolate(t, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Полностью текстовая Story (в том числе «reveal» названия продукта). */
export const TextStory: React.FC<{scene: TextScene; guides?: boolean}> = ({scene, guides}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;
  const reveal = scene.variant === 'reveal';
  const size = fitFont(scene.lines, LAYOUT.contentWidth, reveal ? 176 : 130);
  const out = interpolate(t, [total - 0.3, total], [1, 0.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const drift = reveal ? interpolate(t, [0, total], [1, 1.035]) : 1;
  const midY = (SAFE.top + (1920 - SAFE.bottom)) / 2 - 20;
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Backdrop />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', top: midY - 960, opacity: Math.max(out, 0.0) || 1}}>
        <div style={{transform: `scale(${drift})`, textAlign: 'center', width: LAYOUT.contentWidth, fontFamily: FONT_FAMILY, fontWeight: 700, color: COLORS.cream, textShadow: TEXT_SHADOW}}>
          {scene.lines.map((line, i) => (
            <div key={i} style={{fontSize: size, lineHeight: 0.96, letterSpacing: 2, opacity: appear(t, 0.15 + i * 0.35), transform: `translateY(${(1 - appear(t, 0.15 + i * 0.35)) * 18}px)`}}>
              <RichLine text={line} accent={scene.accent} />
            </div>
          ))}
          {scene.sub && (
            <div style={{marginTop: 48, fontSize: 52, letterSpacing: 5, textTransform: 'uppercase', opacity: appear(t, 0.15 + scene.lines.length * 0.35 + 0.2)}}>{scene.sub}</div>
          )}
          {scene.tags && (
            <div style={{marginTop: 44, fontSize: 32, letterSpacing: 5, color: COLORS.orange, opacity: appear(t, 0.15 + scene.lines.length * 0.35 + 0.65)}}>{scene.tags}</div>
          )}
        </div>
      </AbsoluteFill>
      {guides && <SafeGuides />}
    </AbsoluteFill>
  );
};
