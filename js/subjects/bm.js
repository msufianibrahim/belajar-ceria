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

// ---- KSSR Tahun 1-6 (language, grammar, comprehension) ----
// Items are [text, answer, wrong1, wrong2, question?]. Wrongs must never also be correct.
const PUNC = { '.': '. noktah', ',': ', koma', '?': '? tanda tanya', '!': '! tanda seru', ':': ': titik bertindih' };
const FILL = 'Isi tempat kosong.';

// Multiple choice from items; `ask(text, item)` builds a spoken prompt, `wrongs(item)` overrides the wrongs.
function mc(items, o = {}) {
  return () => {
    const it = pick(items);
    const [t, a] = it;
    const ws = o.wrongs ? o.wrongs(it) : it.slice(2, 4);
    const prompt = o.ask ? o.ask(t, it) : o.prompt;
    return {
      key: `${prompt}|${t}|${a}`, prompt: { ms: prompt }, text: t || undefined, answer: a,
      choices: shuffle([a, ...ws]).map((x) => ({ label: o.label ? o.label(x) : x, value: x })),
      wide: o.wide, stack: o.stack,
    };
  };
}

// [text, meaning, group?]: wrongs are meanings of other groups (so two similar meanings are never offered together).
const group = (it) => it[2] ?? it[1];
const otherMeanings = (items) => (it) => shuffle(items.filter((x) => group(x) !== group(it))).slice(0, 2).map((x) => x[1]);
const meaning = (items, what) => mc(items, { ask: (t) => `Apakah maksud ${what} "${t}"?`, wrongs: otherMeanings(items), wide: true, stack: true });

// passages: [{ p, qs: [[question, answer, wrong1, wrong2]] }]
const passage = (ps) => mc(ps.flatMap(({ p, qs }) => qs.map(([q, ...r]) => [p, ...r, q])), { ask: (t, it) => it[4], wide: true, stack: true });

const NOUN_VERB = [ // [noun, verb, adjective]
  ['kucing', 'makan', 'cantik'], ['sekolah', 'berlari', 'besar'], ['buku', 'menulis', 'merah'], ['ibu', 'tidur', 'tinggi'],
  ['meja', 'duduk', 'manis'], ['pasar', 'membaca', 'panas'], ['guru', 'menyanyi', 'rajin'], ['bola', 'menendang', 'bulat'],
  ['ikan', 'berenang', 'kecil'], ['pokok', 'tumbuh', 'hijau'], ['kereta', 'memandu', 'laju'], ['bunga', 'menari', 'harum'],
];
const KATA_KERJA = [ // [verb, noun, adjective]
  ['makan', 'meja', 'besar'], ['berlari', 'pokok', 'cantik'], ['menulis', 'pensel', 'tinggi'], ['tidur', 'katil', 'rajin'],
  ['membaca', 'buku', 'merah'], ['minum', 'susu', 'manis'], ['menyanyi', 'radio', 'kuat'], ['mandi', 'air', 'sejuk'],
  ['melompat', 'katak', 'pendek'], ['berenang', 'kolam', 'dalam'], ['menari', 'pentas', 'indah'], ['duduk', 'kerusi', 'lembut'],
];
const ADJ = [ // [adjective, noun, verb]
  ['cantik', 'bunga', 'menari'], ['manis', 'gula', 'minum'], ['besar', 'gajah', 'berlari'], ['rajin', 'murid', 'belajar'],
  ['panas', 'api', 'memasak'], ['kecil', 'semut', 'merangkak'], ['sejuk', 'ais', 'mandi'], ['tebal', 'buku', 'menulis'],
  ['lembut', 'kapas', 'menjahit'], ['laju', 'kereta', 'memandu'], ['bersih', 'lantai', 'menyapu'], ['pandai', 'guru', 'mengajar'],
];

const HURUF_BESAR = [
  ['Ali ke sekolah.', 'ali ke sekolah.', 'Ali ke Sekolah.'], ['Saya tinggal di Johor.', 'saya tinggal di Johor.', 'Saya tinggal di johor.'],
  ['Ibu pergi ke Pulau Pinang.', 'Ibu pergi ke pulau pinang.', 'ibu pergi ke Pulau Pinang.'], ['Siti suka makan epal.', 'siti suka makan epal.', 'Siti suka makan Epal.'],
  ['Kami bercuti di Melaka.', 'kami bercuti di Melaka.', 'Kami bercuti di melaka.'], ['Bapa membeli buku.', 'bapa membeli buku.', 'Bapa Membeli buku.'],
  ['Dia pergi ke Kuala Lumpur.', 'dia pergi ke Kuala Lumpur.', 'Dia pergi ke kuala lumpur.'], ['Mei Ling ialah kawan saya.', 'mei ling ialah kawan saya.', 'Mei ling ialah kawan saya.'],
  ['Kumar bermain bola.', 'kumar bermain bola.', 'Kumar Bermain bola.'], ['Ahmad dan Ali berkawan.', 'ahmad dan ali berkawan.', 'Ahmad Dan Ali berkawan.'],
  ['Adik minum susu.', 'adik minum susu.', 'Adik Minum susu.'], ['Kami ke Sabah.', 'kami ke Sabah.', 'Kami ke sabah.'],
].map(([a, w1, w2]) => ['', a, w1, w2]);

const ISI_KERJA = [
  ['Adik ____ susu.', 'minum', 'tidur', 'lari'], ['Kakak ____ buku.', 'membaca', 'menendang', 'minum'],
  ['Ayah ____ kereta.', 'memandu', 'menyanyi', 'memakan'], ['Burung ____ di langit.', 'terbang', 'berenang', 'mandi'],
  ['Ikan ____ di dalam air.', 'berenang', 'terbang', 'berlari'], ['Kucing ____ tikus.', 'menangkap', 'menulis', 'menyanyi'],
  ['Saya ____ gigi setiap pagi.', 'memberus', 'memandu', 'menendang'], ['Murid ____ di dalam kelas.', 'belajar', 'berenang', 'terbang'],
  ['Ali ____ bola.', 'menendang', 'meminum', 'menjahit'], ['Ibu ____ baju.', 'menjahit', 'meminum', 'menendang'],
  ['Datuk ____ surat khabar.', 'membaca', 'memasak', 'berenang'], ['Nenek ____ kuih.', 'membuat', 'menendang', 'terbang'],
];

const TANDA_1 = [
  ['Siapa nama kamu ____', '?', '.', ','], ['Saya suka makan nasi ____', '.', '?', ','], ['Ibu pergi ke pasar ____', '.', '?', ','],
  ['Adik sedang tidur ____', '.', '?', ','], ['Ke mana awak pergi ____', '?', '.', ','], ['Berapa umur adik ____', '?', '.', ','],
  ['Di mana buku saya ____', '?', '.', ','], ['Mengapa kamu menangis ____', '?', '.', ','], ['Wah, cantiknya bunga ini ____', '!', '?', ','],
  ['Hore, kita menang ____', '!', '?', ','], ['Aduh, sakitnya kaki saya ____', '!', '?', ','], ['Kakak membaca buku ____', '.', '?', ','],
  ['Ayah memandu kereta ____', '.', '?', ','],
];

const ANTONIM_1 = [
  ['besar', 'kecil', 'tinggi', 'panjang'], ['panjang', 'pendek', 'besar', 'tinggi'], ['tinggi', 'rendah', 'besar', 'gemuk'],
  ['panas', 'sejuk', 'manis', 'laju'], ['siang', 'malam', 'pagi', 'petang'], ['gemuk', 'kurus', 'tinggi', 'kuat'],
  ['baik', 'jahat', 'laju', 'besar'], ['laju', 'perlahan', 'baik', 'panjang'], ['kuat', 'lemah', 'baik', 'panas'],
  ['tua', 'muda', 'kuat', 'cantik'], ['lama', 'baharu', 'kuat', 'jauh'], ['atas', 'bawah', 'dalam', 'luar'],
  ['jauh', 'dekat', 'tinggi', 'besar'], ['terang', 'gelap', 'panas', 'jauh'], ['basah', 'kering', 'panas', 'tinggi'],
  ['kenyang', 'lapar', 'haus', 'letih'],
];

