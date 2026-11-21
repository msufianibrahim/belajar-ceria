import { pick, rand, shuffle } from './util.js';

// Iqra, in the book's teaching order (own exercises; the books are copyrighted).
// Like the book, each level reads real Quran word shapes (كَتَبَ) with the marks changed
// (كَتِبُ), mixing every mark learnt so far, and every word has the level's new mark.
// Words get longer through a round.
//
// No sound: he reads the word aloud and a grown-up taps ✓ or ✗, like reading the book
// with a teacher. The tablet's Arabic voice couldn't be trusted with long vs short vowels
// (sound-test.html), and Arabic speech recognition drops the marks, so it can't check them.

const F = 'َ', K = 'ِ', D = 'ُ', SUK = 'ْ', SHADDAH = 'ّ';
const TF = 'ً', TK = 'ٍ', TD = 'ٌ';
const ALIF = 'ا';
const K_BERDIRI = 'ٖ', D_TERBALIK = 'ٗ';
const YA = 'ي', WAU = 'و', YA_TANPA_TITIK = 'ى', HA = 'ه', LAM = 'ل';
const F_BERDIRI = 'ٰ', MADDAH = 'ٓ', HAMZAH = 'ء';

// 3-letter roots from the Quran, without alif/wau/ya (those are the long-vowel letters here).
const ROOTS = [
  'كتب', 'نصر', 'جعل', 'علم', 'فتح', 'سمع', 'ذهب', 'دخل', 'جلس', 'قتل', 'حمل', 'صدق',
  'شكر', 'عبد', 'نزل', 'كفر', 'حسب', 'ظلم', 'بعث', 'سجد', 'حكم', 'قبل', 'خلق', 'رزق',
  'غفر', 'صبر', 'ذكر', 'حفظ', 'نظر', 'طلب', 'فعل', 'عمل', 'قدر', 'بلغ', 'سبح', 'شهد',
  'سلم', 'كلم', 'ملك', 'مكر', 'لعب', 'رجع', 'نفع', 'لبث', 'بصر', 'بسط', 'خرج', 'حشر', 'هجر', 'هبط',
].map((r) => [...r]);

// A word is a list of syllables { l: letter, m: mark, long: a key of LONG or null, sh?: shaddah }.
// The small marks on ha are syllables with m = K_BERDIRI / D_TERBALIK.
// ya0: dotless ya after kasrah; berdiriYa: dotless ya after fathah berdiri (عَلٰى); mad: alif with the mad sign.
const LONG = { alif: ALIF, ya: YA + SUK, ya0: YA_TANPA_TITIK + SUK, wau: WAU + SUK, berdiriYa: YA_TANPA_TITIK, mad: ALIF + MADDAH };
const write = (s) => s.l + (s.sh ? SHADDAH : '') + s.m + (LONG[s.long] ?? '');
const shown = (words) => words.map((w) => w.map(write).join('')).join(' ');

// What each level has learnt so far, and its new thing (`target`).
// short: marks; ii/uu/aa: long vowels allowed; ya0: dotless ya allowed at the end of a word.
// ok: keeps only roots that can carry the new thing.
const ALL = { short: [F, K, D], ii: true, ya0: true, uu: true, aa: true, target: null };
const QALQALAH = 'قطبجد', QAMARI = 'ابجحخعغفقكمهوي', SYAMSI = 'تثدذرزسشصضطظلن';
const STAGES = {
  fathah:      { short: [F], target: null },
  fathahAlif:  { short: [F], aa: true, target: 'aa' },
  alifLam:     { short: [F], aa: true, target: 'aa', ok: (ls) => ls.includes(LAM) },
  fBerdiri:    { short: [F], aa: true, target: 'fBerdiri' },
  fBerdiriYa:  { short: [F], aa: true, target: 'fBerdiriYa' },
  kasrah:      { short: [F, K], target: 'K' },
  kasrahYa:    { short: [F, K], ii: true, target: 'ii' },
  berdiri:     { short: [F, K], ii: true, target: 'berdiri' },
  tanpaTitik:  { short: [F, K], ii: true, target: 'ya0' },
  dhammah:     { short: [F, K, D], ii: true, ya0: true, target: 'D' },
  dhammahWau:  { short: [F, K, D], ii: true, ya0: true, uu: true, target: 'uu' },
  terbalik:    { short: [F, K, D], ii: true, ya0: true, uu: true, target: 'terbalik' },
  mix:         { short: [F, K, D], ii: true, ya0: true, uu: true, target: null },
  tanwin:      { short: [F, K, D], ii: true, ya0: true, uu: true, aa: true, target: 'tanwin' },
  sukun:       { short: [F, K, D], ii: true, ya0: true, uu: true, aa: true, target: 'sukun' },
  qalqalah:    { ...ALL, target: 'qalqalah', ok: (ls) => ls.slice(1).some((l) => QALQALAH.includes(l)) },
  shaddah:     { short: [F, K, D], ii: true, ya0: true, uu: true, aa: true, target: 'shaddah' },
  qamari:      { ...ALL, target: 'qamari', ok: (ls) => QAMARI.includes(ls[0]) },
  syamsi:      { ...ALL, target: 'syamsi', ok: (ls) => SYAMSI.includes(ls[0]) },
  waqaf:       { ...ALL, target: 'waqaf' },
};

