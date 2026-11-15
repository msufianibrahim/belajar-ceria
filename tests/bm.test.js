import { test } from 'node:test';
import assert from 'node:assert/strict';
import bm from '../js/subjects/bm.js';
import { makeRound } from '../js/subjects/util.js';

const many = (fn) => { for (const l of bm.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l, pos); };

test('level and sticker ids are unique and well formed', () => {
  assert.equal(bm.lang, 'ms');
  assert.equal(new Set(bm.levels.map((l) => l.id)).size, bm.levels.length);
  assert.equal(new Set(bm.levels.map((l) => l.sticker.id)).size, bm.levels.length);
  assert.equal(new Set(bm.levels.map((l) => l.sticker.e)).size, bm.levels.length);
  for (const l of bm.levels) assert.match(l.id, /^bm-[a-z0-9-]+$/);
});

test('every question has a valid shape', () => {
  many((q, l) => {
    assert.ok(q.key && q.prompt.ms, l.id);
    if (q.read) {
      assert.equal(q.answer, true, l.id);
      assert.equal(q.choices.length, 0, l.id);
      return;
    }
    const vals = q.choices.map((c) => c.value);
    assert.equal(q.choices.length, 3, l.id);
    assert.equal(new Set(vals).size, vals.length, l.id);
    assert.equal(vals.filter((v) => v === q.answer).length, 1, l.id);
  });
});

test('listening questions do not print the answer', () => {
  many((q, l) => {
    if (!l.id.endsWith('-dengar')) return;
    assert.ok(!q.text && !q.visual, l.id);
    assert.ok(q.say?.includes(q.answer), l.id);
    // whole-word match, so the letter "a" is not found inside "pilih"
    assert.ok(!new RegExp(`(^|[^a-z])${q.answer}([^a-z]|$)`, 'i').test(q.prompt.ms), l.id);
  });
});

test('a picture maps to one word within a level', () => {
  const seen = {};
  many((q, l) => {
    if (!q.visual || q.read) return;
    assert.equal((seen[l.id + q.visual] ??= q.answer), q.answer, l.id);
  });
});

test('a round has 10 questions, different where the pool allows', () => {
  for (const l of bm.levels) {
    const keys = makeRound(l.gen, 10).map((q) => q.key);
    assert.equal(keys.length, 10, l.id);
    assert.ok(new Set(keys).size >= 5, l.id);
  }
});
