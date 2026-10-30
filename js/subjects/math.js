import { rand, pick, shuffle, numberChoices } from './util.js';
import { py, zhCount } from '../lang.js';

// A question is: { key, prompt: { ms, en, zh, py }, text?, visual (html), choices[{label,value}], answer, wide? }

// n: Malay, en/pl: English singular/plural, zh/py: Mandarin + pinyin, mw: measure word.
const THINGS = [
  { e: '🍎', n: 'epal', en: 'apple', pl: 'apples', zh: '苹果', py: 'píngguǒ', mw: '个', mwpy: 'gè' },
  { e: '🍌', n: 'pisang', en: 'banana', pl: 'bananas', zh: '香蕉', py: 'xiāngjiāo', mw: '根', mwpy: 'gēn' },
  { e: '🐟', n: 'ikan', en: 'fish', pl: 'fish', zh: '鱼', py: 'yú', mw: '条', mwpy: 'tiáo' },
  { e: '⭐', n: 'bintang', en: 'star', pl: 'stars', zh: '星星', py: 'xīngxing', mw: '颗', mwpy: 'kē' },
  { e: '🐱', n: 'kucing', en: 'cat', pl: 'cats', zh: '猫', py: 'māo', mw: '只', mwpy: 'zhī' },
  { e: '🚗', n: 'kereta', en: 'car', pl: 'cars', zh: '汽车', py: 'qìchē', mw: '辆', mwpy: 'liàng' },
  { e: '🎈', n: 'belon', en: 'balloon', pl: 'balloons', zh: '气球', py: 'qìqiú', mw: '个', mwpy: 'gè' },
  { e: '🐥', n: 'anak ayam', en: 'chick', pl: 'chicks', zh: '小鸡', py: 'xiǎojī', mw: '只', mwpy: 'zhī' },
];

// `goneFrom`: items at this index and after are shown crossed out (for subtraction).
const group = (it, n, goneFrom = n) =>
  `<div class="items">${Array.from({ length: n }, (_, k) =>
    `<span class="${k >= goneFrom ? 'gone' : ''}">${it.e}</span>`).join('')}</div>`;

// Ten frame: `total` cells in rows of 5; the first `a` dots in one colour, the next `b` in another.
// Lets a child *see* "7 is 5 and 2 more" without counting one by one.
const frame = (total, a, b = 0) =>
  `<div class="frame">${Array.from({ length: total }, (_, k) => {
    const dot = k < a ? '<i class="dot a"></i>' : k < a + b ? '<i class="dot b"></i>' : '';
    return `<span class="cell">${dot}</span>`;
  }).join('')}</div>`;

// "x + y" with small two-colour dots underneath to count.
const pairLabel = (x, y) =>
  `<span class="pair"><b>${x} + ${y}</b><span class="mini">${'<i class="a"></i>'.repeat(x)}${'<i class="b"></i>'.repeat(y)}</span></span>`;

const blankable = (v) => (v === '?' ? '<span class="blank">?</span>' : `<span>${v}</span>`);

function count(min, max) {
  const n = rand(min, max);
  const it = pick(THINGS);
  return {
    key: `c${n}${it.e}`,
    prompt: {
      ms: `Berapa banyak ${it.n}?`,
      en: `How many ${it.pl}?`,
      zh: `有几${it.mw}${it.zh}？`,
      py: `yǒu jǐ ${it.mwpy} ${it.py}?`,
    },
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
    prompt: {
      ms: `Mana lebih banyak ${it.n}?`,
      en: `Which side has more ${it.pl}?`,
      zh: `哪边的${it.zh}比较多？`,
      py: `nǎ biān de ${it.py} bǐjiào duō?`,
    },
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
    prompt: {
      ms: `${a} tambah ${b}, jadi berapa?`,
      en: `${a} plus ${b} makes how many?`,
      zh: `${a}加${b}等于几？`,
      py: `${py(a)} jiā ${py(b)} děngyú jǐ?`,
    },
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
    prompt: {
      ms: `${a} tolak ${b}, tinggal berapa?`,
      en: `${a} take away ${b} leaves how many?`,
      zh: `${a}减${b}等于几？`,
      py: `${py(a)} jiǎn ${py(b)} děngyú jǐ?`,
    },
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
  const [zn, zp] = zhCount(n);
  return {
    key: `n${n}`,
    prompt: {
      ms: `Mana ada ${n} ${it.n}?`,
      en: `Which group has ${n} ${n === 1 ? it.en : it.pl}?`,
      zh: `哪组有${zn}${it.mw}${it.zh}？`,
      py: `nǎ zǔ yǒu ${zp} ${it.mwpy} ${it.py}?`,
    },
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
    prompt: after
      ? { ms: `Selepas ${n}, nombor apa?`, en: `What comes after ${n}?`, zh: `${n}的后面是几？`, py: `${py(n)} de hòumiàn shì jǐ?` }
      : { ms: `Sebelum ${n}, nombor apa?`, en: `What comes before ${n}?`, zh: `${n}的前面是几？`, py: `${py(n)} de qiánmiàn shì jǐ?` },
    visual: `<div class="track">${cells.map(blankable).join('')}</div>`,
    choices: numberChoices(answer, 1, max),
    answer,
  };
}

// Number bonds: "Which is the same as 2 + 3?" -> 1 + 4. Teaches that a number can be
// made in different ways. The right pair is never the question flipped (3 + 2), and
// the wrong pairs total one more or one less, so the child has to check.
function bond(total) {
  const a = rand(1, total - 1);
  const b = total - a;
  const others = [];
  for (let x = 1; x < total; x++) if (x !== a && x !== b) others.push(x);
  const x = pick(others);
  const answer = `${x}+${total - x}`;

  const wrong = [];
  while (wrong.length < 2) {
    const sum = total + pick([-1, 1]);
    const p = rand(1, sum - 1);
    const v = `${p}+${sum - p}`;
    if (!wrong.includes(v)) wrong.push(v);
  }
  const choices = shuffle([answer, ...wrong]).map((v) => {
    const [p, q] = v.split('+').map(Number);
    return { label: pairLabel(p, q), value: v };
  });

  return {
    key: `b${total}-${a}+${b}-${x}`,
    prompt: {
      ms: `Mana yang sama dengan ${a} tambah ${b}?`,
      en: `Which is the same as ${a} plus ${b}?`,
      zh: `哪个和${a}加${b}一样？`,
      py: `nǎge hé ${py(a)} jiā ${py(b)} yíyàng?`,
    },
    text: `${a} + ${b}`,
    visual: frame(total, a, b),
    wide: true,
    choices,
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
