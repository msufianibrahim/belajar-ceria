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

const group = (it, n) => `<div class="items">${Array.from({ length: n }, () => `<span>${it.e}</span>`).join('')}</div>`;

// Sums are shown as numbers only: pictures to count would let him count instead of add.
const pairLabel = (x, y) => `<span class="pair"><b>${x} + ${y}</b></span>`;

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
  return {
    key: `a${a}+${b}`,
    prompt: {
      ms: `${a} tambah ${b}, jadi berapa?`,
      en: `${a} plus ${b} makes how many?`,
      zh: `${a}加${b}等于几？`,
      py: `${py(a)} jiā ${py(b)} děngyú jǐ?`,
    },
    text: `${a} + ${b} = ?`,
    choices: numberChoices(a + b, 2, max),
    answer: a + b,
  };
}

const subPrompt = (a, b) => ({
  ms: `${a} tolak ${b}, tinggal berapa?`,
  en: `${a} take away ${b} leaves how many?`,
  zh: `${a}减${b}等于几？`,
  py: `${py(a)} jiǎn ${py(b)} děngyú jǐ?`,
});

function subtract(max) {
  const a = rand(2, max);
  const b = rand(1, a - 1);
  return {
    key: `s${a}-${b}`,
    prompt: subPrompt(a, b),
    text: `${a} − ${b} = ?`,
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
    wide: true,
    choices,
    answer,
  };
}

// Two ten frames with `n` dots.
const tens = (n) =>
  `<div class="frames">${[0, 10].map((start) => `<div class="frame">${Array.from({ length: 10 }, (_, j) => {
    const k = start + j;
    return `<span class="cell">${k < n ? '<i class="dot"></i>' : ''}</span>`;
  }).join('')}</div>`).join('')}</div>`;

// Count back: "9, 8, 7, ?" — the step before subtraction.
function countBack(lo, hi) {
  const s = rand(lo, hi);
  return {
    key: `k${s}`,
    prompt: {
      ms: `Kira undur: ${s}, ${s - 1}, ${s - 2}, lepas itu?`,
      en: `Count back: ${s}, ${s - 1}, ${s - 2}, what comes next?`,
      zh: `倒数：${s}、${s - 1}、${s - 2}，下一个是几？`,
      py: `dàoshǔ: ${py(s)}, ${py(s - 1)}, ${py(s - 2)}, xià yí ge shì jǐ?`,
    },
    visual: `<div class="track">${[s, s - 1, s - 2, '?'].map(blankable).join('')}</div>`,
    choices: numberChoices(s - 3, 1, hi),
    answer: s - 3,
  };
}

// "2 less than 7" on a number line, with 7 marked.
function less(max) {
  const n = rand(3, max);
  const k = rand(1, 2);
  return {
    key: `l${n}-${k}`,
    prompt: {
      ms: `${k} kurang daripada ${n}, nombor apa?`,
      en: `What is ${k} less than ${n}?`,
      zh: `比${n}少${k}是几？`,
      py: `bǐ ${py(n)} shǎo ${py(k)} shì jǐ?`,
    },
    visual: `<div class="line">${Array.from({ length: max }, (_, i) =>
      `<span${i + 1 === n ? ' class="here"' : ''}>${i + 1}</span>`).join('')}</div>`,
    choices: numberChoices(n - k, 1, max),
    answer: n - k,
  };
}

// 11–20 as "a full ten and some more".
function countTeen() {
  const n = rand(11, 20);
  return {
    key: `t${n}`,
    prompt: { ms: 'Berapa titik semuanya?', en: 'How many dots altogether?', zh: '一共有几个点？', py: 'yīgòng yǒu jǐ ge diǎn?' },
    visual: tens(n),
    choices: numberChoices(n, 10, 20),
    answer: n,
  };
}

// Addition within 20: answers 11–20, both "8 + 5" (across ten) and "12 + 5".
function addTeen() {
  const a = rand(1, 19);
  const b = rand(Math.max(1, 11 - a), 20 - a);
  return {
    key: `a${a}+${b}`,
    prompt: {
      ms: `${a} tambah ${b}, jadi berapa?`,
      en: `${a} plus ${b} makes how many?`,
      zh: `${a}加${b}等于几？`,
      py: `${py(a)} jiā ${py(b)} děngyú jǐ?`,
    },
    text: `${a} + ${b} = ?`,
    choices: numberChoices(a + b, 10, 20),
    answer: a + b,
  };
}

