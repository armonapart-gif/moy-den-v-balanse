// Единственное место, где живут цвета, шрифты и safe zones.
// Цвета и шрифт — из инструкции «Современный сторителлинг для Reels «Абрикосовый Рай»».

export const CANVAS = {width: 1080, height: 1920, fps: 30} as const;

/** Зоны интерфейса Instagram Stories (px на холсте 1080×1920). Текст и логотип — только внутри SAFE. */
export const SAFE = {
  top: 270, // аватар, имя, прогресс-бар, «закрыть»
  bottom: 380, // поле «Отправить сообщение», стикер-ссылка
  side: 64,
} as const;

export const COLORS = {
  orange: '#F29A32', // главный акцент, ключевые слова
  green: '#008E3C', // второстепенная деталь
  cream: '#FFF9EE', // основной текст
  forest: '#0B2A19', // фон текстовых Stories: глубокий оттенок бренд-зелёного
  forestDeep: '#06170D',
} as const;

export const FONT_FAMILY = 'Oswald, "Arial Narrow", sans-serif';

export const TEXT_SHADOW = '0 2px 16px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.35)';

/** Вертикальная раскладка видео-историй: лицо сверху, крупные надписи в середине, субтитры снизу. */
export const LAYOUT = {
  overlayTop: 860, // верх блока крупной надписи
  labelTop: 810,
  subtitleBottom: SAFE.bottom + 40, // нижний край блока субтитров от низа холста
  subtitleSize: 62,
  subtitleMaxChars: 30,
  contentWidth: CANVAS.width - SAFE.side * 2,
} as const;
