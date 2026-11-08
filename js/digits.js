// Handwritten digit recognition for the whiteboard answer boxes. Offline, no model:
// the $P point-cloud recognizer (Vatavu, Anthony & Wobbrock 2012) against hand-made
// templates of how children write each digit. Point clouds ignore stroke order and
// direction, so a 0 started at the bottom or a 4 drawn in one stroke still match.

const N = 32;

// --- templates: strokes of [x, y] points on a 100 × 100 grid (y down) ---
const arc = (cx, cy, rx, ry, from, to, n = 16) =>
  Array.from({ length: n + 1 }, (_, k) => {
    const t = ((from + ((to - from) * k) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
const line = (...pts) => pts;

const TEMPLATES = {
  0: [[arc(50, 50, 30, 48, -90, 270)], [arc(50, 50, 22, 48, -90, 270)]],
  1: [
    [line([50, 0], [50, 100])],
    [line([30, 22], [52, 0], [52, 100])],
    [line([30, 22], [52, 0], [52, 100]), line([30, 100], [74, 100])],
  ],
  2: [
    [[...arc(50, 28, 30, 26, 200, 360), [78, 40], [20, 100], [84, 100]]],
    [[...arc(50, 30, 32, 28, 180, 380), [20, 100], [84, 100]]],
  ],
  3: [
    [[...arc(48, 25, 28, 24, 200, 450), ...arc(48, 74, 32, 26, -90, 160)]],
    [[[20, 0], [80, 0], [45, 40], ...arc(48, 70, 32, 30, -80, 160)]],
  ],
  4: [
    [line([62, 0], [12, 66], [90, 66]), line([66, 30], [66, 100])],
    [line([30, 0], [24, 58], [86, 58]), line([72, 0], [72, 100])],
    [line([62, 0], [12, 66], [90, 66], [66, 66], [66, 30], [66, 100])],
  ],
  5: [
    [line([78, 0], [28, 0]), [[28, 0], [24, 44], ...arc(48, 68, 32, 30, -120, 150)]],
    [[[78, 0], [28, 0], [24, 44], ...arc(48, 68, 32, 30, -120, 150)]],
  ],
  6: [
    [[[72, 0], ...arc(72, 62, 50, 62, 245, 180, 8), ...arc(50, 70, 28, 30, 180, 540)]],
    [[[66, 0], [26, 56], ...arc(50, 72, 26, 28, 180, 540)]],
  ],
  7: [
    [line([14, 0], [86, 0], [38, 100])],
    [line([14, 0], [86, 0], [38, 100]), line([36, 50], [80, 50])],
    [line([14, 14], [14, 0], [86, 0], [50, 100])],
  ],
  8: [
    [[...arc(50, 26, 24, 24, 90, -270), ...arc(50, 74, 30, 26, -90, 270)]],
    [arc(50, 26, 24, 24, 0, 360), arc(50, 74, 30, 26, 0, 360)],
  ],
  9: [
    [[...arc(48, 28, 28, 28, 0, -360), [76, 28], [72, 100]]],
    [[...arc(48, 28, 28, 28, 0, -360), [76, 28], ...arc(52, 72, 24, 28, 0, 120, 6)]],
  ],
};

// --- $P ---
const flatten = (strokes) => strokes.flatMap((s, id) => s.map(([x, y]) => ({ x, y, id })));

function resample(points, n) {
  const path = points.reduce((len, p, i) => (i && p.id === points[i - 1].id ? len + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : len), 0);
  if (!path) return Array.from({ length: n }, () => ({ ...points[0] }));
  const step = path / (n - 1);
  const out = [{ ...points[0] }];
  const pts = points.map((p) => ({ ...p }));
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      out.push(q);
      pts.splice(i, 0, q);
      acc = 0;
    } else acc += d;
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function normalize(strokes) {
  let pts = resample(flatten(strokes.filter((s) => s.length)), N);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  pts = pts.map((p) => ({ x: (p.x - Math.min(...xs)) / size, y: (p.y - Math.min(...ys)) / size }));
  const cx = pts.reduce((s, p) => s + p.x, 0) / N, cy = pts.reduce((s, p) => s + p.y, 0) / N;
  return pts.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function cloudDistance(a, b, start) {
  const matched = new Array(N).fill(false);
  let sum = 0;
  let i = start;
  do {
    let best = Infinity, index = -1;
    for (let j = 0; j < N; j++) {
      if (matched[j]) continue;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < best) { best = d; index = j; }
    }
    matched[index] = true;
    sum += (1 - ((i - start + N) % N) / N) * best;
    i = (i + 1) % N;
  } while (i !== start);
  return sum;
}

function greedyMatch(a, b) {
  const step = Math.floor(Math.sqrt(N));
  let min = Infinity;
  for (let i = 0; i < N; i += step) min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  return min;
}

const CLOUDS = Object.entries(TEMPLATES).flatMap(([digit, variants]) => variants.map((strokes) => ({ digit: Number(digit), cloud: normalize(strokes) })));

// Below this a scribble is too far from every digit to guess.
const MAX_DISTANCE = 2;

// strokes: [[[x, y], ...], ...] in any units. Returns { digit, distance } or null when unsure.
export function recognize(strokes) {
  if (!strokes.some((s) => s.length > 1 || strokes.length > 1)) return null;
  const cloud = normalize(strokes);
  let best = null;
  for (const t of CLOUDS) {
    const d = greedyMatch(cloud, t.cloud);
    if (!best || d < best.distance) best = { digit: t.digit, distance: d };
  }
  return best && best.distance <= MAX_DISTANCE ? best : null;
}

export const _templates = TEMPLATES; // for tests
