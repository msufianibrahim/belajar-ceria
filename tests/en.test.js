import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../js/subjects/en.js';
import { makeRound } from '../js/subjects/util.js';

const many = (fn) => { for (const l of en.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l, pos); };

test('subject and level ids are unique and prefixed', () => {
  assert.equal(en.lang, 'en');
  const ids = en.levels.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((i) => i.startsWith('en-')));
  const st = en.levels.map((l) => l.sticker.id);
  assert.equal(new Set(st).size, st.length);
  const em = en.levels.map((l) => l.sticker.e);
  assert.equal(new Set(em).size, em.length);
});

test('every question has a valid shape', () => {
  many((q, l) => {
    assert.ok(q.key && q.prompt.en, l.id);
    if (q.read) {
      assert.equal(q.answer, true);
      assert.equal(q.choices.length, 0);
      return;
    }
    assert.equal(q.choices.length, 3, l.id);
    const vals = q.choices.map((c) => c.value);
    assert.equal(new Set(vals).size, 3, l.id);
    assert.equal(vals.filter((v) => v === q.answer).length, 1, l.id);
  });
});

test('listening questions do not print the answer; look questions show a picture', () => {
  many((q, l) => {
    if (l.id.endsWith('-listen')) {
      assert.equal(q.text, undefined);
      assert.equal(q.say, q.answer);
      assert.ok(!q.prompt.en.toLowerCase().split(/\W+/).includes(q.answer), l.id);
    }
    if (l.id.endsWith('-look')) assert.ok(q.visual && !q.visual.includes(q.answer), l.id);
  });
});

test('colours and numbers are never mixed in one question', () => {
  const colours = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'orange'];
  many((q, l) => {
    if (!l.id.startsWith('en-colours') || q.read) return;
    const n = q.choices.filter((c) => colours.includes(c.value)).length;
    assert.ok(n === 0 || n === 3, `${l.id}: ${q.choices.map((c) => c.value)}`);
  });
});

test('a round has 10 different questions', () => {
  for (const l of en.levels) assert.equal(new Set(makeRound(l.gen, 10).map((q) => q.key)).size, 10, l.id);
});
