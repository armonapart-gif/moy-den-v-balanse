import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile} from 'remotion';
import {toFrames} from '../lib/timing';
import type {Segment} from '../lib/types';

const RAMP = 3; // кадров: микро-затухание звука на стыках, чтобы не было щелчков

/** Последовательность кусков исходников. Видео 9:16 заполняет кадр без растяжения (1080×1920 = исходник ×1.5). */
export const ClipPlayer: React.FC<{segments: Segment[]; frames: number[]}> = ({segments, frames}) => {
  let offset = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {segments.map((seg, i) => {
        const from = offset;
        const dur = frames[i];
        offset += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <OffthreadVideo
              src={staticFile(`source/${seg.src}.mp4`)}
              trimBefore={toFrames(seg.from)}
              volume={(f) => interpolate(f, [0, RAMP, dur - RAMP, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
