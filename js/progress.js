// Which levels are open. Saved as the furthest-open level *id* per subject
// (state.frontier), not an index, so inserting new levels never shifts a
// child's progress. Every level up to the frontier is open.

// Level order before levels were saved by id. Only used to migrate old saves.
const LEGACY_ORDER = {
  math: ['math-count5', 'math-count10', 'math-compare', 'math-add5', 'math-add10', 'math-sub5'],
};

export function migrate(state) {
  state.frontier ??= {};
  if (state.unlocked) {
    for (const [subjectId, i] of Object.entries(state.unlocked)) {
      const id = LEGACY_ORDER[subjectId]?.[i];
      if (id && !state.frontier[subjectId]) state.frontier[subjectId] = id;
    }
    delete state.unlocked;
  }
  return state;
}

export function topIndex(state, subject) {
  return Math.max(0, subject.levels.findIndex((l) => l.id === state.frontier[subject.id]));
}

// Open every level up to index i (never closes levels).
export function openUpTo(state, subject, i) {
  const target = Math.min(i, subject.levels.length - 1);
  if (target > topIndex(state, subject)) state.frontier[subject.id] = subject.levels[target].id;
}

// "Ulang kaji": a passed but not yet mastered level, the one practised longest ago.
// Skips levels already perfect today, since a second perfect round today
// wouldn't count toward mastery.
export function pickReview(state, subjects, today) {
  let best = null;
  for (const subject of subjects) {
    subject.levels.forEach((l, levelIdx) => {
      const r = state.levels[l.id];
      if (!r?.cleared || r.mastered || r.perfectDays.includes(today)) return;
      const last = r.lastPlayed ?? '';
      if (!best || last < best.last) best = { subjectId: subject.id, levelIdx, last };
    });
  }
  return best && { subjectId: best.subjectId, levelIdx: best.levelIdx };
}
