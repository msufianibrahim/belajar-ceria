import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokens, follow } from '../js/follow.js';

const run = (page, heard, lang = 'en-GB') => follow(tokens(page, lang), tokens(heard, lang));

test('words are split, lower-cased and stripped of punctuation; Mandarin goes by character', () => {
  assert.deepEqual(tokens('Ali, ada bola!', 'ms-MY'), ['ali', 'ada', 'bola']);
  assert.deepEqual(tokens('我爱妈妈。', 'zh-CN'), ['我', '爱', '妈', '妈']);
});

test('reading in order marks every word read', () => {
  const r = run('The cat sat on the mat.', 'the cat sat on the mat');
  assert.deepEqual(r.state, ['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
  assert.equal(r.next, 6);
});

test('a skipped word is marked, and reading carries on after it', () => {
  const r = run('The cat sat on the mat.', 'the cat on the mat');
  assert.deepEqual(r.state, ['ok', 'ok', 'skipped', 'ok', 'ok', 'ok']);
});

test('a misheard word does not move ahead; a repeated word does not jump to its next copy far away', () => {
  assert.deepEqual(run('Saya suka makan nasi', 'saya buka').state, ['ok', null, null, null]);
  assert.equal(run('the dog and the cat and the bird', 'the').next, 1);
});

test('one letter off in a longer word still counts; short words must match exactly', () => {
  assert.deepEqual(run('Kucing tidur', 'kucin tidur', 'ms-MY').state, ['ok', 'ok']);
  assert.deepEqual(run('cat sat', 'bat sat').state, ['skipped', 'ok']);
});

test('Mandarin follows character by character', () => {
  assert.deepEqual(run('我爱妈妈', '我爱妈', 'zh-CN').state, ['ok', 'ok', 'ok', null]);
});

test('a word sounded out by syllables counts as read', () => {
  const page = 'Bola itu berwarna merah. Ali main bola dengan kawan di padang.';
  assert.deepEqual(run(page, 'bola itu ber war na merah ali main bola de ngan ka wan di pa dang', 'ms-MY').state, Array(11).fill('ok'));
  // Halfway through sounding out, the word isn't read yet.
  assert.deepEqual(run('berwarna merah', 'ber war', 'ms-MY').state, [null, null]);
});
