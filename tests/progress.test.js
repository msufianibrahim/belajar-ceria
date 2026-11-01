import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, topIndex, isOpen, openUpTo, pickReview } from '../js/progress.js';
import { fromJson } from '../js/storage.js';
import math from '../js/subjects/math.js';

const idx = (id) => math.levels.findIndex((l) => l.id === id);

test('a new child has only the first level open', () => {
  assert.equal(topIndex(fromJson({}), math), 0);
});

test('opening a level opens everything before it', () => {
  const s = fromJson({});
  openUpTo(s, math, 3);
  assert.equal(topIndex(s, math), 3);
});

test('opening never moves backwards', () => {
  const s = fromJson({});
  openUpTo(s, math, 5);
  openUpTo(s, math, 2);
  assert.equal(topIndex(s, math), 5);
});

test('opening past the last level stops at the last level', () => {
  const s = fromJson({});
  openUpTo(s, math, 99);
  assert.equal(topIndex(s, math), math.levels.length - 1);
});

test('progress is saved by level id, so inserting levels does not shift it', () => {
  const s = fromJson({});
  openUpTo(s, math, idx('math-add5'));
  assert.equal(s.frontier.math, 'math-add5');
});

test('old saves (index-based) keep the same level open after the new levels were added', () => {
  // Old order: count5, count10, compare, add5, add10, sub5. Index 3 = "Tambah hingga 5".
  const s = fromJson({ unlocked: { math: 3 } });
  assert.equal(s.unlocked, undefined, 'legacy field removed');
  assert.equal(s.frontier.math, 'math-add5');
  assert.equal(topIndex(s, math), idx('math-add5'));
});

test('migration leaves new-format saves alone', () => {
  const s = migrate({ frontier: { math: 'math-bond10' } });
  assert.deepEqual(s.frontier, { math: 'math-bond10' });
});

test('an unknown saved level id falls back to the first level', () => {
  assert.equal(topIndex(fromJson({ frontier: { math: 'math-removed' } }), math), 0);
});

const rec = (extra) => ({ best: 4, cleared: true, perfectDays: [], mastered: false, ...extra });
const review = (levels, today = 'd9') => pickReview(fromJson({ levels }), [math], today);

test('review: nothing to review when no level is passed', () => {
  assert.equal(review({}), null);
});

test('review: picks the passed level practised longest ago', () => {
  const r = review({
    'math-count5': rec({ lastPlayed: 'd5' }),
    'math-count10': rec({ lastPlayed: 'd2' }),
    'math-add5': rec({ lastPlayed: 'd7' }),
  });
  assert.deepEqual(r, { subjectId: 'math', levelIdx: idx('math-count10') });
});

test('review: skips mastered levels and levels already perfect today', () => {
  const r = review({
    'math-count5': rec({ mastered: true, lastPlayed: 'd1' }),
    'math-count10': rec({ perfectDays: ['d9'], lastPlayed: 'd9' }),
    'math-add5': rec({ lastPlayed: 'd8' }),
  });
  assert.deepEqual(r, { subjectId: 'math', levelIdx: idx('math-add5') });
});

test('review: skips levels not passed yet', () => {
  assert.equal(review({ 'math-count5': rec({ cleared: false, lastPlayed: 'd1' }) }), null);
});

import { answerMode } from '../js/progress.js';

test('answer mode: choices to learn, number pad once an add/subtract level is passed', () => {
  const add5 = math.levels[idx('math-add5')];
  const count5 = math.levels[idx('math-count5')];
  assert.equal(answerMode(fromJson({}), add5), 'choose');
  assert.equal(answerMode(fromJson({ levels: { 'math-add5': rec() } }), add5), 'type');
  assert.equal(answerMode(fromJson({ levels: { 'math-count5': rec() } }), count5), 'choose');
});

test('number pad is used on the addition and subtraction levels only', () => {
  assert.deepEqual(math.levels.filter((l) => l.typed).map((l) => l.id),
    ['math-add5', 'math-sub5', 'math-add10', 'math-sub10', 'math-add20', 'math-sub20']);
});

test('passing an add/subtract level opens the next one of the same skill, even past side levels', () => {
  const idx = (id) => math.levels.findIndex((l) => l.id === id);
  const passed = { best: 4, cleared: true, perfectDays: [], mastered: false };
  const s = fromJson({ frontier: { math: 'math-add5' }, levels: { 'math-add5': passed } });
  assert.ok(isOpen(s, math, idx('math-add10')));
  assert.ok(isOpen(s, math, idx('math-sub5')));
  assert.ok(!isOpen(s, math, idx('math-add20')));
  assert.ok(!isOpen(s, math, idx('math-bond10')));
  s.levels['math-add10'] = passed;
  assert.ok(isOpen(s, math, idx('math-add20')));
});

test('old 5-question best scores are doubled once for 10-question rounds', () => {
  const s = fromJson({ levels: { a: { best: 4, cleared: true, perfectDays: [], mastered: false } } });
  assert.equal(s.levels.a.best, 8);
  assert.equal(fromJson(JSON.parse(JSON.stringify(s))).levels.a.best, 8);
});
