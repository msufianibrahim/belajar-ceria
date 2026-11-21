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

// Single-digit facts up to 9 + 9; two in three cross ten (within 10 has its own level).
function addDigits() {
  const cross = Math.random() < 2 / 3;
  const a = rand(cross ? 2 : 1, 9);
  const b = cross ? rand(Math.max(1, 11 - a), 9) : rand(1, Math.min(9, 10 - a));
  return {
    key: `a${a}+${b}`,
    prompt: {
      ms: `${a} tambah ${b}, jadi berapa?`,
      en: `${a} plus ${b} makes how many?`,
      zh: `${a}加${b}等于几？`,
      py: `${py(a)} jiā ${py(b)} děngyú jǐ?`,
    },
    text: `${a} + ${b} = ?`,
    choices: numberChoices(a + b, 2, 18),
    answer: a + b,
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

// Column (vertical) sums with 2-digit numbers, written the way school sets them out.
// The first 3 of a round add or take a 1-digit number. `regroup`: carrying / borrowing.
function column(op, regroup, pos) {
  const small = pos < 3;
  for (;;) {
    let at, ao, bt, bo;
    if (op === '+') {
      ao = regroup ? rand(1, 9) : rand(0, 9);
      bo = regroup ? rand(10 - ao, 9) : rand(0, 9 - ao);
      at = rand(1, regroup ? 7 : 8);
      bt = small ? 0 : rand(1, (regroup ? 8 : 9) - at);
    } else {
      at = rand(regroup ? 2 : 1, 9);
      ao = regroup ? rand(0, 8) : rand(0, 9);
      bo = regroup ? rand(ao + 1, 9) : rand(0, ao);
      bt = small ? 0 : rand(1, regroup ? at - 1 : at);
    }
    const a = at * 10 + ao, b = bt * 10 + bo;
    if (!b || (op === '-' && b === a)) continue;
    const answer = op === '+' ? a + b : a - b;
    return {
      key: `c${a}${op}${b}`,
      prompt: op === '+' ? {
        ms: `${a} tambah ${b}, jadi berapa?`, en: `${a} plus ${b} makes how many?`,
        zh: `${a}加${b}等于几？`, py: `${py(a)} jiā ${py(b)} děngyú jǐ?`,
      } : subPrompt(a, b),
      column: { a, b, op },
      choices: [],
      answer,
    };
  }
}

// ---- Years 1–6 (KSSR). Every sum is exact: decimals are built from integers, never floats. ----

const PD = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
// Pinyin for 0–9,999,999 (lang.js py() stops at 20).
function pyn(n) {
  if (n < 10) return PD[n];
  const s4 = (m) => {
    const out = [];
    let zero = false;
    [[1000, 'qiān'], [100, 'bǎi'], [10, 'shí'], [1, '']].forEach(([u, w]) => {
      const d = Math.floor(m / u) % 10;
      if (!d) { if (out.length) zero = true; return; }
      if (zero) { out.push('líng'); zero = false; }
      if (!(u === 10 && d === 1 && !out.length)) out.push(PD[d]);
      if (w) out.push(w);
    });
    return out.join(' ');
  };
  const hi = Math.floor(n / 10000), lo = n % 10000;
  if (!hi) return s4(n);
  return `${s4(hi)} wàn${lo ? ` ${lo < 1000 ? 'líng ' : ''}${s4(lo)}` : ''}`;
}
// A number or a decimal string ("3.5") in pinyin.
const pn = (x) => {
  const [i, f] = String(x).split('.');
  return f ? `${pyn(+i)} diǎn ${[...f].map((c) => PD[c]).join(' ')}` : pyn(+i);
};
const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const zhFrac = (k, d) => `${ZH[d] ?? d}分之${ZH[k] ?? k}`;
const pyFrac = (k, d) => `${pn(d)} fēn zhī ${pn(k)}`;
const fr = (k, d) => `<sup>${k}</sup>/<sub>${d}</sub>`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lowest = (n, d) => [n / gcd(n, d), d / gcd(n, d)];
const T = (ms, en, zh, p) => ({ ms, en, zh, py: p });

const addP = (a, b) => T(`${a} tambah ${b}, jadi berapa?`, `${a} plus ${b} makes how many?`, `${a}加${b}等于几？`, `${pn(a)} jiā ${pn(b)} děngyú jǐ?`);
const subQ = (a, b) => T(`${a} tolak ${b}, tinggal berapa?`, `${a} take away ${b} leaves how many?`, `${a}减${b}等于几？`, `${pn(a)} jiǎn ${pn(b)} děngyú jǐ?`);
const mulP = (a, b) => T(`${a} darab ${b}, jadi berapa?`, `${a} times ${b} makes how many?`, `${a}乘${b}等于几？`, `${pn(a)} chéng ${pn(b)} děngyú jǐ?`);
const divP = (a, b) => T(`${a} bahagi ${b}, jadi berapa?`, `${a} divided by ${b} makes how many?`, `${a}除以${b}等于几？`, `${pn(a)} chúyǐ ${pn(b)} děngyú jǐ?`);

// Number choices with the slips a child makes (off by one, ten, a hundred).
function near(a) {
  if (a < 100) return numberChoices(a, Math.max(0, a - 9), a + 9);
  const c = [a + 10, a - 10, a + 100, a - 100, a + 1, a - 1];
  if (a >= 1000) c.push(a + 1000, a - 1000);
  return shuffle([a, ...shuffle(c.filter((v) => v >= 0)).slice(0, 2)]).map((v) => ({ label: String(v), value: v }));
}
// The answer plus up to `n` of the (deduplicated) wrong values, shuffled.
const opts = (answer, wrongs, label = String, n = 2) =>
  shuffle([answer, ...shuffle([...new Set(wrongs)].filter((v) => v !== answer)).slice(0, n)]).map((v) => ({ label: label(v), value: v }));

const pad2 = (m) => String(m).padStart(2, '0');
const hund = (h) => `${Math.floor(h / 100)}.${pad2(h % 100)}`; // hundredths -> "3.05"
const rm = (sen) => `RM${hund(sen)}`;

// Year 1
function tensOnes() {
  const r = Math.random();
  if (r < 0.7) {
    const n = rand(11, 99), tens = r < 0.35;
    const ans = tens ? Math.floor(n / 10) : n % 10;
    return {
      key: `${tens ? 't' : 'o'}${n}`,
      prompt: tens
        ? T(`Apakah digit puluh bagi ${n}?`, `What digit is in the tens place of ${n}?`, `${n}的十位数是几？`, `${pn(n)} de shíwèi shù shì jǐ?`)
        : T(`Apakah digit sa bagi ${n}?`, `What digit is in the ones place of ${n}?`, `${n}的个位数是几？`, `${pn(n)} de gèwèi shù shì jǐ?`),
      text: String(n),
      choices: numberChoices(ans, 0, 9),
      answer: ans,
    };
  }
  const t = rand(1, 9), o = rand(1, 9), n = t * 10 + o;
  return {
    key: `n${t}-${o}`,
    prompt: T(`${t} puluh dan ${o} sa ialah nombor berapa?`, `${t} tens and ${o} ones make what number?`,
      `${t}个十和${o}个一合起来是几？`, `${pn(t)} ge shí hé ${pn(o)} ge yī hé qǐlái shì jǐ?`),
    choices: near(n),
    answer: n,
  };
}

function biggest() {
  const big = Math.random() < 0.5, a = rand(10, 98), sw = (a % 10) * 10 + Math.floor(a / 10);
  const nums = [a];
  if (sw >= 10 && sw !== a && Math.random() < 0.6) nums.push(sw); // 47 and 74: the digits are the trap
  while (nums.length < 3) { const x = rand(10, 99); if (!nums.includes(x)) nums.push(x); }
  const ns = shuffle(nums), answer = big ? Math.max(...ns) : Math.min(...ns);
  return {
    key: `${big ? 'bg' : 'sm'}${ns.join('-')}`,
    prompt: big ? T('Nombor mana paling besar?', 'Which number is the biggest?', '哪个数最大？', 'nǎge shù zuì dà?')
      : T('Nombor mana paling kecil?', 'Which number is the smallest?', '哪个数最小？', 'nǎge shù zuì xiǎo?'),
    choices: ns.map((v) => ({ label: String(v), value: v })),
    answer,
  };
}

// Mental add/subtract within 100: a one-digit number or a whole ten.
function addSub100() {
  for (;;) {
    const a = rand(11, 99), b = Math.random() < 0.5 ? rand(1, 9) : 10 * rand(1, 9), add = Math.random() < 0.5;
    if (add ? a + b > 100 : a - b < 1) continue;
    const ans = add ? a + b : a - b;
    return { key: `${add ? 'p' : 'm'}${a}.${b}`, prompt: add ? addP(a, b) : subQ(a, b), text: `${a} ${add ? '+' : '−'} ${b} = ?`, choices: near(ans), answer: ans };
  }
}

// Malaysian coins: 5, 10, 20, 50 sen.
function sen() {
  for (;;) {
    const cs = Array.from({ length: rand(2, 3) }, () => pick([5, 10, 20, 50])).sort((x, y) => y - x);
    const sum = cs.reduce((x, y) => x + y);
    if (sum > 100) continue;
    return {
      key: `sen${cs.join('-')}`,
      prompt: T('Berapa sen semuanya?', 'How many sen altogether?', '一共多少仙？', 'yīgòng duōshao xiān?'),
      text: `${cs.map((c) => `${c} sen`).join(' + ')} = ? sen`,
      choices: near(sum),
      answer: sum,
    };
  }
}

// Analogue clock: the hour hand sits between the numbers as the minutes pass.
function clock(h, m) {
  const pt = (deg, r) => { const a = (deg * Math.PI) / 180; return [(50 + r * Math.sin(a)).toFixed(1), (50 - r * Math.cos(a)).toFixed(1)]; };
  const hand = (cls, deg, r, w) => { const [x, y] = pt(deg, r); return `<line class="${cls}" x1="50" y1="50" x2="${x}" y2="${y}" stroke="#333" stroke-width="${w}" stroke-linecap="round"/>`; };
  const nums = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = pt((i + 1) * 30, 38);
    return `<text x="${x}" y="${y}" font-size="10" text-anchor="middle" dominant-baseline="central" fill="#333">${i + 1}</text>`;
  }).join('');
  return `<svg class="clock" viewBox="0 0 100 100" width="200" height="200"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#333" stroke-width="3"/>${nums}${hand('hh', (h % 12) * 30 + m / 2, 24, 4)}${hand('mh', m * 6, 34, 2.5)}<circle cx="50" cy="50" r="3" fill="#333"/></svg>`;
}

