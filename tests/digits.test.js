import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recognize, toCloud, _templates } from '../js/digits.js';

// Templates redrawn wobbly, slanted and squashed, like a child's writing.
function distort(strokes, seed) {
  let x = seed;
  const r = (a, b) => { x = (x * 16807) % 2147483647; return a + ((x % 1000) / 1000) * (b - a); };
  const sx = r(0.75, 1.25), sk = r(-0.2, 0.2), th = r(-0.12, 0.12);
  return strokes.map((s) => s.flatMap((p, i) => {
    const q = s[i + 1] ?? p;
    return [0, 0.33, 0.66].map((t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
  }).map(([px, py]) => {
    const X = (px + sk * py) * sx + r(-2, 2), Y = py + r(-2, 2);
    return [X * Math.cos(th) - Y * Math.sin(th), X * Math.sin(th) + Y * Math.cos(th)];
  }));
}

test('every digit template is read back as itself', () => {
  for (const [d, variants] of Object.entries(_templates)) for (const v of variants) assert.equal(recognize(v)?.digit, Number(d));
});

test('reads at least 9 in 10 of wobbly, slanted digits', () => {
  let ok = 0, n = 0;
  for (const [d, variants] of Object.entries(_templates)) for (const v of variants) for (let k = 1; k <= 30; k++) {
    n++;
    if (recognize(distort(v, k * 7919 + Number(d)))?.digit === Number(d)) ok++;
  }
  assert.ok(ok / n >= 0.9, `${ok}/${n}`);
});

test('an empty box or a single dot is not a digit', () => {
  assert.equal(recognize([]), null);
  assert.equal(recognize([[[5, 5]]]), null);
});

test('his own writing, once learnt, is read as the digit he meant', () => {
  // An unusual 4: an open box with a long tail, drawn in one stroke.
  const odd = [[[20, 0], [20, 50], [80, 50], [80, 0], [80, 100]]];
  const learnt = { 4: [toCloud(odd)] };
  assert.equal(recognize(distort(odd, 99), learnt)?.digit, 4);
  // Learnt templates don't break the standard digits.
  for (const [d, variants] of Object.entries(_templates)) if (d !== '4') assert.equal(recognize(variants[0], learnt)?.digit, Number(d));
});
