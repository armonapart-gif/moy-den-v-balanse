import type {ClipScene, Scene, StoryData} from './types';

export const FPS = 30;
export const toFrames = (sec: number) => Math.round(sec * FPS);

export const clipSegmentFrames = (scene: ClipScene) => scene.segments.map((s) => Math.max(1, toFrames(s.to - s.from)));

export const sceneFrames = (scene: Scene): number =>
  scene.type === 'talkingHead' || scene.type === 'video' || scene.type === 'broll'
    ? clipSegmentFrames(scene).reduce((a, b) => a + b, 0)
    : toFrames(scene.durationSec);

export const storyFrames = (story: StoryData) => story.scenes.reduce((a, s) => a + sceneFrames(s), 0);
