import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settleRound, COINS, MASTERY_DAYS, medalCount } from '../js/rewards.js';

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

const typedLevel = { id: 'tl', typed: true, sticker: { id: 'st2', e: '⭐' } };

test('typed levels: a perfect round with choices does not count toward mastery', () => {
  const s = fresh();
  const r = settleRound(s, typedLevel, 5, 5, 'd1', { typed: false });
  assert.deepEqual(s.levels.tl.perfectDays, []);
  assert.equal(r.needsTyping, true);
});

test('typed levels: a perfect typed round counts toward mastery', () => {
  const s = fresh();
  const r = settleRound(s, typedLevel, 5, 5, 'd1', { typed: true });
  assert.deepEqual(s.levels.tl.perfectDays, ['d1']);
  assert.equal(r.needsTyping, false);
});

test('daily practice: 2 rounds of a chosen topic pay a fixed bonus once a day, whatever the score', () => {
  const s = { ...fresh(), settings: { practice: [level.id] } };
  settleRound(s, level, 5, 5, 'd1');                   // first clear (10)
  const r2 = settleRound(s, level, 2, 5, 'd1');
  assert.equal(r2.practice.paid, true);
  assert.equal(r2.coins, COINS.practice);
  const r3 = settleRound(s, level, 2, 5, 'd1');
  assert.equal(r3.coins, 0, 'no more practice coins today');
  settleRound(s, level, 2, 5, 'd2');
  assert.equal(settleRound(s, level, 2, 5, 'd2').coins, COINS.practice, 'again the next day');
});

test('rounds on a topic that is not daily practice never pay practice coins', () => {
  const s = { ...fresh(), settings: { practice: ['other'] } };
  settleRound(s, level, 5, 5, 'd1');
  for (let i = 0; i < 5; i++) assert.equal(settleRound(s, level, 5, 5, 'd1').coins, 0);
});

test('medals at 10, 20, 30 finished rounds, any score, no coins', () => {
  const s = fresh();
  const medals = [];
  for (let i = 1; i <= 30; i++) {
    const r = settleRound(s, level, 1, 5, 'd1');
    if (i > 1) assert.equal(r.coins, 0); // (the first round is a new best)
    if (r.medal) medals.push([i, r.medal]);
  }
  assert.deepEqual(medals, [[10, '🥉'], [20, '🥈'], [30, '🥇']]);
  assert.equal(medalCount(s.levels[level.id].rounds), 3);
});

test('10-question rounds: pass at 8, 9 or 10 counts toward mastery', () => {
  const s = fresh();
  assert.equal(settleRound(s, level, 7, 10, 'd1').passed, false);
  assert.equal(settleRound(s, level, 8, 10, 'd1').passed, true);
  assert.equal(settleRound(s, level, 8, 10, 'd1').masteryProgress, 0);
  assert.equal(settleRound(s, level, 9, 10, 'd1').masteryProgress, 1);
  settleRound(s, level, 10, 10, 'd2');
  assert.equal(settleRound(s, level, 9, 10, 'd3').justMastered, true);
});
