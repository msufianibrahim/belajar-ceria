import { test } from 'node:test';
import assert from 'node:assert/strict';
import jawi from '../js/subjects/jawi.js';
import { makeRound } from '../js/subjects/util.js';

const many = (fn) => { for (const l of jawi.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l, pos); };
const strip = (h) => h.replace(/<[^>]*>/g, '');
const hasJawi = (s) => /[؀-ۿݐ-ݿ]/.test(s);
const listening = (l) => /dengar$|huruf-\d|khas/.test(l.id);

test('level and sticker ids are unique, with the jawi- prefix', () => {
  const ids = jawi.levels.map((l) => l.id), st = jawi.levels.map((l) => l.sticker.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(st).size, st.length);
  assert.equal(new Set(jawi.levels.map((l) => l.sticker.e)).size, st.length);
  for (const l of jawi.levels) assert.match(l.id, /^jawi-/);
  assert.equal(jawi.lang, 'ms');
  assert.equal(jawi.arabic, true);
});

test('every question has a valid shape', () => {
  many((q, l) => {
    assert.ok(q.key && q.prompt[jawi.lang], l.id);
    if (q.read) {
      assert.equal(q.answer, true);
      assert.equal(q.choices.length, 0);
      assert.ok(hasJawi(q.read) && q.read.includes('class="ar"'), l.id);
    } else {
      assert.equal(q.choices.length, 3, l.id);
      const vals = q.choices.map((c) => c.value);
      assert.equal(new Set(vals).size, 3, `${l.id} ${q.key}`);
      assert.equal(vals.filter((v) => v === q.answer).length, 1, `${l.id} ${q.key}`);
    }
  });
});

test('listening questions do not show the answer, and choices are Jawi', () => {
  many((q, l) => {
    if (!listening(l)) return;
    assert.equal(q.text, undefined, l.id);
    assert.match(q.say, /^Mana satu [a-z]+\?$/, l.id);
    const sound = q.say.slice(10, -1);
    assert.ok(Object.values(q.prompt).every((p) => !new RegExp(`\\b${sound}\\b`, 'i').test(p) && !p.includes(q.answer)), l.id);
    assert.ok(q.choices.every((c) => hasJawi(strip(c.label)) && c.label.includes('class="ar"')), l.id);
  });
});

test('reading questions show Jawi and offer Latin sounds', () => {
  many((q, l) => {
    if (!/baca$/.test(l.id)) return;
    assert.ok(hasJawi(strip(q.text)) && q.text.includes('class="ar"'), l.id);
    assert.ok(q.choices.every((c) => !hasJawi(c.label)), l.id);
  });
});

test('Jawi-only letters all appear, and no Arabic kaf or dotless ya is used', () => {
  const seen = new Set();
  many((q, l) => {
    if (l.id === 'jawi-huruf-khas') for (const c of q.choices) seen.add(strip(c.label));
    assert.ok(!/[كى]/.test(JSON.stringify(q)), l.id);
  });
  for (const c of 'چڠڤݢڽۏ') assert.ok(seen.has(c), c);
});

test('word questions: the Jawi matches its Latin spelling', () => {
  const kata = { باجو: 'baju', بوکو: 'buku', کودا: 'kuda', روتي: 'roti' };
  const found = new Set();
  many((q, l) => {
    if (l.id !== 'jawi-kata-baca') return;
    const w = strip(q.text);
    if (kata[w]) { assert.equal(q.answer, kata[w]); found.add(w); }
  });
  assert.equal(found.size, 4);
});

// The smallest pools (6 Jawi-only letters, 8 in group 1) repeat some questions in a round of 10.
test('a round of 10 uses every item in a small pool, 10 different in a big one', () => {
  for (const l of jawi.levels) {
    const n = new Set(makeRound(l.gen, 10).map((q) => q.key)).size;
    assert.ok(n >= (l.id === 'jawi-huruf-khas' ? 6 : /huruf-[12]$/.test(l.id) ? 8 : 10), `${l.id}: ${n}`);
  }
});