function syllable(l, st) {
  const m = pick(st.short);
  // Now and then a long vowel, if learnt: ii after kasrah, uu after dhammah.
  const long = (m === K && st.ii && Math.random() < 0.3) ? 'ya' : (m === D && st.uu && Math.random() < 0.3) ? 'wau' : (m === F && st.aa && Math.random() < 0.3) ? 'alif' : null;
  return { l, m, long };
}

// Put the level's new thing into the word.
function addTarget(w, st) {
  const i = Math.floor(Math.random() * w.length);
  switch (st.target) {
    case 'K': w[i] = { l: w[i].l, m: K, long: null }; break;
    case 'D': w[i] = { l: w[i].l, m: D, long: null }; break;
    case 'aa': w[i] = { l: w[i].l, m: F, long: 'alif' }; break;
    case 'ii': w[i] = { l: w[i].l, m: K, long: 'ya' }; break;
    case 'uu': w[i] = { l: w[i].l, m: D, long: 'wau' }; break;
    case 'ya0': w[w.length - 1] = { l: w[w.length - 1].l, m: K, long: 'ya0' }; break;
    case 'fBerdiri': w[i] = { l: w[i].l, m: F_BERDIRI, long: null }; break;
    case 'fBerdiriYa': w[w.length - 1] = { l: w[w.length - 1].l, m: F_BERDIRI, long: 'berdiriYa' }; break;
    // As in the Quran: kasrah berdiri on ha after kasrah (عَمَلِهٖ), dhammah terbalik after fathah/dhammah (كَتَبَهٗ).
    case 'berdiri': w[w.length - 1] = { ...w[w.length - 1], m: K, long: null }; w.push({ l: HA, m: K_BERDIRI, long: null }); break;
    case 'terbalik': {
      const last = w[w.length - 1];
      w[w.length - 1] = { ...last, m: pick([F, D]), long: null };
      w.push({ l: HA, m: D_TERBALIK, long: null });
      break;
    }
    // Waqaf: the word ends on a short vowel or a tanwin, which he drops when stopping.
    case 'waqaf':
      if (Math.random() < 0.5) { w[w.length - 1].long = null; break; }
      // falls through
    // Tanwin ends a word; fathatain takes an alif (كَتَبًا).
    case 'tanwin': {
      const m = pick([TF, TK, TD]);
      w[w.length - 1] = { l: w[w.length - 1].l, m, long: m === TF ? 'alif' : null };
      break;
    }
    // Sukun / shaddah sit on a letter after the first, which needs a short vowel before it.
    case 'sukun': case 'shaddah': {
      const j = 1 + Math.floor(Math.random() * (w.length - 1));
      w[j - 1] = { ...w[j - 1], long: null };
      w[j] = st.target === 'sukun' ? { l: w[j].l, m: SUK, long: null } : { l: w[j].l, m: pick(st.short), long: null, sh: true };
      break;
    }
    case 'qalqalah': {
      const j = pick(w.map((s, k) => k).filter((k) => k > 0 && QALQALAH.includes(w[k].l)));
      w[j - 1] = { ...w[j - 1], long: null };
      w[j] = { l: w[j].l, m: SUK, long: null };
      break;
    }
    // Alif lam: read before a qamari letter (اَلْقَمَرُ), silent before a syamsi one, which takes shaddah (اَلشَّمْسُ).
    case 'qamari': w.unshift({ l: ALIF, m: F, long: null }, { l: LAM, m: SUK, long: null }); break;
    case 'syamsi': w[0] = { ...w[0], sh: true }; w.unshift({ l: ALIF, m: F, long: null }, { l: LAM, m: '', long: null }); break;
    default:
  }
  return w;
}

