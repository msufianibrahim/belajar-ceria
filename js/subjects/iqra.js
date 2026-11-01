import { pick, shuffle } from './util.js';

// Iqra, in the book's teaching order (own exercises; the books are copyrighted).
// He hears a sound and picks the written syllable. Wrong choices are the same letter
// with a different mark, or a look-alike letter with the same mark, so he has to read
// the marks, not just spot the letter.
//
// Sound: the tablet's Arabic voice. Checked on his tablet (sound-test.html):
// - it ignores the small marks (kasrah berdiri, dhammah terbalik), so `say` spells them out;
// - with fathah it says خ ر غ light ("kha") where Iqra teaches heavy ("kho"), so those
//   are never the spoken answer with fathah;
// - some words come out wrong (كَلَ -> "kalla"): only use word shapes that were checked.

const F = 'َ', K = 'ِ', D = 'ُ', SUK = 'ْ';
const K_BERDIRI = 'ٖ', D_TERBALIK = 'ٗ', YA_TANPA_TITIK = 'ى';

// Alif carries hamzah when it has a vowel.
const LETTERS = 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن و ه ي'.split(' ');
const HEAVY_WITH_FATHAH = new Set(['خ', 'ر', 'غ']);

const LOOK_ALIKE = [
  ['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'],
  ['ص', 'ض'], ['ط', 'ظ'], ['ع', 'غ'], ['ف', 'ق'],
];
// A letter that looks like `l` (or any other letter if it has no look-alike), never one in `not`.
function lookAlike(l, not = []) {
  const ok = (x) => x !== l && !not.includes(x);
  const group = LOOK_ALIKE.find((g) => g.includes(l))?.filter(ok);
  return pick(group?.length ? group : LETTERS.filter(ok));
}

// The hamzah seat changes with kasrah: إِ, not أِ.
const seat = (l, mark) => (l === 'أ' && mark === K ? 'إ' : l);
const syl = (l, mark) => seat(l, mark) + mark;

const PROMPT = { en: 'Which one is this?', ms: 'Yang mana bunyi ini?' };

// shown: the answer as written in the book; say: what the voice reads; wrong: 2 distractors.
function question(shown, say, wrong) {
  const choices = shuffle([shown, ...wrong]).map((v) => ({ label: `<span class="ar">${v}</span>`, value: v }));
  return { key: shown, prompt: PROMPT, sound: say, choices, answer: shown, wide: false };
}

// Letters that can be the answer (spoken) with this mark.
const speakable = (mark) => LETTERS.filter((l) => !(mark === F && HEAVY_WITH_FATHAH.has(l)));

// Short vowel, e.g. بِ. Wrong: same letter with another mark it already knows, and a look-alike.
function short(mark, others) {
  const l = pick(speakable(mark));
  const s = syl(l, mark);
  return question(s, s, [syl(l, pick(others)), syl(lookAlike(l), mark)]);
}

// Long vowel with a letter after it, e.g. بِيْ. Wrong: the short one, and a look-alike long one.
function long(mark, tail, sayTail = tail) {
  const vowelLetters = ['و', 'ي'];
  const l = pick(LETTERS.filter((x) => !vowelLetters.includes(x)));
  const other = lookAlike(l, vowelLetters);
  const shown = syl(l, mark) + tail;
  return question(shown, syl(l, mark) + sayTail, [syl(l, mark), syl(other, mark) + tail]);
}

// Small long-vowel mark on ha, as in the Quran: after kasrah بِهٖ (bi-hii),
// after fathah/dhammah لَهٗ (la-huu). Wrong: the same word with a short vowel on ha,
// and the word with a look-alike first letter.
const HA_FIRST = ['ب', 'ل', 'ف', 'م', 'ن', 'ك', 'ع', 'س', 'ت', 'ق'];
function smallMark(mark) {
  const l = pick(HA_FIRST);
  const first = mark === K_BERDIRI ? K : pick([F, D]);
  const [shortV, longSay] = mark === K_BERDIRI ? [K, K + 'ي' + SUK] : [D, D + 'و' + SUK];
  const word = (x) => syl(x, first) + 'ه' + mark;
  return question(word(l), syl(l, first) + 'ه' + longSay, [syl(l, first) + 'ه' + shortV, word(lookAlike(l))]);
}

// a / i / u on the same letter.
function mix() {
  const mark = pick([F, K, D]);
  const l = pick(speakable(mark));
  const s = syl(l, mark);
  return question(s, s, [F, K, D].filter((m) => m !== mark).map((m) => syl(l, m)));
}

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'iqra',
  name: 'Iqra',
  icon: '📗',
  color: '#9be0c9',
  voice: 'ar',          // `sound` is spoken in Arabic after the prompt
  placement: false,     // no placement quiz: opens up to `startAt` (parent can change it)
  startAt: 'iqra3-dhammah-terbalik',
  levels: [
    { id: 'iqra3-kasrah', title: { en: 'Kasrah (i)', ms: 'Kasrah (i)' }, icon: 'بِ', sticker: { id: 'st-camel', e: '🐫' }, gen: () => short(K, [F]) },
    { id: 'iqra3-kasrah-ya', needs: 'iqra3-kasrah', title: { en: 'Kasrah + ya (ii)', ms: 'Kasrah + ya (ii)' }, icon: 'بِيْ', sticker: { id: 'st-goat', e: '🐐' }, gen: () => long(K, 'ي' + SUK) },
    { id: 'iqra3-kasrah-berdiri', needs: 'iqra3-kasrah-ya', title: { en: 'Kasrah berdiri', ms: 'Kasrah berdiri' }, icon: 'هٖ', sticker: { id: 'st-horse', e: '🐴' }, gen: () => smallMark(K_BERDIRI) },
    { id: 'iqra3-ya-tanpa-titik', needs: 'iqra3-kasrah-berdiri', title: { en: 'Kasrah + dotless ya', ms: 'Kasrah + ya tanpa titik' }, icon: 'فِىْ', sticker: { id: 'st-deer', e: '🦌' }, gen: () => long(K, YA_TANPA_TITIK + SUK, 'ي' + SUK) },
    { id: 'iqra3-dhammah', title: { en: 'Dhammah (u)', ms: 'Dhammah (u)' }, icon: 'بُ', sticker: { id: 'st-bee', e: '🐝' }, gen: () => short(D, [F, K]) },
    { id: 'iqra3-dhammah-wau', needs: 'iqra3-dhammah', title: { en: 'Dhammah + wau (uu)', ms: 'Dhammah + wau (uu)' }, icon: 'بُوْ', sticker: { id: 'st-ladybug', e: '🐞' }, gen: () => long(D, 'و' + SUK) },
    { id: 'iqra3-dhammah-terbalik', needs: 'iqra3-dhammah-wau', title: { en: 'Dhammah terbalik', ms: 'Dhammah terbalik' }, icon: 'هٗ', sticker: { id: 'st-snail', e: '🐌' }, gen: () => smallMark(D_TERBALIK) },
    { id: 'iqra3-mix', title: { en: 'Mix: a, i, u', ms: 'Campur: a, i, u' }, icon: 'بَ بِ بُ', sticker: { id: 'st-seal', e: '🦭' }, gen: () => mix() },
  ],
};