const KATA_GANTI = [
  ['Ahmad', 'dia', 'mereka', 'kami'], ['Siti', 'dia', 'kita', 'mereka'], ['Ali dan Abu', 'mereka', 'dia', 'kami'],
  ['Ibu dan ayah', 'mereka', 'dia', 'kita'], ['Saya dan adik (kamu tidak termasuk)', 'kami', 'mereka', 'dia'],
  ['Kakak dan saya (kamu tidak termasuk)', 'kami', 'dia', 'mereka'], ['Cikgu Aminah', 'dia', 'mereka', 'kami'],
  ['Murid-murid', 'mereka', 'dia', 'kita'], ['Pak Ali', 'dia', 'kami', 'mereka'], ['Nenek', 'dia', 'mereka', 'kami'],
  ['Datuk dan nenek', 'mereka', 'dia', 'kami'], ['Saya dan kamu', 'kita', 'mereka', 'dia'],
];

const KATA_TANYA = [
  ['____ umur adik kamu?', 'Berapa', 'Siapa', 'Di mana'], ['____ kamu pergi ke sekolah?', 'Bagaimana', 'Berapa', 'Siapa'],
  ['____ ibu pergi ke pasar?', 'Bila', 'Siapa', 'Berapa'], ['____ rumah kamu?', 'Di mana', 'Berapa', 'Siapa'],
  ['____ yang memecahkan cawan itu?', 'Siapa', 'Bila', 'Berapa'], ['____ buah epal dalam bakul?', 'Berapa', 'Siapa', 'Mengapa'],
  ['____ kamu menangis?', 'Mengapa', 'Berapa', 'Siapa'], ['____ hari lahir kamu?', 'Bila', 'Siapa', 'Berapa'],
  ['____ yang menolong ibu di dapur?', 'Siapa', 'Di mana', 'Bila'], ['____ kamu membeli buku itu?', 'Di mana', 'Siapa', 'Berapa'],
  ['____ kamu tidak datang semalam?', 'Mengapa', 'Siapa', 'Berapa'], ['____ harga buku ini?', 'Berapa', 'Siapa', 'Di mana'],
];

const SENDI_1 = [
  ['Ibu hendak pergi ____ pasar esok.', 'ke', 'di', 'dari'], ['Adik bermain ____ taman.', 'di', 'ke', 'dari'],
  ['Kami belajar ____ sekolah.', 'di', 'ke', 'dari'], ['Kucing tidur ____ bawah meja.', 'di', 'ke', 'dari'],
  ['Buku itu ada ____ atas meja.', 'di', 'ke', 'dari'], ['Nenek tinggal ____ kampung.', 'di', 'ke', 'dari'],
  ['Kami makan ____ kantin.', 'di', 'ke', 'dari'], ['Ayah membawa kami ____ zoo.', 'ke', 'di', 'dari'],
  ['Saya hendak pergi ____ tandas.', 'ke', 'di', 'dari'], ['Ibu menghantar adik ____ sekolah.', 'ke', 'di', 'dari'],
  ['Buah itu jatuh ____ pokok.', 'dari', 'di', 'ke'], ['Hujan turun ____ langit.', 'dari', 'di', 'ke'],
  ['Adik terjatuh ____ buaian.', 'dari', 'di', 'ke'], ['Air mengalir ____ bukit.', 'dari', 'di', 'ke'],
  ['Surat ini datang ____ nenek.', 'dari', 'di', 'ke'],
];

const PENJODOH = [
  ['Ali memelihara dua ____ kucing.', 'ekor', 'buah', 'biji'], ['Ada tiga ____ rumah di sini.', 'buah', 'ekor', 'batang'],
  ['Saya makan dua ____ epal.', 'biji', 'ekor', 'helai'], ['Cikgu memberi lima ____ kertas.', 'helai', 'ekor', 'biji'],
  ['Ayah menanam tiga ____ pokok.', 'batang', 'ekor', 'helai'], ['Datuk mempunyai dua ____ lembu.', 'ekor', 'buah', 'batang'],
  ['Kami menaiki dua ____ bas.', 'buah', 'ekor', 'biji'], ['Saya ada tiga ____ pensel.', 'batang', 'ekor', 'helai'],
  ['Ibu menggoreng tiga ____ telur.', 'biji', 'ekor', 'helai'], ['Lima ____ murid berbaris.', 'orang', 'ekor', 'biji'],
  ['Saya mempunyai dua ____ baju.', 'helai', 'batang', 'ekor'], ['Ibu membeli dua ____ ikan.', 'ekor', 'biji', 'helai'],
  ['Adik membeli tiga ____ buku.', 'buah', 'ekor', 'helai'], ['Ayah membeli dua ____ kasut.', 'pasang', 'ekor', 'helai'],
  ['Kakak memetik tiga ____ bunga.', 'kuntum', 'ekor', 'helai'],
];

const GANDA_NOUNS = ['kuda', 'buku', 'rumah', 'kereta', 'meja', 'pokok', 'bunga', 'murid', 'burung', 'kucing', 'lembu', 'ikan'];
const GANDA_1 = GANDA_NOUNS.map((w) => [w, `${w}-${w}`, `${w} ${w}`, `${w}${w}`]);

const SINONIM_1 = [
  ['cantik', 'indah', 'hodoh', 'lambat'], ['pandai', 'bijak', 'malas', 'kotor'], ['gembira', 'riang', 'sedih', 'marah'],
  ['ayah', 'bapa', 'ibu', 'adik'], ['ibu', 'emak', 'bapa', 'nenek'], ['rajin', 'tekun', 'malas', 'takut'],
  ['cepat', 'laju', 'perlahan', 'lemah'], ['betul', 'benar', 'salah', 'lama'], ['mudah', 'senang', 'susah', 'berat'],
  ['tolong', 'bantu', 'halang', 'tutup'], ['murid', 'pelajar', 'guru', 'doktor'], ['badan', 'tubuh', 'kaki', 'kepala'],
  ['bising', 'riuh', 'senyap', 'gelap'], ['sedih', 'pilu', 'gembira', 'lapar'],
];

const PASSAGE_2 = [
  { p: 'Ali ada seekor kucing. Kucing itu berwarna putih. Ali memberi susu kepada kucing itu setiap pagi.', qs: [
    ['Apakah warna kucing Ali?', 'putih', 'hitam', 'kuning'], ['Apakah yang diberi Ali kepada kucing itu?', 'susu', 'ikan', 'nasi'],
    ['Bilakah Ali memberi susu?', 'setiap pagi', 'setiap petang', 'setiap malam'] ] },
  { p: 'Hari ini hari Sabtu. Siti dan ibunya pergi ke pasar. Mereka membeli ikan, sayur dan buah.', qs: [
    ['Ke manakah Siti dan ibunya pergi?', 'pasar', 'sekolah', 'taman'], ['Apakah yang mereka beli?', 'ikan, sayur dan buah', 'buku dan pensel', 'baju dan kasut'],
    ['Hari apakah hari ini?', 'Sabtu', 'Isnin', 'Jumaat'] ] },
  { p: 'Pak Ali ialah seorang petani. Dia menanam padi di sawah. Dia bekerja dari pagi hingga petang.', qs: [
    ['Siapakah Pak Ali?', 'petani', 'guru', 'doktor'], ['Apakah yang ditanam oleh Pak Ali?', 'padi', 'jagung', 'bunga'],
    ['Di manakah Pak Ali bekerja?', 'di sawah', 'di sekolah', 'di kedai'] ] },
  { p: 'Adik suka bermain di taman. Dia bermain buaian dan gelongsor. Selepas itu, dia pulang untuk mandi.', qs: [
    ['Apakah yang dimain oleh adik?', 'buaian dan gelongsor', 'bola dan layang-layang', 'pasir dan air'],
    ['Apakah yang dilakukan oleh adik selepas bermain?', 'mandi', 'tidur', 'makan'], ['Di manakah adik bermain?', 'di taman', 'di sekolah', 'di rumah'] ] },
];

