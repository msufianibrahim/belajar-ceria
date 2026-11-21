import { pick, rand, shuffle } from './util.js';

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
function look(pool, ask, stack) {
  const it = pick(pool);
  const choices = shuffle([it, ...distract(pool, it)]).map((x) => ({ label: x.say, value: x.say }));
  return { key: `r${it.j}`, prompt: { ms: ask }, text: ar(it.j), choices, answer: it.say, ...(stack && { stack: true }) };
}

const sebut = (pool) => {
  const it = pick(pool);
  return { key: `s${it.j}`, prompt: READ, read: ar(it.j), answer: true, choices: [] };
};

// ---- KSSR Tahun 1–6 (Jawi in Pendidikan Islam). Spellings follow DBP's Pedoman Umum Ejaan Jawi:
// only very common school words; a word whose DBP spelling was in any doubt is left out.

// See the word in rumi, pick its Jawi spelling (wrong choices are other words of the same pattern).
function pilih(pool) {
  const it = pick(pool);
  const choices = shuffle([it, ...distract(pool, it)]).map((x) => ({ label: ar(x.j), value: x.j }));
  return { key: `p${it.j}`, prompt: { ms: 'Pilih tulisan Jawi yang betul.' }, text: it.say, choices, answer: it.j, stack: true };
}

// More open syllables (consonant + alif/ya/wau), and the same with the Jawi-only letters (va left out: no Malay syllables).
const CV = (cs) => [].concat(...L(cs).map((c) => [['ا', 'a'], ['ي', 'i'], ['و', 'u']].map(([v, rv]) => ({ j: c.j + v, say: c.say + rv }))));
const SUKU2 = CV('ک=k ل=l م=m ن=n س=s ر=r ه=h');
const SUKU_KHAS = CV('چ=c ڠ=ng ڤ=p ݢ=g ڽ=ny');

// Letter shapes: the dual-joining letters drawn with a tatweel (ـ) at the start, middle or end of a word.
const PUTUS = HURUF.filter((x) => 'ادذرزوۏ'.includes(x.j)); // never join the letter after them
const SAMBUNG = HURUF.filter((x) => !PUTUS.includes(x));
const POS = { awal: (c) => c + 'ـ', tengah: (c) => 'ـ' + c + 'ـ', akhir: (c) => 'ـ' + c };
function bentuk() {
  const it = pick(SAMBUNG), pos = pick(Object.keys(POS));
  const choices = shuffle([it, ...distract(SAMBUNG, it)]).map((x) => ({ label: x.say, value: x.say }));
  return { key: `b${it.j}${pos}`, prompt: { ms: 'Ini bentuk huruf apa?' }, text: ar(POS[pos](it.j)), choices, answer: it.say };
}
function kedudukan() {
  const it = pick(SAMBUNG), pos = pick(Object.keys(POS));
  return { key: `d${it.j}${pos}`, prompt: { ms: 'Bentuk huruf ini di awal, tengah atau akhir?' }, text: ar(POS[pos](it.j)),
    choices: Object.keys(POS).map((p) => ({ label: p, value: p })), answer: pos };
}
function takSambung() {
  const it = pick(PUTUS);
  const choices = shuffle([it, ...shuffle(SAMBUNG).slice(0, 2)]).map((x) => ({ label: ar(x.j), value: x.j }));
  return { key: `n${it.j}`, prompt: { ms: 'Huruf mana yang tidak bersambung dengan huruf selepasnya?' }, choices, answer: it.j };
}

