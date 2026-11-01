import { test } from 'node:test';
import assert from 'node:assert/strict';
import iqra from '../js/subjects/iqra.js';
import { makeRound } from '../js/subjects/util.js';

const many = (fn) => { for (const l of iqra.levels) for (let n = 0; n < 500; n++) fn(l.gen(), l); };
const FATHAH = 'َ';

test('every question: answer among 3 distinct choices, with a sound to speak', () => {
  many((q, l) => {
    const values = q.choices.map((c) => c.value);
    assert.equal(values.length, 3, l.id);
    assert.equal(new Set(values).size, 3, `${l.id}: ${values}`);
    assert.ok(values.includes(q.answer));
    assert.ok(q.sound);
  });
});

test('never speaks خ ر غ with fathah (the voice says them light, Iqra teaches heavy)', () => {
  many((q, l) => {
    for (const h of ['خ', 'ر', 'غ']) assert.ok(!q.sound.includes(h + FATHAH), `${l.id}: ${q.sound}`);
  });
});

test('small marks are spoken as full long vowels (the voice ignores them)', () => {
  many((q, l) => assert.doesNotMatch(q.sound, /[ٖٗى]/, l.id));
});

test('kasrah berdiri follows kasrah; dhammah terbalik follows fathah or dhammah', () => {
  for (let n = 0; n < 300; n++) {
    assert.match(iqra.levels.find((l) => l.id === 'iqra3-kasrah-berdiri').gen().answer, /^.ِهٖ$/);
    assert.match(iqra.levels.find((l) => l.id === 'iqra3-dhammah-terbalik').gen().answer, /^.[َُ]هٗ$/);
  }
});

test('a round has 5 different questions', () => {
  for (const l of iqra.levels) assert.equal(new Set(makeRound(l.gen, 5).map((q) => q.key)).size, 5, l.id);
});

test('starts open up to the level he is on', () => {
  assert.ok(iqra.levels.some((l) => l.id === iqra.startAt));
});
