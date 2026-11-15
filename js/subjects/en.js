import { pick, shuffle } from './util.js';

// Word tiers follow the JejakJaya order: letters -> CVC -> colours/numbers -> verbs -> family/body.
// g: words only get mixed with the same group (a colour is never offered beside a number).
const NOUNS = [
  { w: 'apple', e: '🍎' }, { w: 'ball', e: '⚽' }, { w: 'cat', e: '🐱' }, { w: 'dog', e: '🐶' },
  { w: 'egg', e: '🥚' }, { w: 'fish', e: '🐟' }, { w: 'goat', e: '🐐' }, { w: 'hat', e: '🎩' },
  { w: 'ice', e: '🧊' }, { w: 'jet', e: '✈️' }, { w: 'kite', e: '🪁' }, { w: 'lion', e: '🦁' },
  { w: 'moon', e: '🌙' }, { w: 'nose', e: '👃' }, { w: 'octopus', e: '🐙' }, { w: 'pig', e: '🐷' },
  { w: 'queen', e: '👸' }, { w: 'rabbit', e: '🐇' }, { w: 'sun', e: '☀️' }, { w: 'tiger', e: '🐯' },
  { w: 'umbrella', e: '☔' }, { w: 'van', e: '🚐' }, { w: 'watch', e: '⌚' }, { w: 'box', e: '📦' },
  { w: 'yo-yo', e: '🪀' }, { w: 'zebra', e: '🦓' },
];
// Source had wig (same picture as hair), net as a web and pot as a honey pot: swapped for clear pictures.
const CVC = [
  { w: 'bat', e: '🦇' }, { w: 'bed', e: '🛏️' }, { w: 'bin', e: '🗑️' }, { w: 'bus', e: '🚌' },
  { w: 'cup', e: '☕' }, { w: 'hen', e: '🐔' }, { w: 'map', e: '🗺️' }, { w: 'net', e: '🥅' },
  { w: 'pen', e: '🖊️' }, { w: 'pot', e: '🍲' }, { w: 'rat', e: '🐀' }, { w: 'six', e: '6️⃣' },
  { w: 'tap', e: '🚰' }, { w: 'ten', e: '🔟' }, { w: 'fox', e: '🦊' }, { w: 'zip', e: '🤐' },
];
const COLOURS = [
  { w: 'red', e: '🔴', g: 'c' }, { w: 'blue', e: '🔵', g: 'c' }, { w: 'green', e: '🟢', g: 'c' },
  { w: 'yellow', e: '🟡', g: 'c' }, { w: 'black', e: '⚫', g: 'c' }, { w: 'white', e: '⚪', g: 'c' },
  { w: 'orange', e: '🟠', g: 'c' },
  { w: 'one', e: '1️⃣', g: 'n' }, { w: 'two', e: '2️⃣', g: 'n' }, { w: 'three', e: '3️⃣', g: 'n' },
  { w: 'four', e: '4️⃣', g: 'n' }, { w: 'five', e: '5️⃣', g: 'n' },
];
const VERBS = [
  { w: 'run', e: '🏃' }, { w: 'jump', e: '🤸' }, { w: 'eat', e: '🍽️' }, { w: 'sleep', e: '😴' },
  { w: 'swim', e: '🏊' }, { w: 'read', e: '📖' }, { w: 'sing', e: '🎤' }, { w: 'draw', e: '🖍️' },
  { w: 'walk', e: '🚶' }, { w: 'sit', e: '🪑' }, { w: 'play', e: '🎮' }, { w: 'wash', e: '🧼' },
];
// Source said "mom"; Malaysian English says "mum".
const BODY = [
  { w: 'mum', e: '👩' }, { w: 'dad', e: '👨' }, { w: 'baby', e: '👶' }, { w: 'boy', e: '👦' },
  { w: 'girl', e: '👧' }, { w: 'eye', e: '👁️' }, { w: 'ear', e: '👂' }, { w: 'nose', e: '👃' },
  { w: 'hand', e: '✋' }, { w: 'foot', e: '🦶' }, { w: 'mouth', e: '👄' }, { w: 'hair', e: '💇' },
];

