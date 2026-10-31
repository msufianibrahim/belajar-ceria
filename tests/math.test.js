import { test } from 'node:test';
import assert from 'node:assert/strict';
import math from '../js/subjects/math.js';
import { makeRound } from '../js/subjects/util.js';

test('every math question has its answer among distinct choices', () => {
  for (const level of math.levels) {
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
  assert.deepEqual(math.levels.map((l) => l.id), [
    'math-count5', 'math-numerals', 'math-count10', 'math-compare', 'math-sequence',
    'math-countback10', 'math-bond5', 'math-add5', 'math-less', 'math-sub5',
    'math-bond10', 'math-add10', 'math-sub10', 'math-count20', 'math-countback20', 'math-sub20',
  ]);
});

test('placement probes the main levels only, always starting with the first', () => {
  const probed = math.levels.filter((l) => l.probe !== false).map((l) => l.id);
  assert.equal(probed[0], 'math-count5');
  assert.ok(probed.length <= 9, `${probed.length} probed levels`);
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

test('adding and taking away show the written sum only, no pictures to count', () => {
  for (const id of ['math-add5', 'math-add10', 'math-sub5', 'math-sub10', 'math-sub20']) {
    many(id, (q) => {
      assert.ok(q.text);
      assert.ok(!q.visual, id);
    });
  }
});