const PASSAGE_3 = [
  { p: 'Sekolah kami mengadakan hari sukan pada hari Rabu. Semua murid memakai baju sukan berwarna biru. Rumah merah memperoleh tempat pertama. Murid-murid bersorak dengan gembira.', qs: [
    ['Pada hari apakah hari sukan diadakan?', 'Rabu', 'Selasa', 'Khamis'], ['Apakah warna baju sukan murid?', 'biru', 'merah', 'hijau'],
    ['Rumah apakah yang memperoleh tempat pertama?', 'rumah merah', 'rumah biru', 'rumah hijau'], ['Bagaimanakah perasaan murid-murid?', 'gembira', 'sedih', 'marah'] ] },
  { p: 'Kami sekeluarga pergi bercuti ke Pulau Langkawi. Kami menaiki feri dari Kuala Perlis. Di sana, kami mandi laut dan makan makanan laut. Kami pulang pada hari Ahad.', qs: [
    ['Ke manakah mereka bercuti?', 'Pulau Langkawi', 'Pulau Pinang', 'Melaka'], ['Mereka menaiki apa dari Kuala Perlis?', 'feri', 'kapal terbang', 'bas'],
    ['Apakah yang mereka lakukan di sana?', 'mandi laut dan makan makanan laut', 'mendaki gunung', 'menonton wayang'], ['Bilakah mereka pulang?', 'hari Ahad', 'hari Sabtu', 'hari Isnin'] ] },
  { p: 'Mei Ling suka membaca. Setiap petang, dia pergi ke perpustakaan awam. Dia meminjam dua buah buku setiap kali. Dia berjanji akan memulangkan buku itu tepat pada masanya.', qs: [
    ['Apakah kegemaran Mei Ling?', 'membaca', 'berenang', 'melukis'], ['Bilakah dia pergi ke perpustakaan?', 'setiap petang', 'setiap pagi', 'setiap malam'],
    ['Berapa buah buku yang dipinjamnya setiap kali?', 'dua', 'tiga', 'empat'], ['Apakah yang dijanjikan oleh Mei Ling?', 'memulangkan buku tepat pada masanya', 'membeli buku baharu', 'menulis sebuah cerita'] ] },
];
const MEN_ITEMS = [
  ['tulis', 'menulis', 'mentulis', 'memtulis'], ['baca', 'membaca', 'mengbaca', 'menbaca'], ['ambil', 'mengambil', 'menambil', 'memambil'],
  ['sapu', 'menyapu', 'mensapu', 'mengsapu'], ['potong', 'memotong', 'mempotong', 'mengpotong'], ['gigit', 'menggigit', 'mengigit', 'menigit'],
  ['jahit', 'menjahit', 'menyahit', 'mengjahit'], ['cuci', 'mencuci', 'mengcuci', 'menyuci'], ['masak', 'memasak', 'mengmasak', 'menmasak'],
  ['basuh', 'membasuh', 'menbasuh', 'mengbasuh'], ['tanam', 'menanam', 'mentanam', 'mengtanam'], ['lukis', 'melukis', 'menlukis', 'menglukis'],
  ['ikat', 'mengikat', 'menikat', 'meikat'], ['tendang', 'menendang', 'mentendang', 'mengtendang'], ['dengar', 'mendengar', 'mengdengar', 'memdengar'],
];

const AWALAN_AYAT = [
  ['Ali ____ bola ke gol.', 'menendang', 'ditendang', 'bertendang'], ['Bola itu ____ oleh Ali.', 'ditendang', 'menendang', 'bertendang'],
  ['Adik sedang ____ di padang.', 'bermain', 'dimain', 'termain'], ['Surat itu ____ oleh ibu.', 'ditulis', 'menulis', 'tulisan'],
  ['Ibu ____ nasi di dapur.', 'memasak', 'dimasak', 'bermasak'], ['Nasi itu ____ oleh ibu.', 'dimasak', 'memasak', 'bermasak'],
  ['Dia terlalu penat dan ____ di sofa.', 'tertidur', 'menidur', 'ditidur'], ['Kakak ____ di sekolah.', 'belajar', 'berajar', 'terajar'],
  ['Ayah ____ di syarikat besar.', 'bekerja', 'berkerja', 'dikerja'], ['Ikan ____ di dalam kolam.', 'berenang', 'menerenang', 'direnang'],
  ['Pintu itu ____ oleh Ali.', 'ditutup', 'menutup', 'bertutup'], ['Lampu itu ____ oleh ibu semalam.', 'dipasang', 'memasang', 'berpasang'],
  ['Ibu ____ lampu itu.', 'memasang', 'dipasang', 'terpasang'], ['Murid-murid ____ di dalam dewan.', 'berkumpul', 'dikumpul', 'mengumpul'],
];

const AKHIRAN_AN = [
  ['makanan', 'makan', 'termakan'], ['minuman', 'minum', 'diminum'], ['tulisan', 'tulis', 'menulis'], ['mainan', 'main', 'bermain'],
  ['bacaan', 'baca', 'membaca'], ['lukisan', 'lukis', 'melukis'], ['hiasan', 'hias', 'menghias'], ['nyanyian', 'nyanyi', 'menyanyi'],
  ['pakaian', 'pakai', 'memakai'], ['tanaman', 'tanam', 'menanam'], ['masakan', 'masak', 'memasak'], ['lawatan', 'lawat', 'melawat'],
  ['jualan', 'jual', 'menjual'], ['hidangan', 'hidang', 'terhidang'],
].map(([a, w1, w2]) => ['', a, w1, w2]);

const HUBUNG = [
  ['Ali ____ Abu bermain bola.', 'dan', 'tetapi', 'kerana'], ['Kamu mahu teh ____ kopi?', 'atau', 'dan', 'kerana'],
  ['Hari hujan ____ kami tetap ke sekolah.', 'tetapi', 'atau', 'kerana'], ['Adik menangis ____ jatuh basikal.', 'kerana', 'tetapi', 'atau'],
  ['Belajar rajin ____ lulus peperiksaan.', 'supaya', 'tetapi', 'atau'], ['Ibu membeli ikan ____ sayur.', 'dan', 'tetapi', 'kerana'],
  ['Kita mesti makan sayur ____ badan sihat.', 'supaya', 'tetapi', 'atau'], ['Saya mahu ke pasar ____ ibu tidak mengizinkan.', 'tetapi', 'atau', 'kerana'],
  ['____ hujan, kami tidak bermain di luar.', 'Jika', 'Tetapi', 'Dan'], ['Dia tidak datang ____ sakit.', 'kerana', 'dan', 'atau'],
  ['Pilih satu: nasi ____ roti.', 'atau', 'dan', 'tetapi'], ['Ali pandai ____ rajin.', 'dan', 'atau', 'supaya'],
  ['Ayah letih ____ dia tetap bekerja.', 'tetapi', 'atau', 'supaya'],
];

