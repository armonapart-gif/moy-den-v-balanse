#!/usr/bin/env node
// Приводит исходные видео к виду, удобному для Remotion: H.264, 30 fps постоянный, 1080x1920 (lanczos), AAC.
// Использование: node tools/prep-sources.mjs src1=/путь/файл.mov src2=/путь/файл2.mov ...
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

mkdirSync('public/source', {recursive: true});
for (const arg of process.argv.slice(2)) {
  const [id, input] = arg.split('=');
  if (!id || !input) throw new Error(`ожидается id=путь, получено: ${arg}`);
  console.log(`${id}: ${input}`);
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', input,
    // 720x1280 → 1080x1920 ровно ×1.5, без обрезки и искажений
    '-vf', 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-g', '30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', `public/source/${id}.mp4`,
  ], {stdio: 'inherit'});
}
