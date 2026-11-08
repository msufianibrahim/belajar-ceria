import { pick } from './util.js';

// Iqra, in the book's teaching order (own exercises; the books are copyrighted).
// Like the book, each level reads real Quran word shapes (كَتَبَ) with the marks changed
// (كَتِبُ), mixing every mark learnt so far, and every word has the level's new mark.
// Words get longer through a round.
//
// No sound: he reads the word aloud and a grown-up taps ✓ or ✗, like reading the book
// with a teacher. The tablet's Arabic voice couldn't be trusted with long vs short vowels
// (sound-test.html), and Arabic speech recognition drops the marks, so it can't check them.

const F = 'َ', K = 'ِ', D = 'ُ', SUK = 'ْ';
const K_BERDIRI = 'ٖ', D_TERBALIK = 'ٗ';
const YA = 'ي', WAU = 'و', YA_TANPA_TITIK = 'ى', HA = 'ه';

// 3-letter roots from the Quran, without alif/wau/ya (those are the long-vowel letters here).
const ROOTS = [
  'كتب', 'نصر', 'جعل', 'علم', 'فتح', 'سمع', 'ذهب', 'دخل', 'جلس', 'قتل', 'حمل', 'صدق',
  'شكر', 'عبد', 'نزل', 'كفر', 'حسب', 'ظلم', 'بعث', 'سجد', 'حكم', 'قبل', 'خلق', 'رزق',
  'غفر', 'صبر', 'ذكر', 'حفظ', 'نظر', 'طلب', 'فعل', 'عمل', 'قدر', 'بلغ', 'سبح', 'شهد',
].map((r) => [...r]);

// A word is a list of syllables { l: letter, m: mark, long: 'ya' | 'ya0' (dotless) | 'wau' | null }.
// The small marks on ha are syllables with m = K_BERDIRI / D_TERBALIK.
const write = (s) => s.l + s.m + (s.long === 'ya' ? YA + SUK : s.long === 'ya0' ? YA_TANPA_TITIK + SUK : s.long === 'wau' ? WAU + SUK : '');
const shown = (words) => words.map((w) => w.map(write).join('')).join(' ');

// What each level has learnt so far, and its new thing (`target`).
// short: marks; ii/uu: long vowels allowed; ya0: dotless ya allowed at the end of a word.
const STAGES = {
  kasrah:      { short: [F, K], target: 'K' },
  kasrahYa:    { short: [F, K], ii: true, target: 'ii' },
  berdiri:     { short: [F, K], ii: true, target: 'berdiri' },
  tanpaTitik:  { short: [F, K], ii: true, target: 'ya0' },
  dhammah:     { short: [F, K, D], ii: true, ya0: true, target: 'D' },
  dhammahWau:  { short: [F, K, D], ii: true, ya0: true, uu: true, target: 'uu' },
  terbalik:    { short: [F, K, D], ii: true, ya0: true, uu: true, target: 'terbalik' },
  mix:         { short: [F, K, D], ii: true, ya0: true, uu: true, target: null },
};

function syllable(l, st) {
  const m = pick(st.short);
  // Now and then a long vowel, if learnt: ii after kasrah, uu after dhammah.
  const long = (m === K && st.ii && Math.random() < 0.3) ? 'ya' : (m === D && st.uu && Math.random() < 0.3) ? 'wau' : null;
  return { l, m, long };
}

// Put the level's new thing into the word.
function addTarget(w, st) {
  const i = Math.floor(Math.random() * w.length);
  switch (st.target) {
    case 'K': w[i] = { l: w[i].l, m: K, long: null }; break;
    case 'D': w[i] = { l: w[i].l, m: D, long: null }; break;
    case 'ii': w[i] = { l: w[i].l, m: K, long: 'ya' }; break;
    case 'uu': w[i] = { l: w[i].l, m: D, long: 'wau' }; break;
    case 'ya0': w[w.length - 1] = { l: w[w.length - 1].l, m: K, long: 'ya0' }; break;
    // As in the Quran: kasrah berdiri on ha after kasrah (عَمَلِهٖ), dhammah terbalik after fathah/dhammah (كَتَبَهٗ).
    case 'berdiri': w[w.length - 1] = { ...w[w.length - 1], m: K, long: null }; w.push({ l: HA, m: K_BERDIRI, long: null }); break;
    case 'terbalik': {
      const last = w[w.length - 1];
      w[w.length - 1] = { ...last, m: pick([F, D]), long: null };
      w.push({ l: HA, m: D_TERBALIK, long: null });
      break;
    }
    default:
  }
  return w;
}