// Open syllables end in a vowel letter (ا ي و); closed ones end in a consonant (bin بين, kan کن).
const C1 = ['ب', 'ت', 'د', 'ک', 'ل', 'م', 'ن', 'س'];
const BUKA = [].concat(...C1.map((c) => ['ا', 'ي', 'و'].map((v) => c + v)));
const TUTUP = [].concat(...C1.map((c) => [].concat(...['', 'ي', 'و'].map((v) => ['ن', 'م', 'ت', 'ق'].map((e) => c + v + e)))));
function sukuTertutup() {
  const closed = Math.random() < 0.5, [right, wrong] = closed ? [TUTUP, BUKA] : [BUKA, TUTUP];
  const ans = pick(right);
  const choices = shuffle([ans, ...shuffle(wrong).slice(0, 2)]).map((x) => ({ label: ar(x), value: x }));
  return { key: `${closed ? 't' : 'o'}${ans}`, prompt: { ms: closed ? 'Mana satu suku kata tertutup?' : 'Mana satu suku kata terbuka?' }, choices, answer: ans };
}

const KVKV = L('بوکو=buku باجو=baju روتي=roti کودا=kuda کاکي=kaki ݢورو=guru باتو=batu بولا=bola سوسو=susu ناسي=nasi ݢيݢي=gigi ڤادي=padi ساتو=satu ڤاݢي=pagi هاري=hari لاري=lari ساڤو=sapu کوڤي=kopi ايبو=ibu مات=mata');
const KVKVK = L('ماکن=makan جالن=jalan بولن=bulan ايکن=ikan رومه=rumah بوروڠ=burung ڤيسڠ=pisang تيدور=tidur مينوم=minum دودوق=duduk ݢاجه=gajah کاون=kawan توليس=tulis مالم=malam سابون=sabun کاسوت=kasut هوجن=hujan مولوت=mulut کوچيڠ=kucing سوده=sudah');
const KVK2 = L('تمڤت=tempat لومڤت=lompat بينتڠ=bintang رمبوت=rambut تيڠکڤ=tingkap لمبت=lambat چنتيق=cantik ڤنجڠ=panjang رومڤوت=rumput کمبيڠ=kambing سيمڤن=simpan کرتس=kertas ݢمبر=gambar سمڤن=sampan');
// Diphthongs ai/au/oi and digraphs ng/ny/sy/kh.
const DIFTONG = L('ڤنداي=pandai سوڠاي=sungai ڤنتاي=pantai کداي=kedai سمڤاي=sampai کرباو=kerbau ڤولاو=pulau ڤيساو=pisau هيجاو=hijau ليماو=limau هاريماو=harimau کالاو=kalau امبوي=amboi بوڠا=bunga ڽاڽي=nyanyi ڽاموق=nyamuk شکور=syukur خبر=khabar');
// Affixes are joined to the root, and the root keeps its own spelling (di + baca = دباچ, makan + an = ماکنن).
const AWALAN = L('دباچ=dibaca دماکن=dimakan دتوليس=ditulis دمينوم=diminum برجالن=berjalan برلاري=berlari برباجو=berbaju برکاون=berkawan ممباچ=membaca منوليس=menulis مندڠر=mendengar ملوکيس=melukis ممبلي=membeli مڽاڤو=menyapu');
const AKHIRAN = L('ماکنن=makanan مينومن=minuman توليسن=tulisan لوکيسن=lukisan سايورن=sayuran جوالن=jualan بليکن=belikan باچکن=bacakan توليسکن=tuliskan سيمڤنکن=simpankan دڠرکن=dengarkan');
const APITAN = L('کبرسيهن=kebersihan کسيحتن=kesihatan کسلامتن=keselamatan ڤرتنديڠن=pertandingan ڤلاجرن=pelajaran کچنتيقن=kecantikan ممبرسيهکن=membersihkan مڽاڽيکن=menyanyikan دبرسيهکن=dibersihkan دتوليسکن=dituliskan ممباچکن=membacakan');
// Arabic loanwords keep their Arabic letters (ص ح ع ق ة ...).
const ARAB = L('صلاة=solat علمو=ilmu دعا=doa کتاب=kitab مسجد=masjid صبر=sabar هديه=hadiah سلام=salam نبي=nabi رسول=rasul زکات=zakat حلال=halal اخلاق=akhlak وقتو=waktu معاف=maaf دنيا=dunia اخلاص=ikhlas واجب=wajib');

