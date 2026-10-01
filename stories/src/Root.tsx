import React from 'react';
import {Composition} from 'remotion';
import series01 from './episodes/series-01.json';
import {storyFrames} from './lib/timing';
import type {EpisodeData, StoryData} from './lib/types';
import {StoryRenderer} from './stories/StoryRenderer';
import {CANVAS} from './theme/tokens';

// Все эпизоды (монтажные листы) регистрируются здесь: одна композиция = одна Story = один MP4.
const episodes = [series01 as unknown as EpisodeData];

export const Root: React.FC = () => (
  <>
    {episodes.flatMap((ep) =>
      ep.stories.map((story: StoryData) => (
        <Composition
          key={story.id}
          id={story.id}
          component={StoryRenderer}
          width={CANVAS.width}
          height={CANVAS.height}
          fps={CANVAS.fps}
          durationInFrames={storyFrames(story)}
          defaultProps={{story, guides: false}}
        />
      )),
    )}
  </>
);
