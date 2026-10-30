import { rand, pick, numberChoices } from './util.js';

// A question is: { key, prompt (spoken), text?, visual (html), choices[{label,value}], answer, wide? }

const THINGS = [
  { e: '🍎', n: 'epal' },
  { e: '🍌', n: 'pisang' },
  { e: '🐟', n: 'ikan' },
  { e: '⭐', n: 'bintang' },
  { e: '🐱', n: 'kucing' },
  { e: '🚗', n: 'kereta' },
  { e: '🎈', n: 'belon' },
  { e: '🐥', n: 'anak ayam' },
];

// `goneFrom`: items at this index and after are shown crossed out (for subtraction).
const group = (it, n, goneFrom = n) =>
  `<div class="items">${Array.from({ length: n }, (_, k) =>
    `<span class="${k >= goneFrom ? 'gone' : ''}">${it.e}</span>`).join('')}</div>`;

function count(min, max) {
  const n = rand(min, max);
  const it = pick(THINGS);
  return {
    key: `c${n}${it.e}`,
    prompt: `Berapa banyak ${it.n}?`,
    visual: group(it, n),
    choices: numberChoices(n, 1, max),
    answer: n,
  };
}

function compare(max) {
  const a = rand(1, max);
  let b;
  do b = rand(1, max); while (b === a);
  const it = pick(THINGS);
  return {
    key: `m${a}-${b}`,
    prompt: `Mana lebih banyak ${it.n}?`,
    visual: '',
    wide: true,
    choices: [{ label: group(it, a), value: a }, { label: group(it, b), value: b }],
    answer: Math.max(a, b),
  };
}

function add(max) {
  const a = rand(1, max - 1);
  const b = rand(1, max - a);
  const it = pick(THINGS);
  return {
    key: `a${a}+${b}`,
    prompt: `${a} tambah ${b}, jadi berapa?`,
    text: `${a} + ${b} = ?`,
    visual: `<div class="sum">${group(it, a)}<b>+</b>${group(it, b)}</div>`,
    choices: numberChoices(a + b, 2, max),
    answer: a + b,
  };
}

function subtract(max) {
  const a = rand(2, max);
  const b = rand(1, a - 1);
  const it = pick(THINGS);
  return {
    key: `s${a}-${b}`,
    prompt: `${a} tolak ${b}, tinggal berapa?`,
    text: `${a} − ${b} = ?`,
    visual: group(it, a, a - b),
    choices: numberChoices(a - b, 1, max - 1),
    answer: a - b,
  };
}

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'math',
  name: 'Matematik',
  icon: '🔢',
  color: '#ffb74d',
  levels: [
    { id: 'math-count5', title: 'Kira 1–5', icon: '🍎', sticker: { id: 'st-lion', e: '🦁' }, gen: () => count(1, 5) },
    { id: 'math-count10', title: 'Kira 1–10', icon: '🐟', sticker: { id: 'st-elephant', e: '🐘' }, gen: () => count(1, 10) },
    { id: 'math-compare', title: 'Mana lebih banyak?', icon: '⚖️', sticker: { id: 'st-giraffe', e: '🦒' }, gen: () => compare(8) },
    { id: 'math-add5', title: 'Tambah hingga 5', icon: '➕', sticker: { id: 'st-dolphin', e: '🐬' }, gen: () => add(5) },
    { id: 'math-add10', title: 'Tambah hingga 10', icon: '➕', sticker: { id: 'st-butterfly', e: '🦋' }, gen: () => add(10) },
    { id: 'math-sub5', title: 'Tolak hingga 5', icon: '➖', sticker: { id: 'st-zebra', e: '🦓' }, gen: () => subtract(5) },
  ],
};
