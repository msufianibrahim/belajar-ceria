// Follow-along for the reading companion: lines up what speech recognition heard with
// the words on the page. Pure functions, so the mic test page and the app share them.

// Words of a page. Mandarin has no spaces: each Han character is one "word".
export function tokens(text, lang) {
  if (lang.startsWith('zh') || lang.startsWith('cmn')) return [...text].filter((ch) => /\p{Script=Han}/u.test(ch));
  return text.split(/\s+/).map(norm).filter(Boolean);
}

// Lower case, letters and digits only ("Ali," -> "ali", "it's" -> "its").
export const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Children's speech is recognised loosely: one wrong letter is fine in words of 5+ letters.
function close(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// How far a heard word may jump ahead on the page (he skips a word, or recognition drops one).
const LOOKAHEAD = 3;

// expected: page tokens; heard: recognised tokens in order.
// Returns one state per page word: 'ok' (read), 'skipped' (passed over), or null (not reached),
// and `next`, the index of the word he should read next.
export function follow(expected, heard) {
  const state = expected.map(() => null);
  let next = 0;
  for (const h of heard) {
    for (let k = next; k < Math.min(expected.length, next + LOOKAHEAD + 1); k++) {
      if (!close(h, expected[k])) continue;
      for (let s = next; s < k; s++) state[s] = 'skipped';
      state[k] = 'ok';
      next = k + 1;
      break;
    }
  }
  return { state, next };
}
