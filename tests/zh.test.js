import { test } from 'node:test';
import assert from 'node:assert/strict';
import zh, * as Z from '../js/subjects/zh.js';

const many = (fn) => { for (const l of zh.levels) for (let n = 0; n < 300; n++) for (let pos = 0; pos < 10; pos++) fn(l.gen(pos), l); };

test('every question has a valid shape', () => {
  many((q, l) => {
    assert.ok(q.key && q.prompt.zh && q.prompt.py && q.prompt.en, l.id);
    if (q.read) {
      assert.equal(q.answer, true);
      assert.equal(q.choices.length, 0);
    } else {
      const vals = q.choices.map((c) => c.value);
      assert.equal(vals.length, 3, l.id);
      assert.equal(new Set(vals).size, 3, l.id);
      assert.equal(vals.filter((v) => v === q.answer).length, 1, l.id);
    }
  });
});

test('listening questions speak via say and keep the answer out of the prompt', () => {
  many((q) => {
    if (q.read || q.visual || q.text) return;
    assert.ok(q.say, q.key);
    // Pinyin-letter answers (b, a, ...) sit inside English words, so only Chinese answers are checked.
    const han = /\p{Script=Han}/u.test(String(q.answer));
    for (const v of Object.values(q.prompt)) assert.ok(!v.includes(q.say) && !(han && v.includes(q.answer)), q.key);
  });
});

const HAN = /\p{Script=Han}/u;
const TONED = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

test('pinyin has tone marks and no characters', () => {
  const rows = [...Object.values(Z.THEMES).flat().map((x) => x.py), ...Z.INITIALS.map((r) => r[1]), ...Z.FINALS.map((r) => r[1]),
    ...Object.values(Z.P).map((p) => p.py)];
  for (const py of rows) {
    assert.match(py, TONED, py);
    assert.ok(!HAN.test(py), py);
  }
  for (const x of Object.values(Z.THEMES).flat()) assert.ok(HAN.test(x.w) && !/[a-z]/i.test(x.w), x.w);
});

test('initials and finals split their syllable', () => {
  for (const [, py, ini] of Z.INITIALS) assert.ok(Z.plain(py).startsWith(ini), py);
  // zh/ch/sh are not read as z/c/s.
  for (const [, py, ini] of Z.INITIALS) if ('zcs'.includes(ini)) assert.notEqual(Z.plain(py)[1], 'h', py);
  for (const [, py, fin] of Z.FINALS) assert.match(Z.plain(py), new RegExp(`^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])?${fin}$`), py);
});

test('new levels have years in order and stickers from the zh pool', () => {
  const pool = [...'🌞🌝🌛⭐🌟✨☄️🌊💧🔥⚡☀️🌤️🌦️🌩️🌨️☃️⛄🌬️🌪️🌫️🌀🌾🪴🪵🪨🌲🍂🍃🪷🪻🥀🏵️🎋🎍🎑🎐🏮🧧🎎🀄🎏'.matchAll(/\p{Extended_Pictographic}️?/gu)].map((m) => m[0]);
  const yrs = zh.levels.map((l) => l.year ?? 0);
  assert.deepEqual(yrs, [...yrs].sort((a, b) => a - b));
  for (const l of zh.levels.filter((x) => x.year)) {
    assert.ok(l.year >= 1 && l.year <= 6 && /^zh-[a-z0-9-]+$/.test(l.id), l.id);
    assert.ok(pool.includes(l.sticker.e), l.id);
  }
});