// Round position (0-9) -> length: 2 letters, then a 3-letter root, then two words (6-8 letters).
function makeWord(pos, st) {
  let letters;
  do {
    const root = pick(ROOTS);
    letters = pos < 3 ? root.slice(0, 2) : root;
  } while (st.ok && !st.ok(letters));
  const w = letters.map((l) => syllable(l, st));
  // Once learnt, a long ii at the end of a word is sometimes written with the dotless ya.
  const last = w[w.length - 1];
  if (st.ya0 && last.long === 'ya' && Math.random() < 0.5) last.long = 'ya0';
  return addTarget(w, st);
}

const PROMPT = { en: 'Read it aloud!', ms: 'Baca dengan kuat!' };
const line = (text, prompt = PROMPT) => ({ key: text, prompt, read: text, answer: true, choices: [] });

// One line to read: a word, or two words for the last questions of the round.
function question(pos, st, prompt) {
  const words = pos >= 7 ? [makeWord(3, st), makeWord(3, st)] : [makeWord(pos, st)];
  return line(shown(words), prompt);
}

const level = (stage, prompt) => (pos = 0) => question(pos, STAGES[stage], prompt);

// Iqra 1: standalone letters with fathah, a few new ones at a time, mixed with those learnt.
const GROUPS = [['أ', 'ب', 'ت', 'ث'], ['ج', 'ح', 'خ'], ['د', 'ذ', 'ر', 'ز'], ['س', 'ش', 'ص', 'ض'],
  ['ط', 'ظ', 'ع', 'غ'], ['ف', 'ق', 'ك', 'ل'], ['م', 'ن', 'و', 'ه', HAMZAH, 'ي']];
// Letters that sound alike, read side by side.
const SIMILAR = [['ث', 'س', 'ص'], ['ح', 'ه'], ['ذ', 'ز', 'ظ'], ['ك', 'ق'], ['ت', 'ط'], ['أ', 'ع'], ['د', 'ض']];
// Same lengths as the words: 2-3 letters, then 3-4, then 6-8.
const lineLength = (pos) => (pos < 3 ? rand(2, 3) : pos < 7 ? rand(3, 4) : rand(6, 8));
const letterLine = (ls) => line(ls.map((l) => l + F).join(' '));

const letters = (g) => (pos = 0) => {
  const learnt = GROUPS.slice(0, g + 1).flat();
  const ls = Array.from({ length: lineLength(pos) }, () => pick(learnt));
  ls[rand(0, ls.length - 1)] = pick(GROUPS[g]);
  return letterLine(ls);
};

const similar = (pos = 0) => {
  const group = pick(SIMILAR);
  const ls = Array.from({ length: lineLength(pos) }, () => pick(group));
  [ls[0], ls[1]] = shuffle(group);  // at least two different ones
  return letterLine(shuffle(ls));
};

// Mad wajib: a long aa with the mad sign, then hamzah, in one word (جَآءَ). Real Quran words
// (جاء شاء ساء ماء سماء جزاء سواء عطاء بناء نساء دعاء غثاء), as the letters before the alif.
const MAD_WORDS = ['ج', 'ش', 'س', 'م', 'سم', 'جز', 'سو', 'عط', 'بن', 'نس', 'دع', 'غث'].map((r) => [...r]);
const madWord = (pos) => {
  const w = pick(MAD_WORDS.filter((r) => pos < 3 || r.length === 2)).map((l) => ({ l, m: pick([F, K, D]), long: null }));
  w[w.length - 1] = { l: w[w.length - 1].l, m: F, long: 'mad' };
  return shown([[...w, { l: HAMZAH, m: pick([F, K, D]), long: null }]]);
};
const mad = (pos = 0) => line(pos >= 7 ? `${madWord(3)} ${madWord(3)}` : madWord(pos));

const WAQAF_PROMPT = { en: 'Read it, and stop at the end!', ms: 'Baca, dan waqaf di hujungnya!' };

