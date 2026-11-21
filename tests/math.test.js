import { test } from 'node:test';
import assert from 'node:assert/strict';
import math from '../js/subjects/math.js';
import { makeRound } from '../js/subjects/util.js';

test('every math question has its answer among distinct choices', () => {
  for (const level of math.levels.filter((l) => !l.id.startsWith('math-col'))) {
    for (let n = 0; n < 500; n++) {
      const q = level.gen();
      const values = q.choices.map((c) => c.value);
      assert.ok(values.includes(q.answer), `${level.id}: answer ${q.answer} missing from ${values}`);
      assert.equal(new Set(values).size, values.length, `${level.id}: duplicate choices ${values}`);
      assert.ok(q.key);
    }
  }
});

test('subtraction answers are never zero or negative', () => {
  const sub = math.levels.find((l) => l.id === 'math-sub5');
  for (let n = 0; n < 500; n++) assert.ok(sub.gen().answer >= 1);
});

test('a round has 5 questions without repeats', () => {
  for (const level of math.levels) {
    const qs = makeRound(level.gen, 5);
    assert.equal(qs.length, 5);
    assert.equal(new Set(qs.map((q) => q.key)).size, 5, level.id);
  }
});

test('level and sticker ids are unique', () => {
  const ids = math.levels.flatMap((l) => [l.id, l.sticker.id]);
  assert.equal(new Set(ids).size, ids.length);
});

const level = (id) => {
  const l = math.levels.find((x) => x.id === id);
  assert.ok(l, `level ${id} exists`);
  return l;
};
const many = (id, fn) => { for (let n = 0; n < 500; n++) fn(level(id).gen()); };
const count = (html, re) => (html.match(re) || []).length;

test('the learning path is in the agreed order', () => {
  // The preschool path first; year levels (math-y…) are appended after it.
  assert.deepEqual(math.levels.filter((l) => !l.year).map((l) => l.id), [
    'math-count5', 'math-numerals', 'math-count10', 'math-compare', 'math-sequence',
    'math-countback10', 'math-bond5', 'math-add5', 'math-less', 'math-sub5',
    'math-bond10', 'math-add10', 'math-sub10', 'math-add9', 'math-count20', 'math-add20', 'math-countback20', 'math-sub20',
    'math-col-add', 'math-col-sub', 'math-col-add-carry', 'math-col-sub-borrow',
  ]);
});

test('placement probes the main levels only, always starting with the first', () => {
  const probed = math.levels.filter((l) => l.probe !== false).map((l) => l.id);
  assert.equal(probed[0], 'math-count5');
  assert.ok(probed.length <= 10, `${probed.length} probed levels`);
  assert.ok(probed.includes('math-sub20'));
});

test('numerals: the number shown matches the group it asks for', () => {
  many('math-numerals', (q) => {
    assert.ok(q.answer >= 1 && q.answer <= 10);
    assert.match(q.visual, new RegExp(`>${q.answer}<`));
    for (const c of q.choices) assert.equal(count(c.label, /<span/g), c.value, 'group size = choice value');
  });
});

test('sequence: before/after answers stay within 1–10 and are one step away', () => {
  many('math-sequence', (q) => {
    assert.ok(q.answer >= 1 && q.answer <= 10, `answer ${q.answer}`);
    const n = Number(q.prompt.ms.match(/\d+/)[0]);
    assert.equal(q.answer, q.prompt.ms.startsWith('Selepas') ? n + 1 : n - 1);
    assert.equal(count(q.visual, /\?/g), 1, 'exactly one blank');
  });
});

const pair = (v) => v.split('+').map(Number);

