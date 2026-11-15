import { test } from 'node:test';
import assert from 'node:assert/strict';
import zh from '../js/subjects/zh.js';

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
    if (q.read || q.visual) return;
    assert.ok(q.say, q.key);
    for (const v of Object.values(q.prompt)) assert.ok(!v.includes(q.answer), q.key);
    assert.equal(q.text, undefined);
  });
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