// Iqra 6: nun sukun or tanwin, then a word starting with a letter that changes how it's read
// (izhar: clear, idgham: merged, iqlab: to mim, ikhfa: hidden). He reads; the grown-up listens.
const IZHAR = 'ءهعحغخ', IDGHAM = 'يرملون', IQLAB = 'ب', IKHFA = 'تثجدذزسشصضطظفقك';
const NUN_WORDS = ['مِنْ', 'عَنْ', 'أَنْ', 'إِنْ', 'لَنْ'];
const startsWith = (first) => ({ ...ALL, ok: (ls) => first.includes(ls[0]) });
const nun = (first) => (pos = 0) => {
  const w1 = pos < 5 ? pick(NUN_WORDS) : shown([makeWord(3, STAGES.tanwin)]);
  return line(`${w1} ${shown([makeWord(3, startsWith(first))])}`);
};

// Mim sukun, then a word starting with ba, mim, or another letter.
const MIM_WORDS = ['لَهُمْ', 'بِهِمْ', 'هُمْ', 'لَكُمْ', 'مِنْهُمْ', 'أَنْتُمْ', 'كُنْتُمْ', 'أَمْ'];
const mim = () => {
  const first = pick(['ب', 'م', null]);
  return line(`${pick(MIM_WORDS)} ${shown([makeWord(3, first ? startsWith(first) : ALL)])}`);
};

// Huruf muqatta'ah: the letters that open some surahs, read by their names (alif laam miim).
// Written as in the mushaf: ~ is the mad sign, ^ fathah berdiri.
const MUQATTAAH = ['ال~م~', 'ال~م~ص~', 'ال~ر^', 'ال~م~ر^', 'ك~ه^ي^ع~ص~', 'ط^ه^', 'ط^س~م~', 'ط^س~', 'ي^س~',
  'ص~', 'ق~', 'ن~', 'ح^م~', 'ح^م~ ع~س~ق~'].map((s) => s.replace(/~/g, MADDAH).replace(/\^/g, F_BERDIRI));
