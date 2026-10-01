import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ClipPlayer} from '../components/ClipPlayer';
import {OverlayText} from '../components/OverlayText';
import {Subtitles} from '../components/Subtitles';
import {SafeGuides} from '../components/SafeGuides';
import {clipSegmentFrames} from '../lib/timing';
import type {ClipScene} from '../lib/types';
import {COLORS, FONT_FAMILY, SAFE, TEXT_SHADOW} from '../theme/tokens';

/**
 * VideoStory — видео + субтитры + (по желанию) заголовок и крупные надписи.
 * Всё содержимое приходит данными: куски исходников, слова субтитров, надписи.
 */
export const VideoStory: React.FC<{scene: ClipScene; guides?: boolean; strongScrim?: boolean}> = ({scene, guides, strongScrim}) => {
  const {fps} = useVideoConfig();
  const frames = clipSegmentFrames(scene);
  const overlays = scene.overlays ?? [];
  const hidden = overlays.filter((o) => o.replaceSubtitles).map((o) => [o.start, o.end] as [number, number]);
  return (
    <AbsoluteFill>
      <ClipPlayer segments={scene.segments} frames={frames} />
      {/* мягкое затемнение вместо плашек: только низ и самый верх */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 34%, rgba(0,0,0,${strongScrim ? 0.5 : 0.4}) 50%, rgba(0,0,0,${strongScrim ? 0.58 : 0.46}) 72%, rgba(0,0,0,${strongScrim ? 0.7 : 0.58}) 100%)`,
        }}
      />
      {scene.title && (
        <div
          style={{
            position: 'absolute',
            top: SAFE.top + 10,
            left: SAFE.side,
            right: SAFE.side,
            fontFamily: FONT_FAMILY,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: COLORS.cream,
            textShadow: TEXT_SHADOW,
          }}
        >
          {scene.title}
        </div>
      )}
      {overlays.map((o, i) => (
        <OverlayText key={i} overlay={o} />
      ))}
      {scene.subtitles !== false && <Subtitles captions={scene.captions} hiddenRanges={hidden} />}
      {guides && <SafeGuides />}
    </AbsoluteFill>
  );
};
