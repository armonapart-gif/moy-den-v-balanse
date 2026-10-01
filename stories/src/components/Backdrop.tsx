import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../theme/tokens';

/** Фон текстовых Stories: глубокий бренд-зелёный и мягкое абрикосовое свечение снизу. Без декора и плашек. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 120% 70% at 50% ${108 - drift * 6}%, rgba(242,154,50,0.20) 0%, rgba(242,154,50,0) 62%),
                     radial-gradient(ellipse 100% 60% at 50% 18%, #123A22 0%, ${COLORS.forest} 55%, ${COLORS.forestDeep} 100%)`,
      }}
    />
  );
};