const SIMPULAN_1 = [
  ['kaki ayam', 'tidak memakai kasut'], ['ringan tulang', 'rajin'], ['berat tulang', 'malas'], ['panjang tangan', 'suka mencuri'],
  ['besar kepala', 'sombong'], ['murah hati', 'suka memberi'], ['kepala batu', 'degil'], ['cahaya mata', 'anak'],
  ['makan angin', 'bersiar-siar'], ['berat mulut', 'pendiam'], ['kecil hati', 'terasa hati'], ['besar hati', 'berasa bangga'],
  ['putih hati', 'ikhlas'], ['buah hati', 'orang yang disayangi'],
];

const MAJMUK_PADU = [['mata', 'hari'], ['jawatan', 'kuasa'], ['setia', 'usaha'], ['suruhan', 'jaya'], ['kerja', 'sama'], ['olah', 'raga'],
  ['tata', 'bahasa'], ['warga', 'negara'], ['pesuruh', 'jaya'], ['antara', 'bangsa'], ['tanda', 'tangan'], ['tanggung', 'jawab']];
const MAJMUK_PISAH = [['kereta', 'api'], ['kapal', 'terbang'], ['surat', 'khabar'], ['rumah', 'tangga'], ['kaki', 'lima'], ['ibu', 'bapa']];
const MAJMUK = [
  ...MAJMUK_PADU.map(([a, b]) => ['', a + b, `${a} ${b}`, `${a}-${b}`]),
  ...MAJMUK_PISAH.map(([a, b]) => ['', `${a} ${b}`, a + b, `${a}-${b}`]),
];

const APITAN = [
  ['Kita mesti menjaga ____ sekolah.', 'kebersihan', 'bersih', 'membersihkan'], ['Dia berasa bangga dengan ____ anaknya.', 'kejayaan', 'jaya', 'menjayakan'],
  ['Kami menjalinkan ____ yang erat.', 'persahabatan', 'sahabat', 'bersahabat'], ['Kami menghadiri ____ Bahasa Melayu.', 'pelajaran', 'belajar', 'pelajar'],
  ['Makan sayur baik untuk ____ badan.', 'kesihatan', 'sihat', 'menyihatkan'], ['Kami kagum melihat ____ pantai itu.', 'keindahan', 'indah', 'mengindahkan'],
  ['Adik menyertai ____ melukis.', 'pertandingan', 'bertanding', 'tanding'], ['Atlet itu mempunyai ____ yang luar biasa.', 'kekuatan', 'kuat', 'menguatkan'],
  ['Ayah ialah ____ bas.', 'pemandu', 'memandu', 'pandu'], ['Abang ialah ____ bola sepak.', 'pemain', 'bermain', 'mainan'],
  ['Kakak ialah seorang ____ yang berbakat.', 'pelukis', 'melukis', 'lukisan'], ['Setiap ____ menyukai cerita itu.', 'pembaca', 'membaca', 'bacaan'],
];

const SENDI_2 = [
  ['Saya menulis surat ____ nenek.', 'kepada', 'daripada', 'di'], ['Hadiah ini ialah ____ ibu.', 'daripada', 'kepada', 'di'],
  ['Ibu memberikan wang ____ adik.', 'kepada', 'daripada', 'di'], ['Saya menerima buku ____ cikgu.', 'daripada', 'kepada', 'ke'],
  ['Adik lebih tinggi ____ saya.', 'daripada', 'kepada', 'di'], ['Gajah lebih besar ____ kucing.', 'daripada', 'kepada', 'di'],
  ['Kita mesti taat ____ ibu bapa.', 'kepada', 'daripada', 'di'], ['Kuih ini diperbuat ____ tepung.', 'daripada', 'kepada', 'di'],
  ['Meja itu diperbuat ____ kayu.', 'daripada', 'kepada', 'di'], ['Dia berterima kasih ____ cikgu.', 'kepada', 'daripada', 'di'],
  ['Ali meminjam pensel ____ Abu.', 'daripada', 'kepada', 'di'], ['Ali meminjamkan pensel ____ Abu.', 'kepada', 'daripada', 'di'],
  ['Hadiah itu diberikan ____ pemenang.', 'kepada', 'daripada', 'di'],
];

const AYAT_TYPES = ['ayat tunggal', 'ayat majmuk', 'bukan ayat'];
const AYAT_1 = [
  ...['Ali membaca buku.', 'Adik bermain di taman.', 'Ibu memasak nasi goreng.', 'Burung terbang tinggi di langit.',
    'Kami pergi ke sekolah setiap hari.', 'Ayah membeli kereta baharu.'].map((s) => [s, 'ayat tunggal']),
  ...['Ali membaca buku dan Siti menulis surat.', 'Ibu memasak nasi tetapi ayah membeli kuih.', 'Kami membantu ibu supaya dia tidak penat.',
    'Adik menangis kerana jatuh basikal.', 'Murid yang rajin itu mendapat hadiah.', 'Saya makan nasi dan adik makan roti.',
    'Hujan turun tetapi kami tetap bermain bola.'].map((s) => [s, 'ayat majmuk']),
  ...['Kucing yang comel itu', 'Sedang membaca buku di taman', 'Di bawah pokok mangga'].map((s) => [s, 'bukan ayat']),
];

const PERIBAHASA_1 = [ // [peribahasa, meaning, group]
  ['Bersatu teguh, bercerai roboh', 'perpaduan membawa kekuatan', 'u1'], ['Ringan sama dijinjing, berat sama dipikul', 'bekerjasama melakukan sesuatu kerja', 'u2'],
  ['Bagai aur dengan tebing', 'saling bergantung antara satu sama lain', 'u3'], ['Air dicincang tidak akan putus', 'hubungan adik-beradik tidak akan putus walaupun bergaduh', 'u4'],
  ['Rajin pangkal pandai', 'rajin belajar menjadikan seseorang pandai', 'e1'], ['Malu bertanya sesat jalan', 'orang yang tidak mahu bertanya akan rugi', 'e2'],
  ['Sediakan payung sebelum hujan', 'bersedia sebelum sesuatu perkara berlaku', 'p'], ['Berakit-rakit ke hulu, berenang-renang ke tepian', 'bersusah-susah dahulu, kemudian baru bersenang-senang', 'h'],
  ['Seperti kacang lupakan kulit', 'orang yang lupa jasa dan asal usulnya setelah berjaya', 'b1'], ['Pagar makan padi', 'orang yang dipercayai merosakkan amanah yang diberikan', 'b2'],
  ['Di mana bumi dipijak, di situ langit dijunjung', 'kita mesti menghormati adat tempat yang kita duduki', 'a'], ['Alah bisa tegal biasa', 'sesuatu yang susah menjadi mudah jika sudah biasa', 'k'],
];

