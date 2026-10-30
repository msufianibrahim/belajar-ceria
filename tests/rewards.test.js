import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settleRound, COINS, MASTERY_DAYS } from '../js/rewards.js';

const level = { id: 'lv', sticker: { id: 'st', e: '⭐' } };
const fresh = () => ({ coins: 0, stickers: [], levels: {} });

test('passing needs 4 out of 5', () => {
  assert.equal(settleRound(fresh(), level, 3, 5, 'd1').passed, false);
  assert.equal(settleRound(fresh(), level, 4, 5, 'd1').passed, true);
});

test('first pass gives coins and sticker', () => {
  const s = fresh();
  const r = settleRound(s, level, 4, 5, 'd1');
  assert.equal(r.coins, COINS.firstClear);
  assert.equal(r.sticker.id, 'st');
  assert.deepEqual(s.stickers, ['st']);
});

test('replaying with the same score earns nothing', () => {
  const s = fresh();
  settleRound(s, level, 4, 5, 'd1');
  const r = settleRound(s, level, 4, 5, 'd1');
  assert.equal(r.coins, 0);
  assert.equal(s.coins, COINS.firstClear);
});

test('beating your best earns a small bonus once', () => {
  const s = fresh();
  settleRound(s, level, 4, 5, 'd1');
  assert.equal(settleRound(s, level, 5, 5, 'd1').coins, COINS.newBest);
  assert.equal(settleRound(s, level, 5, 5, 'd1').coins, 0);
});

test('failing does not give the sticker', () => {
  const s = fresh();
  const r = settleRound(s, level, 3, 5, 'd1');
  assert.equal(r.passed, false);
  assert.equal(r.sticker, null);
  assert.deepEqual(s.stickers, []);
});

test('mastery needs perfect rounds on different days', () => {
  const s = fresh();
  settleRound(s, level, 5, 5, 'd1');
  settleRound(s, level, 5, 5, 'd1');
  assert.equal(s.levels.lv.perfectDays.length, 1, 'same day counts once');
  settleRound(s, level, 5, 5, 'd2');
  const r = settleRound(s, level, 5, 5, 'd3');
  assert.equal(MASTERY_DAYS, 3);
  assert.equal(r.justMastered, true);
  assert.equal(r.coins, COINS.mastery);
  assert.equal(settleRound(s, level, 5, 5, 'd4').coins, 0, 'nothing more after mastery');
});

test('each round records the day it was played', () => {
  const s = fresh();
  settleRound(s, level, 2, 5, 'd1');
  settleRound(s, level, 2, 5, 'd2');
  assert.equal(s.levels.lv.lastPlayed, 'd2');
});
