#!/usr/bin/env node
// Рендер Stories эпизода: каждая Story → отдельный MP4 (1080×1920, 30 fps, H.264 + AAC).
//   node tools/render-episode.mjs series-01                  — все Stories
//   node tools/render-episode.mjs series-01 s03-oflain       — одна или несколько
//   node tools/render-episode.mjs series-01 s05-opros --still 20 [--guides]  — один кадр PNG (для проверки)
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {normalizeAudio} from './normalize-audio.mjs';
import path from 'node:path';

const args = process.argv.slice(2);
const episodeId = args[0];
if (!episodeId) throw new Error('Укажи эпизод: node tools/render-episode.mjs series-01');
const stillIdx = args.indexOf('--still');
const still = stillIdx >= 0 ? Number(args[stillIdx + 1]) : null;
const guides = args.includes('--guides');
const wanted = args.slice(1).filter((a, i, arr) => !a.startsWith('--') && arr[i - 1] !== '--still');

const episode = JSON.parse(readFileSync(`src/episodes/${episodeId}.json`, 'utf8'));
const stories = episode.stories.filter((s) => !wanted.length || wanted.includes(s.id));

const chromeCandidates = [process.env.BROWSER_EXECUTABLE, ...['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']];
const browserExecutable = chromeCandidates.find((p) => p && existsSync(p)) ?? null;

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const outDir = path.resolve('out', episodeId);
mkdirSync(outDir, {recursive: true});

for (const story of stories) {
  const n = String(episode.stories.indexOf(story) + 1).padStart(2, '0');
  const inputProps = {story, guides};
  const composition = await selectComposition({serveUrl, id: story.id, inputProps, browserExecutable});
  if (still !== null) {
    const output = path.join(outDir, `still-${n}-${story.id}-f${still}.png`);
    await renderStill({composition, serveUrl, output, frame: still, inputProps, browserExecutable});
    console.log('PNG', output);
    continue;
  }
  const output = path.join(outDir, `${n}-${story.id}.mp4`);
  await renderMedia({
    composition, serveUrl, outputLocation: output, inputProps, browserExecutable,
    codec: 'h264', crf: 16, pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k',
    concurrency: 4, chromiumOptions: {gl: 'swangle'},
    onProgress: ({progress}) => process.stdout.write(`\r${story.id} ${(progress * 100).toFixed(0)}%   `),
  });
  normalizeAudio(output, composition.durationInFrames / composition.fps);
  console.log(`\n✓ ${output}  (${(composition.durationInFrames / composition.fps).toFixed(1)} с)`);
}
