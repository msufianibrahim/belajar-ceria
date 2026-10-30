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
      assert.ok(q.prompt && q.key);
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
