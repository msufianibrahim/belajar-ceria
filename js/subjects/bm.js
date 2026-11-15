import { pick, shuffle } from './util.js';

// Bahasa Melayu reading, in the teaching order of the JejakJaya course (11 phonics tiers).
// Each tier has two levels: "dengar" (hear it, pick the written form) and "baca"
// (letters and syllables: read it aloud and a grown-up taps ✓ or ✗; words and sentences:
// see the picture, pick the written form). The old speaking and writing levels are dropped:
// no speech recognition and no handwriting for Latin letters.

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
// Pictures only for the vowels (the source's consonant pictures did not match Malay words).
const VOWEL_PIC = { a: '🐔', e: '🍎', i: '🐟', o: '🍊', u: '🐛' }; // ayam, epal, ikan, oren, ulat
const CONSONANTS = [...'bcdfghjklmnpqrstvwxyz'];
const SYLLABLES = ['ba', 'bi', 'bu', 'be', 'bo', 'da', 'ka', 'ma', 'pa', 'sa', 'la', 'ja', 'ga', 'na', 'ha', 'fa', 'ta', 'ri', 'su', 'gi'];
const CLOSED = ['bas', 'beg', 'cat', 'dam', 'pen', 'gam', 'jam', 'tin', 'kot', 'rak', 'zip', 'lap', 'sos', 'jus'];

// { w: word, e: emoji picture }. Emoji are unique within a tier so a picture has one answer.
const WORDS = [
  { w: 'baju', e: '👕' }, { w: 'buku', e: '📚' }, { w: 'bola', e: '⚽' }, { w: 'kaki', e: '🦶' },
  { w: 'tali', e: '🪢' }, { w: 'mama', e: '👩' }, { w: 'papa', e: '👨' }, { w: 'dadu', e: '🎲' },
  { w: 'mata', e: '👁️' }, { w: 'gigi', e: '🦷' }, { w: 'jari', e: '☝️' }, { w: 'kuda', e: '🐎' },
  { w: 'susu', e: '🥛' }, { w: 'roti', e: '🍞' }, { w: 'feri', e: '⛴️' }, { w: 'topi', e: '🧢' },
];
const DIGRAPHS = [ // ng, ny, sy, kh
  { w: 'bunga', e: '🌻' }, { w: 'penyu', e: '🐢' }, { w: 'syampu', e: '🧴' },
  { w: 'khemah', e: '⛺' }, { w: 'singa', e: '🦁' }, { w: 'nyamuk', e: '🦟' },
];
const CLUSTERS = [ // the source's "berus" has no cluster, so it became "krayon"
  { w: 'traktor', e: '🚜' }, { w: 'stesen', e: '🚉' }, { w: 'krayon', e: '🖍️' },
  { w: 'dram', e: '🥁' }, { w: 'trofi', e: '🏆' }, { w: 'skuter', e: '🛴' },
];
const DIPHTHONGS = [ // ai, au (amboi/pisau swapped for words with a clear, gentle picture)
  { w: 'tupai', e: '🐿️' }, { w: 'pulau', e: '🏝️' }, { w: 'kerbau', e: '🐃' },
  { w: 'harimau', e: '🐯' }, { w: 'rantai', e: '⛓️' }, { w: 'gerai', e: '🏪' },
];
const VOWEL_PAIRS = [ // ia, io, ua, ui ("tuala" had a soap picture, so it became "piano")
  { w: 'durian', e: '🍈' }, { w: 'radio', e: '📻' }, { w: 'buaya', e: '🐊' },
  { w: 'piano', e: '🎹' }, { w: 'kuih', e: '🍰' }, { w: 'biola', e: '🎻' },
];
const THREE = [
  { w: 'kereta', e: '🚗' }, { w: 'tomato', e: '🍅' }, { w: 'kelapa', e: '🥥' },
  { w: 'kamera', e: '📷' }, { w: 'rebana', e: '🪘' }, { w: 'sekolah', e: '🏫' },
];
// "Kucing tidur sini" in the source was not a sentence; fixed to "di sini".
const SENTENCES = [
  { w: 'Bapa baca buku.', e: '📖' }, { w: 'Ibu masak nasi.', e: '🍳' }, { w: 'Saya suka epal.', e: '🍎' },
  { w: 'Adik main bola.', e: '⚽' }, { w: 'Kucing tidur di sini.', e: '🐱' },
];

const choicesOf = (answer, pool) => shuffle([answer, ...shuffle(pool.filter((x) => x !== answer)).slice(0, 2)])
  .map((x) => ({ label: x, value: x }));

// Hear it (`say` is spoken; the prompt is shown on the button so it must not give the answer), pick the written form. The answer is not shown anywhere else.
function listen(items) {
  return () => {
    const w = pick(items);
    return { key: `l-${w}`, prompt: { ms: 'Dengar, kemudian pilih.' }, say: w.endsWith(".") ? w : `Mana satu ${w}?`, choices: choicesOf(w, items), answer: w };
  };
}

