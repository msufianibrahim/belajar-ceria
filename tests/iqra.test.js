import { test } from 'node:test';
import assert from 'node:assert/strict';
import iqra from '../js/subjects/iqra.js';
import { makeRound } from '../js/subjects/util.js';

const level = (id) => iqra.levels.find((l) => l.id === id);
const many = (fn) => { for (const l of iqra.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l, pos); };
const F = 'َ', K = 'ِ', D = 'ُ';
// Letters that carry a sound (the ya/wau of a long vowel only stretches it).
const letters = (s) => [...s.replace(/[\u064A\u0648\u0649]\u0652/g, '').replace(/[\u064B-\u0670 ]/g, '')].length;

test('every question is a line to read aloud, with no sound or choices', () => {
  many((q, l) => {
    assert.ok(q.read, l.id);
    assert.equal(q.choices.length, 0);
    assert.equal(q.sound, undefined);
  });
});

test('words get longer through the round: 2-3 letters, then 3-4, then 6-8', () => {
  many((q, l, pos) => {
    const n = letters(q.read);
    if (pos < 3) assert.ok(n >= 2 && n <= 3, `${l.id} pos ${pos}: ${q.read}`);
    else if (pos < 7) assert.ok(n >= 3 && n <= 4, `${l.id} pos ${pos}: ${q.read}`);
    else assert.ok(n >= 6 && n <= 8, `${l.id} pos ${pos}: ${q.read}`);
  });
});

test('each level only uses marks learnt so far, and always has its new one', () => {
  const has = {
    'iqra3-kasrah': /ِ/, 'iqra3-kasrah-ya': /ِيْ/, 'iqra3-kasrah-berdiri': /ِهٖ/,
    'iqra3-ya-tanpa-titik': /ِىْ/, 'iqra3-dhammah': /ُ/, 'iqra3-dhammah-wau': /ُوْ/,
    'iqra3-dhammah-terbalik': /[َُ]هٗ/,
  };
  many((q, l) => {
    if (has[l.id]) assert.match(q.read, has[l.id], `${l.id}: ${q.read}`);
    const i = iqra.levels.indexOf(l);
    if (i < iqra.levels.findIndex((x) => x.id === 'iqra3-dhammah')) assert.ok(!q.read.includes(D), `${l.id}: ${q.read}`);
  });
});

test('a round has 10 different questions', () => {
  for (const l of iqra.levels) assert.equal(new Set(makeRound(l.gen, 10).map((q) => q.key)).size, 10, l.id);
});

test('starts open up to the level he is on', () => {
  assert.ok(level(iqra.startAt));
});
