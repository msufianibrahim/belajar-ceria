import { test } from 'node:test';
import assert from 'node:assert/strict';
import iqra from '../js/subjects/iqra.js';
import { makeRound } from '../js/subjects/util.js';

const level = (id) => iqra.levels.find((l) => l.id === id);
const index = (id) => iqra.levels.findIndex((l) => l.id === id);
const many = (fn) => { for (const l of iqra.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l, pos); };
const each = (id, fn) => { const l = level(id); for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), pos); };
const F = 'َ', K = 'ِ', D = 'ُ';
// Letters that carry a sound (the ya/wau of a long vowel only stretches it; alif lam is a prefix).
const letters = (s) => [...s.replace(/(^| )اَلْ?/g, '$1').replace(/[يوى]ْ/g, '').replace(/ٰى/g, '').replace(/[ًَ]ا/g, '').replace(/[ً-ٰ ]/g, '')].length;
const words = (s) => s.split(' ');

test('every question is a line to read aloud, with no sound or choices', () => {
  many((q, l) => {
    assert.ok(q.read, l.id);
    assert.equal(q.choices.length, 0);
    assert.equal(q.sound, undefined);
  });
});

test('words get longer through the round: 2-3 letters, then 3-4, then 6-8', () => {
  many((q, l, pos) => {
    if (l.id.startsWith('iqra6-')) return;  // phrases and surah openings, checked below
    const n = letters(q.read);
    if (pos < 3) assert.ok(n >= 2 && n <= 3, `${l.id} pos ${pos}: ${q.read}`);
    else if (pos < 7) assert.ok(n >= 3 && n <= 4, `${l.id} pos ${pos}: ${q.read}`);
    else assert.ok(n >= 6 && n <= 8, `${l.id} pos ${pos}: ${q.read}`);
  });
});

// Marks in the order the book teaches them: a level may only use marks from levels up to it.
const NEW_MARKS = {
  'iqra1-letters-1': 'َ', 'iqra2-fathah-berdiri': 'ٰ', 'iqra3-kasrah': 'ِ', 'iqra3-kasrah-ya': 'ْ',
  'iqra3-kasrah-berdiri': 'ٖ', 'iqra3-dhammah': 'ُ', 'iqra3-dhammah-terbalik': 'ٗ', 'iqra4-tanwin': 'ًٌٍ',
  'iqra5-shaddah': 'ّ', 'iqra5-mad': 'ٓ',
};

test('marks are Unicode combining marks after a letter, and only ones learnt so far', () => {
  const learnt = {};
  let marks = '';
  for (const l of iqra.levels) { marks += NEW_MARKS[l.id] ?? ''; learnt[l.id] = marks; }
  assert.equal(Object.keys(NEW_MARKS).filter((id) => !level(id)).length, 0);
  many((q, l) => {
    for (const c of q.read.match(/[ً-ٰٟ]/g) ?? []) assert.ok(learnt[l.id].includes(c), `${l.id}: ${q.read}`);
    // A mark never starts a word; shaddah comes before the vowel; at most one vowel per letter.
    assert.ok(!/(^| )[ً-ٰٟ]/.test(q.read), `${l.id}: ${q.read}`);
    assert.ok(!/[ً-ِْ-ٰٟ]ّ/.test(q.read), `${l.id}: ${q.read}`);
    assert.ok(!/[ً-ِْٰ]{2}/.test(q.read), `${l.id}: ${q.read}`);
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
    if (iqra.levels.indexOf(l) < index('iqra3-dhammah')) assert.ok(!q.read.includes(D), `${l.id}: ${q.read}`);
  });
});

test('Iqra 1-2 use fathah only; the alif levels have fathah + alif', () => {
  many((q, l) => {
    if (!/^iqra[12]-/.test(l.id)) return;
    assert.ok(!/[ً-ٍُ-ْ]/.test(q.read), `${l.id}: ${q.read}`);
    if (l.id === 'iqra1-fathah') assert.ok(!q.read.includes('ا'), q.read);
    if (['iqra1-fathah-alif', 'iqra2-alif-lam'].includes(l.id)) assert.match(q.read, /َا/, q.read);
  });
});

const GROUPS = ['أبتث', 'جحخ', 'دذرز', 'سشصض', 'طظعغ', 'فقكل', 'منوهءي'];
test('Iqra 1 letters: standalone with fathah, from the letters learnt, always one new one', () => {
  GROUPS.forEach((g, i) => each(`iqra1-letters-${i + 1}`, (q) => {
    const ls = words(q.read).map((w) => { assert.equal([...w].length, 2, q.read); assert.equal(w[1], F, q.read); return w[0]; });
    assert.ok(ls.every((c) => GROUPS.slice(0, i + 1).join('').includes(c)), q.read);
    assert.ok(ls.some((c) => g.includes(c)), q.read);
  }));
});

test('similar sounds: one group of look-alike sounds, at least two different letters', () => {
  const SIMILAR = ['ثسص', 'حه', 'ذزظ', 'كق', 'تط', 'أع', 'دض'];
  each('iqra1-similar', (q) => {
    const ls = words(q.read).map((w) => w[0]);
    assert.ok(words(q.read).every((w) => w.length === 2 && w[1] === F), q.read);
    assert.ok(SIMILAR.some((g) => ls.every((c) => g.includes(c))), q.read);
    assert.ok(new Set(ls).size >= 2, q.read);
  });
});

