import {z} from 'zod';

/** Слово с таймингом — формат транскрипции (data/transcripts/*.json). Время в секундах от начала исходного файла. */
export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  /** подсветить оранжевым */
  accent: z.boolean().optional(),
});

export const PhraseSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
  words: z.array(WordSchema),
});

export const TranscriptSchema = z.object({
  source: z.string(),
  durationSec: z.number(),
  phrases: z.array(PhraseSchema),
});

/** Кусок исходного видео, который берём в Story (тайминги — в секундах исходника). */
export const ClipSchema = z.object({
  src: z.string(), // путь относительно public/source
  from: z.number().default(0),
  to: z.number().optional(), // по умолчанию до конца файла
  transcript: z.string().optional(), // путь к transcript.json
  /** Как вписать 720x1280 в 1080x1920 без искажений */
  fit: z.enum(['cover', 'contain']).default('cover'),
  /** Смещение кадра при cover, чтобы не отрезать лицо: 0 = верх, 0.5 = центр, 1 = низ */
  focusY: z.number().min(0).max(1).default(0.35),
});

export const SubtitleStyleSchema = z.object({
  enabled: z.boolean().default(true),
  maxWordsPerChunk: z.number().default(4),
  maxLines: z.number().min(1).max(2).default(2),
  /** слова (в нижнем регистре), которые подсвечиваются оранжевым */
  highlight: z.array(z.string()).default([]),
  position: z.enum(['lower', 'middle']).default('lower'),
});

const Base = {
  id: z.string(),
  durationSec: z.number().optional(), // для видео-историй считается по клипу
  logo: z.boolean().default(false), // логотип — один раз на ролик, управляется в монтажном листе
};

export const StorySchema = z.discriminatedUnion('type', [
  z.object({...Base, type: z.literal('video'), clip: ClipSchema, title: z.string().optional(), subtitles: SubtitleStyleSchema.optional()}),
  z.object({...Base, type: z.literal('talkingHead'), clip: ClipSchema, title: z.string().optional(), subtitles: SubtitleStyleSchema.optional()}),
  z.object({...Base, type: z.literal('text'), lines: z.array(z.string()), accentWords: z.array(z.string()).default([]), note: z.string().optional(), durationSec: z.number().default(5)}),
  z.object({...Base, type: z.literal('poll'), question: z.string(), hint: z.string().optional(), durationSec: z.number().default(7)}),
  z.object({...Base, type: z.literal('quote'), quote: z.string(), accentWords: z.array(z.string()).default([]), author: z.string().optional(), durationSec: z.number().default(5)}),
  z.object({...Base, type: z.literal('cta'), headline: z.string(), offer: z.string().optional(), action: z.string(), keyword: z.string().optional(), durationSec: z.number().default(6)}),
  z.object({...Base, type: z.literal('broll'), clip: ClipSchema, text: z.string().optional(), voiceover: z.string().optional(), subtitles: SubtitleStyleSchema.optional()}),
]);

/** Монтажный лист = эпизод = серия Stories. Каждая Story → отдельный MP4. */
export const EpisodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  stories: z.array(StorySchema),
});

export type Word = z.infer<typeof WordSchema>;
export type Phrase = z.infer<typeof PhraseSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type Story = z.infer<typeof StorySchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
