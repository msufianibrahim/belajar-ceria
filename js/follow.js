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
  for (let i = 0; i < heard.length;) {
    const m = matchAt(expected, heard, i, next);
    if (!m) { i++; continue; }
    for (let s = next; s < m.k; s++) state[s] = 'skipped';
    state[m.k] = 'ok';
    next = m.k + 1;
    i += m.len;
  }
  return { state, next };
}

// Sounding a word out by syllables ("ber war na") is heard as separate pieces:
// up to this many heard pieces may join into one page word.
const MAX_PIECES = 4;

// The nearest page word (from `next`) that heard[i], or heard[i..] joined, reads as.
function matchAt(expected, heard, i, next) {
  for (let k = next; k < Math.min(expected.length, next + LOOKAHEAD + 1); k++) {
    let joined = '';
    for (let len = 1; len <= MAX_PIECES && i + len <= heard.length; len++) {
      joined += heard[i + len - 1];
      if (close(joined, expected[k])) return { k, len };
      if (joined.length > expected[k].length + 1) break;
    }
  }
  return null;
}
