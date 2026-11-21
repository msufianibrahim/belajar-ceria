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
    // tak-sambung has one question per non-joining letter (7).
    assert.ok(n >= (l.id === 'jawi-huruf-khas' ? 6 : /huruf-[12]$/.test(l.id) ? 8 : l.id === 'jawi-t2-tak-sambung' ? 7 : 10), `${l.id}: ${n}`);
  }
});

// ---- KSSR Tahun 1–6 levels
const OLD = ['huruf-1', 'huruf-2', 'huruf-3', 'huruf-khas', 'huruf-baca', 'huruf-sebut', 'suku-dengar', 'suku-baca', 'suku-sebut', 'kata-dengar', 'kata-baca', 'kata-sebut'];
const POOL = '🎨🖌️🖍️✏️📏📐📌📎🧩🎲🪁🪀🎯🎳🎮🧸🪆🎹🥁🎺🎸🪕🎻📯🎷🪇🪈🔔🪄🎭';
const kssr = jawi.levels.slice(OLD.length);
const each = (id, fn) => { const l = jawi.levels.find((x) => x.id === id); assert.ok(l, id); for (let n = 0; n < 400; n++) fn(l.gen(n % 10)); };

test('old levels keep their ids and order; new ones have years 1..6 going up, stickers from the Jawi pool', () => {
  assert.deepEqual(jawi.levels.slice(0, OLD.length).map((l) => l.id), OLD.map((x) => `jawi-${x}`));
  assert.ok(kssr.length >= 25);
  const years = jawi.levels.map((l) => l.year ?? 0);
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  for (let y = 1; y <= 6; y++) assert.ok(kssr.some((l) => l.year === y), `year ${y}`);
  for (const l of kssr) {
    assert.match(l.id, /^jawi-[a-z0-9-]+$/);
    assert.match(l.sticker.id, /^st-jawi-/);
    assert.ok(POOL.includes(l.sticker.e) && l.sticker.e.length > 0, l.id);
    assert.ok(l.title.en && l.title.ms && l.icon, l.id);
  }
});

test('only Jawi letters (DBP forms) appear in the Arabic script', () => {
  const ok = new Set('ابتثجحخدذرزسشصضطظعغفقکلمنوهيچڠڤݢڽۏةـ');
  many((q, l) => { for (const ch of JSON.stringify(q)) if (/[؀-ۿݐ-ݿ]/.test(ch)) assert.ok(ok.has(ch), `${l.id}: ${ch} U+${ch.codePointAt(0).toString(16)}`); });
});

// Rumi -> Jawi for every word seen in word, sentence and passage questions: one spelling per word, both ways.
test('every rumi word always has the same Jawi spelling, and known words are spelled the DBP way', () => {
  const r2j = new Map(), j2r = new Map();
  const add = (rumi, jw) => {
    const rs = rumi.toLowerCase().replace(/\./g, '').split(' '), js = jw.replace(/\./g, '').split(' ');
    assert.equal(rs.length, js.length, `${rumi} / ${jw}`);
    rs.forEach((r, i) => {
      assert.equal(r2j.get(r) ?? js[i], js[i], `${r}: ${r2j.get(r)} vs ${js[i]}`);
      assert.equal(j2r.get(js[i]) ?? r, r, `${js[i]}: ${j2r.get(js[i])} vs ${r}`);
      r2j.set(r, js[i]); j2r.set(js[i], r);
    });
  };
  many((q, l) => {
    if (!/-(kvkv|kvkvk|kvk2|diftong|awalan|akhiran|apitan|imbuhan|arab|ayat)-(baca|pilih)$/.test(l.id)) return;
    if (/pilih$/.test(l.id)) add(q.text, q.answer); else add(q.answer, strip(q.text));
  });
  const known = { buku: 'بوکو', mata: 'مات', kucing: 'کوچيڠ', pisang: 'ڤيسڠ', rumah: 'رومه', tempat: 'تمڤت', cantik: 'چنتيق', pandai: 'ڤنداي', pulau: 'ڤولاو', nyanyi: 'ڽاڽي', dibaca: 'دباچ', membaca: 'ممباچ', menulis: 'منوليس', makanan: 'ماکنن', kesihatan: 'کسيحتن', solat: 'صلاة', ilmu: 'علمو', saya: 'ساي', ibu: 'ايبو' };
  for (const [r, j] of Object.entries(known)) assert.equal(r2j.get(r), j, r);
});

test('affixed words: the affix is written on the unchanged root', () => {
  for (const id of ['jawi-t4-awalan-baca', 'jawi-t4-akhiran-baca', 'jawi-t4-apitan-baca']) each(id, (q) => {
    const r = q.answer, j = strip(q.text);
    if (r.startsWith('di')) assert.ok(j.startsWith('د'), r);
    if (r.startsWith('ber')) assert.ok(j.startsWith('بر'), r);
    if (r.startsWith('me')) assert.ok(j.startsWith('م'), r);
    if (r.startsWith('ke')) assert.ok(j.startsWith('ک'), r);
    if (r.startsWith('pe')) assert.ok(j.startsWith('ڤ'), r);
    // -kan is کن; a root ending in k (cantik چنتيق) + -an keeps its ق: کچنتيقن.
    if (r.endsWith('kan')) assert.ok(j.endsWith('کن') || j.endsWith('قن'), r);
    else if (r.endsWith('an')) assert.ok(j.endsWith('ن') && !j.endsWith('ان'), r);
  });
});

test('letter shapes: position matches the tatweel, and only non-joining letters are the answer', () => {
  each('jawi-t2-kedudukan', (q) => {
    const t = strip(q.text);
    assert.equal(q.answer, t.startsWith('ـ') ? (t.endsWith('ـ') ? 'tengah' : 'akhir') : 'awal');
    assert.equal(t.replace(/ـ/g, '').length, 1);
  });
  each('jawi-t2-bentuk', (q) => assert.ok(/ـ/.test(strip(q.text)) && q.choices.every((c) => !hasJawi(c.label))));
  each('jawi-t2-tak-sambung', (q) => {
    for (const c of q.choices) assert.equal('ادذرزوۏ'.includes(c.value), c.value === q.answer, c.value);
  });
});

test('open syllables end in a vowel letter, closed ones in a consonant', () => {
  each('jawi-t2-suku-tertutup', (q) => {
    const open = /terbuka/.test(q.prompt.ms);
    for (const c of q.choices) assert.equal('اوي'.includes(c.value.slice(-1)) === open, c.value === q.answer, c.value);
  });
});

test('sentences: wrong choices differ from the answer by one part', () => {
  each('jawi-t5-ayat-baca', (q) => {
    const [who, ...rest] = q.answer.split(' ');
    for (const c of q.choices.filter((x) => x.value !== q.answer)) {
      const [w, ...r] = c.value.split(' ');
      assert.ok((w === who) !== (r.join(' ') === rest.join(' ')), c.value);
    }
  });
  each('jawi-t6-ayat-sebut', (q) => assert.ok(/\.<\/span>$/.test(q.read)));
});

test('passages: Jawi answers appear in the passage, wrong ones do not', () => {
  each('jawi-t6-petikan-jawi', (q) => {
    const words = strip(q.text).replace(/\./g, '').split(' ');
    for (const c of q.choices) assert.equal(words.includes(c.value), c.value === q.answer, c.value);
  });
  each('jawi-t6-petikan', (q) => assert.ok(q.choices.every((c) => !hasJawi(c.label)) && hasJawi(strip(q.text))));
});
