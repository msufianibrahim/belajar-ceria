import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionLang, zhCount, py } from '../js/lang.js';
import { fromJson } from '../js/storage.js';

const mastered = { levels: { lv: { best: 5, cleared: true, perfectDays: ['a', 'b', 'c'], mastered: true } } };

test('by default, new levels use English and mastered levels use Mandarin', () => {
  const s = fromJson(mastered);
  assert.equal(questionLang(s, 'other'), 'en');
  assert.equal(questionLang(s, 'lv'), 'zh');
});

test('Mandarin off: mastered levels use the base language', () => {
  const s = fromJson({ ...mastered, settings: { mandarin: 'off' } });
  assert.equal(questionLang(s, 'lv'), 'en');
});

test('Mandarin on all levels', () => {
  const s = fromJson({ settings: { mandarin: 'all' } });
  assert.equal(questionLang(s, 'other'), 'zh');
});

test('BM as the base language', () => {
  const s = fromJson({ ...mastered, settings: { lang: 'ms' } });
  assert.equal(questionLang(s, 'other'), 'ms');
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

test('old saves switch to English once, then keep the parent choice', () => {
  const old = fromJson({ settings: { mathLang: 'ms' } });
  assert.equal(old.settings.lang, 'en');
  assert.ok(!('mathLang' in old.settings));
  old.settings.lang = 'ms';
  assert.equal(fromJson(JSON.parse(JSON.stringify(old))).settings.lang, 'ms');
});

test('a BM choice made after the English switch is kept when renaming to lang', () => {
  assert.equal(fromJson({ settings: { mathLang: 'ms', langV: 1 } }).settings.lang, 'ms');
});
