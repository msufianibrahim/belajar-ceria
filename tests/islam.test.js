import { test } from 'node:test';
import assert from 'node:assert/strict';
import islam from '../js/subjects/islam.js';
import { makeRound } from '../js/subjects/util.js';

const POOL = [...'⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🏓🏸🏒🏑🥍🏏🪃🥅⛳🏹🎣🤿🥊🥋🎽🛷'.matchAll(/\p{Extended_Pictographic}/gu)].map((m) => m[0])
  .concat(['⛸️', '🥌', '💚', '💙', '💜', '🧡', '💛', '🤍', '🤎', '🏅', '🎖️']);
const many = (fn) => { for (const l of islam.levels) for (let n = 0; n < 2000; n++) fn(l.gen(n % 10), l); };
// prompt -> answer, seen across many draws (the same prompt must always have the same answer).
const facts = {};
many((q) => { (facts[q.prompt.ms] ??= new Set()).add(q.answer); });
const one = (prompt) => { assert.ok(facts[prompt], prompt); assert.equal(facts[prompt].size, 1, prompt); return [...facts[prompt]][0]; };

test('subject shape, ids, stickers and years', () => {
  assert.equal(islam.id, 'islam');
  assert.equal(islam.lang, 'ms');
  assert.deepEqual(islam.name, { en: 'Islamic Studies', ms: 'Asas Islam' });
  const ids = islam.levels.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^islam-[a-z0-9-]+$/);
  assert.equal(new Set(islam.levels.map((l) => l.sticker.id)).size, ids.length);
  const em = islam.levels.map((l) => l.sticker.e);
  assert.equal(new Set(em).size, em.length);
  for (const e of em) assert.ok(POOL.includes(e), e);
  for (const l of islam.levels) assert.ok(l.title.en && l.title.ms && l.icon, l.id);
  const years = islam.levels.map((l) => l.year ?? 0);
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  assert.ok(years[0] === 0 && years.at(-1) === 6);
  for (const y of [1, 2, 3, 4, 5, 6]) assert.ok(years.filter((x) => x === y).length >= 5, `Tahun ${y}`);
});

test('every question has a valid shape and one right answer', () => {
  many((q, l) => {
    assert.ok(q.key && q.prompt.ms, l.id);
    const vals = q.choices.map((c) => c.value);
    assert.equal(q.choices.length, 3, l.id);
    assert.equal(new Set(vals).size, 3, `${l.id} ${q.key}`);
    assert.equal(vals.filter((v) => v === q.answer).length, 1, l.id);
    for (const c of q.choices) assert.equal(c.label, c.value);
  });
});

test('a "which one is" question never offers two right answers', () => {
  // For pick-the-good prompts, every answer seen for that prompt is right, so no distractor may be one of them.
  many((q, l) => {
    const right = facts[q.prompt.ms];
    for (const v of q.choices.map((c) => c.value)) if (v !== q.answer) assert.ok(!right.has(v), `${l.id}: ${q.prompt.ms} ${v}`);
  });
});

test('a round has 10 questions, mostly different', () => {
  for (const l of islam.levels) {
    const keys = makeRound(l.gen, 10).map((q) => q.key);
    assert.equal(keys.length, 10, l.id);
    assert.ok(new Set(keys).size >= 8, l.id);
  }
});

test('standard school facts', () => {
  assert.equal(one('Solat Subuh berapa rakaat?'), '2');
  assert.equal(one('Solat Zuhur berapa rakaat?'), '4');
  assert.equal(one('Solat Asar berapa rakaat?'), '4');
  assert.equal(one('Solat Maghrib berapa rakaat?'), '3');
  assert.equal(one('Solat Isyak berapa rakaat?'), '4');
  assert.equal(one('Jumlah rakaat solat fardu sehari semalam?'), String(2 + 4 + 4 + 3 + 4));
  assert.equal(one('Berapakah bilangan Rukun Islam?'), '5');
  assert.equal(one('Berapakah bilangan Rukun Iman?'), '6');
  assert.equal(one('Rukun Islam yang pertama ialah?'), 'Mengucap dua kalimah syahadah');
  assert.equal(one('Rukun Islam yang kelima ialah?'), 'Menunaikan haji bagi yang mampu');
  assert.equal(one('Rukun Iman yang keenam ialah?'), "Beriman kepada qada' dan qadar");
  assert.equal(one('Fardu wuduk ada berapa?'), '6');
  assert.equal(one('Fardu wuduk yang pertama ialah?'), 'Niat');
  assert.equal(one('Rukun solat ada berapa?'), '13');
  assert.equal(one('Berapakah bilangan malaikat yang wajib diketahui?'), '10');
  assert.equal(one('Malaikat yang bertugas menyampaikan wahyu ialah?'), 'Jibril');
  assert.equal(one('Kitab Taurat diturunkan kepada?'), 'Nabi Musa');
  assert.equal(one('Kitab Zabur diturunkan kepada?'), 'Nabi Daud');
  assert.equal(one('Kitab Injil diturunkan kepada?'), 'Nabi Isa');
  assert.equal(one('Berapakah bilangan rasul yang wajib diketahui?'), '25');
  assert.equal(one('Siapakah rasul yang pertama?'), 'Nabi Adam');
  assert.equal(one('Rasul selepas Nabi Adam ialah?'), 'Nabi Idris');
  assert.equal(one('Di manakah Nabi Muhammad SAW menerima wahyu pertama?'), "Gua Hira'");
  assert.equal(one('Nabi Muhammad SAW berhijrah dari Makkah ke?'), 'Madinah');
  assert.equal(one('Khalifah ar-Rasyidin yang pertama ialah?'), 'Abu Bakar as-Siddiq');
  assert.equal(one('Khalifah ar-Rasyidin yang keempat ialah?'), 'Ali bin Abi Talib');
  assert.equal(one('Berapakah bilangan surah dalam Al-Quran?'), '114');
  assert.equal(one('Berapakah golongan asnaf?'), '8');
  assert.equal(one('Anjing dan babi ialah najis jenis apa?'), 'Mughallazah');
  assert.equal(one('Apakah maksud Ar-Rahman?'), 'Maha Pemurah');
});

test('no people or angels drawn: level icons and questions carry no person emoji', () => {
  const person = /\p{Emoji_Modifier_Base}|[\u{1F466}-\u{1F469}\u{1F474}-\u{1F477}\u{1F47C}\u{1F9D1}-\u{1F9DD}]/u;
  for (const l of islam.levels) assert.ok(!person.test(l.icon), l.id);
  many((q, l) => assert.ok(!q.visual && !q.text, l.id));
});