test('Iqra 2: alif and lam together; fathah berdiri in every word, then before a dotless ya', () => {
  each('iqra2-alif-lam', (q) => { for (const w of words(q.read)) assert.ok(w.includes('ل') && w.includes('َا'), q.read); });
  each('iqra2-fathah-berdiri', (q) => { for (const w of words(q.read)) assert.match(w, /ٰ/, q.read); });
  each('iqra2-berdiri-ya', (q) => { for (const w of words(q.read)) assert.match(w, /ٰى$/, q.read); });
});

test('tanwin ends every word that has it, fathatain with an alif', () => {
  many((q, l) => {
    if (l.id === 'iqra4-tanwin') for (const w of q.read.split(' ')) assert.match(w, /(ًا|[ٌٍ])$/, q.read);
    if (/[ً-ٍ]/.test(q.read)) for (const w of words(q.read).filter((x) => /[ً-ٍ]/.test(x))) assert.match(w, /(ًا|[ٌٍ])$/, `${l.id}: ${q.read}`);
  });
});

test('sukun and shaddah sit on a letter after a short vowel; shaddah takes a vowel', () => {
  many((q, l) => {
    // A consonant (not the ya/wau of a long vowel) with sukun.
    if (l.id === 'iqra4-sukun') assert.match(q.read, /[َُِ][^يوى ]ْ/, q.read);
    if (l.id === 'iqra5-shaddah') assert.match(q.read, /[َُِ]\Sّ[َُِ]/, q.read);
    assert.equal((q.read.match(/ّ/g) || []).length, (q.read.match(/ّ[َُِ]/g) || []).length, q.read);
  });
});

test('qalqalah: every word has a sukun on qaf, tho, ba, jim or dal after a short vowel', () => {
  each('iqra4-qalqalah', (q) => { for (const w of words(q.read)) assert.match(w, /[َُِ][قطبجد]ْ/, q.read); });
});

test('alif lam: lam with sukun before a qamari letter, lam silent and shaddah on a syamsi letter', () => {
  each('iqra5-alif-lam-qamariah', (q) => { for (const w of words(q.read)) assert.match(w, /^اَلْ[ابجحخعغفقكمهوي][َُِ]/, q.read); });
  each('iqra5-alif-lam-syamsiah', (q) => { for (const w of words(q.read)) assert.match(w, /^اَل[تثدذرزسشصضطظلن]ّ[َُِ]/, q.read); });
});

test('mad: fathah, alif with the mad sign, then hamzah with a vowel, in every word', () => {
  each('iqra5-mad', (q) => { for (const w of words(q.read)) assert.match(w, /َآء[َُِ]$/, q.read); });
});

test('waqaf: asks him to stop at the end, which is a vowel or tanwin', () => {
  each('iqra5-waqaf', (q) => {
    assert.match(q.prompt.en, /stop/);
    for (const w of words(q.read)) assert.match(w, /([َُِ]|ًا|[ٌٍ])$/, q.read);
  });
});

test('Iqra 6: nun sukun or tanwin, then a word starting with the level\'s letters', () => {
  const next = { 'iqra6-izhar': 'ءهعحغخ', 'iqra6-idgham': 'يرملون', 'iqra6-iqlab': 'ب', 'iqra6-ikhfa': 'تثجدذزسشصضطظفقك' };
  for (const [id, first] of Object.entries(next)) each(id, (q) => {
    const [a, b, ...rest] = words(q.read);
    assert.equal(rest.length, 0, q.read);
    assert.match(a, /(نْ|ًا|[ٌٍ])$/, q.read);
    assert.ok(first.includes(b[0]), `${id}: ${q.read}`);
  });
  each('iqra6-mim-sukun', (q) => {
    assert.equal(words(q.read).length, 2, q.read);
    assert.match(words(q.read)[0], /مْ$/, q.read);
  });
});

test('surah openings: only the 14 opening letters, each with the mad sign or fathah berdiri', () => {
  each('iqra6-muqattaah', (q, pos) => {
    assert.match(q.prompt.en, /letter names/);
    for (const w of words(q.read)) assert.match(w, /^ا?([المصركهيعطسحقن][ٰٓ])+$/, q.read);
    if (pos < 3) assert.ok(letters(q.read) <= 2, q.read);
  });
});

test('level and sticker ids are unique, in book order', () => {
  const ids = iqra.levels.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  const st = iqra.levels.map((l) => l.sticker.id);
  assert.equal(new Set(st).size, st.length);
  assert.equal(new Set(iqra.levels.map((l) => l.sticker.e)).size, st.length);
  const book = (id) => +id.match(/^iqra(\d)/)[1];
  assert.deepEqual(ids.map(book), [...ids.map(book)].sort());
  for (const l of iqra.levels) {
    assert.equal(l.year, undefined, l.id);  // Iqra goes by book, not school year
    if (l.needs) assert.ok(index(l.needs) >= 0 && index(l.needs) < index(l.id), l.id);
  }
});

test('a round has 10 different questions', () => {
  for (const l of iqra.levels) assert.equal(new Set(makeRound(l.gen, 10).map((q) => q.key)).size, 10, l.id);
});

test('starts open up to the level he is on', () => {
  assert.ok(level(iqra.startAt));
});