const PASSAGE_4 = [
  { p: 'Pada hari Ahad, Hakim dan ayahnya pergi memancing di sungai. Selepas dua jam, Hakim menangkap tiga ekor ikan. Dia melepaskan seekor ikan kembali ke dalam sungai kerana ikan itu masih kecil.', qs: [
    ['Dengan siapakah Hakim pergi memancing?', 'ayahnya', 'abangnya', 'datuknya'], ['Berapa ekor ikan yang ditangkap oleh Hakim?', 'tiga', 'dua', 'lima'],
    ['Mengapakah Hakim melepaskan seekor ikan?', 'kerana ikan itu masih kecil', 'kerana ikan itu busuk', 'kerana dia takut'],
    ['Apakah sifat Hakim?', 'penyayang', 'kedekut', 'malas'] ] },
  { p: 'Setiap pagi, Puan Salmah menjual nasi lemak di tepi jalan. Nasi lemaknya sentiasa habis sebelum pukul sembilan. Anaknya, Farah, membantu ibunya membungkus nasi lemak sebelum pergi ke sekolah.', qs: [
    ['Apakah yang dijual oleh Puan Salmah?', 'nasi lemak', 'kuih-muih', 'roti canai'], ['Nasi lemak habis sebelum pukul berapa?', 'sembilan', 'tujuh', 'sepuluh'],
    ['Apakah yang dibuat oleh Farah sebelum ke sekolah?', 'membungkus nasi lemak', 'menjual kuih', 'membasuh pinggan'], ['Apakah sifat Farah?', 'rajin', 'malas', 'sombong'] ] },
  { p: 'Pokok-pokok di hutan ditebang untuk membuat jalan raya. Banyak haiwan kehilangan tempat tinggal. Seekor harimau terpaksa keluar mencari makanan di kampung. Penduduk kampung berasa takut lalu meminta bantuan pegawai hidupan liar. Pegawai itu membawa harimau itu pulang ke hutan.', qs: [
    ['Mengapakah banyak haiwan kehilangan tempat tinggal?', 'kerana pokok-pokok di hutan ditebang', 'kerana banjir', 'kerana kemarau'],
    ['Siapakah yang dipanggil untuk membantu?', 'pegawai hidupan liar', 'guru', 'doktor'], ['Bagaimanakah perasaan penduduk kampung?', 'takut', 'gembira', 'bosan'],
    ['Apakah yang dilakukan oleh pegawai itu?', 'membawa harimau itu pulang ke hutan', 'memberi makan harimau itu', 'menjual harimau itu'] ] },
  { p: 'Cikgu Rina meminta murid Tahun Empat menanam biji kacang di dalam pasu kecil. Setiap hari, mereka menyiram pasu itu dan melihat pertumbuhannya. Selepas seminggu, biji kacang Dina mula bercambah. Dina melompat kegirangan.', qs: [
    ['Apakah yang ditanam oleh murid?', 'biji kacang', 'biji jagung', 'biji bunga'], ['Apakah yang dilakukan oleh murid setiap hari?', 'menyiram dan melihat pertumbuhannya', 'mencabut dan menyimpannya', 'menjual hasilnya'],
    ['Bilakah biji kacang Dina mula bercambah?', 'selepas seminggu', 'selepas sebulan', 'pada hari yang sama'], ['Bagaimanakah perasaan Dina?', 'gembira', 'sedih', 'marah'] ] },
];

const GANDA_TYPES = ['ganda penuh', 'ganda separa', 'ganda berentak'];
const GANDA_2 = [
  ...['buku-buku', 'kereta-kereta', 'cepat-cepat', 'rumah-rumah', 'kecil-kecil'].map((w) => [w, 'ganda penuh']),
  ...['lelaki', 'tetamu', 'pepohon'].map((w) => [w, 'ganda separa']),
  ...['sayur-mayur', 'lauk-pauk', 'kuih-muih', 'cerai-berai', 'gunung-ganang', 'tali-temali', 'huru-hara', 'kusut-masai', 'hiruk-pikuk'].map((w) => [w, 'ganda berentak']),
];

const TANDA_2 = [
  ['Ibu membeli ikan ____ sayur dan buah.', ',', '.', '?'], ['Aduh ____ sakitnya kaki saya!', ',', '.', '?'],
  ['Bahan-bahan ____ telur, gula dan tepung.', ':', '.', '?'], ['Siapakah yang mengambil pensel saya ____', '?', '.', ','],
  ['Adik tidur lena di atas katil ____', '.', '?', ','], ['Warna bendera Malaysia ialah merah ____ putih, biru dan kuning.', ',', '.', '?'],
  ['Nama saya Ahmad ____ Saya berumur sepuluh tahun.', '.', '?', ','], ['Berapakah harga baju itu ____', '?', '.', ','],
  ['Pada hari Sabtu ____ kami pergi berkelah.', ',', '.', '?'], ['Hari ini kita belajar tentang haiwan ____ kucing, lembu dan ayam.', ':', '.', '?'],
  ['Mengapa kamu lewat ke sekolah ____', '?', '.', ','], ['Kami membeli pen ____ pensel dan pemadam.', ',', '.', '?'],
  ['Alangkah cantiknya bunga itu ____', '!', '?', ','], ['Selamat pagi ____ cikgu.', ',', '.', '?'],
];

// [passive, active, intransitive]
const PASIF = [
  ['Buku itu dibaca oleh Ali.', 'Ali membaca buku itu.', 'Ali sedang tidur.'], ['Kuih itu dimakan oleh adik.', 'Adik memakan kuih itu.', 'Adik sedang menari.'],
  ['Pintu dibuka oleh ayah.', 'Ayah membuka pintu.', 'Ayah sedang duduk.'], ['Lantai disapu oleh kakak.', 'Kakak menyapu lantai.', 'Kakak sedang berehat.'],
  ['Surat itu ditulis oleh Siti.', 'Siti menulis surat itu.', 'Siti tersenyum.'], ['Baju itu dijahit oleh nenek.', 'Nenek menjahit baju itu.', 'Nenek berjalan perlahan.'],
  ['Bola ditendang oleh Abu.', 'Abu menendang bola.', 'Abu berlari laju.'], ['Pokok itu ditanam oleh datuk.', 'Datuk menanam pokok itu.', 'Datuk bangun awal.'],
  ['Rumah itu dicat oleh pak cik.', 'Pak cik mengecat rumah itu.', 'Pak cik pulang lewat.'], ['Nasi dimasak oleh ibu.', 'Ibu memasak nasi.', 'Ibu pergi ke pasar.'],
  ['Kereta itu dibasuh oleh ayah.', 'Ayah membasuh kereta itu.', 'Ayah pergi bekerja.'], ['Gambar itu dilukis oleh Mei Ling.', 'Mei Ling melukis gambar itu.', 'Mei Ling berdiri.'],
];

const PERIBAHASA_2 = [
  ['Seperti katak di bawah tempurung', 'orang yang sempit pengetahuannya'], ['Seperti kera mendapat bunga', 'orang yang mendapat sesuatu tetapi tidak tahu menghargainya'],
  ['Ada udang di sebalik batu', 'ada niat yang tersembunyi'], ['Terlajak perahu boleh diundur, terlajak kata buruk padahnya', 'kata-kata yang sudah diucapkan tidak boleh ditarik balik'],
  ['Sudah terhantuk baru tengadah', 'baru insaf setelah mendapat kesusahan'], ['Pucuk dicita ulam mendatang', 'mendapat sesuatu yang dihajati tanpa disangka-sangka'],
  ['Seperti telur di hujung tanduk', 'berada dalam keadaan bahaya'], ['Seperti pinang dibelah dua', 'sangat serupa'],
  ['Bagai isi dengan kuku', 'sangat akrab'], ['Sedikit demi sedikit, lama-lama menjadi bukit', 'simpanan sedikit lama-kelamaan menjadi banyak'],
  ['Tak ada rotan akar pun jadi', 'jika tiada yang terbaik, yang ada pun boleh digunakan'], ['Jauh berjalan luas pengalaman', 'orang yang banyak mengembara luas pengalamannya'],
];

const SIMPULAN_2 = [
  ['buah mulut', 'perkara yang menjadi bualan orang'], ['cakar ayam', 'tulisan yang buruk'], ['langkah kanan', 'bernasib baik'],
  ['tebal muka', 'tidak tahu malu'], ['tipis telinga', 'cepat marah', 'marah'], ['gigit jari', 'kecewa'], ['panas hati', 'marah', 'marah'],
  ['sejuk hati', 'berasa tenteram'], ['ibu kota', 'bandar utama sesebuah negara'], ['ibu jari', 'jari yang paling besar'],
  ['anak emas', 'orang yang paling disayangi'], ['anak buah', 'orang di bawah pimpinan seseorang'], ['kaki bangku', 'orang yang tidak pandai bermain bola'],
  ['lembut hati', 'mudah berasa kasihan'],
];