// "Jawi = rumi", one per line.
const lines = (s) => s.trim().split('\n').map((x) => { const [j, say] = x.split('=').map((y) => y.trim()); return { j, say }; });
// Sentences: who + what they do. Wrong choices change one part, so the child has to read every word.
const SUBJ = L('ساي=Saya ايبو=Ibu اياه=Ayah اديق=Adik کاکق=Kakak ابڠ=Abang علي=Ali');
const PRED = lines(`
ماکن ناسي = makan nasi
ماکن روتي = makan roti
مينوم سوسو = minum susu
مينوم اير = minum air
ممباچ بوکو = membaca buku
ممبلي ايکن = membeli ikan
منوليس سورت = menulis surat`);
const mkAyat = (s, p) => ({ j: `${s.j} ${p.j}.`, say: `${s.say} ${p.say}.` });
const other = (arr, x) => pick(arr.filter((y) => y !== x));
function ayat(toJawi) {
  const s = pick(SUBJ), p = pick(PRED), it = mkAyat(s, p);
  const opts = shuffle([it, mkAyat(other(SUBJ, s), p), mkAyat(s, other(PRED, p))]);
  return toJawi
    ? { key: `ap${it.j}`, prompt: { ms: 'Pilih ayat Jawi yang betul.' }, text: it.say, choices: opts.map((x) => ({ label: ar(x.j), value: x.j })), answer: it.j, stack: true }
    : { key: `ab${it.j}`, prompt: { ms: 'Apakah ayat ini?' }, text: ar(it.j), choices: opts.map((x) => ({ label: x.say, value: x.say })), answer: it.say, stack: true };
}
const AYAT = [...lines(`
اين بوکو ساي. = Ini buku saya.
ايت کوچيڠ علي. = Itu kucing Ali.
ساي ڤرݢي ک سکوله. = Saya pergi ke sekolah.
اياه ڤرݢي ک ڤاسر. = Ayah pergi ke pasar.
اديق تيدور د بيليق. = Adik tidur di bilik.
کامي ماکن د داڤور. = Kami makan di dapur.
بوڠا ايت ميره. = Bunga itu merah.
رومه ساي بسر. = Rumah saya besar.
بوروڠ ايت تربڠ تيڠݢي. = Burung itu terbang tinggi.
هاري اين هاري اثنين. = Hari ini hari Isnin.
کامي سوک ممباچ بوکو. = Kami suka membaca buku.
علي صلاة د مسجد. = Ali solat di masjid.`), ...[].concat(...SUBJ.map((s) => PRED.map((p) => mkAyat(s, p))))];

