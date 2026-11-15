import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText } from '../js/ocr.js';

test('OCR text becomes one line of words; words split over lines are joined', () => {
  assert.equal(cleanText('Bola itu ber-\nwarna merah.\n\nAli  main | bola.\n', 'ms'), 'Bola itu berwarna merah. Ali main bola.');
});

test('Mandarin loses the spaces OCR puts between characters', () => {
  assert.equal(cleanText('我 有 一 个\n红 色 的 球 。', 'zh'), '我有一个红色的球。');
});
