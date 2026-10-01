# Abricot Stories — система Instagram Stories на Remotion

Переиспользуемый шаблон для Stories Зебунисо Солиевой и Центра ЗОЖ «Абрикосовый рай».
Принцип: **код не меняется — меняется монтажный лист** (`src/episodes/<серия>.montage.json`).

Формат: 1080×1920, 30 fps, 9:16, каждая Story — отдельный MP4. Safe zones Instagram: сверху 270 px, снизу 380 px, по бокам 64 px (`src/theme/tokens.ts`). Исходники 720×1280 увеличиваются ровно ×1.5 без обрезки и искажений.

## Как собрать новую серию

```bash
npm install
# 1. исходники → H.264 1080×1920 (public/source/srcN.mp4)
node tools/prep-sources.mjs src1=/путь/файл1.mov src2=/путь/файл2.mov
# 2. транскрипция с таймкодами (офлайн), затем вычитка текста человеком → data/transcripts/full.json
python3 tools/transcribe.py /путь/файл1.mov --out data/transcripts
# 3. монтажный лист → данные для Remotion
python3 tools/build-episode.py src/episodes/series-01.montage.json
# 4. рендер: все Stories или выбранные; --still N — один кадр PNG, --guides — показать safe zones и места под стикеры
node tools/render-episode.mjs series-01
node tools/render-episode.mjs series-01 s05-opros --still 60 --guides
npm run studio    # предпросмотр в Remotion Studio
```

Результат: `out/<серия>/NN-<id>.mp4`.

## Структура

```
data/transcripts/        full.json — вычитанный транскрипт единой шкалы (фразы + слова с таймингами), src1–5.json — сырьё
src/theme/tokens.ts      цвета, шрифт, safe zones, раскладка — единственный источник
src/lib/                 types, captions (разбивка субтитров), timing, fonts
src/components/          Subtitles, OverlayText, ClipPlayer, Backdrop, SafeGuides
src/stories/             VideoStory, TalkingHeadStory, TextStory, PollStory, QuoteStory, CTAStory, BrollStory, StoryRenderer
src/episodes/            *.montage.json (пишет человек/ИИ) → *.json (собирает build-episode.py)
tools/                   prep-sources, transcribe, build-episode, render-episode
```

## Монтажный лист

Story = список сцен. Видео-сцена ссылается на **номера фраз транскрипта** — инструмент сам находит файл и время, режет паузы длиннее 0.9 с и строит пословные субтитры:

```json
{"id": "s02", "title": "Что изменилось", "scenes": [
  {"type": "talkingHead",
   "cuts": [{"rows": [4, 5, 6], "from": "я", "until": "мини-продукт", "padEnd": 1.0}],
   "highlight": ["вебинар"],
   "overlays": [{"variant": "headline", "lines": ["ВМЕСТО ВЕБИНАРА", "Я РЕШИЛА…"], "accent": ["…"], "at": {"word": "решила"}}]},
  {"type": "text", "variant": "reveal", "lines": ["ПЯТЬ ДНЕЙ", "ЛЁГКОСТИ"], "accent": ["ЛЁГКОСТИ"], "sub": "5 дней рядом со мной", "durationSec": 3.6},
  {"type": "poll", "kicker": "А ВАМ ЗНАКОМО?", "quote": ["…"], "durationSec": 7},
  {"type": "cta", "headline": ["…"], "question": "…", "hint": "…", "durationSec": 8}
]}
```

- `overlays[].at / until` — время числом (сек) или якорь `{"word": "решила", "nth": 1, "offset": 0.2, "edge": "start|end"}`.
- Варианты надписей: `headline`, `card`, `stack` (строки по очереди), `quote` (может заменять субтитры), `label` (мелкая подпись).
- Субтитры берут слова из вычитанного транскрипта. Спорные места в транскрипте помечены `[…]` и в субтитрах превращаются в «…» — их не угадываем.
- Интерактивные стикеры Instagram (опрос, вопрос) не рисуются: под них оставлено свободное место (`--guides` показывает его).
