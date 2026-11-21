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

// ---- KSSR Year 1-6 levels ----
const kssr = en.levels.filter((l) => l.year);
const byId = (id) => en.levels.find((l) => l.id === `en-${id}`);
const gens = (id, fn, n = 400) => { for (let i = 0; i < n; i++) fn(byId(id).gen(i % 10)); };
const POOL = '🛺🚐🛻🚚🚛🏎️🛴🛹🚤🛳️⛴️🚢✈️🛩️🛰️🚠🚡🚟🚃🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🏰🏯🗼🗽🏠🏡🏢🏫🏥🏦🏪🎡🎢🎠⛲🌉🗻🏔️🏝️🏜️🌋⛺🏕️';

test('KSSR levels: years 1-6 in order, ids, stickers from the English pool', () => {
  assert.ok(kssr.length >= 30 && kssr.length <= 45);
  assert.deepEqual([...new Set(kssr.map((l) => l.year))], [1, 2, 3, 4, 5, 6]);
  const years = kssr.map((l) => l.year);
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  const pool = [...new Intl.Segmenter().segment(POOL)].map((s) => s.segment);
  for (const l of kssr) {
    assert.match(l.id, /^en-[a-z0-9-]+$/);
    assert.ok(l.title.en && l.title.ms && l.icon, l.id);
    assert.ok(pool.includes(l.sticker.e), l.id);
    assert.match(l.sticker.id, /^st-en-/);
  }
});

test('KSSR questions: 3 distinct choices, exactly one is the answer', () => {
  for (const l of kssr) for (let i = 0; i < 300; i++) {
    const q = l.gen(i % 10);
    assert.equal(q.choices.length, 3, l.id);
    const v = q.choices.map((c) => c.value);
    assert.equal(new Set(v).size, 3, l.id);
    assert.equal(v.filter((x) => x === q.answer).length, 1, l.id);
  }
});

test('digraphs: filling the blank makes a real word', () => {
  const words = ['shell', 'cheese', 'chair', 'shark', 'shirt', 'fish', 'three', 'thumb', 'thread', 'shower', 'sandwich', 'teeth', 'peach', 'beach'];
  gens('digraphs', (q) => assert.ok(words.includes(q.text.replace('__', q.answer)), q.text));
});

test('magic e and long vowels', () => {
  gens('magic-e', (q) => assert.equal(q.answer, `${q.text.split(' + ')[0]}e`));
  const long = 'cake rain tape name gate tree bee sea leaf feet kite bike five nine line boat home nose rose bone cube tube cute mule huge'.split(' ');
  gens('long-vowels', (q) => {
    assert.ok(long.includes(q.answer));
    assert.ok(q.choices.every((c) => c.value === q.answer || !long.includes(c.value)));
  });
});

test('a/an follows the first letter; plurals follow the spelling rule', () => {
  gens('a-an', (q) => {
    const w = q.text.replace(/^.*____ /, '').replace('.', '');
    assert.equal(q.answer, /^[aeiou]/.test(w) ? 'an' : 'a', q.text);
  });
  gens('plurals-s', (q) => {
    const w = q.text;
    assert.equal(q.answer, /(x|ch|sh|ss)$/.test(w) ? `${w}es` : `${w}s`);
  });
});

test('this/that/these/those, am/is/are, possessives', () => {
  gens('this-that', (q) => {
    const near = q.text.startsWith('Near'), many = q.text.includes(' are ');
    assert.equal(q.answer, near ? (many ? 'these' : 'this') : (many ? 'those' : 'that'));
  });
  gens('am-is-are', (q) => {
    const s = q.text.split(' ____')[0];
    const exp = s === 'I' ? 'am' : ['He', 'She', 'It', 'The cat', 'My sister', 'Ali'].includes(s) ? 'is' : 'are';
    assert.equal(q.answer, exp, q.text);
  });
  const own = { I: 'my', You: 'your', He: 'his', She: 'her', We: 'our', They: 'their', 'The cat': 'its' };
  gens('possessives', (q) => {
    const s = Object.keys(own).find((k) => q.text.startsWith(`${k} `));
    assert.equal(q.answer, own[s], q.text);
    if (s === 'The cat') assert.ok(!q.choices.some((c) => ['his', 'her'].includes(c.value)));
  });
});