const PASSAGE_5 = [
  { p: 'Rumah Pak Hamid terletak di tepi sungai. Pada musim tengkujuh, sungai itu sering melimpah. Pak Hamid sudah bersedia dengan membina rumah yang tinggi dan menyimpan makanan kering. Apabila air naik, keluarganya tidak panik.', qs: [
    ['Bilakah sungai itu sering melimpah?', 'musim tengkujuh', 'musim kemarau', 'musim buah'],
    ['Apakah persediaan yang dibuat oleh Pak Hamid?', 'membina rumah yang tinggi dan menyimpan makanan kering', 'membeli kereta baharu dan menanam padi', 'berpindah ke bandar dan menjual rumah'],
    ['Peribahasa manakah yang sesuai dengan Pak Hamid?', 'Sediakan payung sebelum hujan', 'Alah bisa tegal biasa', 'Pagar makan padi'],
    ['Mengapakah keluarga Pak Hamid tidak panik?', 'kerana mereka sudah bersedia', 'kerana air tidak naik', 'kerana mereka tidak tahu'] ] },
  { p: 'Syafiq mempunyai kebiasaan buruk, iaitu menangguhkan kerja rumah. Dia selalu bermain dahulu. Pada suatu hari, dia tidak dapat menghantar buku latihan kerana tidak menyiapkan tugasan. Cikgu menasihatinya dengan lembut. Sejak itu, Syafiq menyiapkan kerja rumah sebelum bermain.', qs: [
    ['Apakah kebiasaan buruk Syafiq?', 'menangguhkan kerja rumah', 'berbohong kepada guru', 'membuang sampah merata-rata'],
    ['Bagaimanakah cikgu menasihati Syafiq?', 'dengan lembut', 'dengan kasar', 'dengan menjerit'],
    ['Apakah pengajaran cerita ini?', 'kita mesti menyiapkan tugasan dengan segera', 'kita mesti bermain sepanjang hari', 'kita tidak perlu mendengar nasihat'],
    ['Apakah yang dilakukan oleh Syafiq sejak itu?', 'menyiapkan kerja rumah sebelum bermain', 'berhenti bermain terus', 'menyalin kerja kawan'] ] },
  { p: 'Hutan bakau berfungsi sebagai benteng semula jadi. Akar pokok bakau yang kuat dapat menahan hakisan tanah di pinggir pantai. Selain itu, hutan bakau menjadi tempat ikan dan udang bertelur. Oleh itu, kita perlu menjaga hutan bakau.', qs: [
    ['Apakah fungsi akar pokok bakau?', 'menahan hakisan tanah', 'menghasilkan bunga wangi', 'menghasilkan garam'],
    ['Mengapakah kita perlu menjaga hutan bakau?', 'kerana ia melindungi pantai dan menjadi tempat ikan bertelur', 'kerana ia tempat bermain layang-layang', 'kerana ia menghasilkan banyak minyak'],
    ['Di manakah ikan dan udang bertelur?', 'di hutan bakau', 'di padang pasir', 'di gunung'],
    ['Apakah maksud benteng semula jadi?', 'perlindungan yang terjadi secara semula jadi', 'tembok yang dibina oleh manusia', 'pagar di sekeliling rumah'] ] },
  { p: 'Nurul gemar menabung. Dia menyimpan sedikit wang saku setiap hari di dalam tabung buluh. Selepas enam bulan, tabungnya penuh. Dia membeli buku cerita dan menderma sebahagian wang itu kepada rumah anak yatim. Ibunya berasa bangga.', qs: [
    ['Di manakah Nurul menyimpan wang?', 'di dalam tabung buluh', 'di dalam bank', 'di dalam dompet'],
    ['Berapa lamakah masa diambil sehingga tabung penuh?', 'enam bulan', 'enam hari', 'enam tahun'],
    ['Apakah yang dilakukan oleh Nurul dengan wang itu?', 'membeli buku cerita dan menderma sebahagian', 'membeli permainan sahaja', 'menyimpan semuanya'],
    ['Peribahasa manakah yang sesuai dengan Nurul?', 'Sedikit demi sedikit, lama-lama menjadi bukit', 'Pagar makan padi', 'Seperti kacang lupakan kulit'] ] },
];

const TRANSITIF = [ // [transitive, intransitive, intransitive]
  ['Ibu menyapu lantai.', 'Ibu tersenyum manis.', 'Ibu duduk di kerusi.'], ['Ayah memandu kereta.', 'Ayah tiba petang tadi.', 'Ayah berehat di rumah.'],
  ['Adik menulis surat.', 'Adik menangis kuat.', 'Adik tidur lena.'], ['Kakak melukis bunga.', 'Kakak berlari ke sekolah.', 'Kakak duduk diam.'],
  ['Abang membasuh motosikal.', 'Abang pulang awal.', 'Abang bangun pagi.'], ['Cikgu mengajar Matematik.', 'Cikgu masuk ke kelas.', 'Cikgu datang awal.'],
  ['Nenek menjahit baju.', 'Nenek berjalan perlahan.', 'Nenek berehat.'], ['Murid itu membaca buku.', 'Murid itu bangun.', 'Murid itu ketawa.'],
  ['Pak Ali menanam padi.', 'Pak Ali pergi ke sawah.', 'Pak Ali pulang petang.'], ['Siti memasak nasi.', 'Siti tersenyum.', 'Siti menangis.'],
  ['Kucing menangkap tikus.', 'Kucing tidur.', 'Kucing berlari laju.'], ['Burung membina sarang.', 'Burung terbang tinggi.', 'Burung berkicau riang.'],
];

const MAJMUK_TYPES = ['ayat majmuk gabungan', 'ayat majmuk pancangan', 'ayat tunggal'];
const AYAT_2 = [
  ...['Ali membaca buku dan Siti menulis surat.', 'Ibu memasak nasi tetapi ayah membeli kuih.', 'Kita boleh naik bas atau kita boleh naik kereta api.',
    'Hujan turun tetapi kami tetap bermain bola.', 'Adik bermain bola dan kakak membaca buku.', 'Saya makan nasi dan adik makan roti.'].map((s) => [s, 'ayat majmuk gabungan']),
  ...['Murid yang rajin itu mendapat hadiah.', 'Adik menangis kerana jatuh basikal.', 'Ibu berkata bahawa dia akan pulang lewat.',
    'Kami tidak keluar jika hujan turun.', 'Ayah membeli buku yang saya mahu.', 'Dia belajar rajin supaya lulus peperiksaan.',
    'Cikgu memberitahu bahawa peperiksaan bermula esok.'].map((s) => [s, 'ayat majmuk pancangan']),
  ...['Ibu memasak nasi.', 'Adik bermain di taman bersama kawan-kawannya.', 'Ayah dan ibu pergi ke pasar.', 'Kami melawat nenek di kampung.',
    'Murid-murid berbaris di dataran.'].map((s) => [s, 'ayat tunggal']),
];

