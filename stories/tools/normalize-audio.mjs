// Нормализация громкости готового MP4 до ≈ -16 LUFS (два прохода, линейно), видео не перекодируется.
// Текстовые Stories без звука получают тихую дорожку — так их одинаково принимают редакторы и Instagram.
import {execFileSync, spawnSync} from 'node:child_process';
import {renameSync} from 'node:fs';

const hasAudio = (f) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', f]).toString().trim() !== '';

export const normalizeAudio = (file, durationSec) => {
  const tmp = file.replace(/\.mp4$/, '.norm.mp4');
  if (!hasAudio(file)) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-f', 'lavfi', '-t', String(durationSec), '-i', 'anullsrc=r=48000:cl=stereo',
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
  } else {
    const target = 'I=-16:TP=-1.5:LRA=11';
    const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `loudnorm=${target}:print_format=json`, '-vn', '-f', 'null', '-'], {encoding: 'utf8'});
    const m = JSON.parse(probe.stderr.slice(probe.stderr.lastIndexOf('{'), probe.stderr.lastIndexOf('}') + 1));
    const af = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-af', af, '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
  }
  renameSync(tmp, file);
};

if (process.argv[1].endsWith('normalize-audio.mjs')) {
  for (const f of process.argv.slice(2)) normalizeAudio(f, Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()));
}
