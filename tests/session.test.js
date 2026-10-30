import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mustRest, addPlayTime, endRest } from '../js/session.js';

const MIN = 60000;
const T = Date.UTC(2026, 9, 31, 9); // a realistic "now"; 0 would mean "never played"
const settings = { sessionMinutes: 20, restMinutes: 60 };
const fresh = () => ({ usedMs: 0, lastActive: 0, restUntil: 0 });

test('can play while under the limit', () => {
  const s = fresh();
  addPlayTime(s, 19 * MIN, T + 1000);
  assert.equal(mustRest(s, settings, T + 2000), false);
});

test('hitting the limit starts a rest period', () => {
  const s = fresh();
  addPlayTime(s, 20 * MIN, T + 1000);
  assert.equal(mustRest(s, settings, T + 2000), true);
  assert.equal(s.restUntil, T + 2000 + 60 * MIN);
  assert.equal(s.usedMs, 0);
});

test('still resting until the rest period ends', () => {
  const s = fresh();
  addPlayTime(s, 20 * MIN, T + 0);
  mustRest(s, settings, T + 0);
  assert.equal(mustRest(s, settings, T + 59 * MIN), true);
  assert.equal(mustRest(s, settings, T + 60 * MIN), false);
  assert.equal(s.restUntil, 0, 'rest cleared once over');
});

test('a natural break as long as the rest period resets the clock', () => {
  const s = fresh();
  addPlayTime(s, 15 * MIN, T + 0);
  assert.equal(mustRest(s, settings, T + 61 * MIN), false);
  assert.equal(s.usedMs, 0);
});

test('a short break does not reset the clock', () => {
  const s = fresh();
  addPlayTime(s, 15 * MIN, T + 0);
  mustRest(s, settings, T + 10 * MIN);
  assert.equal(s.usedMs, 15 * MIN);
});

test('parent can end the rest early', () => {
  const s = fresh();
  addPlayTime(s, 20 * MIN, T + 0);
  mustRest(s, settings, T + 0);
  endRest(s);
  assert.equal(mustRest(s, settings, T + 1), false);
});

test('changing the limit applies immediately', () => {
  const s = fresh();
  addPlayTime(s, 12 * MIN, T + 0);
  assert.equal(mustRest(s, { ...settings, sessionMinutes: 10 }, T + 1), true);
});
