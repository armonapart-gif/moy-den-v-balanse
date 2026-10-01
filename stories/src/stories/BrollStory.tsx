import React from 'react';
import type {ClipScene} from '../lib/types';
import {VideoStory} from './VideoStory';

/** Атмосферное видео + короткий текст/voice-over (субтитры из данных). Затемнение чуть сильнее — для читаемости на пейзаже. */
export const BrollStory: React.FC<{scene: ClipScene; guides?: boolean}> = (props) => <VideoStory {...props} strongScrim />;