const SHORT_MUQATTAAH = MUQATTAAH.filter((s) => s.replace(/[^ء-ي]/g, '').length <= 2);
const NAMES_PROMPT = { en: 'Read the letter names!', ms: 'Baca nama huruf-huruf ini!' };
const muqattaah = (pos = 0) => line(pick(pos < 3 ? SHORT_MUQATTAAH : MUQATTAAH), NAMES_PROMPT);

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
    { id: 'iqra1-letters-1', title: { en: 'Letters: alif to tsa', ms: 'Huruf: alif hingga tsa' }, icon: 'أَ بَ', sticker: { id: 'st-iqra-letters-1', e: '🔷' }, gen: letters(0) },
    { id: 'iqra1-letters-2', needs: 'iqra1-letters-1', title: { en: 'Letters: jim to kha', ms: 'Huruf: jim hingga kha' }, icon: 'جَ حَ', sticker: { id: 'st-iqra-letters-2', e: '🔶' }, gen: letters(1) },
    { id: 'iqra1-letters-3', needs: 'iqra1-letters-2', title: { en: 'Letters: dal to zai', ms: 'Huruf: dal hingga zai' }, icon: 'دَ ذَ', sticker: { id: 'st-iqra-letters-3', e: '🔺' }, gen: letters(2) },
    { id: 'iqra1-letters-4', needs: 'iqra1-letters-3', title: { en: 'Letters: sin to dhod', ms: 'Huruf: sin hingga dhod' }, icon: 'سَ شَ', sticker: { id: 'st-iqra-letters-4', e: '🔻' }, gen: letters(3) },
    { id: 'iqra1-letters-5', needs: 'iqra1-letters-4', title: { en: 'Letters: tho to ghain', ms: 'Huruf: tho hingga ghain' }, icon: 'طَ ظَ', sticker: { id: 'st-iqra-letters-5', e: '💎' }, gen: letters(4) },
    { id: 'iqra1-letters-6', needs: 'iqra1-letters-5', title: { en: 'Letters: fa to lam', ms: 'Huruf: fa hingga lam' }, icon: 'فَ قَ', sticker: { id: 'st-iqra-letters-6', e: '🟢' }, gen: letters(5) },
    { id: 'iqra1-letters-7', needs: 'iqra1-letters-6', title: { en: 'Letters: mim to ya', ms: 'Huruf: mim hingga ya' }, icon: 'مَ نَ', sticker: { id: 'st-iqra-letters-7', e: '🟡' }, gen: letters(6) },
    { id: 'iqra1-similar', needs: 'iqra1-letters-7', title: { en: 'Letters that sound alike', ms: 'Huruf yang hampir sama bunyi' }, icon: 'سَ صَ', sticker: { id: 'st-iqra-similar', e: '🔴' }, gen: similar },
    { id: 'iqra1-fathah', title: { en: 'Fathah (a)', ms: 'Fathah (a)' }, icon: 'بَ', sticker: { id: 'st-ant', e: '🐜' }, gen: level('fathah') },
    { id: 'iqra1-fathah-alif', needs: 'iqra1-fathah', title: { en: 'Fathah + alif (aa)', ms: 'Fathah + alif (aa)' }, icon: 'بَا', sticker: { id: 'st-caterpillar', e: '🐛' }, gen: level('fathahAlif') },
    { id: 'iqra2-alif-lam', needs: 'iqra1-fathah-alif', title: { en: 'Alif or lam?', ms: 'Alif atau lam?' }, icon: 'بَا بَلَ', sticker: { id: 'st-iqra-alif-lam', e: '🟣' }, gen: level('alifLam') },
    { id: 'iqra2-fathah-berdiri', needs: 'iqra2-alif-lam', title: { en: 'Fathah berdiri (aa)', ms: 'Fathah berdiri (aa)' }, icon: 'هٰ', sticker: { id: 'st-iqra-fathah-berdiri', e: '🟠' }, gen: level('fBerdiri') },
    { id: 'iqra2-berdiri-ya', needs: 'iqra2-fathah-berdiri', title: { en: 'Fathah berdiri + dotless ya', ms: 'Fathah berdiri + ya tanpa titik' }, icon: 'لٰى', sticker: { id: 'st-iqra-berdiri-ya', e: '🟤' }, gen: level('fBerdiriYa') },
    { id: 'iqra3-kasrah', title: { en: 'Kasrah (i)', ms: 'Kasrah (i)' }, icon: 'بِ', sticker: { id: 'st-camel', e: '🐫' }, gen: level('kasrah') },
    { id: 'iqra3-kasrah-ya', needs: 'iqra3-kasrah', title: { en: 'Kasrah + ya (ii)', ms: 'Kasrah + ya (ii)' }, icon: 'بِيْ', sticker: { id: 'st-goat', e: '🐐' }, gen: level('kasrahYa') },
    { id: 'iqra3-kasrah-berdiri', needs: 'iqra3-kasrah-ya', title: { en: 'Kasrah berdiri', ms: 'Kasrah berdiri' }, icon: 'هٖ', sticker: { id: 'st-horse', e: '🐴' }, gen: level('berdiri') },
    { id: 'iqra3-ya-tanpa-titik', needs: 'iqra3-kasrah-berdiri', title: { en: 'Kasrah + dotless ya', ms: 'Kasrah + ya tanpa titik' }, icon: 'فِىْ', sticker: { id: 'st-deer', e: '🦌' }, gen: level('tanpaTitik') },
    { id: 'iqra3-dhammah', title: { en: 'Dhammah (u)', ms: 'Dhammah (u)' }, icon: 'بُ', sticker: { id: 'st-bee', e: '🐝' }, gen: level('dhammah') },
    { id: 'iqra3-dhammah-wau', needs: 'iqra3-dhammah', title: { en: 'Dhammah + wau (uu)', ms: 'Dhammah + wau (uu)' }, icon: 'بُوْ', sticker: { id: 'st-ladybug', e: '🐞' }, gen: level('dhammahWau') },
    { id: 'iqra3-dhammah-terbalik', needs: 'iqra3-dhammah-wau', title: { en: 'Dhammah terbalik', ms: 'Dhammah terbalik' }, icon: 'هٗ', sticker: { id: 'st-snail', e: '🐌' }, gen: level('terbalik') },
    { id: 'iqra3-mix', title: { en: 'Mix: a, i, u', ms: 'Campur: a, i, u' }, icon: 'بَ بِ بُ', sticker: { id: 'st-seal', e: '🦭' }, gen: level('mix') },
    { id: 'iqra4-tanwin', title: { en: 'Tanwin (an, in, un)', ms: 'Tanwin (baris dua)' }, icon: 'بًا', sticker: { id: 'st-cricket', e: '🦗' }, gen: level('tanwin') },
    { id: 'iqra4-sukun', needs: 'iqra4-tanwin', title: { en: 'Sukun (silent vowel)', ms: 'Sukun (huruf mati)' }, icon: 'بْ', sticker: { id: 'st-squirrel', e: '🐿️' }, gen: level('sukun') },
    { id: 'iqra4-qalqalah', needs: 'iqra4-sukun', title: { en: 'Qalqalah (bouncing sukun)', ms: 'Qalqalah (bunyi memantul)' }, icon: 'قْ', sticker: { id: 'st-iqra-qalqalah', e: '⚫' }, gen: level('qalqalah') },
    { id: 'iqra5-shaddah', needs: 'iqra4-sukun', title: { en: 'Shaddah (double)', ms: 'Shaddah (sabdu)' }, icon: 'بَّ', sticker: { id: 'st-mouse', e: '🐭' }, gen: level('shaddah') },
    { id: 'iqra5-alif-lam-qamariah', needs: 'iqra5-shaddah', title: { en: 'Alif lam: lam read', ms: 'Alif lam qamariah' }, icon: 'اَلْقَ', sticker: { id: 'st-iqra-qamariah', e: '⚪' }, gen: level('qamari') },
    { id: 'iqra5-alif-lam-syamsiah', needs: 'iqra5-alif-lam-qamariah', title: { en: 'Alif lam: lam silent', ms: 'Alif lam syamsiah' }, icon: 'اَلشَّ', sticker: { id: 'st-iqra-syamsiah', e: '🟥' }, gen: level('syamsi') },
    { id: 'iqra5-mad', needs: 'iqra5-alif-lam-syamsiah', title: { en: 'Mad: long aa before hamzah', ms: 'Mad wajib' }, icon: 'جَآءَ', sticker: { id: 'st-iqra-mad', e: '🟧' }, gen: mad },
    { id: 'iqra5-waqaf', needs: 'iqra5-mad', title: { en: 'Stopping at the end (waqaf)', ms: 'Cara waqaf' }, icon: 'بْ', sticker: { id: 'st-iqra-waqaf', e: '🟨' }, gen: level('waqaf', WAQAF_PROMPT) },
    { id: 'iqra6-izhar', needs: 'iqra5-waqaf', title: { en: 'Nun sukun & tanwin: clear', ms: 'Nun mati & tanwin: izhar' }, icon: 'نْ ع', sticker: { id: 'st-iqra-izhar', e: '🟩' }, gen: nun(IZHAR) },
    { id: 'iqra6-idgham', needs: 'iqra6-izhar', title: { en: 'Nun sukun & tanwin: merged', ms: 'Nun mati & tanwin: idgham' }, icon: 'نْ ر', sticker: { id: 'st-iqra-idgham', e: '🟦' }, gen: nun(IDGHAM) },
    { id: 'iqra6-iqlab', needs: 'iqra6-idgham', title: { en: 'Nun sukun & tanwin: to mim', ms: 'Nun mati & tanwin: iqlab' }, icon: 'نْ ب', sticker: { id: 'st-iqra-iqlab', e: '🟪' }, gen: nun(IQLAB) },
    { id: 'iqra6-ikhfa', needs: 'iqra6-iqlab', title: { en: 'Nun sukun & tanwin: hidden', ms: 'Nun mati & tanwin: ikhfa' }, icon: 'نْ ك', sticker: { id: 'st-iqra-ikhfa', e: '⬛' }, gen: nun(IKHFA) },
    { id: 'iqra6-mim-sukun', needs: 'iqra6-ikhfa', title: { en: 'Mim sukun', ms: 'Mim mati' }, icon: 'مْ', sticker: { id: 'st-iqra-mim-sukun', e: '⬜' }, gen: mim },
    { id: 'iqra6-muqattaah', needs: 'iqra6-mim-sukun', title: { en: 'Surah opening letters', ms: "Huruf muqatta'ah" }, icon: 'الٓمٓ', sticker: { id: 'st-iqra-muqattaah', e: '💠' }, gen: muqattaah },
  ],
};
