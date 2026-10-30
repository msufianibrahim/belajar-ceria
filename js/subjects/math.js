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

// Ten frame: `total` cells in rows of 5 with `filled` dots. The top row always fills
// first (so 7 reads as "5 and 2"); `rightSide` packs each row's dots to the right.
const frame = (total, filled, rightSide = false) =>
  `<div class="frame">${Array.from({ length: total }, (_, k) => {
    const col = k % 5;
    const order = k - col + (rightSide ? 4 - col : col);
    return `<span class="cell">${order < filled ? '<i class="dot"></i>' : ''}</span>`;
  }).join('')}</div>`;

const blankable = (v) => (v === '?' ? '<span class="blank">?</span>' : `<span>${v}</span>`);

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

// See the numeral, pick the group with that many.
function numeral(max) {
  const n = rand(1, max);
  const it = pick(THINGS);
  return {
    key: `n${n}`,
    prompt: `Mana ada ${n} ${it.n}?`,
    visual: `<div class="numeral">${n}</div>`,
    wide: true,
    choices: numberChoices(n, 1, max).map((c) => ({ label: group(it, c.value), value: c.value })),
    answer: n,
  };
}

// What comes before / after n on a number track.
function sequence(max) {
  const after = Math.random() < 0.5;
  const n = after ? rand(1, max - 1) : rand(2, max);
  const answer = after ? n + 1 : n - 1;
  const cells = (after ? [n - 1, n, '?'] : ['?', n, n + 1]).filter((c) => c === '?' || (c >= 1 && c <= max));
  return {
    key: `q${after ? 'a' : 'b'}${n}`,
    prompt: after ? `Selepas ${n}, nombor apa?` : `Sebelum ${n}, nombor apa?`,
    visual: `<div class="track">${cells.map(blankable).join('')}</div>`,
    choices: numberChoices(answer, 1, max),
    answer,
  };
}

// Number bond: the whole split into two parts, one part missing.
function bond(total) {
  const known = rand(1, total - 1);
  const answer = total - known;
  const missingLeft = Math.random() < 0.5;
  const parts = missingLeft ? ['?', known] : [known, '?'];
  // Dots sit on the same side as the known part.
  return {
    key: `b${total}-${known}-${missingLeft ? 'L' : 'R'}`,
    prompt: missingLeft ? `${total} ialah berapa dan ${known}?` : `${total} ialah ${known} dan berapa?`,
    visual: `<div class="bond"><span class="whole">${total}</span><div class="parts">${parts.map(blankable).join('')}</div></div>${frame(total, known, missingLeft)}`,
    choices: numberChoices(answer, 1, total - 1),
    answer,
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
    { id: 'math-numerals', title: 'Kenal nombor', icon: '7️⃣', sticker: { id: 'st-panda', e: '🐼' }, gen: () => numeral(10) },
    { id: 'math-count10', title: 'Kira 1–10', icon: '🐟', sticker: { id: 'st-elephant', e: '🐘' }, gen: () => count(1, 10) },
    { id: 'math-compare', title: 'Mana lebih banyak?', icon: '⚖️', sticker: { id: 'st-giraffe', e: '🦒' }, gen: () => compare(8) },
    { id: 'math-sequence', title: 'Sebelum & selepas', icon: '➡️', sticker: { id: 'st-owl', e: '🦉' }, gen: () => sequence(10) },
    { id: 'math-bond5', title: 'Pasangan 5', icon: '🖐️', sticker: { id: 'st-octopus', e: '🐙' }, gen: () => bond(5) },
    { id: 'math-add5', title: 'Tambah hingga 5', icon: '➕', sticker: { id: 'st-dolphin', e: '🐬' }, gen: () => add(5) },
    { id: 'math-sub5', title: 'Tolak hingga 5', icon: '➖', sticker: { id: 'st-zebra', e: '🦓' }, gen: () => subtract(5) },
    { id: 'math-bond10', title: 'Pasangan 10', icon: '🔟', sticker: { id: 'st-peacock', e: '🦚' }, gen: () => bond(10) },
    { id: 'math-add10', title: 'Tambah hingga 10', icon: '➕', sticker: { id: 'st-butterfly', e: '🦋' }, gen: () => add(10) },
  ],
};