for (const [id, total] of [['math-bond5', 5], ['math-bond10', 10]]) {
  test(`${id}: question pair makes ${total}; exactly one choice makes the same`, () => {
    many(id, (q) => {
      const [a, b] = pair(q.key.split('-')[1]);
      assert.equal(a + b, total);
      const sums = q.choices.map((c) => pair(c.value).reduce((x, y) => x + y));
      assert.equal(sums.filter((s) => s === total).length, 1, `sums ${sums}`);
      assert.equal(pair(q.answer).reduce((x, y) => x + y), total);
    });
  });

  test(`${id}: right answer is a different pair, not the same one flipped`, () => {
    many(id, (q) => {
      const [a, b] = pair(q.key.split('-')[1]);
      const [x, y] = pair(q.answer);
      assert.ok(!(x === a && y === b) && !(x === b && y === a), `${a}+${b} vs ${q.answer}`);
    });
  });

  test(`${id}: every part is at least 1, wrong pairs are 1 away from ${total}`, () => {
    many(id, (q) => {
      for (const c of q.choices) {
        const [x, y] = pair(c.value);
        assert.ok(x >= 1 && y >= 1, c.value);
        assert.ok(Math.abs(x + y - total) <= 1, c.value);
      }
    });
  });

  test(`${id}: numbers only, nothing to count`, () => {
    many(id, (q) => {
      assert.ok(!q.visual);
      for (const c of q.choices) assert.doesNotMatch(c.label, /<i/);
    });
  });
}

