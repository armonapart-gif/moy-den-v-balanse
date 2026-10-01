// Единственное место, где живут цвета, шрифты и safe zones.
// Значения цветов/шрифтов взяты из «Современный сторителлинг для Reels «Абрикосовый Рай»».

export const CANVAS = {width: 1080, height: 1920, fps: 30} as const;

/** Зоны интерфейса Instagram Stories (px на холсте 1080x1920). Текст и логотип — только внутри SAFE. */
export const SAFE = {
  top: 270, // аватар, имя, прогресс-бар, «закрыть»
  bottom: 380, // поле «Отправить сообщение», стикер-ссылка, реакции
  side: 64,
} as const;

/** Область под субтитры: нижняя треть, но выше нижней safe zone. */
export const SUBTITLE_BOX = {
  bottom: SAFE.bottom + 40, // нижний край блока субтитров
  maxLines: 2,
  fontSize: 62, // Oswald Bold 60–66
  lineHeight: 1.0,
} as const;

export const COLORS = {
  orange: '#F29A32', // главный акцент, ключевые слова
  green: '#008E3C', // второстепенная деталь
  cream: '#FFF9EE', // основной текст
  shade: 'rgba(0,0,0,0.38)', // мягкое затемнение под текстом (без плашек)
} as const;

export const FONTS = {
  display: 'Oswald', // 700 — заголовки, цитаты, субтитры
  accent: 'Stapel', // Medium — редкая поясняющая строка (28–34 px). Файл шрифта нужен от автора.
} as const;

export const TEXT_SHADOW = '0 2px 18px rgba(0,0,0,0.45)';
