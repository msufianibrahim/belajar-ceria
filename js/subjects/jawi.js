import { pick, shuffle } from './util.js';

// Jawi (Malay in Arabic script), spelled the modern DBP way (ک for ka, ݢ ga, ڠ nga, ڤ pa, چ ca, ڽ nya, ۏ va).
// Ported from the JejakJaya curriculum: letters, then syllables (consonant + vowel), then easy words.
// Each tier has listen (hear it, pick the Jawi), read (see the Jawi, pick the sound) and read-aloud (grown-up checks).
// "Dengar dan taip" and writing levels are dropped: the app has no keyboard and no handwriting for letters.

const ar = (s) => `<span class="ar">${s}</span>`;
const L = (s) => s.split(' ').map((p) => { const [j, say] = p.split('='); return { j, say }; });

// Letters in alphabet order, in groups so a child learns a few at a time (listening only mixes within a group).
// ح and ه are both "ha": they sit in different groups so a listening question never has both.
const G1 = L('ا=alif ب=ba ت=ta ث=tsa ج=jim ح=ha خ=kho د=dal');
const G2 = L('ذ=zal ر=ra ز=zai س=sin ش=syin ص=sod ض=dod ط=tho');
const G3 = L('ظ=zho ع=ain غ=ghain ف=fa ق=qaf ک=kaf ل=lam م=mim ن=nun و=wau ه=ha ي=ya');
const KHAS = L('چ=ca ڠ=nga ڤ=pa ݢ=ga ڽ=nya ۏ=va'); // Jawi-only letters
const HURUF = [...G1, ...G2, ...G3, ...KHAS];

// Syllables: consonant + vowel letter (alif = a, ya = i, wau = u), e.g. ba = با.
const SUKU = [].concat(...[['ب', 'b'], ['ت', 't'], ['ج', 'j'], ['د', 'd']].map(([c, r]) =>
  [['ا', 'a'], ['ي', 'i'], ['و', 'u']].map(([v, rv]) => ({ j: c + v, say: r + rv }))));

// Words from the source, checked against DBP spelling. "tiga" is left out (its final alif is unsure): "dadu" instead.
const KATA = L('باجو=baju بورو=buru بوکو=buku باکو=baku بابا=baba دادو=dadu روتي=roti جاري=jari کودا=kuda لوري=lori');

const READ = { ms: 'Baca dengan kuat!', en: 'Read it aloud!' };
// n wrong answers, all with different sounds (ح and ه are both "ha").
const distract = (pool, item, n = 2) => {
  const used = new Set([item.say]);
  return shuffle(pool).filter((x) => !used.has(x.say) && used.add(x.say)).slice(0, n);
};

// Hear the sound, pick the Jawi. Distractors never have the same sound as the answer.
function listen(pool, stack) {
  const it = pick(pool);
  const choices = shuffle([it, ...distract(pool, it)]).map((x) => ({ label: ar(x.j), value: x.j }));
  return { key: `l${it.j}`, prompt: { ms: 'Dengar, kemudian pilih.', en: 'Listen and pick.' }, say: `Mana satu ${it.say}?`, choices, answer: it.j, ...(stack && { stack: true }) };
}

// See the Jawi, pick how it is said.
function look(pool, ask) {
  const it = pick(pool);
  const choices = shuffle([it, ...distract(pool, it)]).map((x) => ({ label: x.say, value: x.say }));
  return { key: `r${it.j}`, prompt: { ms: ask }, text: ar(it.j), choices, answer: it.say };
}

const sebut = (pool) => {
  const it = pick(pool);
  return { key: `s${it.j}`, prompt: READ, read: ar(it.j), answer: true, choices: [] };
};

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'jawi',
  name: 'Jawi',
  icon: '✍️',
  color: '#d1b3ff',
  lang: 'ms',
  placement: false,     // starts at level 1 (parent can change it); read-aloud levels need a grown-up anyway
  arabic: true,         // Arabic script: Jawi in .ar spans, read-aloud questions are checked by a grown-up
  levels: [
    { id: 'jawi-huruf-1', title: { en: 'Letters 1: listen', ms: 'Huruf 1: dengar' }, icon: 'ا', sticker: { id: 'st-jawi-1', e: '🦀' }, gen: () => listen(G1) },
    { id: 'jawi-huruf-2', title: { en: 'Letters 2: listen', ms: 'Huruf 2: dengar' }, icon: 'ر', sticker: { id: 'st-jawi-2', e: '🦞' }, gen: () => listen(G2) },
    { id: 'jawi-huruf-3', title: { en: 'Letters 3: listen', ms: 'Huruf 3: dengar' }, icon: 'م', sticker: { id: 'st-jawi-3', e: '🦐' }, gen: () => listen(G3) },
    { id: 'jawi-huruf-khas', title: { en: 'Jawi-only letters', ms: 'Huruf khas Jawi' }, icon: 'ڠ', sticker: { id: 'st-jawi-4', e: '🦑' }, gen: () => listen(KHAS) },
    { id: 'jawi-huruf-baca', title: { en: 'Letters: read', ms: 'Huruf: baca' }, icon: 'ب', sticker: { id: 'st-jawi-5', e: '🐡' }, gen: () => look(HURUF, 'Apakah nama huruf ini?') },
    { id: 'jawi-huruf-sebut', title: { en: 'Letters: read aloud', ms: 'Huruf: sebut' }, icon: 'ت', sticker: { id: 'st-jawi-6', e: '🐠' }, gen: () => sebut(HURUF) },
    { id: 'jawi-suku-dengar', title: { en: 'Syllables: listen', ms: 'Suku kata: dengar' }, icon: 'با', sticker: { id: 'st-jawi-7', e: '🪼' }, gen: () => listen(SUKU) },
    { id: 'jawi-suku-baca', title: { en: 'Syllables: read', ms: 'Suku kata: baca' }, icon: 'بي', sticker: { id: 'st-jawi-8', e: '🐚' }, gen: () => look(SUKU, 'Apakah bunyi ini?') },
    { id: 'jawi-suku-sebut', title: { en: 'Syllables: read aloud', ms: 'Suku kata: sebut' }, icon: 'بو', sticker: { id: 'st-jawi-9', e: '🪸' }, gen: () => sebut(SUKU) },
    { id: 'jawi-kata-dengar', title: { en: 'Words: listen', ms: 'Perkataan: dengar' }, icon: 'باجو', sticker: { id: 'st-jawi-10', e: '🪐' }, gen: () => listen(KATA, true) },
    { id: 'jawi-kata-baca', title: { en: 'Words: read', ms: 'Perkataan: baca' }, icon: 'بوکو', sticker: { id: 'st-jawi-11', e: '🛸' }, gen: () => look(KATA, 'Apakah perkataan ini?') },
    { id: 'jawi-kata-sebut', title: { en: 'Words: read aloud', ms: 'Perkataan: sebut' }, icon: 'کودا', sticker: { id: 'st-jawi-12', e: '🌙' }, gen: () => sebut(KATA) },
  ],
};
