import { test } from 'node:test';
import assert from 'node:assert/strict';
import iqra from '../js/subjects/iqra.js';
import { makeRound } from '../js/subjects/util.js';

const level = (id) => iqra.levels.find((l) => l.id === id);
const many = (fn) => { for (const l of iqra.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 5; pos++) fn(l.gen(pos), l, pos); };
const F = 'َ', K = 'ِ', D = 'ُ';
// Letters that carry a sound (the ya/wau of a long vowel only stretches it).
const letters = (s) => [...s.replace(/[\u064A\u0648\u0649]\u0652/g, '').replace(/[\u064B-\u0670 ]/g, '')].length;

test('every question: answer among 3 distinct choices, with a sound to speak', () => {
  many((q, l) => {
    const values = q.choices.map((c) => c.value);
    assert.equal(values.length, 3, l.id);
    assert.equal(new Set(values).size, 3, `${l.id}: ${values}`);
    assert.ok(values.includes(q.answer));
    assert.ok(q.sound);
  });
});

test('wrong choices are the same word with one mark changed', () => {
  many((q, l) => {
    for (const c of q.choices) assert.equal(c.value.replace(/[ً-ٰٗيوى]/g, ''), q.answer.replace(/[ً-ٰٗيوى]/g, ''), l.id);
  });
});

test('words get longer through the round: 2-3 letters, then 3-4, then 6-8', () => {
  many((q, l, pos) => {
    const n = letters(q.answer);
    if (pos < 2) assert.ok(n >= 2 && n <= 3, `${l.id} pos ${pos}: ${q.answer}`);
    else if (pos < 4) assert.ok(n >= 3 && n <= 4, `${l.id} pos ${pos}: ${q.answer}`);
    else assert.ok(n >= 6 && n <= 8, `${l.id} pos ${pos}: ${q.answer}`);
  });
});

test('never speaks خ ر غ with fathah (the voice says them light, Iqra teaches heavy)', () => {
  many((q, l) => {
    for (const h of ['خ', 'ر', 'غ']) assert.ok(!q.sound.includes(h + F), `${l.id}: ${q.sound}`);
  });
});

test('spoken syllable by syllable, small marks as full long vowels', () => {
  many((q, l) => {
    assert.doesNotMatch(q.sound, /[ٖٗى]/, l.id);
    assert.ok(q.sound.split(' ').length >= 2, l.id);
  });
});

test('each level only uses marks learnt so far, and always has its new one', () => {
  const has = {
    'iqra3-kasrah': /ِ/, 'iqra3-kasrah-ya': /ِيْ/, 'iqra3-kasrah-berdiri': /ِهٖ/,
    'iqra3-ya-tanpa-titik': /ِىْ/, 'iqra3-dhammah': /ُ/, 'iqra3-dhammah-wau': /ُوْ/,
    'iqra3-dhammah-terbalik': /[َُ]هٗ/,
  };
  many((q, l) => {
    if (has[l.id]) assert.match(q.answer, has[l.id], `${l.id}: ${q.answer}`);
    const i = iqra.levels.indexOf(l);
    if (i < iqra.levels.findIndex((x) => x.id === 'iqra3-dhammah')) assert.ok(!q.answer.includes(D), `${l.id}: ${q.answer}`);
  });
});

test('a round has 5 different questions', () => {
  for (const l of iqra.levels) assert.equal(new Set(makeRound(l.gen, 5).map((q) => q.key)).size, 5, l.id);
});

test('starts open up to the level he is on', () => {
  assert.ok(level(iqra.startAt));
});