// Subtraction within 20, written the way school writes it: "15 − 4 = ?"
function subtractTeen() {
  const a = rand(11, 20);
  const b = rand(1, 9);
  return {
    key: `s${a}-${b}`,
    prompt: subPrompt(a, b),
    text: `${a} − ${b} = ?`,
    choices: numberChoices(a - b, 1, 20),
    answer: a - b,
  };
}

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'math',
  name: { en: 'Maths', ms: 'Matematik' },
  icon: '🔢',
  color: '#ffb74d',
  mandarin: true,       // questions can switch to 华文 (see lang.js)
  // typed: answered on a number pad once passed (see progress.js answerMode).
  // needs: also opens once that level is passed (see progress.js isOpen).
  // probe: false = stepping stone; placement skips it (it opens with the levels around it).
  levels: [
    { id: 'math-count5', title: { en: 'Count 1–5', ms: 'Kira 1–5' }, icon: '🍎', sticker: { id: 'st-lion', e: '🦁' }, gen: () => count(1, 5) },
    { id: 'math-numerals', title: { en: 'Number match', ms: 'Kenal nombor' }, icon: '7️⃣', sticker: { id: 'st-panda', e: '🐼' }, gen: () => numeral(10) },
    { id: 'math-count10', title: { en: 'Count 1–10', ms: 'Kira 1–10' }, icon: '🐟', sticker: { id: 'st-elephant', e: '🐘' }, gen: () => count(1, 10) },
    { id: 'math-compare', title: { en: 'Which has more?', ms: 'Mana lebih banyak?' }, icon: '⚖️', probe: false, sticker: { id: 'st-giraffe', e: '🦒' }, gen: () => compare(8) },
    { id: 'math-sequence', title: { en: 'Before & after', ms: 'Sebelum & selepas' }, icon: '➡️', probe: false, sticker: { id: 'st-owl', e: '🦉' }, gen: () => sequence(10) },
    { id: 'math-countback10', title: { en: 'Count back from 10', ms: 'Kira undur hingga 10' }, icon: '⬅️', probe: false, sticker: { id: 'st-koala', e: '🐨' }, gen: () => countBack(4, 10) },
    { id: 'math-bond5', title: { en: 'Pairs of 5', ms: 'Pasangan 5' }, icon: '🖐️', probe: false, sticker: { id: 'st-octopus', e: '🐙' }, gen: () => bond(5) },
    { id: 'math-add5', typed: true, title: { en: 'Add within 5', ms: 'Tambah hingga 5' }, icon: '➕', sticker: { id: 'st-dolphin', e: '🐬' }, gen: () => add(5) },
    { id: 'math-less', title: { en: '1 less, 2 less', ms: 'Kurang 1, kurang 2' }, icon: '🔙', probe: false, sticker: { id: 'st-fox', e: '🦊' }, gen: () => less(10) },
    { id: 'math-sub5', typed: true, needs: 'math-add5', title: { en: 'Subtract within 5', ms: 'Tolak hingga 5' }, icon: '➖', sticker: { id: 'st-zebra', e: '🦓' }, gen: () => subtract(5) },
    { id: 'math-bond10', title: { en: 'Pairs of 10', ms: 'Pasangan 10' }, icon: '🔟', probe: false, sticker: { id: 'st-peacock', e: '🦚' }, gen: () => bond(10) },
    { id: 'math-add10', typed: true, needs: 'math-add5', title: { en: 'Add within 10', ms: 'Tambah hingga 10' }, icon: '➕', sticker: { id: 'st-butterfly', e: '🦋' }, gen: () => add(10) },
    { id: 'math-sub10', typed: true, needs: 'math-sub5', title: { en: 'Subtract within 10', ms: 'Tolak hingga 10' }, icon: '➖', sticker: { id: 'st-whale', e: '🐳' }, gen: () => subtract(10) },
    { id: 'math-count20', title: { en: 'Count 11–20', ms: 'Kira 11–20' }, icon: '🧮', sticker: { id: 'st-flamingo', e: '🦩' }, gen: () => countTeen() },
    { id: 'math-add20', typed: true, needs: 'math-add10', title: { en: 'Add within 20', ms: 'Tambah hingga 20' }, icon: '➕', sticker: { id: 'st-crocodile', e: '🐊' }, gen: () => addTeen() },
    { id: 'math-countback20', title: { en: 'Count back from 20', ms: 'Kira undur hingga 20' }, icon: '⬅️', probe: false, sticker: { id: 'st-kangaroo', e: '🦘' }, gen: () => countBack(12, 20) },
    { id: 'math-sub20', typed: true, needs: 'math-sub10', title: { en: 'Subtract within 20', ms: 'Tolak hingga 20' }, icon: '➖', sticker: { id: 'st-hedgehog', e: '🦔' }, gen: () => subtractTeen() },
  ],
};
