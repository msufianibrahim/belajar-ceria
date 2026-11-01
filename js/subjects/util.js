export const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `count` numeric choices in [lo, hi] including `answer`, with distractors near the answer.
export function numberChoices(answer, lo, hi, count = 3) {
  const pool = [];
  for (let v = lo; v <= hi; v++) if (v !== answer) pool.push(v);
  const near = shuffle(pool).sort((x, y) => Math.abs(x - answer) - Math.abs(y - answer));
  const distractors = shuffle(near.slice(0, count + 1)).slice(0, count - 1);
  return shuffle([answer, ...distractors]).map((v) => ({ label: String(v), value: v }));
}

// n questions from a generator, avoiding repeats within the round where possible.
// gen gets the question's position (0..n-1) so a round can get harder as it goes.
export function makeRound(gen, n) {
  const qs = [];
  const seen = new Set();
  for (let tries = 0; qs.length < n && tries < 200; tries++) {
    const q = gen(qs.length);
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    qs.push(q);
  }
  while (qs.length < n) qs.push(gen(qs.length));
  return qs;
}
