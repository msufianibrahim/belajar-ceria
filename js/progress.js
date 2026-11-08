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
  // Rounds went from 5 to 10 questions: scale old best scores so "beat your best" stays fair.
  for (const rec of Object.values(state.levels ?? {})) {
    if (!rec.of) {
      rec.best = (rec.best ?? 0) * 2;
      rec.of = 10;
    }
  }
  // `mathLang` became `lang`. Saves from before langV switch to English (he learns Maths in English).
  const st = state.settings;
  if (st && 'mathLang' in st) {
    st.lang = st.langV ? st.mathLang : 'en';
    delete st.mathLang;
    delete st.langV;
  }
  return state;
}

export function topIndex(state, subject) {
  return Math.max(0, subject.levels.findIndex((l) => l.id === state.frontier[subject.id]));
}

// A level is open if it's within the frontier, or if the level it `needs` (the previous
// step of the same skill, e.g. Add within 5 -> Add within 10) is passed. So side levels
// like number pairs don't block the main add/subtract path.
export function isOpen(state, subject, i) {
  const needs = subject.levels[i].needs;
  return i <= topIndex(state, subject) || Boolean(needs && state.levels[needs]?.cleared);
}

// "His level" for daily practice, picked automatically: the two furthest open levels
// on the main path that aren't mastered yet. Main path = levels the placement quiz
// probes, or that follow on from another (`needs`); side games (bonds, counting back) are left out.
export function autoPractice(state, subject, count = 2) {
  return subject.levels
    .filter((l, i) => isOpen(state, subject, i) && !state.levels[l.id]?.mastered && (l.probe !== false || l.needs))
    .slice(-count)
    .map((l) => l.id);
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

// Choices to learn, number pad to master: once an add/subtract level is passed,
// the child types the answer instead of picking it.
export const answerMode = (state, level) => (level.typed && state.levels[level.id]?.cleared ? 'type' : 'choose');
