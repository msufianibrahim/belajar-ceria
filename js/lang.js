// Question language. Mandarin is introduced on levels the child has already
// mastered, so only the language is new, not the maths.

export const VOICE = { ms: 'ms-MY', en: 'en-GB', zh: 'zh-CN' };

// Pick the app language from a { en, ms } pair; plain strings pass through.
export const L = (state, v) => (v && typeof v === 'object' ? v[state.settings.lang] ?? v.en : v);

export function questionLang(state, levelId) {
  const { lang, mandarin } = state.settings;
  if (mandarin === 'all') return 'zh';
  if (mandarin === 'mastered' && state.levels[levelId]?.mastered) return 'zh';
  return lang;
}

const PINYIN = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];
export const py = (n) => (n <= 10 ? PINYIN[n] : n < 20 ? `shí${PINYIN[n - 10]}` : 'èrshí');

// A number before a measure word: 2 is 两 (liǎng), not 二. Other numbers stay as digits.
export const zhCount = (n) => (n === 2 ? ['两', 'liǎng'] : [String(n), py(n)]);

export const PRAISE = {
  ms: ['Betul!', 'Pandai!', 'Bagus!'],
  en: ['Correct!', 'Well done!', 'Great!'],
  zh: ['对了！', '很棒！', '真聪明！'],
};
export const RETRY = { ms: 'Cuba lagi', en: 'Try again', zh: '再试一次' };
