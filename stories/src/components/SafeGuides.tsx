import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SAFE} from '../theme/tokens';

/** Только для предпросмотра (props.guides = true): показывает safe zones Instagram. В финальный рендер не попадает. */
export const SafeGuides: React.FC<{sticker?: {top: number; height: number; label: string}}> = ({sticker}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: SAFE.top, background: 'rgba(255,0,0,0.18)'}} />
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: SAFE.bottom, background: 'rgba(255,0,0,0.18)'}} />
    {sticker && (
      <div style={{position: 'absolute', top: sticker.top, left: 120, right: 120, height: sticker.height, border: '3px dashed rgba(255,255,255,0.8)', color: '#fff', fontSize: 34, textAlign: 'center', paddingTop: 12}}>
        {sticker.label}
      </div>
    )}
  </AbsoluteFill>
);