// 3 choices: the word plus 2 others. Later in the round the others look more alike (same first letter or length).
function choicesFor(items, it, pos) {
  const others = items.filter((x) => x !== it && x.g === it.g);
  const like = (x) => (x.w[0] === it.w[0] ? 2 : 0) + (x.w.length === it.w.length ? 1 : 0);
  const pool = pos >= 5 ? shuffle(others).sort((a, b) => like(b) - like(a)).slice(0, 4) : others;
  return shuffle([it, ...shuffle(pool).slice(0, 2)]).map((x) => ({ label: x.w, value: x.w }));
}

// Listening: `say` is what the speaker says (the prompt must not hold the answer); choices are the written words.
const listen = (items, pos) => {
  const it = pick(items);
  return {
    key: `l-${it.w}`, prompt: { en: 'Listen and pick.' }, say: it.w,
    choices: choicesFor(items, it, pos), answer: it.w,
  };
};

const look = (items, pos) => {
  const it = pick(items);
  return {
    key: `r-${it.w}`, prompt: { en: 'What is this?' },
    visual: `<div class="items"><span>${it.e}</span></div>`,
    choices: choicesFor(items, it, pos), answer: it.w,
  };
};

// Read aloud: a grown-up ticks it (no speech recognition).
const say = (items) => {
  const it = pick(items);
  return {
    key: `s-${it.w}`, prompt: { en: 'Read it aloud.' },
    visual: `<div class="items"><span>${it.e}</span></div>`,
    read: it.w, choices: [], answer: true,
  };
};

// Writing levels from the source are dropped (no handwriting for English); listening covers the spelling.
const tier = (slug, items, name, ms, icon, stickers) => [
  { id: `en-${slug}-listen`, title: { en: `${name}: listen`, ms: `${ms}: dengar` }, icon: '👂', sticker: stickers[0], gen: (pos) => listen(items, pos) },
  { id: `en-${slug}-look`, title: { en: `${name}: look`, ms: `${ms}: lihat` }, icon, sticker: stickers[1], gen: (pos) => look(items, pos) },
  { id: `en-${slug}-say`, title: { en: `${name}: say it`, ms: `${ms}: sebut` }, icon: '🗣️', sticker: stickers[2], gen: () => say(items) },
];

const st = (n, e) => ({ id: `st-en-${n}`, e });
const stickers = [
  st(1, '🚗'), st(2, '🚕'), st(3, '🚌'), st(4, '🚎'), st(5, '🚓'), st(6, '🚑'), st(7, '🚒'), st(8, '🚜'),
  st(9, '🚲'), st(10, '🛵'), st(11, '🏍️'), st(12, '🚂'), st(13, '🚁'), st(14, '🚀'), st(15, '⛵'),
];
const s3 = (i) => stickers.slice(i * 3, i * 3 + 3);

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'en',
  name: 'English',
  icon: '🔤',
  color: '#a5d6a7',
  lang: 'en',
  placement: false,     // starts at level 1 (parent can change it); read-aloud levels need a grown-up anyway
  levels: [
    ...tier('nouns', NOUNS, 'Letter words', 'Perkataan huruf', '🍎', s3(0)),
    ...tier('cvc', CVC, 'Short words', 'Perkataan pendek', '🐱', s3(1)),
    ...tier('colours', COLOURS, 'Colours & numbers', 'Warna & nombor', '🎨', s3(2)),
    ...tier('verbs', VERBS, 'Action words', 'Perkataan perbuatan', '🏃', s3(3)),
    ...tier('body', BODY, 'Family & body', 'Keluarga & badan', '👪', s3(4)),
  ],
};
