// Формат данных, который собирает tools/build-episode.py из монтажного листа.

export type Caption = {text: string; start: number; end: number; accent?: boolean};
export type Segment = {src: string; from: number; to: number};

export type OverlayVariant = 'headline' | 'card' | 'stack' | 'quote' | 'label';
export type Overlay = {
  variant: OverlayVariant;
  lines: string[];
  accent?: string[];
  start: number;
  end: number;
  editorial?: boolean;
  /** на время надписи скрыть субтитры (когда надпись дословно повторяет речь) */
  replaceSubtitles?: boolean;
};

type SceneBase = {durationSec: number};

export type ClipScene = SceneBase & {
  type: 'talkingHead' | 'video' | 'broll';
  segments: Segment[];
  captions: Caption[];
  overlays?: Overlay[];
  title?: string;
  subtitles?: boolean;
};
export type TextScene = SceneBase & {
  type: 'text';
  variant?: 'reveal' | 'plain';
  lines: string[];
  accent?: string[];
  sub?: string;
  tags?: string;
};
export type PollScene = SceneBase & {type: 'poll'; kicker: string; quote: string[]; accent?: string[]; note?: string};
export type QuoteScene = SceneBase & {type: 'quote'; quote: string[]; accent?: string[]; author?: string};
export type CtaScene = SceneBase & {
  type: 'cta';
  headline: string[];
  accent?: string[];
  question?: string;
  hint?: string;
  note?: string;
};
export type Scene = ClipScene | TextScene | PollScene | QuoteScene | CtaScene;

export type StoryData = {id: string; title: string; durationSec: number; scenes: Scene[]};
export type EpisodeData = {id: string; title: string; fps: number; stories: StoryData[]};