function readClock(mins) {
  const h = rand(1, 12), m = pick(mins), t = (hh, mi) => `${hh}:${pad2(mi)}`;
  const wrong = [...mins.filter((x) => x !== m).map((x) => t(h, x)), t((h % 12) + 1, m), t(((h + 10) % 12) + 1, m)];
  return {
    key: `k${t(h, m)}`,
    prompt: T('Pukul berapa sekarang?', 'What time is it?', '现在是几点？', 'xiànzài shì jǐ diǎn?'),
    visual: clock(h, m),
    choices: opts(t(h, m), wrong),
    answer: t(h, m),
  };
}

const ngon = (n) => Array.from({ length: n }, (_, i) => {
  const a = (2 * Math.PI * i) / n - Math.PI / 2;
  return `${(50 + 42 * Math.cos(a)).toFixed(1)},${(50 + 42 * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const SHAPES = [
  { k: 'circle', ms: 'bulatan', en: 'circle', zh: '圆形', py: 'yuánxíng', sides: 0, svg: '<circle cx="50" cy="50" r="42"/>' },
  { k: 'triangle', ms: 'segi tiga', en: 'triangle', zh: '三角形', py: 'sānjiǎoxíng', sides: 3, svg: `<polygon points="${ngon(3)}"/>` },
  { k: 'square', ms: 'segi empat sama', en: 'square', zh: '正方形', py: 'zhèngfāngxíng', sides: 4, svg: '<rect x="12" y="12" width="76" height="76"/>' },
  { k: 'rectangle', ms: 'segi empat tepat', en: 'rectangle', zh: '长方形', py: 'chángfāngxíng', sides: 4, svg: '<rect x="5" y="27" width="90" height="46"/>' },
  { k: 'pentagon', ms: 'pentagon', en: 'pentagon', zh: '五边形', py: 'wǔbiānxíng', sides: 5, svg: `<polygon points="${ngon(5)}"/>` },
  { k: 'hexagon', ms: 'heksagon', en: 'hexagon', zh: '六边形', py: 'liùbiānxíng', sides: 6, svg: `<polygon points="${ngon(6)}"/>` },
];
const shapeSvg = (k) => `<svg viewBox="0 0 100 100" width="90" height="90" fill="#ffb74d" stroke="#333" stroke-width="4" stroke-linejoin="round">${SHAPES.find((s) => s.k === k).svg}</svg>`;

function flatShapes() {
  if (Math.random() < 0.6) {
    const s = pick(SHAPES);
    // A square is also a rectangle: rectangle is only ever the answer, and never sits beside a square.
    const others = shuffle(SHAPES.filter((x) => x !== s && x.k !== 'rectangle' && !(s.k === 'rectangle' && x.k === 'square'))).slice(0, 2);
    return {
      key: `sh-${s.k}`,
      prompt: T(`Yang mana satu ${s.ms}?`, `Which one is a ${s.en}?`, `哪个是${s.zh}？`, `nǎge shì ${s.py}?`),
      wide: true,
      choices: shuffle([s, ...others]).map((x) => ({ label: shapeSvg(x.k), value: x.k })),
      answer: s.k,
    };
  }
  const s = pick(SHAPES.filter((x) => x.sides));
  return {
    key: `si-${s.k}`,
    prompt: T(`Berapa sisi ada pada ${s.ms}?`, `How many sides does a ${s.en} have?`, `${s.zh}有几条边？`, `${s.py} yǒu jǐ tiáo biān?`),
    visual: shapeSvg(s.k),
    choices: numberChoices(s.sides, 3, 6),
    answer: s.sides,
  };
}

// Year 2
function placeValue3() {
  if (Math.random() < 0.6) {
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), n = ds[0] * 100 + ds[1] * 10 + ds[2];
    const p = rand(0, 2), d = ds[2 - p];
    return {
      key: `v${n}-${d}`,
      prompt: T(`Apakah nilai digit ${d} dalam ${n}?`, `What is the value of the digit ${d} in ${n}?`,
        `在${n}中，数字${d}的值是多少？`, `zài ${pn(n)} zhōng, shùzì ${pn(d)} de zhí shì duōshao?`),
      text: String(n),
      choices: shuffle([1, 10, 100]).map((u) => ({ label: String(d * u), value: d * u })),
      answer: d * 10 ** p,
    };
  }
  let h, t, o;
  do { h = rand(1, 9); t = rand(0, 9); o = rand(0, 9); } while (!t && !o);
  const n = h * 100 + t * 10 + o;
  return {
    key: `e${n}`,
    prompt: T('Tulis sebagai satu nombor.', 'Write it as one number.', '写成一个数。', 'xiě chéng yí ge shù.'),
    text: [h * 100, t * 10, o].filter(Boolean).join(' + '),
    choices: near(n),
    answer: n,
  };
}

// a + b or a − b, all within max, with a at least aMin and b at least bMin.
function addSub(max, aMin, bMin) {
  if (Math.random() < 0.5) {
    const a = rand(aMin, max - bMin), b = rand(bMin, max - a);
    return { key: `p${a}.${b}`, prompt: addP(a, b), text: `${a} + ${b} = ?`, choices: near(a + b), answer: a + b };
  }
  const a = rand(aMin, max), b = rand(bMin, a - 1);
  return { key: `m${a}.${b}`, prompt: subQ(a, b), text: `${a} − ${b} = ?`, choices: near(a - b), answer: a - b };
}

function times(list) {
  const a = pick(list), b = rand(1, 10), [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return { key: `x${x}x${y}`, prompt: mulP(x, y), text: `${x} × ${y} = ?`, choices: near(a * b), answer: a * b };
}
function divide(list) {
  const a = pick(list), b = rand(2, 10), p = a * b;
  return { key: `d${p}-${a}`, prompt: divP(p, a), text: `${p} ÷ ${a} = ?`, choices: near(b), answer: b };
}

const bar = (k, d) => `<svg viewBox="0 0 120 30" width="120" height="30">${Array.from({ length: d }, (_, i) =>
  `<rect x="${(1 + (i * 118) / d).toFixed(2)}" y="1" width="${(118 / d).toFixed(2)}" height="28" fill="${i < k ? '#ffb74d' : '#fff'}" stroke="#333" stroke-width="1.5"/>`).join('')}</svg>`;
const FRACS2 = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]];
function barFractions() {
  const [k, d] = pick(FRACS2), f = `${k}/${d}`;
  const all = shuffle([[k, d], ...shuffle(FRACS2.filter(([a, b]) => `${a}/${b}` !== f)).slice(0, 2)]);
  if (Math.random() < 0.5) {
    return {
      key: `fn${f}`,
      prompt: T('Pecahan manakah yang berlorek?', 'What fraction is shaded?', '阴影部分是几分之几？', 'yīnyǐng bùfen shì jǐ fēn zhī jǐ?'),
      visual: bar(k, d),
      choices: all.map(([a, b]) => ({ label: fr(a, b), value: `${a}/${b}` })),
      answer: f,
    };
  }
  return {
    key: `fb${f}`,
    prompt: T(`Mana yang menunjukkan ${k}/${d}?`, `Which one shows ${k}/${d}?`, `哪个表示${zhFrac(k, d)}？`, `nǎge biǎoshì ${pyFrac(k, d)}?`),
    text: fr(k, d),
    wide: true,
    choices: all.map(([a, b]) => ({ label: bar(a, b), value: `${a}/${b}` })),
    answer: f,
  };
}

// Year 3
function placeRound() {
  if (Math.random() < 0.5) {
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), n = Number(ds.join('')), p = rand(0, 3), d = ds[3 - p];
    return {
      key: `v${n}-${d}`,
      prompt: T(`Apakah nilai digit ${d} dalam ${n}?`, `What is the value of the digit ${d} in ${n}?`,
        `在${n}中，数字${d}的值是多少？`, `zài ${pn(n)} zhōng, shùzì ${pn(d)} de zhí shì duōshao?`),
      text: String(n),
      choices: opts(d * 10 ** p, [1, 10, 100, 1000].map((u) => d * u)),
      answer: d * 10 ** p,
    };
  }
  let x, to;
  do { x = rand(11, 9999); to = pick([10, 100]); } while (x % to === 0);
  const rd = (u) => Math.floor((x + u / 2) / u) * u, ans = rd(to), down = Math.floor(x / to) * to;
  const word = to === 10 ? ['puluh', 'ten', '十', 'shí'] : ['ratus', 'hundred', '百', 'bǎi'];
  return {
    key: `r${x}-${to}`,
    prompt: T(`Bundarkan ${x} kepada ${word[0]} terdekat.`, `Round ${x} to the nearest ${word[1]}.`,
      `把${x}四舍五入到最接近的${word[2]}。`, `bǎ ${pn(x)} sì shě wǔ rù dào zuì jiējìn de ${word[3]}.`),
    text: String(x),
    choices: opts(ans, [down, down + to, rd(to === 10 ? 100 : 10), ans + to, ans - to].filter((v) => v >= 0)),
    answer: ans,
  };
}

const timesDiv = (list) => (Math.random() < 0.5 ? times(list) : divide(list));

function fracAddSub() {
  const d = rand(4, 10), sub = Math.random() < 0.4;
  let a, b;
  if (sub) { a = rand(2, d - 1); b = rand(1, a - 1); } else { a = rand(1, d - 2); b = rand(1, d - 1 - a); }
  const n = sub ? a - b : a + b, ans = `${n}/${d}`;
  const wrong = [`${n}/${d + d}`, `${n + 1}/${d}`, ...(n > 1 ? [`${n - 1}/${d}`] : [])];
  return {
    key: `${sub ? 'fs' : 'fa'}${a}.${b}/${d}`,
    prompt: sub ? T('Tolakkan pecahan itu.', 'Subtract the fractions.', '把这两个分数相减。', 'bǎ zhè liǎng ge fēnshù xiāngjiǎn.')
      : T('Tambahkan pecahan itu.', 'Add the fractions.', '把这两个分数相加。', 'bǎ zhè liǎng ge fēnshù xiāngjiā.'),
    text: `${fr(a, d)} ${sub ? '−' : '+'} ${fr(b, d)} = ?`,
    choices: opts(ans, wrong, (v) => fr(...v.split('/'))),
    answer: ans,
  };
}

function money() {
  const add = Math.random() < 0.6, a = 5 * rand(20, 1000), b = 5 * rand(4, add ? 600 : Math.floor(a / 5) - 1);
  const ans = add ? a + b : a - b;
  return {
    key: `${add ? 'ma' : 'ml'}${a}.${b}`,
    prompt: add ? T('Berapakah jumlahnya?', 'How much is it altogether?', '一共多少钱？', 'yīgòng duōshao qián?')
      : T('Berapakah bakinya?', 'How much is left?', '还剩多少钱？', 'hái shèng duōshao qián?'),
    text: `${rm(a)} ${add ? '+' : '−'} ${rm(b)} = ?`,
    choices: opts(rm(ans), [ans + 10, ans - 10, ans + 100, ans - 100, ans + 50, ans - 50].filter((v) => v > 0).map(rm)),
    answer: rm(ans),
  };
}

function duration() {
  const sh = rand(1, 12), sm = pick([0, 15, 30, 45]), dur = 5 * rand(3, 36);
  const tot = (sh % 12) * 60 + sm + dur, eh = Math.floor(tot / 60) % 12 || 12, em = tot % 60;
  const s = `${sh}:${pad2(sm)}`, e = `${eh}:${pad2(em)}`;
  return {
    key: `du${s}-${e}`,
    prompt: T(`Satu kelas bermula pukul ${s} dan tamat pukul ${e}. Berapa minit kelas itu?`,
      `A lesson starts at ${s} and ends at ${e}. How many minutes long is it?`,
      `一节课从${s}开始，${e}结束，一共多少分钟？`, `yì jié kè cóng ${s} kāishǐ, ${e} jiéshù, yīgòng duōshao fēnzhōng?`),
    choices: near(dur),
    answer: dur,
  };
}

const UNITS = [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['L', 'ml', 1000], ['cm', 'mm', 10]];
function units() {
  const [big, small, f] = pick(UNITS), r = Math.random(), n = rand(1, 20);
  let text, ans;
  if (r < 0.4) { text = `${n} ${big} = ? ${small}`; ans = n * f; }
  else if (r < 0.7) { text = `${n * f} ${small} = ? ${big}`; ans = n; }
  else {
    const step = f === 1000 ? 50 : 1, b = step * rand(1, f / step - 1), a = rand(1, 9);
    text = `${a} ${big} ${b} ${small} = ? ${small}`; ans = a * f + b;
  }
  return {
    key: text,
    prompt: T('Isi nombor yang hilang.', 'Fill in the missing number.', '填上缺少的数。', 'tián shàng quēshǎo de shù.'),
    text,
    choices: near(ans),
    answer: ans,
  };
}

const SOLIDS = [
  { k: 'cube', ms: 'kubus', en: 'cube', zh: '正方体', py: 'zhèngfāngtǐ', faces: 6, edges: 12, vertices: 8 },
  { k: 'cuboid', ms: 'kuboid', en: 'cuboid', zh: '长方体', py: 'chángfāngtǐ', faces: 6, edges: 12, vertices: 8 },
  { k: 'cylinder', ms: 'silinder', en: 'cylinder', zh: '圆柱', py: 'yuánzhù', faces: 2 },
  { k: 'cone', ms: 'kon', en: 'cone', zh: '圆锥', py: 'yuánzhuī', faces: 1 },
  { k: 'sphere', ms: 'sfera', en: 'sphere', zh: '球体', py: 'qiútǐ', faces: 0 },
];
const SOLID_ASK = {
  faces: (s) => T(`Berapa muka rata ada pada ${s.ms}?`, `How many flat faces does a ${s.en} have?`, `${s.zh}有几个平的面？`, `${s.py} yǒu jǐ ge píng de miàn?`),
  edges: (s) => T(`Berapa tepi ada pada ${s.ms}?`, `How many edges does a ${s.en} have?`, `${s.zh}有几条棱？`, `${s.py} yǒu jǐ tiáo léng?`),
  vertices: (s) => T(`Berapa bucu ada pada ${s.ms}?`, `How many vertices does a ${s.en} have?`, `${s.zh}有几个顶点？`, `${s.py} yǒu jǐ ge dǐngdiǎn?`),
};
function solids() {
  // Edges and vertices only where they are clear-cut (cube, cuboid).
  const s = pick(SOLIDS), prop = pick(['faces', 'faces', 'edges', 'vertices'].filter((p) => s[p] !== undefined));
  return { key: `s${s.k}-${prop}`, prompt: SOLID_ASK[prop](s), choices: numberChoices(s[prop], 0, 12), answer: s[prop] };
}

// Year 4
function mulDivBig() {
  if (Math.random() < 0.5) {
    const a = rand(12, 250), b = rand(2, 9);
    return { key: `x${a}x${b}`, prompt: mulP(a, b), text: `${a} × ${b} = ?`, choices: near(a * b), answer: a * b };
  }
  const q = rand(12, 150), b = rand(2, 9), p = q * b;
  return { key: `d${p}-${b}`, prompt: divP(p, b), text: `${p} ÷ ${b} = ?`, choices: near(q), answer: q };
}

function mixedNumbers() {
  let d, r;
  do { d = rand(2, 8); r = rand(1, d - 1); } while (gcd(r, d) !== 1); // 4 2/4 would not be in lowest terms
  const w = rand(1, 4), n = w * d + r;
  if (Math.random() < 0.5) {
    const ans = `${w} ${r}/${d}`;
    const wrong = [[w + 1, r], [w + 2, r], [w, d - r], [w, r + 1], [w, r - 1], [w - 1, r]]
      .filter(([W, R]) => W >= 1 && R >= 1 && R < d).map(([W, R]) => `${W} ${R}/${d}`);
    return {
      key: `mx${n}/${d}`,
      prompt: T('Tukarkan kepada nombor bercampur.', 'Write it as a mixed number.', '写成带分数。', 'xiě chéng dàifēnshù.'),
      text: fr(n, d),
      choices: opts(ans, wrong, (v) => { const [W, f] = v.split(' '); return `${W} ${fr(...f.split('/'))}`; }),
      answer: ans,
    };
  }
  const ans = `${n}/${d}`;
  return {
    key: `im${w}-${r}/${d}`,
    prompt: T('Tukarkan kepada pecahan tak wajar.', 'Write it as an improper fraction.', '写成假分数。', 'xiě chéng jiǎfēnshù.'),
    text: `${w} ${fr(r, d)}`,
    choices: opts(ans, [`${n + 1}/${d}`, `${n - 1}/${d}`, `${w + r}/${d}`], (v) => fr(...v.split('/'))),
    answer: ans,
  };
}

function fractionOf() {
  const d = pick([2, 3, 4, 5, 6, 8, 10]), k = rand(1, d - 1), m = rand(1, 12), N = d * m;
  return {
    key: `fo${k}/${d}-${N}`,
    prompt: T(`Berapakah ${k}/${d} daripada ${N}?`, `What is ${k}/${d} of ${N}?`, `${N}的${zhFrac(k, d)}是多少？`, `${pn(N)} de ${pyFrac(k, d)} shì duōshao?`),
    text: `${fr(k, d)} × ${N} = ?`,
    choices: near(k * m),
    answer: k * m,
  };
}

function decimals() {
  const add = Math.random() < 0.5, a = rand(105, 4999), b = rand(105, 4999);
  const [x, y] = add || a > b ? [a, b] : [b, a];
  const ans = add ? x + y : x - y, A = hund(x), B = hund(y);
  return {
    key: `dc${x}${add ? '+' : '-'}${y}`,
    prompt: add ? addP(A, B) : subQ(A, B),
    text: `${A} ${add ? '+' : '−'} ${B} = ?`,
    choices: opts(hund(ans), [ans + 10, ans - 10, ans + 1, ans - 1, ans + 100, ans - 100].filter((v) => v >= 0).map(hund)),
    answer: hund(ans),
  };
}

function time24() {
  const h24 = rand(1, 23), m = 5 * rand(0, 11), h12 = h24 % 12 || 12, ap = h24 < 12 ? 'a.m.' : 'p.m.';
  const t24 = `${pad2(h24)}:${pad2(m)}`, t12 = `${h12}:${pad2(m)} ${ap}`;
  if (Math.random() < 0.5) {
    const flip = ap === 'a.m.' ? 'p.m.' : 'a.m.';
    return {
      key: `ta${t24}`,
      prompt: T(`Tukar ${t24} kepada waktu 12 jam.`, `Write ${t24} as 12-hour time.`, `把${t24}写成12小时制。`, `bǎ ${t24} xiě chéng 12 xiǎoshí zhì.`),
      text: t24,
      choices: opts(t12, [`${h12}:${pad2(m)} ${flip}`, `${(h12 % 12) + 1}:${pad2(m)} ${ap}`, `${((h12 + 10) % 12) + 1}:${pad2(m)} ${ap}`]),
      answer: t12,
    };
  }
  const f = (h) => `${pad2(((h % 24) + 24) % 24)}:${pad2(m)}`;
  return {
    key: `tb${t24}`,
    prompt: T(`Tukar ${t12} kepada waktu 24 jam.`, `Write ${t12} as 24-hour time.`, `把${t12}写成24小时制。`, `bǎ ${t12} xiě chéng 24 xiǎoshí zhì.`),
    text: t12,
    choices: opts(t24, [f(h24 + 12), f(h24 + 1), f(h24 - 1), f(h24 - 12)]),
    answer: t24,
  };
}

function rectSvg(l, w) {
  const W = Math.round((80 * l) / Math.max(l, w)), H = Math.round((80 * w) / Math.max(l, w));
  return `<svg viewBox="0 0 140 110" width="180" height="140"><rect x="20" y="8" width="${W}" height="${H}" fill="#ffe0b2" stroke="#333" stroke-width="2"/>`
    + `<text x="${20 + W / 2}" y="${H + 24}" font-size="11" text-anchor="middle">${l} cm</text>`
    + `<text x="${20 + W + 5}" y="${8 + H / 2}" font-size="11" dominant-baseline="central">${w} cm</text></svg>`;
}
function perimeterArea() {
  const l = rand(3, 15), w = rand(2, l), per = 2 * (l + w), area = l * w, isP = Math.random() < 0.5, ans = isP ? per : area;
  return {
    key: `${isP ? 'pp' : 'pa'}${l}x${w}`,
    prompt: isP ? T('Berapakah perimeter dalam cm?', 'What is the perimeter in cm?', '周长是多少厘米？', 'zhōucháng shì duōshao límǐ?')
      : T('Berapakah luas dalam cm²?', 'What is the area in cm²?', '面积是多少平方厘米？', 'miànjī shì duōshao píngfāng límǐ?'),
    visual: rectSvg(l, w),
    choices: opts(ans, [l + w, isP ? area : per, ans + 2, ans - 2, l * 2 + w].filter((v) => v > 0)),
    answer: ans,
  };
}

function gridSvg(x, y) {
  const px = (v) => 14 + v * 12, py2 = (v) => 90 - v * 12;
  const lines = Array.from({ length: 7 }, (_, i) =>
    `<line x1="${px(i)}" y1="${py2(0)}" x2="${px(i)}" y2="${py2(6)}" stroke="#bbb"/><line x1="${px(0)}" y1="${py2(i)}" x2="${px(6)}" y2="${py2(i)}" stroke="#bbb"/>`
    + `<text x="${px(i)}" y="100" font-size="6" text-anchor="middle">${i}</text><text x="8" y="${py2(i)}" font-size="6" text-anchor="middle" dominant-baseline="central">${i}</text>`).join('');
  return `<svg class="coord" viewBox="0 0 100 106" width="220" height="233">${lines}<circle class="cpt" cx="${px(x)}" cy="${py2(y)}" r="4" fill="#ff7043"/></svg>`;
}
function coordinates() {
  let x, y;
  do { x = rand(1, 6); y = rand(1, 6); } while (x === y);
  const c = (a, b) => `(${a}, ${b})`;
  return {
    key: `co${x}-${y}`,
    prompt: T('Apakah koordinat titik itu? Ke kanan dahulu, kemudian ke atas.', 'What are the coordinates of the dot? Go across first, then up.',
      '这个点的坐标是什么？先往右，再往上。', 'zhège diǎn de zuòbiāo shì shénme? xiān wǎng yòu, zài wǎng shàng.'),
    visual: gridSvg(x, y),
    choices: opts(c(x, y), [c(y, x), ...[[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && a <= 6 && b >= 0 && b <= 6).map(([a, b]) => c(a, b))]),
    answer: c(x, y),
  };
}

// Year 5
function percent() {
  if (Math.random() < 0.55) {
    const p = pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]), N = 20 * rand(1, 15), ans = (p * N) / 100;
    return {
      key: `pc${p}-${N}`,
      prompt: T(`Berapakah ${p}% daripada ${N}?`, `What is ${p}% of ${N}?`, `${N}的${p}%是多少？`, `${pn(N)} de bǎifēn zhī ${pn(p)} shì duōshao?`),
      text: `${p}% × ${N} = ?`,
      choices: near(ans),
      answer: ans,
    };
  }
  const d = pick([2, 4, 5, 10, 20, 25]), k = rand(1, d - 1), ans = (k * 100) / d;
  return {
    key: `pf${k}/${d}`,
    prompt: T('Tulis sebagai peratus.', 'Write it as a percentage.', '写成百分数。', 'xiě chéng bǎifēnshù.'),
    text: `${fr(k, d)} = ?%`,
    choices: near(ans),
    answer: ans,
  };
}

// Decimal point shifts. Values are whole numbers of 10⁻⁹, so ×10 and ÷10 stay exact.
const fmtU = (u) => {
  const f = String(u % 1e9).padStart(9, '0').replace(/0+$/, '');
  return f ? `${Math.floor(u / 1e9)}.${f}` : String(Math.floor(u / 1e9));
};
function decimalShift() {
  const v = pick([rand(2, 50) * 1000, rand(11, 99) * 100, rand(101, 999) * 10]), m = pick([10, 100, 1000]), mul = Math.random() < 0.5;
  const u = v * 1e6, u2 = mul ? u * m : u / m, A = fmtU(u);
  return {
    key: `ds${v}${mul ? 'x' : 'd'}${m}`,
    prompt: mul ? mulP(A, m) : divP(A, m),
    text: `${A} ${mul ? '×' : '÷'} ${m} = ?`,
    choices: opts(fmtU(u2), [u2 * 10, u2 / 10, u2 * 100, u2 / 100].map(fmtU)),
    answer: fmtU(u2),
  };
}

function fracUnlike() {
  for (;;) {
    const [d, e] = pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [5, 10], [2, 10], [3, 9], [4, 12], [6, 12]]);
    const k = e / d, sub = Math.random() < 0.4, a = rand(1, d - 1), b = rand(1, e - 1);
    const num = sub ? a * k - b : a * k + b;
    if (num < 1 || num >= e) continue;
    const ans = lowest(num, e).join('/');
    const wrong = [...(sub ? [] : [[a + b, d + e]]), [num + 1, e], [num - 1, e], [num + 2, e], [num - 2, e], [num, d]]
      .filter(([n, m]) => n >= 1 && n < m).map(([n, m]) => lowest(n, m).join('/'));
    if (new Set(wrong.filter((v) => v !== ans)).size < 2) continue;
    return {
      key: `fu${a}/${d}${sub ? '-' : '+'}${b}/${e}`,
      prompt: sub ? T('Tolakkan pecahan itu.', 'Subtract the fractions.', '把这两个分数相减。', 'bǎ zhè liǎng ge fēnshù xiāngjiǎn.')
        : T('Tambahkan pecahan itu.', 'Add the fractions.', '把这两个分数相加。', 'bǎ zhè liǎng ge fēnshù xiāngjiā.'),
      text: `${fr(a, d)} ${sub ? '−' : '+'} ${fr(b, e)} = ?`,
      choices: opts(ans, wrong, (v) => fr(...v.split('/'))),
      answer: ans,
    };
  }
}

function cuboidSvg(l, w, h) {
  return '<svg viewBox="0 0 130 95" width="200" height="146" fill="none" stroke="#333" stroke-width="2">'
    + '<polygon points="10,30 35,10 95,10 70,30" fill="#ffe0b2"/><rect x="10" y="30" width="60" height="40" fill="#ffcc80"/>'
    + '<polygon points="70,30 95,10 95,50 70,70" fill="#ffb74d"/>'
    + `<text x="40" y="85" font-size="10" text-anchor="middle" stroke="none" fill="#333">${l} cm</text>`
    + `<text x="6" y="50" font-size="10" text-anchor="end" stroke="none" fill="#333">${h} cm</text>`
    + `<text x="100" y="35" font-size="10" stroke="none" fill="#333">${w} cm</text></svg>`;
}
function volume() {
  const l = rand(2, 10), w = rand(2, 10), h = rand(2, 10), v = l * w * h;
  return {
    key: `v${l}x${w}x${h}`,
    prompt: T('Berapakah isi padu dalam cm³?', 'What is the volume in cm³?', '体积是多少立方厘米？', 'tǐjī shì duōshao lìfāng límǐ?'),
    visual: cuboidSvg(l, w, h),
    choices: opts(v, [l * w + h, 2 * (l * w + w * h + l * h), v + 10, v - 10, v + l].filter((x) => x > 0)),
    answer: v,
  };
}

const ANGLE_RULES = [
  { total: 90, parts: 1, max: 80, ms: 'Sudut tegak ialah 90°. Cari x.', en: 'A right angle is 90°. Find x.', zh: '直角是90°。求x。', py: 'zhíjiǎo shì 90 dù. qiú x.' },
  { total: 180, parts: 1, max: 80, ms: 'Sudut pada garis lurus berjumlah 180°. Cari x.', en: 'Angles on a straight line add up to 180°. Find x.', zh: '直线上的角加起来是180°。求x。', py: 'zhíxiàn shàng de jiǎo jiā qǐlái shì 180 dù. qiú x.' },
  { total: 180, parts: 2, max: 80, ms: 'Sudut dalam segi tiga berjumlah 180°. Cari x.', en: 'Angles in a triangle add up to 180°. Find x.', zh: '三角形的三个内角加起来是180°。求x。', py: 'sānjiǎoxíng de sān ge nèijiǎo jiā qǐlái shì 180 dù. qiú x.' },
  { total: 360, parts: 2, max: 150, ms: 'Sudut pada satu titik berjumlah 360°. Cari x.', en: 'Angles around a point add up to 360°. Find x.', zh: '一个点周围的角加起来是360°。求x。', py: 'yí ge diǎn zhōuwéi de jiǎo jiā qǐlái shì 360 dù. qiú x.' },
];
function angles() {
  const i = rand(0, ANGLE_RULES.length - 1), r = ANGLE_RULES[i];
  const given = Array.from({ length: r.parts }, () => 5 * rand(2, r.max / 5)), x = r.total - given.reduce((p, c) => p + c);
  return {
    key: `an${i}-${given.join('-')}`,
    prompt: T(r.ms, r.en, r.zh, r.py),
    text: `x + ${given.map((g) => `${g}°`).join(' + ')} = ${r.total}°`,
    choices: near(x),
    answer: x,
  };
}

const ASK_STAT = {
  mean: T('Cari min.', 'Find the mean.', '求平均数。', 'qiú píngjūnshù.'),
  median: T('Cari median.', 'Find the median.', '求中位数。', 'qiú zhōngwèishù.'),
  mode: T('Cari mod.', 'Find the mode.', '求众数。', 'qiú zhòngshù.'),
};
function dataSet() {
  const kind = pick(['mean', 'median', 'mode']);
  for (;;) {
    const v = Array.from({ length: 5 }, () => rand(1, 12)), sorted = [...v].sort((a, b) => a - b), cnt = {};
    v.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
    const top = Math.max(...Object.values(cnt)), modes = Object.keys(cnt).filter((x) => cnt[x] === top);
    let ans;
    if (kind === 'mean') { const s = v.reduce((a, b) => a + b); if (s % 5) continue; ans = s / 5; }
    else if (kind === 'median') ans = sorted[2];
    else { if (top < 2 || modes.length > 1) continue; ans = Number(modes[0]); }
    return { key: `dt-${kind}-${v.join('.')}`, prompt: ASK_STAT[kind], text: v.join(', '), choices: near(ans), answer: ans };
  }
}

// Year 6
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const UPTO60 = Array.from({ length: 58 }, (_, i) => i + 2);
const PRIMES = UPTO60.filter(isPrime), COMPOSITES = UPTO60.filter((n) => !isPrime(n) && n > 3);
function primes() {
  const yes = Math.random() < 0.6;
  const answer = pick(yes ? PRIMES : COMPOSITES), wrong = shuffle(yes ? COMPOSITES : PRIMES).slice(0, 2);
  return {
    key: `${yes ? 'py' : 'pn'}${answer}|${wrong.join('|')}`,
    prompt: yes ? T('Yang manakah nombor perdana?', 'Which is a prime number?', '哪个是质数？', 'nǎge shì zhìshù?')
      : T('Yang manakah bukan nombor perdana?', 'Which is NOT a prime number?', '哪个不是质数？', 'nǎge bú shì zhìshù?'),
    choices: shuffle([answer, ...wrong]).map((v) => ({ label: String(v), value: v })),
    answer,
  };
}

function simplifyRatio() {
  let p, q;
  do { p = rand(1, 9); q = rand(1, 9); } while (p === q || gcd(p, q) !== 1);
  const f = rand(2, 6), a = p * f, b = q * f, ans = `${p}:${q}`;
  return {
    key: `rt${a}:${b}`,
    prompt: T(`Ringkaskan nisbah ${a} : ${b}.`, `Simplify the ratio ${a} : ${b}.`, `把${a}:${b}化成最简比。`, `bǎ ${pn(a)} bǐ ${pn(b)} huà chéng zuì jiǎn bǐ.`),
    text: `${a} : ${b}`,
    choices: opts(ans, [`${q}:${p}`, `${p + 1}:${q}`, `${p}:${q + 1}`], (v) => v.replace(':', ' : ')),
    answer: ans,
  };
}

function shareRatio() {
  let a, b;
  do { a = rand(1, 5); b = rand(1, 5); } while (a === b);
  const m = rand(2, 12), N = (a + b) * m, bigger = Math.random() < 0.5, ans = (bigger ? Math.max(a, b) : Math.min(a, b)) * m;
  return {
    key: `rs${N}-${a}:${b}-${bigger ? 'B' : 'S'}`,
    prompt: bigger
      ? T(`Bahagikan ${N} mengikut nisbah ${a} : ${b}. Berapakah bahagian yang lebih besar?`, `Share ${N} in the ratio ${a} : ${b}. How much is the bigger share?`,
        `把${N}按${a}比${b}来分，较大的一份是多少？`, `bǎ ${pn(N)} àn ${pn(a)} bǐ ${pn(b)} lái fēn, jiào dà de yí fèn shì duōshao?`)
      : T(`Bahagikan ${N} mengikut nisbah ${a} : ${b}. Berapakah bahagian yang lebih kecil?`, `Share ${N} in the ratio ${a} : ${b}. How much is the smaller share?`,
        `把${N}按${a}比${b}来分，较小的一份是多少？`, `bǎ ${pn(N)} àn ${pn(a)} bǐ ${pn(b)} lái fēn, jiào xiǎo de yí fèn shì duōshao?`),
    choices: near(ans),
    answer: ans,
  };
}

function profitLoss() {
  const c = 5 * rand(4, 80), r = Math.random();
  const head = [`Sebuah buku dibeli dengan harga RM${c}.`, `A book costs RM${c} to buy.`, `一本书的成本是${c}令吉。`, `yì běn shū de chéngběn shì ${pn(c)} lìngjí.`];
  if (r < 0.65) {
    const profit = r < 0.33, d = 5 * rand(1, 12), s = profit ? c + d : Math.max(5, c - d), ans = Math.abs(s - c);
    return {
      key: `${profit ? 'pr' : 'ls'}${c}-${s}`,
      prompt: T(`${head[0]} Ia dijual dengan harga RM${s}. ${profit ? 'Berapakah untungnya?' : 'Berapakah ruginya?'}`,
        `${head[1]} It is sold for RM${s}. ${profit ? 'How much is the profit?' : 'How much is the loss?'}`,
        `${head[2]}售价是${s}令吉。${profit ? '赚了多少令吉？' : '亏了多少令吉？'}`,
        `${head[3]} shòujià shì ${pn(s)} lìngjí. ${profit ? 'zhuàn le' : 'kuī le'} duōshao lìngjí?`),
      choices: near(ans),
      answer: ans,
    };
  }
  const pr = 5 * rand(1, 12), ans = c + pr;
  return {
    key: `sp${c}-${pr}`,
    prompt: T(`${head[0]} Ia dijual dengan untung RM${pr}. Berapakah harga jualan?`, `${head[1]} It is sold at a profit of RM${pr}. What is the selling price?`,
      `${head[2]}赚了${pr}令吉。售价是多少令吉？`, `${head[3]} zhuàn le ${pn(pr)} lìngjí. shòujià shì duōshao lìngjí?`),
    choices: near(ans),
    answer: ans,
  };
}

const MARBLES = [
  { ms: 'merah', en: 'red', zh: '红色', py: 'hóngsè' },
  { ms: 'biru', en: 'blue', zh: '蓝色', py: 'lánsè' },
  { ms: 'hijau', en: 'green', zh: '绿色', py: 'lǜsè' },
];
function probability() {
  for (;;) {
    const cnt = [rand(1, 5), rand(1, 5), Math.random() < 0.5 ? 0 : rand(1, 4)], total = cnt[0] + cnt[1] + cnt[2], r = cnt[0];
    if (r * 2 === total) continue;
    const ans = lowest(r, total).join('/');
    const wrong = [[cnt[1], total], [total - r, total], [r, total - r], [r + 1, total], [r - 1, total]]
      .filter(([n, m]) => n >= 1 && n < m).map(([n, m]) => lowest(n, m).join('/'));
    if (new Set(wrong.filter((v) => v !== ans)).size < 2) continue;
    const used = MARBLES.map((c, i) => ({ ...c, n: cnt[i] })).filter((c) => c.n);
    const join = (arr, and) => (arr.length > 1 ? `${arr.slice(0, -1).join(', ')} ${and} ${arr[arr.length - 1]}` : arr[0]);
    const ms = join(used.map((c) => `${c.n} guli ${c.ms}`), 'dan'), en = join(used.map((c) => `${c.n} ${c.en} marble${c.n === 1 ? '' : 's'}`), 'and');
    const zh = used.map((c) => `${c.n}颗${c.zh}弹珠`).join('、'), pyl = used.map((c) => `${pn(c.n)} kē ${c.py} dànzhū`).join(', ');
    return {
      key: `pb${cnt.join('-')}`,
      prompt: T(`Sebuah beg ada ${ms}. Satu guli dipilih tanpa melihat. Apakah kebarangkalian mendapat guli merah?`,
        `A bag has ${en}. One marble is picked without looking. What is the probability of picking a red marble?`,
        `袋子里有${zh}。随意拿出一颗，拿到红色弹珠的可能性是多少？`,
        `dàizi lǐ yǒu ${pyl}. suíyì ná chū yì kē, ná dào hóngsè dànzhū de kěnéngxìng shì duōshao?`),
      choices: opts(ans, wrong, (v) => fr(...v.split('/'))),
      answer: ans,
    };
  }
}

function circleSvg(label, radius) {
  return '<svg viewBox="0 0 100 100" width="150" height="150"><circle cx="50" cy="50" r="40" fill="#ffe0b2" stroke="#333" stroke-width="2"/>'
    + `<line x1="${radius ? 50 : 10}" y1="50" x2="90" y2="50" stroke="#333" stroke-width="2"/>`
    + `<text x="${radius ? 70 : 50}" y="44" font-size="10" text-anchor="middle">${label}</text></svg>`;
}
// π = 22/7 with diameters and radii that are multiples of 7, so every answer is a whole number.
function circle() {
  const r = Math.random(), k = rand(1, 10), pi = 'π = 22/7';
  const circ = T(`Gunakan ${pi}. Berapakah lilitan dalam cm?`, `Use ${pi}. What is the circumference in cm?`, `取${pi}。周长是多少厘米？`, `qǔ ${pi}. zhōucháng shì duōshao límǐ?`);
  if (r < 0.34) return { key: `cd${7 * k}`, prompt: circ, visual: circleSvg(`d = ${7 * k} cm`, false), choices: near(22 * k), answer: 22 * k };
  if (r < 0.67) return { key: `cr${7 * k}`, prompt: circ, visual: circleSvg(`r = ${7 * k} cm`, true), choices: near(44 * k), answer: 44 * k };
  const rad = 7 * Math.min(k, 4), ans = (22 * rad * rad) / 7;
  return {
    key: `ca${rad}`,
    prompt: T(`Gunakan ${pi}. Berapakah luas dalam cm²?`, `Use ${pi}. What is the area in cm²?`, `取${pi}。面积是多少平方厘米？`, `qǔ ${pi}. miànjī shì duōshao píngfāng límǐ?`),
    visual: circleSvg(`r = ${rad} cm`, true),
    choices: near(ans),
    answer: ans,
  };
}

function orderOfOps() {
  const [a, b, c] = [rand(2, 30), rand(2, 9), rand(2, 9)];
  const [text, ans] = pick([
    [`${a} + ${b} × ${c}`, a + b * c],
    [`(${a} + ${b}) × ${c}`, (a + b) * c],
    [`${a} × ${b + 4} − ${c}`, a * (b + 4) - c],
    [`${a + b * c} − ${b} × ${c}`, a],
    [`${a} + ${b * c} ÷ ${c}`, a + b],
    [`(${a + b * c} − ${a}) ÷ ${c}`, b],
  ]);
  return {
    key: text,
    prompt: T('Selesaikan dengan tertib yang betul.', 'Solve it in the right order.', '按正确的运算顺序计算。', 'àn zhèngquè de yùnsuàn shùnxù jìsuàn.'),
    text: `${text} = ?`,
    choices: near(ans),
    answer: ans,
  };
}

// Level for years 1–6: id without the "math-" prefix. Word answers (times, fractions, RM) need wide buttons.
const lv = (id, year, en, ms, icon, e, gen, o = {}) => ({
  id: `math-${id}`, year, ...o, probe: false, title: { en, ms }, icon, sticker: { id: `st-math-${id}`, e },
  gen: (pos) => { const q = gen(pos); if (typeof q.answer === 'string') q.wide = true; return q; },
});

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
    { id: 'math-add9', typed: true, probe: false, needs: 'math-add10', title: { en: 'Add up to 9 + 9', ms: 'Tambah hingga 9 + 9' }, icon: '➕', sticker: { id: 'st-turtle', e: '🐢' }, gen: () => addDigits() },
    { id: 'math-count20', title: { en: 'Count 11–20', ms: 'Kira 11–20' }, icon: '🧮', sticker: { id: 'st-flamingo', e: '🦩' }, gen: () => countTeen() },
    { id: 'math-add20', typed: true, needs: 'math-add10', title: { en: 'Add within 20', ms: 'Tambah hingga 20' }, icon: '➕', sticker: { id: 'st-crocodile', e: '🐊' }, gen: () => addTeen() },
    { id: 'math-countback20', title: { en: 'Count back from 20', ms: 'Kira undur hingga 20' }, icon: '⬅️', probe: false, sticker: { id: 'st-kangaroo', e: '🦘' }, gen: () => countBack(12, 20) },
    { id: 'math-sub20', typed: true, needs: 'math-sub10', title: { en: 'Subtract within 20', ms: 'Tolak hingga 20' }, icon: '➖', sticker: { id: 'st-hedgehog', e: '🦔' }, gen: () => subtractTeen() },
    // Column sums: answered by writing digits (see digits.js), or the number pad if the parent picks it.
    { id: 'math-col-add', probe: false, needs: 'math-add10', title: { en: 'Column add', ms: 'Tambah bentuk lazim' }, icon: '🧾', sticker: { id: 'st-shark', e: '🦈' }, gen: (pos) => column('+', false, pos) },
    { id: 'math-col-sub', probe: false, needs: 'math-sub10', title: { en: 'Column subtract', ms: 'Tolak bentuk lazim' }, icon: '🧾', sticker: { id: 'st-rabbit', e: '🐰' }, gen: (pos) => column('-', false, pos) },
    { id: 'math-col-add-carry', probe: false, needs: 'math-col-add', title: { en: 'Column add, carrying', ms: 'Tambah bentuk lazim, mengumpul semula' }, icon: '🧾', sticker: { id: 'st-frog', e: '🐸' }, gen: (pos) => column('+', true, pos) },
    { id: 'math-col-sub-borrow', probe: false, needs: 'math-col-sub', title: { en: 'Column subtract, borrowing', ms: 'Tolak bentuk lazim, mengumpul semula' }, icon: '🧾', sticker: { id: 'st-chick', e: '🐥' }, gen: (pos) => column('-', true, pos) },
    // Years 1–6 (KSSR Tahun 1–6), appended after the preschool path. All are side levels for the placement quiz.
    lv('y1-tens', 1, 'Tens & ones', 'Puluh & sa', '🔟', '🐒', tensOnes, { typed: true, needs: 'math-count20' }),
    lv('y1-order', 1, 'Biggest & smallest', 'Paling besar & kecil', '📊', '🦍', biggest, { needs: 'math-y1-tens' }),
    lv('y1-addsub', 1, 'Add & subtract to 100', 'Tambah & tolak hingga 100', '➕', '🦧', addSub100, { typed: true, needs: 'math-col-sub-borrow' }),
    lv('y1-sen', 1, 'Coins (sen)', 'Syiling (sen)', '🪙', '🐕', sen, { typed: true, needs: 'math-add20' }),
    lv('y1-clock', 1, 'Clock: hours & half hours', 'Jam: tepat & setengah', '🕐', '🐩', () => readClock([0, 30]), { needs: 'math-count20' }),
    lv('y1-shapes', 1, 'Flat shapes', 'Bentuk 2D', '🔺', '🐈', flatShapes, { needs: 'math-count20' }),

    lv('y2-place', 2, 'Place value to 999', 'Nilai tempat hingga 999', '💯', '🐅', placeValue3, { typed: true, needs: 'math-y1-tens' }),
    lv('y2-addsub', 2, 'Add & subtract to 999', 'Tambah & tolak hingga 999', '➕', '🐆', () => addSub(999, 100, 10), { typed: true, needs: 'math-y1-addsub' }),
    lv('y2-times-a', 2, '× 2, 5, 10', 'Darab 2, 5, 10', '✖️', '🐄', () => times([2, 5, 10]), { typed: true, needs: 'math-y1-addsub' }),
    lv('y2-times-b', 2, '× 3, 4', 'Darab 3, 4', '✖️', '🐖', () => times([3, 4]), { typed: true, needs: 'math-y2-times-a' }),
    lv('y2-div', 2, 'Division facts', 'Fakta bahagi', '➗', '🐑', () => divide([2, 3, 4, 5, 10]), { typed: true, needs: 'math-y2-times-b' }),
    lv('y2-frac', 2, 'Halves, thirds & quarters', 'Setengah, sepertiga & suku', '🍰', '🦙', barFractions, { needs: 'math-y1-shapes' }),
    lv('y2-clock', 2, 'Clock: quarter hours', 'Jam: suku jam', '🕒', '🦬', () => readClock([0, 15, 30, 45]), { needs: 'math-y1-clock' }),

    lv('y3-place', 3, 'Place value & rounding', 'Nilai tempat & pembundaran', '🎯', '🐪', placeRound, { typed: true, needs: 'math-y2-place' }),
    lv('y3-addsub', 3, 'Add & subtract to 9999', 'Tambah & tolak hingga 9999', '➕', '🦏', () => addSub(9999, 1000, 100), { typed: true, needs: 'math-y2-addsub' }),
    lv('y3-times', 3, '× ÷ 6, 7, 8, 9', 'Darab & bahagi 6, 7, 8, 9', '✖️', '🦛', () => timesDiv([6, 7, 8, 9]), { typed: true, needs: 'math-y2-div' }),
    lv('y3-frac', 3, 'Add & subtract fractions', 'Tambah & tolak pecahan', '🍕', '🐁', fracAddSub, { needs: 'math-y2-frac' }),
    lv('y3-money', 3, 'Money (RM)', 'Wang (RM)', '💰', '🐇', money, { needs: 'math-y1-sen' }),
    lv('y3-duration', 3, 'How long?', 'Berapa lama?', '⏱️', '🦇', duration, { typed: true, needs: 'math-y2-clock' }),
    lv('y3-units', 3, 'Convert units', 'Tukar unit', '📏', '🐓', units, { typed: true, needs: 'math-y3-place' }),
    lv('y3-solids', 3, '3D shapes', 'Bentuk 3D', '🧊', '🦃', solids, { typed: true, needs: 'math-y1-shapes' }),

    lv('y4-muldiv', 4, 'Multiply & divide', 'Darab & bahagi', '✖️', '🦆', mulDivBig, { typed: true, needs: 'math-y3-times' }),
    lv('y4-mixed', 4, 'Mixed numbers', 'Nombor bercampur', '🍕', '🦅', mixedNumbers, { needs: 'math-y3-frac' }),
    lv('y4-frac-of', 4, 'Fraction of a number', 'Pecahan sesuatu nombor', '🥧', '🦢', fractionOf, { typed: true, needs: 'math-y4-mixed' }),
    lv('y4-decimals', 4, 'Add & subtract decimals', 'Tambah & tolak perpuluhan', '🔢', '🦜', decimals, { needs: 'math-y3-money' }),
    lv('y4-time24', 4, '12-hour & 24-hour time', 'Waktu 12 jam & 24 jam', '🕓', '🐍', time24, { needs: 'math-y3-duration' }),
    lv('y4-area', 4, 'Perimeter & area', 'Perimeter & luas', '📐', '🦎', perimeterArea, { typed: true, needs: 'math-y3-units' }),
    lv('y4-coords', 4, 'Coordinates', 'Koordinat', '📍', '🦖', coordinates, { needs: 'math-y3-solids' }),

    lv('y5-percent', 5, 'Percentages', 'Peratus', '💯', '🦕', percent, { typed: true, needs: 'math-y4-frac-of' }),
    lv('y5-decimals', 5, 'Decimals × ÷ 10, 100, 1000', 'Perpuluhan × ÷ 10, 100, 1000', '🔢', '🐋', decimalShift, { needs: 'math-y4-decimals' }),
    lv('y5-frac', 5, 'Fractions: unlike denominators', 'Pecahan: penyebut berbeza', '🍕', '🦦', fracUnlike, { needs: 'math-y4-mixed' }),
    lv('y5-volume', 5, 'Volume of a cuboid', 'Isi padu kuboid', '📦', '🦥', volume, { typed: true, needs: 'math-y4-area' }),
    lv('y5-angles', 5, 'Angles', 'Sudut', '📐', '🦨', angles, { typed: true, needs: 'math-y4-coords' }),
    lv('y5-data', 5, 'Mean, median & mode', 'Min, median & mod', '📈', '🦡', dataSet, { typed: true, needs: 'math-y4-muldiv' }),

    lv('y6-prime', 6, 'Prime numbers', 'Nombor perdana', '🔍', '🐉', primes, { needs: 'math-y4-muldiv' }),
    lv('y6-ratio', 6, 'Simplify ratios', 'Ringkaskan nisbah', '⚖️', '🦤', simplifyRatio, { needs: 'math-y5-frac' }),
    lv('y6-ratio-share', 6, 'Share in a ratio', 'Bahagi mengikut nisbah', '🍬', '🦫', shareRatio, { typed: true, needs: 'math-y6-ratio' }),
    lv('y6-profit', 6, 'Profit & loss', 'Untung & rugi', '🛍️', '🐻', profitLoss, { typed: true, needs: 'math-y5-percent' }),
    lv('y6-probability', 6, 'Chance', 'Kebarangkalian', '🎲', '🐯', probability, { needs: 'math-y5-frac' }),
    lv('y6-circle', 6, 'Circles', 'Bulatan', '⭕', '🐮', circle, { typed: true, needs: 'math-y5-volume' }),
    lv('y6-ops', 6, 'Order of operations', 'Tertib operasi', '🧮', '🐷', orderOfOps, { typed: true, needs: 'math-y5-decimals' }),
  ],
};