const PERIBAHASA_3 = [
  ['Menang sorak, kampung tergadai', 'menang tetapi kehilangan banyak perkara', 'a'], ['Sambil menyelam minum air', 'membuat dua pekerjaan pada satu masa', 'b'],
  ['Sebab nila setitik, rosak susu sebelanga', 'kesalahan kecil merosakkan nama baik', 'c'], ['Bagai mencurah air ke daun keladi', 'nasihat yang tidak diendahkan', 'd'],
  ['Seperti ayam kehilangan induk', 'orang yang kehilangan tempat bergantung', 'e'], ['Hancur badan dikandung tanah, budi baik dikenang jua', 'jasa dan budi baik orang akan sentiasa dikenang', 'f'],
  ['Ke bukit sama didaki, ke lurah sama dituruni', 'sama-sama menghadapi susah dan senang', 'g'], ['Lembu punya susu, sapi dapat nama', 'orang lain mendapat nama atas usaha orang lain', 'h'],
  ['Kuman di seberang laut nampak, gajah di pelupuk mata tidak kelihatan', 'mudah melihat kesalahan orang lain tetapi tidak melihat kesalahan sendiri', 'i'],
  ['Biar lambat asalkan selamat', 'lebih baik berhati-hati walaupun lambat', 'j'], ['Yang bulat tidak datang bergolek, yang pipih tidak datang melayang', 'kejayaan tidak diperoleh tanpa usaha', 'k'],
  ['Kalau tidak dipecahkan ruyung, manakan dapat sagunya', 'tidak berusaha tidak akan mendapat hasil', 'k'],
];

const SINONIM_2 = [
  ['tabah', 'cekal', 'lemah', 'gusar'], ['pelik', 'ganjil', 'lazim', 'cekal'], ['termasyhur', 'terkenal', 'asing', 'sunyi'],
  ['angkuh', 'sombong', 'rendah hati', 'bimbang'], ['damai', 'aman', 'kacau', 'bosan'], ['ramah', 'mesra', 'garang', 'ganjil'],
  ['cuai', 'lalai', 'berhati-hati', 'tabah'], ['jemu', 'bosan', 'seronok', 'cekal'], ['gusar', 'bimbang', 'tenang', 'sombong'],
  ['lazim', 'biasa', 'ganjil', 'angkuh'], ['lengang', 'sunyi', 'riuh', 'lazim'], ['tekun', 'rajin', 'malas', 'gusar'],
];

const ANTONIM_2 = [
  ['jujur', 'curang', 'ikhlas', 'pantas'], ['kaya', 'miskin', 'berada', 'jemu'], ['luas', 'sempit', 'besar', 'rajin'],
  ['murah', 'mahal', 'rendah', 'tabah'], ['maju', 'mundur', 'pantas', 'kuat'], ['sihat', 'sakit', 'segar', 'tebal'],
  ['cetek', 'dalam', 'nipis', 'lembut'], ['tajam', 'tumpul', 'licin', 'halus'], ['nipis', 'tebal', 'halus', 'lembut'],
  ['ringan', 'berat', 'kecil', 'nipis'], ['lurus', 'bengkok', 'tinggi', 'licin'], ['berani', 'penakut', 'gagah', 'kuat'],
  ['rajin', 'malas', 'tekun', 'pandai'], ['lemah', 'kuat', 'letih', 'sakit'], ['hodoh', 'cantik', 'buruk', 'kotor'],
];

const PASSAGE_6 = [
  { p: 'Sistem pengangkutan awam yang cekap dapat mengurangkan kesesakan jalan raya. Apabila lebih ramai orang menaiki bas dan tren, bilangan kereta di jalan raya berkurang. Hal ini turut mengurangkan pencemaran udara. Oleh itu, kerajaan menggalakkan rakyat menggunakan pengangkutan awam.', qs: [
    ['Apakah kebaikan menggunakan pengangkutan awam?', 'mengurangkan kesesakan dan pencemaran udara', 'menambahkan bilangan kereta', 'menaikkan harga minyak'],
    ['Apakah maksud kesesakan?', 'keadaan sesak atau padat', 'keadaan sunyi', 'keadaan bersih'],
    ['Siapakah yang menggalakkan penggunaan pengangkutan awam?', 'kerajaan', 'peniaga', 'pemandu teksi'],
    ['Apakah isi utama perenggan ini?', 'pengangkutan awam mengurangkan kesesakan dan pencemaran', 'kereta lebih selesa daripada bas', 'tren lebih mahal daripada bas'] ] },
  { p: 'Setiap tahun, murid Tahun Enam menyertai Hari Kebersihan. Mereka membersihkan longkang dan mengutip sampah di sekitar sekolah. Pada mulanya, Danial berasa malas kerana cuaca panas. Namun, dia berubah fikiran apabila melihat sekolah menjadi bersih dan cantik. Dia berasa puas hati dengan hasil kerja mereka.', qs: [
    ['Apakah yang dilakukan oleh murid pada Hari Kebersihan?', 'membersihkan longkang dan mengutip sampah', 'menanam pokok dan membuat kebun', 'mengecat dinding dan pagar'],
    ['Mengapakah Danial berasa malas pada mulanya?', 'kerana cuaca panas', 'kerana dia sakit', 'kerana dia tidak suka sekolah'],
    ['Mengapakah Danial berubah fikiran?', 'kerana sekolah menjadi bersih dan cantik', 'kerana cikgu memarahinya', 'kerana kawannya memberi hadiah'],
    ['Apakah maksud puas hati?', 'berasa senang kerana hasilnya baik', 'berasa marah', 'berasa lapar'] ] },
  { p: 'Penyu ialah haiwan yang dilindungi di negara kita. Penyu betina naik ke pantai pada waktu malam untuk bertelur. Telur-telur itu ditanam di dalam pasir. Sayangnya, banyak telur diambil oleh manusia. Kerajaan menubuhkan pusat penetasan supaya telur dapat dijaga dan anak penyu dilepaskan ke laut.', qs: [
    ['Bilakah penyu betina naik ke pantai?', 'pada waktu malam', 'pada waktu pagi', 'pada waktu tengah hari'],
    ['Mengapakah kerajaan menubuhkan pusat penetasan?', 'supaya telur dapat dijaga', 'supaya telur dapat dijual', 'supaya penyu menjadi haiwan peliharaan'],
    ['Di manakah telur penyu ditanam?', 'di dalam pasir', 'di dalam air', 'di atas batu'],
    ['Apakah maksud dilindungi?', 'dijaga daripada bahaya', 'dijual di pasar', 'dibawa ke bandar'] ] },
  { p: 'Encik Rahim sudah berniaga di pasar malam selama sepuluh tahun. Dia terkenal kerana jujur. Pada suatu hari, seorang pelanggan tertinggal dompetnya di gerai. Encik Rahim menyimpan dompet itu dan memulangkannya keesokan harinya. Pelanggan itu mengucapkan terima kasih berkali-kali.', qs: [
    ['Sudah berapa lamakah Encik Rahim berniaga?', 'sepuluh tahun', 'lima tahun', 'dua puluh tahun'],
    ['Apakah sifat Encik Rahim?', 'jujur', 'tamak', 'pemalu'],
    ['Apakah yang dilakukan oleh Encik Rahim terhadap dompet itu?', 'menyimpannya dan memulangkannya', 'menggunakan wang di dalamnya', 'membuangnya'],
    ['Bilakah dompet itu dipulangkan?', 'keesokan harinya', 'pada hari yang sama', 'seminggu kemudian'] ] },
];