test('prepositions of place: the picture matches the answer', () => {
  gens('prep-place', (q) => {
    if (!q.visual) return;
    const m = q.visual.match(/<circle cx="(\d+)" cy="(\d+)"/);
    const cx = +m[1], cy = +m[2];
    let exp;
    if (q.text.includes('two boxes')) exp = 'between';
    else if (cx > 100) exp = 'next to';
    else if (q.text.includes('table')) exp = cy < 40 ? 'on' : 'under';
    else exp = cy < 45 ? 'on' : 'in';
    assert.equal(q.answer, exp, q.text);
  });
});

test('tricky plurals and opposites', () => {
  const irr = { man: 'men', woman: 'women', child: 'children', foot: 'feet', tooth: 'teeth', mouse: 'mice', goose: 'geese', sheep: 'sheep', deer: 'deer', ox: 'oxen', snowman: 'snowmen', postman: 'postmen' };
  const f = { leaf: 'leaves', knife: 'knives', wolf: 'wolves', shelf: 'shelves', wife: 'wives', loaf: 'loaves', calf: 'calves', half: 'halves', thief: 'thieves', life: 'lives' };
  gens('plurals-tricky', (q) => {
    const w = q.text;
    assert.equal(q.answer, irr[w] ?? f[w] ?? `${w.slice(0, -1)}ies`);
    if (!irr[w] && !f[w]) assert.match(w, /y$/);
  });
  const pairs = [['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['fast', 'slow'], ['happy', 'sad'], ['tall', 'short'], ['open', 'close'], ['day', 'night'], ['full', 'empty'], ['clean', 'dirty'], ['wet', 'dry'], ['early', 'late'], ['strong', 'weak'], ['hard', 'soft'], ['heavy', 'light'], ['young', 'old'], ['good', 'bad'], ['thick', 'thin'], ['buy', 'sell'], ['wide', 'narrow'], ['rich', 'poor'], ['near', 'far'], ['loud', 'quiet']];
  const partners = (w) => pairs.flatMap(([a, b]) => (a === w ? [b] : b === w ? [a] : []));
  gens('opposites', (q) => {
    assert.ok(partners(q.text).includes(q.answer));
    // no wrong word is also an opposite of the question word
    for (const c of q.choices) if (c.value !== q.answer) assert.ok(!partners(q.text).includes(c.value), q.text);
  });
});

test('present simple, continuous, past tenses recomputed', () => {
  const ones = ['He', 'She', 'Ali', 'Mei Ling', 'My mother'];
  gens('present-simple', (q) => {
    const s = q.text.split(' ____')[0];
    const third = q.choices.map((c) => c.value).find((v) => /(s|es)$/.test(v));
    if (ones.includes(s)) assert.equal(q.answer, third);
    else assert.ok(q.answer !== third && !q.answer.endsWith('ing'));
  });
  gens('present-continuous', (q) => {
    const s = q.text.replace('Look! ', '').split(' ____')[0];
    const be = s === 'I' ? 'am' : ['He', 'She', 'Ali', 'Mum'].includes(s) ? 'is' : 'are';
    assert.match(q.answer, new RegExp(`^${be} [a-z]+ing$`));
  });
  const dbl = ['stop', 'clap', 'plan', 'hop', 'skip', 'hug'];
  gens('past-regular', (q) => {
    const b = q.key.slice(3);
    const exp = dbl.includes(b) ? `${b}${b.at(-1)}ed` : /[^aeiou]y$/.test(b) ? `${b.slice(0, -1)}ied` : b.endsWith('e') ? `${b}d` : `${b}ed`;
    assert.equal(q.answer, exp);
  });
  const irr = { go: 'went', eat: 'ate', see: 'saw', come: 'came', take: 'took', give: 'gave', write: 'wrote', drink: 'drank', sit: 'sat', make: 'made', buy: 'bought', sleep: 'slept', swim: 'swam', bring: 'brought', find: 'found', tell: 'told', ride: 'rode', fall: 'fell', draw: 'drew', fly: 'flew', know: 'knew', run: 'ran', have: 'had', get: 'got' };
  gens('past-irregular', (q) => assert.equal(q.answer, irr[q.key.slice(3)]));
});

test('in/on/at for time, comparatives, superlatives', () => {
  gens('prep-time', (q) => {
    const t = q.key.slice(3);
    const on = /^(Wednesday|Saturday|Sunday|31 August|my birthday|Friday)/.test(t);
    const at = !on && /^(\d|noon|night|midnight|the weekend)/.test(t) && !/^2018/.test(t);
    assert.equal(q.answer, on ? 'on' : at ? 'at' : 'in', q.text);
  });
  const irr = { good: ['better', 'best'], bad: ['worse', 'worst'] };
  const long = ['beautiful', 'expensive', 'interesting', 'difficult'];
  const form = (a, sup) => {
    if (irr[a]) return irr[a][sup ? 1 : 0];
    if (long.includes(a)) return `${sup ? 'most' : 'more'} ${a}`;
    let r = a;
    if (/[^aeiou]y$/.test(a)) r = `${a.slice(0, -1)}i`;
    else if (['big', 'hot', 'thin'].includes(a)) r = a + a.at(-1);
    return r + (sup ? 'est' : 'er');
  };
  gens('comparatives', (q) => assert.equal(q.answer, form(q.key.slice(3), false)));
  gens('superlatives', (q) => assert.equal(q.answer, form(q.key.slice(3), true)));
});

test('spelling and punctuation levels', () => {
  gens('spelling-listen', (q) => assert.equal(q.say, q.answer));
  const us = ['color', 'favorite', 'neighbor', 'center', 'theater', 'behavior', 'harbor', 'flavor', 'honor', 'humor', 'liter', 'gray', 'traveled', 'jewelry'];
  gens('british-spelling', (q) => assert.ok(!us.includes(q.answer) && q.choices.some((c) => us.includes(c.value))));
  gens('end-marks', (q) => {
    const s = q.text;
    const exp = /^(Wow|Look|Happy|Hooray|What a)/.test(s) ? '!' : /^(What|Where|Who|How|Is|Can|Do)\b/.test(s) ? '?' : '.';
    assert.equal(q.answer, exp, s);
  });
  gens('capitals', (q) => {
    assert.match(q.answer, /^[A-Z].*[.?]$/);
    assert.ok(q.choices.every((c) => c.value === q.answer || c.value.toLowerCase() === q.answer.toLowerCase()));
  });
  gens('apostrophes', (q) => assert.ok(q.answer.includes("'") || q.answer.includes('its tail')));
  gens('mixed-tenses', (q) => {
    const t = q.text;
    const exp = /^(Yesterday|Last|Three days ago)/.test(t) ? 'past' : /^(Next|Tomorrow)/.test(t) ? 'future' : 'now';
    const kind = /^will/.test(q.answer) ? 'future' : /^(is|are) [a-z]+ing$/.test(q.answer) ? 'now' : 'past';
    assert.equal(kind, exp, t);
  });
});

test('reading levels: passage shown, stacked, enough questions', () => {
  for (const id of ['reading-1', 'reading-2', 'reading-3', 'reading-4']) {
    const keys = new Set();
    gens(id, (q) => { assert.ok(q.text.length > 40 && q.stack, id); keys.add(q.key); }, 800);
    assert.ok(keys.size >= 12, `${id}: ${keys.size} questions`);
  }
});

test('fill-in levels with fixed answers show a blank', () => {
  for (const id of ['family', 'pronouns', 'question-words', 'conjunctions', 'modals', 'future', 'adverbs']) {
    gens(id, (q) => assert.ok(q.text.includes('____'), id));
  }
});
