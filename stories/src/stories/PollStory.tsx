import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {RichLine, fitFont} from '../components/RichLine';
import {SafeGuides} from '../components/SafeGuides';
import type {PollScene} from '../lib/types';
import {COLORS, FONT_FAMILY, LAYOUT, TEXT_SHADOW} from '../theme/tokens';

/** Позиция зарезервированного места под стикер Instagram (сам стикер не рисуем). */
export const POLL_STICKER = {top: 1010, height: 400};

/** Визуальная карточка под Instagram-опрос. Нижняя часть остаётся свободной под настоящий Poll sticker. */
export const PollStory: React.FC<{scene: PollScene; guides?: boolean}> = ({scene, guides}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const a = (at: number) => interpolate(t, [at, at + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const kSize = fitFont([scene.kicker], LAYOUT.contentWidth, 104);
  const qSize = fitFont(scene.quote, LAYOUT.contentWidth, 78, 0.5);
  return (
    <AbsoluteFill style={{opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'})}}>
      <Backdrop />
      <div style={{position: 'absolute', top: 360, left: (1080 - LAYOUT.contentWidth) / 2, width: LAYOUT.contentWidth, textAlign: 'center', fontFamily: FONT_FAMILY, fontWeight: 700, textShadow: TEXT_SHADOW}}>
        <div style={{fontSize: kSize, letterSpacing: 3, color: COLORS.orange, opacity: a(0.1), transform: `translateY(${(1 - a(0.1)) * 14}px)`}}>{scene.kicker}</div>
        <div style={{marginTop: 54, color: COLORS.cream, fontSize: qSize, lineHeight: 1.08, letterSpacing: 0.5}}>
          {scene.quote.map((l, i) => (
            <div key={i} style={{opacity: a(0.6 + i * 0.35)}}>
              <RichLine text={l} accent={scene.accent} />
            </div>
          ))}
        </div>
      </div>
      {guides && <SafeGuides sticker={{...POLL_STICKER, label: 'место под Instagram Poll'}} />}
    </AbsoluteFill>
  );
};