// Sticker pool for the Tahun 1-6 levels: food, one per level.
const TSTICKERS = [...'🍔🍟🍕🌭🥪🌮🌯🥗🍝🍜🍲🍛🍣🍱🥟🍤🍚🍘🍥🥮🍢🍡🍧🍨🎂🍰🧁🥧🍫🍬🍭🍮🍯🧃🥤🧋🍵🥐'];
let tn = 0;
const tl = (id, year, ms, en, icon, gen) => ({ id: `bm-${id}`, year, title: { en, ms }, icon, sticker: { id: `st-bm-t${tn + 1}`, e: TSTICKERS[tn++] }, gen });
const pasifGen = () => {
  const [p, a, i] = pick(PASIF);
  return { key: `pasif|${p}`, prompt: { ms: 'Pilih ayat pasif.' }, answer: p, wide: true, stack: true, choices: shuffle([p, a, i]).map((x) => ({ label: x, value: x })) };
};
const transitif = () => {
  const [t, a, b] = pick(TRANSITIF);
  return { key: `transitif|${t}`, prompt: { ms: 'Pilih ayat yang ada kata kerja transitif.' }, answer: t, wide: true, stack: true, choices: shuffle([t, a, b]).map((x) => ({ label: x, value: x })) };
};

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
    tl('t1-huruf-besar', 1, 'Huruf besar', 'Capital letters', '🔠', mc(HURUF_BESAR, { prompt: 'Pilih ayat yang betul.', wide: true, stack: true })),
    tl('t1-kata-nama', 1, 'Kata nama', 'Nouns', '🏷️', mc(NOUN_VERB.map(([n, v, a]) => ['', n, v, a]), { prompt: 'Pilih kata nama.' })),
    tl('t1-kata-kerja', 1, 'Kata kerja', 'Verbs', '🏃', mc(KATA_KERJA.map(([v, n, a]) => ['', v, n, a]), { prompt: 'Pilih kata kerja.' })),
    tl('t1-isi-ayat', 1, 'Lengkapkan ayat', 'Complete the sentence', '✍️', mc(ISI_KERJA, { prompt: FILL })),
    tl('t1-tanda-baca', 1, 'Tanda baca', 'Punctuation', '❓', mc(TANDA_1, { prompt: 'Pilih tanda baca yang betul.', label: (x) => PUNC[x], wide: true })),
    tl('t1-lawan-kata', 1, 'Lawan kata', 'Opposites', '↔️', mc(ANTONIM_1, { ask: (t) => `Apakah lawan kata bagi ${t}?` })),
    tl('t2-kata-ganti', 2, 'Kata ganti nama diri', 'Pronouns', '🧑', mc(KATA_GANTI, { ask: (t) => `Pilih kata ganti nama bagi ${t}.` })),
    tl('t2-kata-tanya', 2, 'Kata tanya', 'Question words', '🙋', mc(KATA_TANYA, { prompt: 'Pilih kata tanya yang betul.' })),
    tl('t2-di-ke-dari', 2, 'Di, ke, dari', 'Di, ke, dari', '📍', mc(SENDI_1, { prompt: FILL })),
    tl('t2-penjodoh', 2, 'Penjodoh bilangan', 'Number classifiers', '🔢', mc(PENJODOH, { prompt: FILL })),
    tl('t2-kata-ganda', 2, 'Kata ganda', 'Reduplicated words', '👯', mc(GANDA_1, { ask: (t) => `Banyak ${t}. Pilih kata ganda yang betul.` })),
    tl('t2-sinonim', 2, 'Persamaan kata', 'Synonyms', '🟰', mc(SINONIM_1, { ask: (t) => `Apakah persamaan kata bagi ${t}?` })),
    tl('t2-pemahaman', 2, 'Pemahaman: cerita pendek', 'Comprehension: short stories', '📄', passage(PASSAGE_2)),
    tl('t3-awalan-men', 3, 'Awalan meN-', 'Prefix meN-', '🧩', mc(MEN_ITEMS, { ask: (t) => `Tambah awalan men, mem, meng atau meny yang sesuai pada ${t}.` })),
    tl('t3-awalan-ayat', 3, 'Awalan ber-, di-, ter-', 'Prefixes ber-, di-, ter-', '🧱', mc(AWALAN_AYAT, { prompt: FILL })),
    tl('t3-akhiran-an', 3, 'Akhiran -an', 'Suffix -an', '🔚', mc(AKHIRAN_AN, { prompt: 'Pilih perkataan yang ada akhiran an.' })),
    tl('t3-kata-hubung', 3, 'Kata hubung', 'Conjunctions', '🔗', mc(HUBUNG, { prompt: FILL })),
    tl('t3-simpulan-bahasa', 3, 'Simpulan bahasa', 'Idioms', '💬', meaning(SIMPULAN_1, 'simpulan bahasa')),
    tl('t3-kata-adjektif', 3, 'Kata adjektif', 'Adjectives', '🌈', mc(ADJ.map(([a, n, v]) => ['', a, n, v]), { prompt: 'Pilih kata adjektif.' })),
    tl('t3-pemahaman', 3, 'Pemahaman: perenggan', 'Comprehension: paragraphs', '📄', passage(PASSAGE_3)),
    tl('t4-apitan', 4, 'Imbuhan kata nama', 'Noun affixes', '🏗️', mc(APITAN, { prompt: FILL })),
    tl('t4-kata-majmuk', 4, 'Kata majmuk', 'Compound words', '🧲', mc(MAJMUK, { prompt: 'Pilih ejaan yang betul.' })),
    tl('t4-kepada-daripada', 4, 'Kepada dan daripada', 'Kepada and daripada', '📬', mc(SENDI_2, { prompt: FILL })),
    tl('t4-ayat', 4, 'Ayat tunggal dan majmuk', 'Simple and compound sentences', '🧾', mc(AYAT_1, { prompt: 'Apakah jenis ayat ini?', wrongs: (it) => AYAT_TYPES.filter((x) => x !== it[1]), wide: true })),
    tl('t4-peribahasa', 4, 'Peribahasa', 'Proverbs', '📜', meaning(PERIBAHASA_1, 'peribahasa')),
    tl('t4-pemahaman', 4, 'Pemahaman: cerita', 'Comprehension: stories', '📄', passage(PASSAGE_4)),
    tl('t5-jenis-ganda', 5, 'Jenis kata ganda', 'Types of reduplication', '👯', mc(GANDA_2, { ask: (t) => `Apakah jenis kata ganda bagi ${t}?`, wrongs: (it) => GANDA_TYPES.filter((x) => x !== it[1]) })),
    tl('t5-tanda-baca', 5, 'Koma dan titik bertindih', 'Commas and colons', '✒️', mc(TANDA_2, { prompt: 'Pilih tanda baca yang betul.', label: (x) => PUNC[x], wide: true })),
    tl('t5-ayat-pasif', 5, 'Ayat pasif', 'Passive sentences', '🔁', pasifGen),
    tl('t5-peribahasa', 5, 'Peribahasa 2', 'Proverbs 2', '📜', meaning(PERIBAHASA_2, 'peribahasa')),
    tl('t5-simpulan-bahasa', 5, 'Simpulan bahasa 2', 'Idioms 2', '💬', meaning(SIMPULAN_2, 'simpulan bahasa')),
    tl('t5-pemahaman', 5, 'Pemahaman: pengajaran', 'Comprehension: lessons', '📄', passage(PASSAGE_5)),
    tl('t6-kata-kerja-transitif', 6, 'Kata kerja transitif', 'Transitive verbs', '🎯', transitif),
    tl('t6-jenis-ayat', 6, 'Ayat majmuk', 'Compound sentences', '🧾', mc(AYAT_2, { prompt: 'Apakah jenis ayat ini?', wrongs: (it) => MAJMUK_TYPES.filter((x) => x !== it[1]), wide: true, stack: true })),
    tl('t6-peribahasa', 6, 'Peribahasa 3', 'Proverbs 3', '📜', meaning(PERIBAHASA_3, 'peribahasa')),
    tl('t6-sinonim', 6, 'Persamaan kata 2', 'Synonyms 2', '🟰', mc(SINONIM_2, { ask: (t) => `Apakah persamaan kata bagi ${t}?` })),
    tl('t6-antonim', 6, 'Lawan kata 2', 'Opposites 2', '↔️', mc(ANTONIM_2, { ask: (t) => `Apakah lawan kata bagi ${t}?` })),
    tl('t6-pemahaman', 6, 'Pemahaman: bahan ilmiah', 'Comprehension: facts', '📄', passage(PASSAGE_6)),
  ],
};