test('answers are in their pools and distractors are not also right', () => {
  const lv = (id) => zh.levels.find((l) => l.id === id);
  const run = (id, fn) => { for (let n = 0; n < 500; n++) fn(lv(id).gen(0)); };
  run('zh-y1-tones', (q) => assert.equal(q.answer, Z.tone(Z.TONE.find((x) => x.w === q.say).py)));
  run('zh-y1-tone-pinyin', (q) => {
    const item = Z.TONE.find((x) => x.w === q.text);
    assert.equal(q.answer, item.py);
    for (const c of q.choices) assert.equal(Z.plain(c.value), Z.plain(item.py));
  });
  run('zh-y1-initials', (q) => assert.equal(q.answer, Z.INITIALS.find((r) => r[0] === q.say)[2]));
  run('zh-y1-finals', (q) => assert.equal(q.answer, Z.FINALS.find((r) => r[0] === q.say)[2]));
  run('zh-y1-strokes', (q) => assert.equal(q.answer, Z.STROKES.find((r) => r[0] === q.text)[1]));
  run('zh-y2-radicals', (q) => {
    assert.ok(Z.RADICALS[q.answer].includes(q.text));
    for (const c of q.choices) if (c.value !== q.answer) assert.ok(!Z.RADICALS[c.value].includes(q.text));
  });
  for (const [id, m] of [['zh-y2-measure', Z.MEASURE1], ['zh-y3-measure', Z.MEASURE2]]) run(id, (q) => {
    const [, a, also = ''] = m.items.find((r) => `一（　）${r[0]}` === q.text);
    assert.equal(q.answer, a);
    for (const c of q.choices) assert.ok(c.value === a || (!also.includes(c.value) && c.value !== '个'), q.text);
  });
  for (const [id, list] of [['zh-y2-opposites', Z.OPP1], ['zh-y4-opposites', Z.OPP2], ['zh-y3-synonyms', Z.SYN]]) run(id, (q) => {
    const pair = list.find((p) => p.includes(q.text));
    assert.deepEqual([...pair].sort(), [q.text, q.answer].sort());
    // A word sits in one pair only, so no distractor is a second answer.
    assert.equal(list.flat().filter((w) => w === q.text).length, 1, q.text);
  });
  run('zh-y3-ba-bei', (q) => {
    const ba = Z.BA.some(([d, t, v]) => q.text === `${d}（　）${t}${v}。`);
    const bei = Z.BA.some(([d, t, v]) => q.text === `${t}（　）${d}${v}。`);
    assert.ok(ba !== bei, q.text);
    assert.equal(q.answer, ba ? '把' : '被');
  });
  run('zh-y4-ba-bei-swap', (q) => {
    const row = Z.BA.find(([d, t, v]) => [`${d}把${t}${v}。`, `${t}被${d}${v}。`].includes(q.text));
    assert.deepEqual([q.text, q.answer].sort(), [`${row[0]}把${row[1]}${row[2]}。`, `${row[1]}被${row[0]}${row[2]}。`].sort());
  });
  for (const [id, list] of [['zh-y4-idioms', Z.IDIOMS], ['zh-y6-fables', Z.FABLES]]) run(id, (q) => {
    assert.equal(q.answer, list.find((x) => x[0] === q.text)[1]);
  });
  for (const [id, list] of [['zh-y5-idiom-pick', Z.IDIOMS], ['zh-y6-fable-pick', Z.FABLES]]) run(id, (q) => {
    assert.equal(q.answer, list.find((x) => x[1] === q.text)[0]);
  });
  run('zh-y5-idiom-fill', (q) => assert.ok(Z.IDIOMS.some(([w]) => q.text.replace('（　）', q.answer) === w), q.text));
  run('zh-y5-linking', (q) => {
    const hit = Z.LINK2.find(([[a, b], list]) => list.includes(q.text.replace('（　）', q.answer)) && q.answer === a);
    assert.ok(hit, q.text);
  });
  for (const y of [3, 4, 5, 6]) run(`zh-y${y}-reading`, (q) => {
    const all = Z.READING[y].flatMap(([p, qs]) => qs.map(([qq, a, d]) => [`${p}<br><br><b>${qq}</b>`, a, d]));
    const [, a, d] = all.find((r) => r[0] === q.text);
    assert.equal(q.answer, a);
    assert.ok(!d.includes(a));
  });
});

test('linking sentences hold each word of their pair once, in order', () => {
  for (const [[a, b], list] of Z.LINK2) for (const s of list) {
    const i = s.indexOf(a);
    assert.ok(i >= 0 && s.indexOf(b, i + a.length) > i, s);
    if (a !== b) assert.equal(s.split(a).length, 2, s);
  }
});

test('stroke counts are small whole numbers and idioms are four characters', () => {
  for (const [w, n] of Z.STROKES) assert.ok(w.length === 1 && n >= 1 && n <= 6);
  for (const [w] of [...Z.IDIOMS, ...Z.FABLES]) assert.equal([...w].length, 4, w);
});

test('level and sticker ids are unique, ids prefixed zh-', () => {
  const ids = zh.levels.map((l) => l.id);
  const st = zh.levels.map((l) => l.sticker.id);
  const em = zh.levels.map((l) => l.sticker.e);
  for (const a of [ids, st, em]) assert.equal(new Set(a).size, a.length);
  assert.ok(ids.every((i) => i.startsWith('zh-')));
  assert.equal(zh.lang, 'zh');
});

test('prompts are Chinese with a toned pinyin line', () => {
  many((q) => {
    assert.match(q.prompt.zh, /^[一-鿿，。？]+$/);
    assert.match(q.prompt.py, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/);
  });
});