// Short passages: read the Jawi, answer a question in rumi or in Jawi. The first option is right; the others are
// the same kind of thing but not what the passage says.
const PETIKAN = [
  { j: 'اين رومه علي. رومه علي بسر. علي تيڠݢل دڠن ايبو دان اياه.', say: 'Ini rumah Ali. Rumah Ali besar. Ali tinggal dengan ibu dan ayah.',
    qs: [['Ini rumah siapa?', 'Ali', 'Abu', 'Siti'], ['Rumah Ali bagaimana?', 'besar', 'kecil', 'sempit'], ['Ali tinggal dengan siapa?', 'ibu dan ayah', 'datuk dan nenek', 'abang dan kakak']],
    jq: [['Siapa tinggal dengan ibu dan ayah?', 'علي', 'ابو', 'سيتي'], ['Rumah Ali bagaimana?', 'بسر', 'کچيل', 'سمڤيت'], ['Ali tinggal dengan ibu dan siapa?', 'اياه', 'نينيق', 'داتوق']] },
  { j: 'سيتي ڤرݢي ک ڤاسر دڠن ايبو ڤد هاري احد. ايبو ممبلي ايکن دان سايور.', say: 'Siti pergi ke pasar dengan ibu pada hari Ahad. Ibu membeli ikan dan sayur.',
    qs: [['Siti pergi ke mana?', 'pasar', 'sekolah', 'masjid'], ['Bilakah Siti pergi?', 'hari Ahad', 'hari Isnin', 'hari Jumaat'], ['Ibu membeli apa?', 'ikan dan sayur', 'roti dan susu', 'nasi dan air']],
    jq: [['Siti pergi ke mana?', 'ڤاسر', 'سکوله', 'مسجد'], ['Bilakah Siti pergi?', 'احد', 'اثنين', 'جمعة'], ['Ibu membeli ikan dan apa?', 'سايور', 'روتي', 'سوسو']] },
  { j: 'ابو باڠون ڤاݢي. دي مندي دان صلاة صبح. سلڤس ايت دي ماکن روتي.', say: 'Abu bangun pagi. Dia mandi dan solat Subuh. Selepas itu dia makan roti.',
    qs: [['Bilakah Abu bangun?', 'pagi', 'petang', 'malam'], ['Abu solat apa?', 'Subuh', 'Zohor', 'Asar'], ['Abu makan apa?', 'roti', 'nasi', 'ikan']],
    jq: [['Bilakah Abu bangun?', 'ڤاݢي', 'ڤتڠ', 'مالم'], ['Abu solat apa?', 'صبح', 'ظهر', 'عصر'], ['Abu makan apa?', 'روتي', 'ناسي', 'ايکن']] },
  { j: 'د تامن اد باڽق بوڠا. بوڠا ايت ميره دان کونيڠ. اديق سوک بوڠا.', say: 'Di taman ada banyak bunga. Bunga itu merah dan kuning. Adik suka bunga.',
    qs: [['Di mana ada banyak bunga?', 'di taman', 'di sekolah', 'di pasar'], ['Apakah warna bunga itu?', 'merah dan kuning', 'biru dan putih', 'hijau dan hitam'], ['Siapa suka bunga?', 'Adik', 'Ibu', 'Ayah']],
    jq: [['Di mana ada banyak bunga?', 'تامن', 'سکوله', 'ڤاسر'], ['Bunga itu merah dan apa?', 'کونيڠ', 'بيرو', 'هيجاو'], ['Siapa suka bunga?', 'اديق', 'ايبو', 'اياه']] },
];
function petikan(jawi) {
  const pi = rand(0, PETIKAN.length - 1), p = PETIKAN[pi], qs = jawi ? p.jq : p.qs, qi = rand(0, qs.length - 1);
  const [ask, ...opts] = qs[qi];
  const choices = shuffle(opts).map((o) => ({ label: jawi ? ar(o) : o, value: o }));
  return { key: `${jawi ? 'j' : 'r'}${pi}-${qi}`, prompt: { ms: ask }, text: `<div class="ar" dir="rtl">${p.j}</div>`, choices, answer: opts[0], stack: true };
}

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
    // KSSR Tahun 1: open syllables, Jawi-only letters in syllables, KV+KV words.
    { id: 'jawi-t1-suku-dengar', year: 1, title: { en: 'Open syllables: listen', ms: 'Suku kata terbuka: dengar' }, icon: 'کا', sticker: { id: 'st-jawi-t1-1', e: '🎨' }, gen: () => listen(SUKU2) },
    { id: 'jawi-t1-suku-baca', year: 1, title: { en: 'Open syllables: read', ms: 'Suku kata terbuka: baca' }, icon: 'لي', sticker: { id: 'st-jawi-t1-2', e: '🖌️' }, gen: () => look(SUKU2, 'Apakah bunyi ini?') },
    { id: 'jawi-t1-khas-suku', year: 1, title: { en: 'Jawi-only letter syllables: listen', ms: 'Suku kata huruf khas: dengar' }, icon: 'ڠا', sticker: { id: 'st-jawi-t1-3', e: '🖍️' }, gen: () => listen(SUKU_KHAS) },
    { id: 'jawi-t1-kvkv-baca', year: 1, title: { en: 'Words KV+KV: read', ms: 'Perkataan KV+KV: baca' }, icon: 'باتو', sticker: { id: 'st-jawi-t1-4', e: '✏️' }, gen: () => look(KVKV, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t1-kvkv-pilih', year: 1, title: { en: 'Words KV+KV: pick the Jawi', ms: 'Perkataan KV+KV: pilih Jawi' }, icon: 'ݢورو', sticker: { id: 'st-jawi-t1-5', e: '📏' }, gen: () => pilih(KVKV) },
    { id: 'jawi-t1-kvkv-sebut', year: 1, title: { en: 'Words KV+KV: read aloud', ms: 'Perkataan KV+KV: sebut' }, icon: 'ناسي', sticker: { id: 'st-jawi-t1-6', e: '📐' }, gen: () => sebut(KVKV) },
    // Tahun 2: letter shapes, closed syllables, KV+KVK words.
    { id: 'jawi-t2-bentuk', year: 2, title: { en: 'Letter shapes', ms: 'Bentuk huruf' }, icon: 'بـ', sticker: { id: 'st-jawi-t2-1', e: '📌' }, gen: bentuk },
    { id: 'jawi-t2-kedudukan', year: 2, title: { en: 'Start, middle or end?', ms: 'Awal, tengah atau akhir?' }, icon: 'ـبـ', sticker: { id: 'st-jawi-t2-2', e: '📎' }, gen: kedudukan },
    { id: 'jawi-t2-tak-sambung', year: 2, title: { en: "Letters that don't join on", ms: 'Huruf tidak bersambung' }, icon: 'د', sticker: { id: 'st-jawi-t2-3', e: '🧩' }, gen: takSambung },
    { id: 'jawi-t2-suku-tertutup', year: 2, title: { en: 'Open and closed syllables', ms: 'Suku kata terbuka dan tertutup' }, icon: 'کن', sticker: { id: 'st-jawi-t2-4', e: '🎲' }, gen: sukuTertutup },
    { id: 'jawi-t2-kvkvk-baca', year: 2, title: { en: 'Words KV+KVK: read', ms: 'Perkataan KV+KVK: baca' }, icon: 'ماکن', sticker: { id: 'st-jawi-t2-5', e: '🪁' }, gen: () => look(KVKVK, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t2-kvkvk-pilih', year: 2, title: { en: 'Words KV+KVK: pick the Jawi', ms: 'Perkataan KV+KVK: pilih Jawi' }, icon: 'رومه', sticker: { id: 'st-jawi-t2-6', e: '🪀' }, gen: () => pilih(KVKVK) },
    { id: 'jawi-t2-kvkvk-sebut', year: 2, title: { en: 'Words KV+KVK: read aloud', ms: 'Perkataan KV+KVK: sebut' }, icon: 'کوچيڠ', sticker: { id: 'st-jawi-t2-7', e: '🎯' }, gen: () => sebut(KVKVK) },
    // Tahun 3: KVK+KVK words, diphthongs and digraphs.
    { id: 'jawi-t3-kvk2-baca', year: 3, title: { en: 'Words KVK+KVK: read', ms: 'Perkataan KVK+KVK: baca' }, icon: 'تمڤت', sticker: { id: 'st-jawi-t3-1', e: '🎳' }, gen: () => look(KVK2, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t3-kvk2-pilih', year: 3, title: { en: 'Words KVK+KVK: pick the Jawi', ms: 'Perkataan KVK+KVK: pilih Jawi' }, icon: 'بينتڠ', sticker: { id: 'st-jawi-t3-2', e: '🎮' }, gen: () => pilih(KVK2) },
    { id: 'jawi-t3-kvk2-sebut', year: 3, title: { en: 'Words KVK+KVK: read aloud', ms: 'Perkataan KVK+KVK: sebut' }, icon: 'رمبوت', sticker: { id: 'st-jawi-t3-3', e: '🧸' }, gen: () => sebut(KVK2) },
    { id: 'jawi-t3-diftong-baca', year: 3, title: { en: 'Diphthongs and digraphs: read', ms: 'Diftong dan digraf: baca' }, icon: 'ڤنداي', sticker: { id: 'st-jawi-t3-4', e: '🪆' }, gen: () => look(DIFTONG, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t3-diftong-pilih', year: 3, title: { en: 'Diphthongs and digraphs: pick the Jawi', ms: 'Diftong dan digraf: pilih Jawi' }, icon: 'ڤولاو', sticker: { id: 'st-jawi-t3-5', e: '🎹' }, gen: () => pilih(DIFTONG) },
    // Tahun 4: words with affixes.
    { id: 'jawi-t4-awalan-baca', year: 4, title: { en: 'Prefixes di-, ber-, meN-: read', ms: 'Awalan di-, ber-, meN-: baca' }, icon: 'دباچ', sticker: { id: 'st-jawi-t4-1', e: '🥁' }, gen: () => look(AWALAN, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t4-akhiran-baca', year: 4, title: { en: 'Suffixes -kan, -an: read', ms: 'Akhiran -kan, -an: baca' }, icon: 'ماکنن', sticker: { id: 'st-jawi-t4-2', e: '🎺' }, gen: () => look(AKHIRAN, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t4-apitan-baca', year: 4, title: { en: 'Prefix and suffix together: read', ms: 'Apitan: baca' }, icon: 'کسيحتن', sticker: { id: 'st-jawi-t4-3', e: '🎸' }, gen: () => look(APITAN, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t4-imbuhan-pilih', year: 4, title: { en: 'Words with affixes: pick the Jawi', ms: 'Perkataan berimbuhan: pilih Jawi' }, icon: 'برجالن', sticker: { id: 'st-jawi-t4-4', e: '🪕' }, gen: () => pilih([...AWALAN, ...AKHIRAN, ...APITAN]) },
    // Tahun 5: Arabic loanwords, sentences.
    { id: 'jawi-t5-arab-baca', year: 5, title: { en: 'Arabic loanwords: read', ms: 'Kata pinjaman Arab: baca' }, icon: 'صلاة', sticker: { id: 'st-jawi-t5-1', e: '🎻' }, gen: () => look(ARAB, 'Apakah perkataan ini?', true) },
    { id: 'jawi-t5-arab-pilih', year: 5, title: { en: 'Arabic loanwords: pick the Jawi', ms: 'Kata pinjaman Arab: pilih Jawi' }, icon: 'علمو', sticker: { id: 'st-jawi-t5-2', e: '📯' }, gen: () => pilih(ARAB) },
    { id: 'jawi-t5-arab-sebut', year: 5, title: { en: 'Arabic loanwords: read aloud', ms: 'Kata pinjaman Arab: sebut' }, icon: 'مسجد', sticker: { id: 'st-jawi-t5-3', e: '🎷' }, gen: () => sebut(ARAB) },
    { id: 'jawi-t5-ayat-baca', year: 5, title: { en: 'Sentences: read', ms: 'Ayat: baca' }, icon: 'ساي', sticker: { id: 'st-jawi-t5-4', e: '🪇' }, gen: () => ayat(false) },
    // Tahun 6: sentences, short passages.
    { id: 'jawi-t6-ayat-pilih', year: 6, title: { en: 'Sentences: pick the Jawi', ms: 'Ayat: pilih Jawi' }, icon: 'اين', sticker: { id: 'st-jawi-t6-1', e: '🪈' }, gen: () => ayat(true) },
    { id: 'jawi-t6-ayat-sebut', year: 6, title: { en: 'Sentences: read aloud', ms: 'Ayat: sebut' }, icon: 'ايت', sticker: { id: 'st-jawi-t6-2', e: '🔔' }, gen: () => sebut(AYAT) },
    { id: 'jawi-t6-petikan', year: 6, title: { en: 'Passages: answer in rumi', ms: 'Petikan: jawab dalam rumi' }, icon: 'تامن', sticker: { id: 'st-jawi-t6-3', e: '🪄' }, gen: () => petikan(false) },
    { id: 'jawi-t6-petikan-jawi', year: 6, title: { en: 'Passages: answer in Jawi', ms: 'Petikan: jawab dalam Jawi' }, icon: 'بوڠا', sticker: { id: 'st-jawi-t6-4', e: '🎭' }, gen: () => petikan(true) },
  ],
};
