import React from 'react';
import type {ClipScene} from '../lib/types';
import {VideoStory} from './VideoStory';

/** Разговорное видео Зебунисо: лицо остаётся свободным (надписи — в средней зоне, субтитры — над нижней safe zone). */
export const TalkingHeadStory: React.FC<{scene: ClipScene; guides?: boolean}> = (props) => <VideoStory {...props} />;