// Read it aloud; a grown-up checks. Vowels get a picture hint.
function readAloud(items) {
  return () => {
    const w = pick(items);
    return { key: `r-${w}`, prompt: { ms: 'Baca kuat-kuat.' }, read: w, visual: VOWEL_PIC[w], choices: [], answer: true };
  };
}

// See the picture, pick the word.
function picture(items, sentence) {
  const words = items.map((i) => i.w);
  return () => {
    const it = pick(items);
    return {
      key: `p-${it.w}`, visual: it.e, wide: sentence, stack: sentence,
      prompt: { ms: sentence ? 'Pilih ayat yang betul.' : 'Pilih perkataan yang betul.' },
      choices: choicesOf(it.w, words), answer: it.w,
    };
  };
}

const wordsOf = (items) => items.map((i) => i.w);
// Sticker pool: fruit and food, one per level.
const FOOD = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍍', '🥭', '🍉', '🍒', '🍑', '🍐', '🍋', '🥥', '🥕', '🌽', '🍞', '🧀', '🥚', '🍙', '🍪', '🍩', '🍦'];
let n = 0;
const lv = (id, ms, en, icon, gen) => ({ id: `bm-${id}`, title: { en, ms }, icon, sticker: { id: `st-bm-${n + 1}`, e: FOOD[n++] }, gen });

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'bm',
  name: 'Bahasa Melayu',
  icon: '📖',
  color: '#7cc6fe',
  lang: 'ms',
  placement: false,     // starts at level 1 (parent can change it); read-aloud levels need a grown-up anyway
  levels: [
    lv('vokal-dengar', 'Vokal: dengar', 'Vowels: listen', '🔊', listen(VOWELS)),
    lv('vokal-baca', 'Vokal: baca', 'Vowels: read', '🅰️', readAloud(VOWELS)),
    lv('konsonan-dengar', 'Konsonan: dengar', 'Consonants: listen', '🔊', listen(CONSONANTS)),
    lv('konsonan-baca', 'Konsonan: baca', 'Consonants: read', '🔤', readAloud(CONSONANTS)),
    lv('sukukata-dengar', 'Suku kata: dengar', 'Syllables: listen', '🔊', listen(SYLLABLES)),
    lv('sukukata-baca', 'Suku kata: baca', 'Syllables: read', '🗣️', readAloud(SYLLABLES)),
    lv('perkataan-dengar', 'Perkataan: dengar', 'Words: listen', '🔊', listen(wordsOf(WORDS))),
    lv('perkataan-baca', 'Perkataan: baca', 'Words: read', '🖼️', picture(WORDS)),
    lv('tertutup-dengar', 'Suku kata tertutup: dengar', 'Closed syllables: listen', '🔊', listen(CLOSED)),
    lv('tertutup-baca', 'Suku kata tertutup: baca', 'Closed syllables: read', '🗣️', readAloud(CLOSED)),
    lv('dwigraf-dengar', 'Dwigraf: dengar', 'Digraphs: listen', '🔊', listen(wordsOf(DIGRAPHS))),
    lv('dwigraf-baca', 'Dwigraf: baca', 'Digraphs: read', '🖼️', picture(DIGRAPHS)),
    lv('gabung-dengar', 'Konsonan bergabung: dengar', 'Consonant clusters: listen', '🔊', listen(wordsOf(CLUSTERS))),
    lv('gabung-baca', 'Konsonan bergabung: baca', 'Consonant clusters: read', '🖼️', picture(CLUSTERS)),
    lv('diftong-dengar', 'Diftong: dengar', 'Diphthongs: listen', '🔊', listen(wordsOf(DIPHTHONGS))),
    lv('diftong-baca', 'Diftong: baca', 'Diphthongs: read', '🖼️', picture(DIPHTHONGS)),
    lv('berganding-dengar', 'Vokal berganding: dengar', 'Vowel pairs: listen', '🔊', listen(wordsOf(VOWEL_PAIRS))),
    lv('berganding-baca', 'Vokal berganding: baca', 'Vowel pairs: read', '🖼️', picture(VOWEL_PAIRS)),
    lv('tigasuku-dengar', 'Tiga suku kata: dengar', 'Three syllables: listen', '🔊', listen(wordsOf(THREE))),
    lv('tigasuku-baca', 'Tiga suku kata: baca', 'Three syllables: read', '🖼️', picture(THREE)),
    lv('ayat-dengar', 'Ayat: dengar', 'Sentences: listen', '🔊', listen(wordsOf(SENTENCES))),
    lv('ayat-baca', 'Ayat: baca', 'Sentences: read', '📖', picture(SENTENCES, true)),
  ],
};
