import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionLang, zhCount, py } from '../js/lang.js';
import { fromJson } from '../js/storage.js';

const mastered = { levels: { lv: { best: 5, cleared: true, perfectDays: ['a', 'b', 'c'], mastered: true } } };

test('by default, new levels use BM and mastered levels use Mandarin', () => {
  const s = fromJson(mastered);
  assert.equal(questionLang(s, 'other'), 'ms');
  assert.equal(questionLang(s, 'lv'), 'zh');
});

test('Mandarin off: mastered levels use the base language', () => {
  const s = fromJson({ ...mastered, settings: { mandarin: 'off' } });
  assert.equal(questionLang(s, 'lv'), 'ms');
});

test('Mandarin on all levels', () => {
  const s = fromJson({ settings: { mandarin: 'all' } });
  assert.equal(questionLang(s, 'other'), 'zh');
});

test('English as the base language', () => {
  const s = fromJson({ ...mastered, settings: { mathLang: 'en' } });
  assert.equal(questionLang(s, 'other'), 'en');
  assert.equal(questionLang(s, 'lv'), 'zh');
});

test('2 before a measure word is 两 (liǎng), not 二', () => {
  assert.deepEqual(zhCount(2), ['两', 'liǎng']);
  assert.deepEqual(zhCount(8), ['8', 'bā']);
});

test('pinyin numbers go up to 20', () => {
  assert.equal(py(10), 'shí');
  assert.equal(py(13), 'shísān');
  assert.equal(py(20), 'èrshí');
});