// Round position (0-9) -> length: 2 letters, then a 3-letter root, then two words (6-8 letters).
function makeWord(pos, st) {
  const root = pick(ROOTS);
  const letters = pos < 3 ? root.slice(0, 2) : root;
  const w = letters.map((l) => syllable(l, st));
  // Once learnt, a long ii at the end of a word is sometimes written with the dotless ya.
  const last = w[w.length - 1];
  if (st.ya0 && last.long === 'ya' && Math.random() < 0.5) last.long = 'ya0';
  return addTarget(w, st);
}

// One line to read: a word, or two words for the last questions of the round.
function question(pos, st) {
  const words = pos >= 7 ? [makeWord(3, st), makeWord(3, st)] : [makeWord(pos, st)];
  const text = shown(words);
  return { key: text, prompt: PROMPT, read: text, answer: true, choices: [] };
}

const PROMPT = { en: 'Read it aloud!', ms: 'Baca dengan kuat!' };

const level = (stage) => (pos = 0) => question(pos, STAGES[stage]);

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'iqra',
  name: 'Iqra',
  icon: '📗',
  color: '#9be0c9',
  arabic: true,         // Arabic script: questions are read aloud and a grown-up checks them
  placement: false,     // no placement quiz: opens up to `startAt` (parent can change it)
  startAt: 'iqra3-dhammah-terbalik',
  levels: [
    { id: 'iqra3-kasrah', title: { en: 'Kasrah (i)', ms: 'Kasrah (i)' }, icon: 'بِ', sticker: { id: 'st-camel', e: '🐫' }, gen: level('kasrah') },
    { id: 'iqra3-kasrah-ya', needs: 'iqra3-kasrah', title: { en: 'Kasrah + ya (ii)', ms: 'Kasrah + ya (ii)' }, icon: 'بِيْ', sticker: { id: 'st-goat', e: '🐐' }, gen: level('kasrahYa') },
    { id: 'iqra3-kasrah-berdiri', needs: 'iqra3-kasrah-ya', title: { en: 'Kasrah berdiri', ms: 'Kasrah berdiri' }, icon: 'هٖ', sticker: { id: 'st-horse', e: '🐴' }, gen: level('berdiri') },
    { id: 'iqra3-ya-tanpa-titik', needs: 'iqra3-kasrah-berdiri', title: { en: 'Kasrah + dotless ya', ms: 'Kasrah + ya tanpa titik' }, icon: 'فِىْ', sticker: { id: 'st-deer', e: '🦌' }, gen: level('tanpaTitik') },
    { id: 'iqra3-dhammah', title: { en: 'Dhammah (u)', ms: 'Dhammah (u)' }, icon: 'بُ', sticker: { id: 'st-bee', e: '🐝' }, gen: level('dhammah') },
    { id: 'iqra3-dhammah-wau', needs: 'iqra3-dhammah', title: { en: 'Dhammah + wau (uu)', ms: 'Dhammah + wau (uu)' }, icon: 'بُوْ', sticker: { id: 'st-ladybug', e: '🐞' }, gen: level('dhammahWau') },
    { id: 'iqra3-dhammah-terbalik', needs: 'iqra3-dhammah-wau', title: { en: 'Dhammah terbalik', ms: 'Dhammah terbalik' }, icon: 'هٗ', sticker: { id: 'st-snail', e: '🐌' }, gen: level('terbalik') },
    { id: 'iqra3-mix', title: { en: 'Mix: a, i, u', ms: 'Campur: a, i, u' }, icon: 'بَ بِ بُ', sticker: { id: 'st-seal', e: '🦭' }, gen: level('mix') },
  ],
};
