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

// ---- KSSR Tahun 1-6 levels ----
const years = bm.levels.filter((l) => l.year);
const STICKERS = [...'🍔🍟🍕🌭🥪🌮🌯🥗🍝🍜🍲🍛🍣🍱🥟🍤🍚🍘🍥🥮🍢🍡🍧🍨🎂🍰🧁🥧🍫🍬🍭🍮🍯🧃🥤🧋🍵🥐🥯🥨🥞🧇🍗🍖🥔🍠🥒🥬🥦🧄🧅🍆🥑🫐🥝🍅🫑🥜🌰'];
const manyY = (fn) => { for (const l of years) for (let n = 0; n < 400; n++) fn(l.gen(n % 10), l); };

test('year levels: years 1..6 in order, bm sticker pool, ids kept', () => {
  assert.ok(years.length >= 30);
  assert.equal(bm.levels.findIndex((l) => l.year), bm.levels.length - years.length); // appended after the old levels
  const ys = years.map((l) => l.year);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b));
  assert.deepEqual([...new Set(ys)], [1, 2, 3, 4, 5, 6]);
  for (const l of years) assert.ok(STICKERS.includes(l.sticker.e), l.id);
  assert.equal(bm.levels[0].id, 'bm-vokal-dengar');
});

test('year questions: Malay prompt, 3 unique choices, one answer, distractors differ', () => {
  manyY((q, l) => {
    assert.ok(q.key && q.prompt.ms, l.id);
    assert.equal(q.choices.length, 3, l.id);
    const vals = q.choices.map((c) => c.value);
    assert.equal(new Set(vals).size, 3, l.id);
    assert.equal(vals.filter((v) => v === q.answer).length, 1, l.id);
    assert.ok(q.choices.every((c) => c.label), l.id);
    if (q.prompt.ms.startsWith('Isi tempat kosong')) assert.equal(q.text.split('____').length, 2, l.id);
  });
});

test('year pools are varied enough: 12+ distinct questions', () => {
  for (const l of years) {
    const keys = new Set();
    for (let i = 0; i < 1500; i++) keys.add(l.gen(i % 10).key);
    assert.ok(keys.size >= 12, `${l.id} has ${keys.size}`);
  }
});

test('kata ganda: answer is the hyphenated word', () => {
  const l = bm.levels.find((x) => x.id === 'bm-t2-kata-ganda');
  for (let i = 0; i < 100; i++) {
    const q = l.gen(0);
    assert.equal(q.answer, `${q.text}-${q.text}`);
  }
});

test('awalan meN-: answer follows the sound rules', () => {
  const men = (b) => {
    const c = b[0];
    if ('aeiough'.includes(c)) return 'meng' + b;
    if (c === 'k') return 'meng' + b.slice(1);
    if ('lmnrwy'.includes(c)) return 'me' + b;
    if ('bfv'.includes(c)) return 'mem' + b;
    if (c === 'p') return 'mem' + b.slice(1);
    if ('cdjz'.includes(c)) return 'men' + b;
    if (c === 't') return 'men' + b.slice(1);
    if (c === 's') return 'meny' + b.slice(1);
  };
  const l = bm.levels.find((x) => x.id === 'bm-t3-awalan-men');
  for (let i = 0; i < 200; i++) { const q = l.gen(0); assert.equal(q.answer, men(q.text)); }
});

test('kata majmuk: choices differ only in the join', () => {
  const l = bm.levels.find((x) => x.id === 'bm-t4-kata-majmuk');
  for (let i = 0; i < 200; i++) {
    const q = l.gen(0);
    assert.equal(new Set(q.choices.map((c) => c.value.replace(/[ -]/g, ''))).size, 1);
  }
});

test('di/ke/dari and kepada/daripada: answers come from the expected set', () => {
  for (const [id, set] of [['bm-t2-di-ke-dari', ['di', 'ke', 'dari']], ['bm-t4-kepada-daripada', ['kepada', 'daripada']]]) {
    const l = bm.levels.find((x) => x.id === id);
    for (let i = 0; i < 200; i++) assert.ok(set.includes(l.gen(0).answer), id);
  }
});

test('peribahasa and simpulan: the meaning is never the same as a distractor', () => {
  manyY((q, l) => {
    if (/peribahasa|simpulan/.test(l.id)) assert.equal(new Set(q.choices.map((c) => c.label)).size, 3, l.id);
  });
});

test('ayat pasif: answer starts with an object and has di- plus oleh', () => {
  const l = bm.levels.find((x) => x.id === 'bm-t5-ayat-pasif');
  for (let i = 0; i < 100; i++) assert.match(l.gen(0).answer, / (di|[A-Za-z]*)[a-z]+ oleh /);
});