test('every level in every subject has a unique sticker', async () => {
  const { SUBJECTS } = await import('../js/subjects/index.js');
  const ids = SUBJECTS.flatMap((s) => s.levels.map((l) => l.sticker.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('sticker pictures are unique across all subjects, and every level id is unique', async () => {
  const { SUBJECTS } = await import('../js/subjects/index.js');
  const pics = SUBJECTS.flatMap((s) => s.levels.map((l) => l.sticker.e));
  assert.deepEqual(pics.filter((e, i) => pics.indexOf(e) !== i), []);
  const ids = SUBJECTS.flatMap((s) => s.levels.map((l) => l.id));
  assert.equal(new Set(ids).size, ids.length);
  // Years only go up within a subject, so each year heading shows once.
  for (const s of SUBJECTS) {
    const years = s.levels.map((l) => l.year ?? 0);
    assert.deepEqual(years, [...years].sort((x, y) => x - y), s.id);
  }
});

test('every question has BM, English, Mandarin and pinyin prompts', () => {
  for (const level of math.levels) {
    for (let n = 0; n < 200; n++) {
      const { prompt: p } = level.gen();
      for (const k of ['ms', 'en', 'zh', 'py']) assert.ok(typeof p[k] === 'string' && p[k].length > 3, `${level.id} ${k}`);
      assert.match(p.zh, /[\u4e00-\u9fff]/, `${level.id} zh has characters`);
      assert.doesNotMatch(p.py, /[\u4e00-\u9fff]/, `${level.id} pinyin has no characters`);
      assert.doesNotMatch(p.en, / 1 [a-z]+s\?/, `${level.id} singular for 1: ${p.en}`);
    }
  }
});

test('numerals: Mandarin says 两 for 2', () => {
  for (let n = 0; n < 300; n++) {
    const q = level('math-numerals').gen();
    if (q.answer === 2) assert.match(q.prompt.zh, /两/);
  }
});

for (const [id, max] of [['math-countback10', 10], ['math-countback20', 20]]) {
  test(`${id}: three numbers counting down, then the next one`, () => {
    many(id, (q) => {
      const nums = [...q.visual.matchAll(/<span>(\d+)<\/span>/g)].map((m) => Number(m[1]));
      assert.equal(nums.length, 3);
      assert.deepEqual(nums, [nums[0], nums[0] - 1, nums[0] - 2]);
      assert.ok(nums[0] <= max);
      assert.equal(q.answer, nums[2] - 1);
      assert.ok(q.answer >= 1);
    });
  });
}

test('less: 1 or 2 less, never below 1, the number is marked on the line', () => {
  many('math-less', (q) => {
    const [n, k] = q.key.slice(1).split('-').map(Number);
    assert.ok(k === 1 || k === 2);
    assert.equal(q.answer, n - k);
    assert.ok(q.answer >= 1);
    assert.match(q.visual, new RegExp(`class="here">${n}<`));
  });
});

test('count 11–20: one full ten frame plus the rest', () => {
  many('math-count20', (q) => {
    assert.ok(q.answer >= 11 && q.answer <= 20);
    assert.equal(count(q.visual, /class="cell"/g), 20);
    assert.equal(count(q.visual, /class="dot"/g), q.answer);
  });
});

for (const [id, max] of [['math-sub10', 10], ['math-sub20', 20]]) {
  test(`${id}: written as "a − b = ?", answer at least 1`, () => {
    many(id, (q) => {
      const [, a, b] = q.text.match(/^(\d+) − (\d+) = \?$/).map(Number);
      assert.ok(a <= max);
      assert.equal(q.answer, a - b);
      assert.ok(q.answer >= 1);
      if (max === 20) assert.ok(a >= 11, 'within-20 level uses teen numbers');
    });
  });
}

test('add up to 9 + 9: single digits, mostly across ten', () => {
  let cross = 0;
  many('math-add9', (q) => {
    const [, a, b] = q.text.match(/^(\d) \+ (\d) = \?$/).map(Number);
    assert.ok(a >= 1 && b >= 1);
    assert.equal(q.answer, a + b);
    if (q.answer > 10) cross++;
  });
  assert.ok(cross > 250, `${cross}/500 across ten`);
});

test('add within 20: answers 11–20, both parts at least 1', () => {
  many('math-add20', (q) => {
    const [, a, b] = q.text.match(/^(\d+) \+ (\d+) = \?$/).map(Number);
    assert.ok(a >= 1 && b >= 1);
    assert.equal(q.answer, a + b);
    assert.ok(q.answer >= 11 && q.answer <= 20);
  });
});

test('adding and taking away show the written sum only, no pictures to count', () => {
  for (const id of ['math-add5', 'math-add10', 'math-add9', 'math-add20', 'math-sub5', 'math-sub10', 'math-sub20']) {
    many(id, (q) => {
      assert.ok(q.text);
      assert.ok(!q.visual, id);
    });
  }
});

test('column sums: 2-digit numbers, answers under 100, carrying/borrowing only where the level says', () => {
  const lv = (id) => math.levels.find((l) => l.id === id);
  for (const [id, op, regroup] of [['math-col-add', '+', false], ['math-col-sub', '-', false], ['math-col-add-carry', '+', true], ['math-col-sub-borrow', '-', true]]) {
    for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) {
      const q = lv(id).gen(pos);
      const { a, b } = q.column;
      assert.equal(q.column.op, op);
      assert.ok(a >= 10 && a <= 99 && b >= 1, `${id}: ${a} ${op} ${b}`);
      assert.ok(pos < 3 ? b < 10 : b >= 10, `${id} pos ${pos}: b = ${b}`);
      assert.equal(q.answer, op === '+' ? a + b : a - b);
      assert.ok(q.answer >= 0 && q.answer < 100, `${id}: ${q.answer}`);
      const crosses = op === '+' ? (a % 10) + (b % 10) >= 10 : (a % 10) < (b % 10);
      assert.equal(crosses, regroup, `${id}: ${a} ${op} ${b}`);
    }
  }
});

// ---- Years 1–6 (KSSR) ----
const YEARS = math.levels.filter((l) => l.year);
const nums = (s) => s.match(/\d+/g).map(Number);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const hm = (t) => t.split(':').map(Number);

test('year levels: ids, years 1–6, side levels with a chain, typed answers are whole numbers', () => {
  assert.ok(YEARS.length >= 35 && YEARS.length <= 45, `${YEARS.length} year levels`);
  for (let y = 1; y <= 6; y++) assert.ok(YEARS.filter((l) => l.year === y).length >= 5, `year ${y}`);
  const ids = math.levels.map((l) => l.id);
  for (const l of YEARS) {
    assert.match(l.id, /^math-y[1-6]-[a-z0-9-]+$/);
    assert.equal(l.id[6], String(l.year), l.id);
    assert.equal(l.probe, false, `${l.id} must not be probed`);
    assert.ok(ids.includes(l.needs), `${l.id} needs ${l.needs}`);
    assert.ok(ids.indexOf(l.needs) < ids.indexOf(l.id), `${l.id}: needs comes earlier`);
    assert.ok(l.title.en && l.title.ms);
    if (l.typed) many(l.id, (q) => assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 1e7, `${l.id}: ${q.answer}`));
  }
});

test('year levels: 3 distinct choices with one right, and a round of 10 has 5+ different keys', () => {
  for (const l of YEARS) {
    for (let n = 0; n < 200; n++) {
      const q = l.gen();
      assert.ok(q.choices.length >= 3 && q.choices.length <= 4, l.id);
      assert.equal(q.choices.filter((c) => c.value === q.answer).length, 1, `${l.id}: ${q.key}`);
      assert.equal(new Set(q.choices.map((c) => c.value)).size, q.choices.length, `${l.id}: ${q.key}`);
    }
    for (let n = 0; n < 20; n++) assert.ok(new Set(makeRound(l.gen, 10).map((q) => q.key)).size >= 5, l.id);
  }
});

test('year 1: tens & ones', () => {
  many('math-y1-tens', (q) => {
    const [a, b] = nums(q.key);
    if (q.key[0] === 't') assert.equal(q.answer, Math.floor(a / 10));
    else if (q.key[0] === 'o') assert.equal(q.answer, a % 10);
    else assert.equal(q.answer, a * 10 + b);
  });
});

test('year 1: biggest / smallest of three different numbers', () => {
  many('math-y1-order', (q) => {
    const ns = nums(q.key);
    assert.equal(new Set(ns).size, 3);
    assert.equal(q.answer, q.key.startsWith('bg') ? Math.max(...ns) : Math.min(...ns));
    assert.deepEqual(q.choices.map((c) => c.value).sort((a, b) => a - b), [...ns].sort((a, b) => a - b));
  });
});

test('year 1: add/subtract within 100, written sums, answers 1–100', () => {
  many('math-y1-addsub', (q) => {
    const [, a, op, b] = q.text.match(/^(\d+) ([+−]) (\d+) = \?$/);
    assert.equal(q.answer, op === '+' ? +a + +b : a - b);
    assert.ok(q.answer >= 1 && q.answer <= 100);
    assert.ok(!q.visual);
  });
});

test('year 1: coins add up to at most 100 sen', () => {
  many('math-y1-sen', (q) => {
    const coins = [...q.text.matchAll(/(\d+) sen/g)].map((m) => +m[1]);
    assert.ok(coins.every((c) => [5, 10, 20, 50].includes(c)));
    assert.equal(q.answer, coins.reduce((x, y) => x + y));
    assert.ok(q.answer <= 100);
  });
});

for (const [id, mins] of [['math-y1-clock', [0, 30]], ['math-y2-clock', [0, 15, 30, 45]]]) {
  test(`${id}: the hands on the clock show the answer`, () => {
    many(id, (q) => {
      const [h, m] = hm(q.answer);
      assert.ok(h >= 1 && h <= 12 && mins.includes(m));
      const angle = (cls) => {
        const [x, y] = q.visual.match(new RegExp(`class="${cls}" x1="50" y1="50" x2="([\\d.]+)" y2="([\\d.]+)"`)).slice(1).map(Number);
        return (Math.atan2(x - 50, 50 - y) * 180 / Math.PI + 360) % 360;
      };
      const diff = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      assert.ok(diff(angle('mh'), m * 6) < 1, `minute hand ${q.key}`);
      assert.ok(diff(angle('hh'), (h % 12) * 30 + m / 2) < 1, `hour hand ${q.key}`);
      assert.equal(q.key, `k${q.answer}`);
    });
  });
}

test('year 1: shapes: the picture matches the name; square and rectangle never offered together', () => {
  const kind = (svg) => {
    if (svg.includes('<circle')) return 'circle';
    const pts = svg.match(/points="([^"]+)"/);
    if (pts) return { 3: 'triangle', 5: 'pentagon', 6: 'hexagon' }[pts[1].split(' ').length];
    const [w, h] = svg.match(/<rect[^>]*width="(\d+)" height="(\d+)"/).slice(1);
    return w === h ? 'square' : 'rectangle';
  };
  const sides = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
  many('math-y1-shapes', (q) => {
    if (q.key.startsWith('sh-')) {
      const picked = q.choices.map((c) => kind(c.label));
      assert.deepEqual(picked, q.choices.map((c) => c.value));
      assert.equal(q.answer, q.key.slice(3));
      assert.ok(!(picked.includes('square') && picked.includes('rectangle')));
    } else assert.equal(q.answer, sides[kind(q.visual)]);
  });
});

test('year 2: place value', () => {
  many('math-y2-place', (q) => {
    if (q.key[0] === 'v') {
      const [n, d] = nums(q.key), place = String(n).length - 1 - String(n).indexOf(String(d));
      assert.equal(q.answer, d * 10 ** place);
    } else assert.equal(q.answer, q.text.split(' + ').map(Number).reduce((x, y) => x + y));
  });
});

for (const [id, max, aMin] of [['math-y2-addsub', 999, 100], ['math-y3-addsub', 9999, 1000]]) {
  test(`${id}: sums and differences within ${max}`, () => {
    many(id, (q) => {
      const [, a, op, b] = q.text.match(/^(\d+) ([+−]) (\d+) = \?$/);
      assert.ok(+a >= aMin && +a <= max && +b >= 1);
      assert.equal(q.answer, op === '+' ? +a + +b : a - b);
      assert.ok(q.answer >= 1 && q.answer <= max);
      assert.ok(!q.visual);
    });
  });
}

for (const [id, tables] of [['math-y2-times-a', [2, 5, 10]], ['math-y2-times-b', [3, 4]]]) {
  test(`${id}: only the ${tables} times tables, up to × 10`, () => {
    many(id, (q) => {
      const [a, b] = nums(q.text);
      assert.equal(q.answer, a * b);
      assert.ok(tables.some((t) => [a, b].includes(t)) && Math.max(a, b) <= 10 && Math.min(a, b) >= 1);
    });
  });
}

test('division facts come from the times tables with no remainder; Y3 mixes × and ÷', () => {
  const check = (id, tables) => many(id, (q) => {
    const m = q.text.match(/^(\d+) ÷ (\d+) = \?$/);
    if (!m) return;
    const [p, a] = [Number(m[1]), Number(m[2])];
    assert.ok(tables.includes(a), `${id}: ${q.text}`);
    assert.equal(p % a, 0);
    assert.equal(q.answer, p / a);
    assert.ok(q.answer >= 2 && q.answer <= 10);
  });
  check('math-y2-div', [2, 3, 4, 5, 10]);
  check('math-y3-times', [6, 7, 8, 9]);
  let mul = 0, div = 0;
  many('math-y3-times', (q) => {
    if (q.text.includes('×')) { mul++; const [a, b] = nums(q.text); assert.equal(q.answer, a * b); assert.ok([a, b].some((x) => x >= 6 && x <= 9)); } else div++;
  });
  assert.ok(mul > 100 && div > 100);
});

test('year 2: bars are divided into equal parts and shaded to match the fraction', () => {
  many('math-y2-frac', (q) => {
    const [k, d] = q.answer.split('/').map(Number);
    assert.ok(d >= 2 && d <= 4 && k < d && gcd(k, d) === 1);
    const shaded = (svg) => [(svg.match(/<rect/g) || []).length, (svg.match(/fill="#ffb74d"/g) || []).length];
    if (q.key.startsWith('fn')) {
      assert.deepEqual(shaded(q.visual), [d, k]);
      assert.equal(q.key, `fn${q.answer}`);
    } else {
      for (const c of q.choices) assert.deepEqual(shaded(c.label), c.value.split('/').reverse().map(Number));
      assert.equal(q.key, `fb${q.answer}`);
    }
  });
});

test('year 3: place value and rounding', () => {
  many('math-y3-place', (q) => {
    if (q.key[0] === 'v') {
      const [n, d] = nums(q.key), place = String(n).length - 1 - String(n).indexOf(String(d));
      assert.equal(q.answer, d * 10 ** place);
    } else {
      const [x, to] = nums(q.key);
      assert.equal(q.answer % to, 0);
      assert.ok(Math.abs(q.answer - x) <= to / 2, `${x} -> ${q.answer}`);
      assert.ok(Math.abs(q.answer - x) < to / 2 || q.answer > x, 'a half rounds up');
    }
  });
});

test('year 3: fractions with the same denominator stay proper', () => {
  many('math-y3-frac', (q) => {
    const [, op, a, b, d] = q.key.match(/^f([as])(\d+)\.(\d+)\/(\d+)$/);
    const n = op === 'a' ? +a + +b : a - b;
    assert.ok(n >= 1 && n < d);
    assert.equal(q.answer, `${n}/${d}`);
    assert.deepEqual(nums(q.text.replace(/<[^>]+>/g, ' ').replace(/\//g, ' ')), [+a, +d, +b, +d]);
  });
});

test('year 3: money in RM and sen, exact to the sen', () => {
  const sen = (s) => Number(s.replace('.', ''));
  many('math-y3-money', (q) => {
    const [, a, op, b] = q.text.match(/^RM(\d+\.\d\d) ([+−]) RM(\d+\.\d\d) = \?$/);
    const ans = op === '+' ? sen(a) + sen(b) : sen(a) - sen(b);
    assert.ok(ans > 0);
    assert.equal(q.answer, `RM${Math.floor(ans / 100)}.${String(ans % 100).padStart(2, '0')}`);
    for (const c of q.choices) assert.match(c.value, /^RM\d+\.\d\d$/);
  });
});

test('year 3: lesson length across the hour and past 12', () => {
  many('math-y3-duration', (q) => {
    const [s, e] = q.key.slice(2).split('-').map(hm);
    assert.equal(q.answer, (((e[0] % 12) - (s[0] % 12)) * 60 + e[1] - s[1] + 720) % 720);
    assert.ok(q.answer >= 15 && q.answer <= 180 && q.answer % 5 === 0);
  });
});

test('year 3: unit conversions', () => {
  const f = { 'm|cm': 100, 'km|m': 1000, 'kg|g': 1000, 'L|ml': 1000, 'cm|mm': 10 };
  many('math-y3-units', (q) => {
    let m = q.text.match(/^(\d+) (\w+) = \? (\w+)$/);
    if (m && f[`${m[2]}|${m[3]}`]) return assert.equal(q.answer, m[1] * f[`${m[2]}|${m[3]}`]);
    if (m) { const fac = f[`${m[3]}|${m[2]}`]; assert.equal(m[1] % fac, 0); return assert.equal(q.answer, m[1] / fac); }
    m = q.text.match(/^(\d+) (\w+) (\d+) (\w+) = \? \w+$/);
    assert.equal(q.answer, m[1] * f[`${m[2]}|${m[4]}`] + Number(m[3]));
    assert.ok(m[3] < f[`${m[2]}|${m[4]}`]);
  });
});

test('year 3: 3D shape facts', () => {
  const facts = { cube: { faces: 6, edges: 12, vertices: 8 }, cuboid: { faces: 6, edges: 12, vertices: 8 }, cylinder: { faces: 2 }, cone: { faces: 1 }, sphere: { faces: 0 } };
  const seen = new Set();
  many('math-y3-solids', (q) => {
    const [, shape, prop] = q.key.match(/^s(\w+)-(\w+)$/);
    assert.equal(q.answer, facts[shape][prop]);
    seen.add(shape);
  });
  assert.equal(seen.size, 5);
});

test('year 4: multiply and divide bigger numbers exactly', () => {
  many('math-y4-muldiv', (q) => {
    const [a, b] = nums(q.text);
    if (q.text.includes('×')) assert.equal(q.answer, a * b);
    else { assert.equal(a % b, 0); assert.equal(q.answer, a / b); }
  });
});

test('year 4: mixed numbers and improper fractions are equal; mixed in lowest terms', () => {
  many('math-y4-mixed', (q) => {
    if (q.key.startsWith('mx')) {
      const [n, d] = nums(q.key), [w, r] = q.answer.split(/[ /]/).map(Number);
      assert.equal(w * d + r, n);
      assert.ok(r < d && gcd(r, d) === 1);
    } else {
      const [w, r, d] = nums(q.key);
      assert.equal(q.answer, `${w * d + r}/${d}`);
    }
  });
});

test('year 4: fraction of a number is a whole number', () => {
  many('math-y4-frac-of', (q) => {
    const [, k, d, N] = q.key.match(/^fo(\d+)\/(\d+)-(\d+)$/).map(Number);
    assert.equal(N % d, 0);
    assert.equal(q.answer * d, k * N);
  });
});

test('year 4: decimals add and subtract exactly to 2 places', () => {
  const h = (s) => { assert.match(s, /^\d+\.\d\d$/); return Number(s.replace('.', '')); };
  many('math-y4-decimals', (q) => {
    const [, a, op, b] = q.text.match(/^(\S+) ([+−]) (\S+) = \?$/);
    assert.equal(h(q.answer), op === '+' ? h(a) + h(b) : h(a) - h(b));
    for (const c of q.choices) h(c.value);
  });
});

test('year 4: 12-hour and 24-hour time', () => {
  const to12 = (t24) => { const [h, m] = hm(t24); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`; };
  many('math-y4-time24', (q) => {
    if (q.key.startsWith('ta')) assert.equal(q.answer, to12(q.text));
    else { assert.equal(to12(q.answer), q.text); for (const c of q.choices) assert.match(c.value, /^\d\d:\d\d$/); }
  });
});

test('year 4: perimeter and area of the rectangle in the picture', () => {
  many('math-y4-area', (q) => {
    const [a, b] = [...q.visual.matchAll(/>(\d+) cm</g)].map((m) => Number(m[1]));
    assert.equal(q.answer, q.key.startsWith('pp') ? 2 * (a + b) : a * b);
    assert.deepEqual([a, b], nums(q.key));
  });
});

test('year 4: the dot on the grid is where the answer says', () => {
  many('math-y4-coords', (q) => {
    const [cx, cy] = q.visual.match(/class="cpt" cx="(\d+)" cy="(\d+)"/).slice(1).map(Number);
    assert.equal(q.answer, `(${(cx - 14) / 12}, ${(90 - cy) / 12})`);
  });
});

test('year 5: percentages of whole numbers', () => {
  many('math-y5-percent', (q) => {
    const [a, b] = nums(q.key);
    if (q.key.startsWith('pc')) assert.equal(q.answer * 100, a * b);
    else assert.equal(q.answer * b, a * 100);
  });
});

test('year 5: decimal point shifts are exact', () => {
  const scaled = (s) => { const [i, f = ''] = s.split('.'); return BigInt(i + f.padEnd(9, '0')); };
  many('math-y5-decimals', (q) => {
    const [, a, op, m] = q.text.match(/^(\S+) ([×÷]) (\d+) = \?$/);
    assert.ok(!/\.\d*0$/.test(a) && !/\.\d*0$/.test(q.answer), 'no trailing zeros');
    if (op === '×') assert.equal(scaled(q.answer), scaled(a) * BigInt(m));
    else { assert.equal(scaled(a) % BigInt(m), 0n); assert.equal(scaled(q.answer), scaled(a) / BigInt(m)); }
  });
});

test('year 5: fractions with unlike denominators, answers proper and in lowest terms', () => {
  many('math-y5-frac', (q) => {
    const [a, d, b, e] = nums(q.key), sub = q.key.includes('-');
    const num = sub ? a * e - b * d : a * e + b * d, den = d * e;
    const [n, m] = q.answer.split('/').map(Number);
    assert.equal(n * den, num * m, 'same value');
    assert.equal(gcd(n, m), 1);
    assert.ok(n < m);
    for (const c of q.choices) { const [x, y] = c.value.split('/').map(Number); assert.equal(gcd(x, y), 1); }
  });
});

test('year 5: volume of the cuboid in the picture', () => {
  many('math-y5-volume', (q) => {
    const dims = [...q.visual.matchAll(/>(\d+) cm</g)].map((m) => Number(m[1]));
    assert.deepEqual([...dims].sort(), nums(q.key).sort());
    assert.equal(q.answer, dims[0] * dims[1] * dims[2]);
  });
});

test('year 5: missing angle', () => {
  many('math-y5-angles', (q) => {
    const ns = nums(q.text);
    assert.ok([90, 180, 360].includes(ns.at(-1)));
    assert.equal(q.answer, ns.at(-1) - ns.slice(0, -1).reduce((x, y) => x + y));
    assert.ok(q.answer > 0);
  });
});

test('year 5: mean, median and mode of five numbers', () => {
  many('math-y5-data', (q) => {
    const v = nums(q.text), kind = q.key.split('-')[1], sum = v.reduce((a, b) => a + b);
    assert.equal(v.length, 5);
    if (kind === 'mean') { assert.equal(sum % 5, 0); assert.equal(q.answer, sum / 5); }
    else if (kind === 'median') assert.equal(q.answer, [...v].sort((a, b) => a - b)[2]);
    else {
      const count = (x) => v.filter((y) => y === x).length;
      assert.ok(count(q.answer) >= 2 && v.every((x) => x === q.answer || count(x) < count(q.answer)));
    }
  });
});

test('year 6: prime numbers', () => {
  const prime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d);
  many('math-y6-prime', (q) => {
    const vals = q.choices.map((c) => c.value), yes = q.key.startsWith('py');
    assert.equal(vals.filter(prime).length, yes ? 1 : 2);
    assert.equal(prime(q.answer), yes);
  });
});

test('year 6: ratios simplify to lowest terms and sharing adds up', () => {
  many('math-y6-ratio', (q) => {
    const [a, b] = nums(q.key), [p, r] = q.answer.split(':').map(Number);
    assert.equal(a * r, b * p);
    assert.equal(gcd(p, r), 1);
    for (const c of q.choices.filter((x) => x.value !== q.answer)) { const [x, y] = c.value.split(':').map(Number); assert.notEqual(a * y, b * x, 'wrong choice is a different ratio'); }
  });
  many('math-y6-ratio-share', (q) => {
    const [N, a, b] = nums(q.key), unit = N / (a + b);
    assert.ok(Number.isInteger(unit) && a !== b);
    assert.equal(q.answer, (q.key.endsWith('B') ? Math.max(a, b) : Math.min(a, b)) * unit);
  });
});

test('year 6: profit, loss and selling price', () => {
  many('math-y6-profit', (q) => {
    const [c, x] = nums(q.key);
    if (q.key.startsWith('pr')) { assert.ok(x > c); assert.equal(q.answer, x - c); }
    else if (q.key.startsWith('ls')) { assert.ok(x < c); assert.equal(q.answer, c - x); }
    else assert.equal(q.answer, c + x);
    assert.ok(q.answer > 0);
  });
});

test('year 6: probability of red is in lowest terms', () => {
  many('math-y6-probability', (q) => {
    const [r, b, g] = nums(q.key), t = r + b + g, [n, d] = q.answer.split('/').map(Number);
    assert.equal(n * t, r * d);
    assert.equal(gcd(n, d), 1);
    assert.ok(q.prompt.en.includes(`${r} red marble`));
  });
});

test('year 6: circles with pi = 22/7 give whole numbers', () => {
  many('math-y6-circle', (q) => {
    const [v] = nums(q.key), t = q.key.slice(0, 2);
    assert.equal(v % 7, 0);
    assert.equal(q.answer, t === 'cd' ? (22 * v) / 7 : t === 'cr' ? (44 * v) / 7 : (22 * v * v) / 7);
    assert.ok(q.visual.includes(`${v} cm`));
  });
});

test('year 6: order of operations matches real arithmetic', () => {
  many('math-y6-ops', (q) => {
    const js = q.key.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    assert.equal(q.answer, Function(`return ${js}`)());
  });
});
