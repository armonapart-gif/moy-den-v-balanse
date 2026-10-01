import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {loadFonts} from '../lib/fonts';
import {sceneFrames} from '../lib/timing';
import type {StoryData} from '../lib/types';
import {BrollStory} from './BrollStory';
import {CTAStory} from './CTAStory';
import {PollStory} from './PollStory';
import {QuoteStory} from './QuoteStory';
import {TalkingHeadStory} from './TalkingHeadStory';
import {TextStory} from './TextStory';
import {VideoStory} from './VideoStory';

loadFonts();

/** Собирает одну Story из сцен монтажного листа. Каждая Story рендерится отдельным MP4. */
export const StoryRenderer: React.FC<{story: StoryData; guides?: boolean}> = ({story, guides}) => {
  let offset = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {story.scenes.map((scene, i) => {
        const from = offset;
        const dur = sceneFrames(scene);
        offset += dur;
        let node: React.ReactNode = null;
        switch (scene.type) {
          case 'talkingHead': node = <TalkingHeadStory scene={scene} guides={guides} />; break;
          case 'video': node = <VideoStory scene={scene} guides={guides} />; break;
          case 'broll': node = <BrollStory scene={scene} guides={guides} />; break;
          case 'text': node = <TextStory scene={scene} guides={guides} />; break;
          case 'poll': node = <PollStory scene={scene} guides={guides} />; break;
          case 'quote': node = <QuoteStory scene={scene} guides={guides} />; break;
          case 'cta': node = <CTAStory scene={scene} guides={guides} />; break;
        }
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={`${scene.type}-${i + 1}`}>
            {node}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
