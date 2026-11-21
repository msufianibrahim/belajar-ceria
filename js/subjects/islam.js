import { pick, shuffle } from './util.js';

// Asas Islam: preschool basics, then KSSR Pendidikan Islam Tahun 1-6 (Sunni, mazhab Syafie, as taught in
// Malaysian schools). Only the standard school answers; anything scholars differ on is left out.
// No pictures of prophets, angels or companions: questions are text, icons are neutral objects.

// q(prompt, answer, [distractors]): two distractors are picked at random. Distractors are never also right.
const q = (prompt, answer, wrong) => ({ prompt, answer, wrong });
const ORD = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam'];

// Fact pairs [question, answer]: distractors are the other pairs' answers (answers must not overlap in meaning).
const matchUp = (pairs) => pairs.map(([p, a]) => q(p, a, [...new Set(pairs.map((x) => x[1]).filter((x) => x !== a))]));
// The same pairs asked the other way round.
const reverse = (pairs, ask) => matchUp(pairs.map(([a, b]) => [ask(b), a]));
// "What is pillar N?" for an ordered list.
const ordinal = (list, ask) => list.map((x, i) => q(ask(ORD[i]), x, list.filter((y) => y !== x)));
// Pick the one that belongs (good) among ones that don't (bad), and the other way round.
const goodBad = (good, bad, askGood, askBad) => [
  ...good.map((g) => q(askGood, g, bad)),
  ...bad.map((b) => q(askBad, b, good)),
];

function gen(items) {
  return () => {
    const it = pick(items);
    const choices = shuffle([it.answer, ...shuffle(it.wrong).slice(0, 2)]).map((x) => ({ label: x, value: x }));
    const long = choices.some((c) => c.label.length > 14);
    // TTS would read "SAW" as a word; say it in full.
    const say = it.prompt.includes('SAW') ? it.prompt.replaceAll('SAW', 'sallallahu alaihi wasallam') : undefined;
    return { key: `${it.prompt}|${it.answer}`, prompt: { ms: it.prompt }, say, choices, answer: it.answer, wide: long, stack: long };
  };
}

// ---------------------------------------------------------------- preschool

const UCAPAN = [
  q('Apa kita ucap sebelum makan?', 'Bismillah', ['Alhamdulillah', 'Assalamualaikum', 'Astaghfirullah']),
  q('Apa kita ucap selepas makan?', 'Alhamdulillah', ['Bismillah', 'Assalamualaikum', 'Astaghfirullah']),
  q('Apa kita ucap apabila berjumpa kawan?', 'Assalamualaikum', ['Alhamdulillah', 'Astaghfirullah', 'Insya-Allah']),
  q('Bagaimana kita menjawab salam?', 'Waalaikumussalam', ['Bismillah', 'Alhamdulillah', 'Astaghfirullah']),
  q('Apa kita ucap apabila berjanji untuk buat sesuatu esok?', 'Insya-Allah', ['Alhamdulillah', 'Waalaikumussalam', 'Astaghfirullah']),
  q('Apa kita ucap apabila membuat salah?', 'Astaghfirullah', ['Alhamdulillah', 'Insya-Allah', 'Waalaikumussalam']),
  q('Apa kita ucap apabila bersin?', 'Alhamdulillah', ['Astaghfirullah', 'Insya-Allah', 'Waalaikumussalam']),
  q('Kawan bersin dan berkata Alhamdulillah. Kita jawab?', 'Yarhamukallah', ['Waalaikumussalam', 'Insya-Allah', 'Bismillah']),
  q('Apa kita ucap apabila melihat sesuatu yang cantik?', 'Masya-Allah', ['Astaghfirullah', 'Waalaikumussalam', 'Yarhamukallah']),
  q('Apa kita ucap apabila mendapat hadiah?', 'Alhamdulillah', ['Astaghfirullah', 'Waalaikumussalam', 'Yarhamukallah']),
  q('Bismillah bermaksud?', 'Dengan nama Allah', ['Segala puji bagi Allah', 'Allah Maha Besar']),
  q('Alhamdulillah bermaksud?', 'Segala puji bagi Allah', ['Dengan nama Allah', 'Allah Maha Besar']),
  q('Allahu Akbar bermaksud?', 'Allah Maha Besar', ['Dengan nama Allah', 'Segala puji bagi Allah']),
];

const KENALI = [
  q('Siapakah Tuhan kita?', 'Allah', ['Nabi Muhammad', 'Malaikat']),
  q('Siapakah yang mencipta kita?', 'Allah', ['Ibu', 'Ayah']),
  q('Siapakah nabi kita?', 'Nabi Muhammad', ['Malaikat Jibril', 'Allah']),
  q('Apakah kitab suci umat Islam?', 'Al-Quran', ['Buku cerita', 'Kamus']),
  q('Apakah nama rumah ibadat orang Islam?', 'Masjid', ['Sekolah', 'Pasar']),
  q('Kiblat kita ialah?', 'Kaabah', ['Matahari', 'Bulan']),
  q('Kaabah terletak di bandar?', 'Makkah', ['Madinah', 'Kuala Lumpur']),
  q('Pada bulan apakah orang Islam berpuasa?', 'Ramadan', ['Syawal', 'Muharam']),
  q('Hari raya selepas bulan puasa ialah?', 'Hari Raya Aidilfitri', ['Hari Raya Aidiladha', 'Hari Jumaat']),
  q('Berapa kali solat fardu sehari?', '5', ['3', '7']),
  q('Al-Quran dalam bahasa?', 'Bahasa Arab', ['Bahasa Melayu', 'Bahasa Inggeris']),
];

const ADAB_ASAS = goodBad(
  ['Makan dengan tangan kanan', 'Basuh tangan sebelum makan', 'Memberi salam kepada ibu', 'Bersalam dengan ayah',
    'Berkongsi mainan', 'Senyum kepada kawan', 'Mengucap terima kasih', 'Duduk ketika makan',
    'Membuang sampah ke dalam tong', 'Meminta maaf apabila bersalah', 'Beratur dengan sabar', 'Bercakap dengan sopan'],
  ['Makan dengan tangan kiri', 'Menolak kawan', 'Menjerit di dalam rumah', 'Membuang sampah merata-rata',
    'Merampas mainan kawan', 'Membazir makanan', 'Bercakap ketika mulut penuh', 'Memotong barisan'],
  'Yang manakah perbuatan yang baik?', 'Yang manakah perbuatan yang tidak baik?');

// ---------------------------------------------------------------- Tahun 1

const RUKUN_ISLAM = ['Mengucap dua kalimah syahadah', 'Solat fardu lima waktu', 'Berpuasa pada bulan Ramadan',
  'Menunaikan zakat', 'Menunaikan haji bagi yang mampu'];
const RUKUN_IMAN = ['Beriman kepada Allah', 'Beriman kepada malaikat', 'Beriman kepada kitab-kitab',
  'Beriman kepada rasul-rasul', 'Beriman kepada hari akhirat', "Beriman kepada qada' dan qadar"];

const T1_ISLAM = [
  ...ordinal(RUKUN_ISLAM, (n) => `Rukun Islam yang ${n} ialah?`),
  q('Berapakah bilangan Rukun Islam?', '5', ['4', '6']),
  ...RUKUN_ISLAM.map((x) => q('Yang manakah Rukun Islam?', x, RUKUN_IMAN)),
];
const T1_IMAN = [
  ...ordinal(RUKUN_IMAN, (n) => `Rukun Iman yang ${n} ialah?`),
  q('Berapakah bilangan Rukun Iman?', '6', ['5', '7']),
  ...RUKUN_IMAN.map((x) => q('Yang manakah Rukun Iman?', x, RUKUN_ISLAM)),
];

const T1_PENCIPTA = [
  ...['matahari', 'bulan', 'bintang', 'pokok', 'gunung', 'laut', 'gajah', 'bunga', 'hujan']
    .map((x) => q(`Siapakah yang mencipta ${x}?`, 'Allah', ['Manusia', 'Robot'])),
  q('Allah itu Esa. Esa bermaksud?', 'Satu', ['Dua', 'Tiga']),
  q('Allah Maha Melihat. Allah melihat?', 'Semua perkara', ['Waktu siang sahaja', 'Benda besar sahaja']),
  q('Allah Maha Mendengar. Allah mendengar?', 'Semua perkara', ['Suara kuat sahaja', 'Waktu siang sahaja']),
  q('Allah Maha Mengetahui. Allah tahu?', 'Semua perkara', ['Sedikit sahaja', 'Perkara semalam sahaja']),
  q('Adakah Allah tidur?', 'Tidak', ['Ya', 'Kadang-kadang']),
];

const WAKTU = [['Subuh', 'Awal pagi'], ['Zuhur', 'Tengah hari'], ['Asar', 'Petang'],
  ['Maghrib', 'Selepas matahari terbenam'], ['Isyak', 'Malam']];
const T1_WAKTU = [
  q('Solat fardu sehari semalam ada berapa waktu?', '5', ['3', '4']),
  ...reverse(WAKTU, (t) => `Solat fardu pada waktu ${t.toLowerCase()} ialah?`),
  ...matchUp(WAKTU.map(([s, t]) => [`Bilakah waktu solat ${s}?`, t])),
  ...matchUp([['Solat selepas Subuh ialah?', 'Zuhur'], ['Solat selepas Zuhur ialah?', 'Asar'],
    ['Solat selepas Asar ialah?', 'Maghrib'], ['Solat selepas Maghrib ialah?', 'Isyak']]),
  q('Panggilan untuk solat dipanggil?', 'Azan', ['Iqamah', 'Doa']),
];

const T1_MAKAN = goodBad(
  ['Membaca Bismillah sebelum makan', 'Makan dengan tangan kanan', 'Membasuh tangan sebelum makan',
    'Membaca doa selepas makan', 'Duduk ketika makan', 'Mengambil makanan yang dekat', 'Menghabiskan makanan',
    'Duduk ketika minum'],
  ['Makan sambil berjalan', 'Makan dengan tangan kiri', 'Membazir makanan', 'Bercakap ketika mulut penuh',
    'Mencela makanan', 'Makan dengan gelojoh'],
  'Yang manakah adab makan yang baik?', 'Yang manakah adab makan yang tidak baik?');

const T1_IBUBAPA = goodBad(
  ['Mendengar nasihat ibu bapa', 'Bercakap dengan lembut', 'Bersalam dan mencium tangan ibu bapa',
    'Membantu kerja rumah', 'Mendoakan ibu bapa', 'Meminta izin sebelum keluar', 'Memberi salam apabila pulang',
    'Mengucap terima kasih kepada ibu bapa'],
  ['Meninggikan suara kepada ibu', 'Membantah kata ayah', 'Keluar rumah tanpa izin',
    'Buat-buat tidak dengar apabila dipanggil', 'Berbohong kepada ibu bapa', 'Merajuk dan menghentak kaki'],
  'Yang manakah adab yang baik terhadap ibu bapa?', 'Yang manakah adab yang tidak baik terhadap ibu bapa?');

// ---------------------------------------------------------------- Tahun 2

const T2_NAJIS = [
  ...matchUp([
    ['Anjing dan babi ialah najis jenis apa?', 'Mughallazah'],
    ['Air kencing bayi lelaki bawah 2 tahun yang hanya minum susu ibu ialah najis jenis apa?', 'Mukhaffafah'],
    ['Darah ialah najis jenis apa?', 'Mutawassitah'],
    ['Najis berat juga dipanggil?', 'Mughallazah'],
    ['Najis ringan juga dipanggil?', 'Mukhaffafah'],
    ['Najis sederhana juga dipanggil?', 'Mutawassitah'],
    ['Tahi dan air kencing orang dewasa ialah najis jenis apa?', 'Mutawassitah'],
  ]),
  q('Najis terbahagi kepada berapa jenis?', '3', ['2', '4']),
  q('Bagaimana membersihkan najis mughallazah?', 'Basuh 7 kali, sekali dengan air tanah', ['Renjis air sahaja', 'Lap dengan tisu sahaja']),
  q('Bagaimana membersihkan najis mukhaffafah?', 'Renjis air ke tempat itu', ['Lap dengan tisu sahaja', 'Biarkan kering sahaja']),
  q('Bagaimana membersihkan najis mutawassitah?', 'Basuh hingga hilang bau, warna dan rasa', ['Renjis air sahaja', 'Lap dengan tisu sahaja']),
];

const FARDU_WUDUK = ['Niat', 'Membasuh muka', 'Membasuh kedua-dua tangan hingga siku', 'Menyapu sebahagian kepala',
  'Membasuh kedua-dua kaki hingga buku lali', 'Tertib'];
const SUNAT_WUDUK = ['Membaca Bismillah', 'Membasuh kedua-dua tapak tangan', 'Berkumur-kumur',
  'Memasukkan air ke dalam hidung', 'Menyapu kedua-dua telinga', 'Mendahulukan anggota kanan',
  'Membasuh setiap anggota tiga kali', 'Bersugi', 'Membaca doa selepas wuduk'];

const T2_FARDU = [
  ...ordinal(FARDU_WUDUK, (n) => `Fardu wuduk yang ${n} ialah?`),
  q('Fardu wuduk ada berapa?', '6', ['4', '5']),
  q('Dalam wuduk, tangan dibasuh hingga ke?', 'Siku', ['Pergelangan tangan', 'Bahu']),
  q('Dalam wuduk, kaki dibasuh hingga ke?', 'Buku lali', ['Jari kaki', 'Lutut']),
  q('Tertib dalam wuduk bermaksud?', 'Mengikut urutan', ['Dengan cepat', 'Dengan air sejuk']),
  q('Niat wuduk dibuat ketika?', 'Membasuh muka', ['Membasuh kaki', 'Menyapu kepala']),
  q('Air yang boleh digunakan untuk berwuduk ialah?', 'Air mutlak', ['Air teh', 'Air sirap']),
];
const T2_SUNAT = goodBad(SUNAT_WUDUK, FARDU_WUDUK, 'Yang manakah perkara sunat wuduk?', 'Yang manakah fardu wuduk?');

const T2_BATAL = goodBad(
  ['Kentut', 'Buang air kecil', 'Buang air besar', 'Tidur nyenyak yang tidak tetap punggung', 'Pengsan',
    'Bersentuh kulit lelaki dan perempuan yang bukan mahram'],
  ['Makan', 'Minum', 'Berjalan', 'Membaca buku', 'Menyikat rambut', 'Memakai baju', 'Duduk'],
  'Yang manakah membatalkan wuduk?', 'Yang manakah TIDAK membatalkan wuduk?');

const T2_NABI = [
  ...matchUp([
    ['Siapakah bapa Nabi Muhammad SAW?', 'Abdullah'],
    ['Siapakah ibu Nabi Muhammad SAW?', 'Aminah'],
    ['Siapakah datuk yang menjaga Nabi Muhammad SAW?', 'Abdul Muttalib'],
    ['Siapakah bapa saudara yang menjaga Nabi Muhammad SAW?', 'Abu Talib'],
    ['Siapakah ibu susuan Nabi Muhammad SAW?', 'Halimatus Saadiah'],
    ['Siapakah isteri pertama Nabi Muhammad SAW?', 'Khadijah'],
    ['Puteri Nabi Muhammad SAW yang berkahwin dengan Saidina Ali ialah?', 'Fatimah'],
  ]),
  q('Di manakah Nabi Muhammad SAW dilahirkan?', 'Makkah', ['Madinah', 'Taif']),
  q('Nabi Muhammad SAW lahir pada tahun?', 'Tahun Gajah', ['Tahun Kesedihan', 'Tahun Hijrah']),
  q('Pada hari apakah Nabi Muhammad SAW dilahirkan?', 'Isnin', ['Jumaat', 'Sabtu']),
  q('Nabi Muhammad SAW lahir pada bulan?', 'Rabiulawal', ['Ramadan', 'Syawal']),
  q('Nabi Muhammad SAW berasal dari kaum?', 'Quraisy', ['Aus', 'Khazraj']),
];

const T2_TIDUR = goodBad(
  ['Berwuduk sebelum tidur', 'Membaca doa sebelum tidur', 'Tidur mengiring ke kanan', 'Membaca doa bangun tidur',
    'Masuk tandas dengan kaki kiri', 'Keluar tandas dengan kaki kanan', 'Membaca doa masuk tandas',
    'Beristinjak selepas buang air', 'Tidak bercakap di dalam tandas'],
  ['Masuk tandas dengan kaki kanan', 'Keluar tandas dengan kaki kiri', 'Bercakap di dalam tandas', 'Tidur meniarap',
    'Tidak membasuh selepas buang air', 'Bermain di dalam tandas', 'Tidur lewat kerana bermain'],
  'Yang manakah adab yang betul?', 'Yang manakah adab yang salah?');

// ---------------------------------------------------------------- Tahun 3

const RAKAAT = [['Subuh', '2'], ['Zuhur', '4'], ['Asar', '4'], ['Maghrib', '3'], ['Isyak', '4']];
const T3_RAKAAT = [
  ...matchUp(RAKAAT.map(([s, n]) => [`Solat ${s} berapa rakaat?`, n])),
  q('Jumlah rakaat solat fardu sehari semalam?', '17', ['15', '20']),
  q('Solat fardu yang 2 rakaat ialah?', 'Subuh', ['Maghrib', 'Isyak', 'Zuhur', 'Asar']),
  q('Solat fardu yang 3 rakaat ialah?', 'Maghrib', ['Subuh', 'Zuhur', 'Asar', 'Isyak']),
  ...['Zuhur', 'Asar', 'Isyak'].map((s) => q('Solat fardu yang 4 rakaat ialah?', s, ['Subuh', 'Maghrib'])),
  q('Solat Jumaat berapa rakaat?', '2', ['3', '4']),
];

const RUKUN_SOLAT = ['Niat', 'Takbiratul ihram', 'Berdiri betul bagi yang mampu', 'Membaca surah al-Fatihah', 'Rukuk',
  'Iktidal', 'Sujud', 'Duduk antara dua sujud', 'Duduk tahiyat akhir', 'Membaca tahiyat akhir',
  'Berselawat ke atas Nabi dalam tahiyat akhir', 'Memberi salam yang pertama', 'Tertib'];
const T3_RUKUN = [
  q('Rukun solat ada berapa?', '13', ['11', '15']),
  q('Solat dimulakan dengan?', 'Takbiratul ihram', ['Memberi salam', 'Sujud']),
  q('Solat diakhiri dengan?', 'Memberi salam', ['Rukuk', 'Takbiratul ihram']),
  q('Lafaz takbiratul ihram ialah?', 'Allahu Akbar', ['Alhamdulillah', 'Subhanallah']),
  q('Surah yang wajib dibaca dalam setiap rakaat?', 'Al-Fatihah', ['Al-Ikhlas', 'An-Nas']),
  ...matchUp([['Membongkok dengan tangan di lutut dipanggil?', 'Rukuk'], ['Meletakkan dahi di sejadah dipanggil?', 'Sujud'],
    ['Bangun dari rukuk dan berdiri tegak dipanggil?', 'Iktidal'], ['Selepas rukuk ialah?', 'Iktidal'],
    ['Selepas iktidal ialah?', 'Sujud']]),
  ...goodBad(RUKUN_SOLAT.slice(1, 12), ['Membaca doa iftitah', 'Membaca surah selepas al-Fatihah', 'Mengangkat tangan ketika takbir'],
    'Yang manakah rukun solat?', 'Yang manakah sunat solat, bukan rukun?'),
];

const T3_BATAL = goodBad(
  ['Bercakap dengan sengaja', 'Makan', 'Minum', 'Ketawa', 'Berhadas', 'Terkena najis', 'Bergerak tiga kali berturut-turut',
    'Membelakangkan kiblat', 'Terbuka aurat'],
  ['Membaca al-Fatihah', 'Rukuk', 'Sujud', 'Menghadap kiblat', 'Membaca tahiyat', 'Membaca tasbih ketika rukuk'],
  'Yang manakah membatalkan solat?', 'Yang manakah TIDAK membatalkan solat?');

const MALAIKAT = [['Jibril', 'Menyampaikan wahyu'], ['Mikail', 'Menurunkan hujan dan rezeki'], ['Israfil', 'Meniup sangkakala'],
  ['Izrail', 'Mencabut nyawa'], ['Munkar dan Nakir', 'Menyoal di alam kubur'], ['Raqib', 'Mencatat amalan baik'],
  ['Atid', 'Mencatat amalan buruk'], ['Ridwan', 'Menjaga syurga'], ['Malik', 'Menjaga neraka']];
const T3_MALAIKAT = [
  ...reverse(MALAIKAT, (t) => `Malaikat yang bertugas ${t.toLowerCase()} ialah?`),
  ...matchUp(MALAIKAT.map(([m, t]) => [`Apakah tugas Malaikat ${m}?`, t])),
  q('Berapakah bilangan malaikat yang wajib diketahui?', '10', ['8', '12']),
  q('Malaikat dicipta daripada?', 'Cahaya', ['Tanah', 'Api']),
];

const KITAB = [['Taurat', 'Nabi Musa'], ['Zabur', 'Nabi Daud'], ['Injil', 'Nabi Isa'], ['Al-Quran', 'Nabi Muhammad SAW']];
const T3_KITAB = [
  ...matchUp(KITAB.map(([k, r]) => [`Kitab ${k} diturunkan kepada?`, r])),
  ...reverse(KITAB, (r) => `Kitab yang diturunkan kepada ${r} ialah?`),
  q('Berapakah bilangan kitab yang wajib diketahui?', '4', ['3', '5']),
  q('Kitab yang terakhir diturunkan ialah?', 'Al-Quran', ['Taurat', 'Injil']),
];

const T3_MASJID = goodBad(
  ['Masuk masjid dengan kaki kanan', 'Keluar masjid dengan kaki kiri', 'Membaca doa masuk masjid',
    'Solat sunat tahiyatul masjid', 'Memakai pakaian bersih yang menutup aurat', 'Bercakap dengan perlahan',
    'Menjaga kebersihan masjid', 'Duduk dengan tenang mendengar khutbah'],
  ['Berlari-lari di dalam masjid', 'Menjerit di dalam masjid', 'Masuk masjid dengan kaki kiri',
    'Membuang sampah di dalam masjid', 'Bermain ketika khutbah', 'Memakai pakaian yang kotor'],
  'Yang manakah adab yang baik di masjid?', 'Yang manakah adab yang tidak baik di masjid?');

// ---------------------------------------------------------------- Tahun 4

// Two sets kept apart so near-synonym meanings (e.g. Pemberi Rezeki / Pemberi Kurnia) never meet in one question.
const AH1 = [['Ar-Rahman', 'Maha Pemurah'], ['Ar-Rahim', 'Maha Penyayang'], ['Al-Malik', 'Maha Merajai'],
  ['Al-Quddus', 'Maha Suci'], ['As-Salam', 'Maha Sejahtera'], ['Al-Khaliq', 'Maha Pencipta'], ['Al-Ghafur', 'Maha Pengampun'],
  ['Ar-Razzaq', 'Maha Pemberi Rezeki'], ['Al-Alim', 'Maha Mengetahui'], ["As-Sami'", 'Maha Mendengar']];
const AH2 = [['Al-Basir', 'Maha Melihat'], ['Al-Hakim', 'Maha Bijaksana'], ['Al-Aziz', 'Maha Perkasa'], ['Al-Adl', 'Maha Adil'],
  ['Al-Hayyu', 'Maha Hidup'], ['Al-Ahad', 'Maha Esa'], ['Al-Ghaniy', 'Maha Kaya'], ['Al-Awwal', 'Maha Awal'],
  ['Al-Akhir', 'Maha Akhir'], ['Al-Wahhab', 'Maha Pemberi Kurnia']];
const asmaul = (set) => [
  ...matchUp(set.map(([n, m]) => [`Apakah maksud ${n}?`, m])),
  ...reverse(set, (m) => `Nama Allah yang bermaksud ${m} ialah?`),
];

const SIFAT = [['Wujud', 'Ada'], ['Qidam', 'Sedia (tiada permulaan)'], ["Baqa'", 'Kekal'],
  ['Mukhalafatuhu lil hawadith', 'Berbeza dengan makhluk'], ['Qiyamuhu binafsih', 'Berdiri dengan sendiri'],
  ['Wahdaniyyah', 'Esa'], ['Qudrat', 'Berkuasa'], ['Iradat', 'Berkehendak'], ['Ilmu', 'Mengetahui'], ['Hayat', 'Hidup'],
  ["Sama'", 'Mendengar'], ['Basar', 'Melihat'], ['Kalam', 'Berkata-kata']];
const T4_SIFAT = [
  ...matchUp(SIFAT.map(([s, m]) => [`Sifat Allah ${s} bermaksud?`, m])),
  ...reverse(SIFAT, (m) => `Sifat Allah yang bermaksud ${m.toLowerCase()} ialah?`),
  q('Sifat wajib bagi Allah ada berapa?', '20', ['13', '25']),
];

// Order questions only at the ends of the list of 25, where every school list agrees.
const RASUL_AWAL = ['Nabi Adam', 'Nabi Idris', 'Nabi Nuh', 'Nabi Hud', 'Nabi Saleh', 'Nabi Ibrahim'];
const RASUL_AKHIR = ['Nabi Zakaria', 'Nabi Yahya', 'Nabi Isa', 'Nabi Muhammad SAW'];
const after = (list) => list.slice(0, -1).map((x, i) => q(`Rasul selepas ${x} ialah?`, list[i + 1], list.filter((y, j) => j !== i && j !== i + 1)));
const T4_RASUL = [
  q('Berapakah bilangan rasul yang wajib diketahui?', '25', ['20', '30']),
  q('Siapakah rasul yang pertama?', 'Nabi Adam', ['Nabi Nuh', 'Nabi Ibrahim']),
  q('Siapakah rasul yang terakhir?', 'Nabi Muhammad SAW', ['Nabi Isa', 'Nabi Musa']),
  q('Nabi Muhammad SAW ialah rasul yang ke?', '25', ['24', '20']),
  q('Rasul sebelum Nabi Muhammad SAW ialah?', 'Nabi Isa', ['Nabi Musa', 'Nabi Adam']),
  ...after(RASUL_AWAL),
  ...after(RASUL_AKHIR),
];

const T4_PUASA = [
  q('Puasa Ramadan ialah Rukun Islam yang ke?', '3', ['2', '4']),
  q('Makan sebelum waktu Subuh pada bulan puasa dipanggil?', 'Sahur', ['Berbuka', 'Moreh']),
  q('Kita berbuka puasa apabila masuk waktu?', 'Maghrib', ['Asar', 'Isyak']),
  q('Puasa bermula dari terbit fajar hingga?', 'Terbenam matahari', ['Tengah hari', 'Tengah malam']),
  q('Yang manakah membatalkan puasa?', 'Makan dengan sengaja', ['Mandi', 'Tidur']),
  q('Jika terlupa lalu termakan ketika berpuasa, puasa itu?', 'Tidak batal', ['Batal', 'Perlu diulang esok']),
  q('Malam yang lebih baik daripada seribu bulan ialah?', 'Lailatulqadar', ['Malam Jumaat', 'Malam Hari Raya']),
  q('Hari Raya Aidilfitri disambut pada 1 haribulan?', 'Syawal', ['Ramadan', 'Zulhijjah']),
  q('Solat sunat yang khusus pada malam bulan Ramadan?', 'Solat Tarawih', ['Solat Dhuha', 'Solat Jumaat']),
  q('Puasa Ramadan wajib ke atas orang Islam yang?', 'Baligh dan berakal', ['Berumur 5 tahun', 'Kaya sahaja']),
  q('Rukun puasa yang pertama ialah?', 'Niat', ['Sahur', 'Berbuka']),
];

const T4_GURU = goodBad(
  ['Memberi salam kepada guru', 'Mendengar ketika guru mengajar', 'Menghormati guru', 'Membantu guru membawa buku',
    'Mendoakan guru', 'Melawat jiran yang sakit', 'Memberi makanan kepada jiran', 'Menjaga kebersihan kawasan rumah',
    'Menolong jiran yang susah'],
  ['Bercakap ketika guru mengajar', 'Melawan cakap guru', 'Membuat bising waktu malam',
    'Membuang sampah di depan rumah jiran', 'Mengejek jiran', 'Mengambil barang jiran tanpa izin'],
  'Yang manakah adab yang baik terhadap guru dan jiran?', 'Yang manakah adab yang tidak baik terhadap guru dan jiran?');

// ---------------------------------------------------------------- Tahun 5

const T5_ZAKAT = [
  q('Zakat ialah Rukun Islam yang ke?', '4', ['3', '5']),
  q('Zakat yang wajib ke atas setiap orang Islam pada bulan Ramadan?', 'Zakat fitrah', ['Zakat harta', 'Zakat perniagaan']),
  q('Bilakah zakat fitrah dibayar?', 'Pada bulan Ramadan', ['Pada bulan Zulhijjah', 'Pada bulan Muharam']),
  q('Golongan yang berhak menerima zakat dipanggil?', 'Asnaf', ['Imam', 'Bilal']),
  q('Berapakah golongan asnaf?', '8', ['6', '10']),
  ...matchUp([['Orang yang tiada harta dan pendapatan?', 'Fakir'], ['Orang yang pendapatannya tidak mencukupi?', 'Miskin'],
    ['Orang yang mengutip dan mengagihkan zakat?', 'Amil'], ['Orang yang baru memeluk Islam?', 'Muallaf'],
    ['Orang yang berhutang untuk keperluan yang dibenarkan?', 'Gharimin'], ['Musafir yang kehabisan bekalan?', 'Ibnu Sabil'],
    ['Orang yang berjuang di jalan Allah?', 'Fisabilillah']]),
  q('Kadar zakat wang simpanan ialah?', '2.5%', ['10%', '25%']),
  q('Harta yang disimpan cukup setahun dikatakan cukup?', 'Haul', ['Nisab', 'Asnaf']),
  q('Kadar minimum harta yang wajib dizakatkan dipanggil?', 'Nisab', ['Haul', 'Asnaf']),
];

const T5_WAHYU = [
  q('Di manakah Nabi Muhammad SAW menerima wahyu pertama?', "Gua Hira'", ['Gua Thur', "Masjid Quba'"]),
  q("Gua Hira' terletak di bukit?", 'Jabal Nur', ['Jabal Uhud', 'Jabal Rahmah']),
  q('Siapakah yang membawa wahyu pertama?', 'Malaikat Jibril', ['Malaikat Mikail', 'Malaikat Israfil']),
  q('Wahyu pertama ialah surah?', 'Al-Alaq, ayat 1 hingga 5', ['Al-Fatihah, ayat 1 hingga 7', 'An-Nas, ayat 1 hingga 6']),
  q("Perkataan pertama wahyu pertama ialah Iqra'. Maksudnya?", 'Bacalah', ['Tulislah', 'Dengarlah']),
  q('Berapakah umur Nabi Muhammad SAW ketika menerima wahyu pertama?', '40 tahun', ['25 tahun', '63 tahun']),
  q('Isteri yang menenangkan Nabi selepas wahyu pertama ialah?', 'Khadijah', ['Aisyah', 'Halimatus Saadiah']),
  q('Wanita pertama memeluk Islam ialah?', 'Khadijah', ['Fatimah', 'Aisyah']),
  q('Lelaki dewasa pertama memeluk Islam ialah?', 'Abu Bakar', ['Umar al-Khattab', 'Uthman bin Affan']),
  q('Kanak-kanak pertama memeluk Islam ialah?', 'Ali bin Abi Talib', ['Abu Bakar', 'Umar al-Khattab']),
  q('Nabi berdakwah secara sembunyi-sembunyi selama?', '3 tahun', ['1 tahun', '10 tahun']),
];

const T5_QURAN = [
  q('Berapakah bilangan surah dalam Al-Quran?', '114', ['100', '120']),
  q('Berapakah bilangan juzuk dalam Al-Quran?', '30', ['20', '40']),
  q('Surah pertama dalam Al-Quran ialah?', 'Al-Fatihah', ['Al-Baqarah', 'An-Nas']),
  q('Surah terakhir dalam Al-Quran ialah?', 'An-Nas', ['Al-Falaq', 'Al-Ikhlas']),
  q('Surah yang paling panjang ialah?', 'Al-Baqarah', ['Al-Kauthar', 'Al-Fatihah']),
  q('Surah yang paling pendek ialah?', 'Al-Kauthar', ['Al-Baqarah', 'Yasin']),
  ...matchUp([['Surah yang bermula dengan Qul huwallahu ahad?', 'Al-Ikhlas'],
    ["Surah yang bermula dengan Qul a'uzu birabbil falaq?", 'Al-Falaq'],
    ["Surah yang bermula dengan Qul a'uzu birabbin nas?", 'An-Nas']]),
  q('Al-Quran diturunkan dalam bahasa?', 'Arab', ['Melayu', 'Parsi']),
  q('Al-Quran diturunkan kepada Nabi Muhammad SAW melalui?', 'Malaikat Jibril', ['Malaikat Mikail', 'Malaikat Israfil']),
  q('Surah al-Fatihah ada berapa ayat?', '7', ['5', '6']),
  q('Surah yang digelar Ibu Al-Quran ialah?', 'Al-Fatihah', ['Yasin', 'Al-Ikhlas']),
];

const T5_KISAH = [
  q('Nabi yang membina bahtera besar ialah?', 'Nabi Nuh', ['Nabi Musa', 'Nabi Isa']),
  q('Nabi yang tidak terbakar dalam api ialah?', 'Nabi Ibrahim', ['Nabi Nuh', 'Nabi Yunus']),
  q('Nabi yang membina Kaabah bersama anaknya ialah?', 'Nabi Ibrahim', ['Nabi Daud', 'Nabi Sulaiman']),
  q('Anak Nabi Ibrahim yang membantu membina Kaabah ialah?', 'Nabi Ismail', ['Nabi Ishak', 'Nabi Yaakub']),
  q('Nabi yang ditelan ikan besar ialah?', 'Nabi Yunus', ['Nabi Nuh', 'Nabi Yusuf']),
  q('Nabi yang memahami bahasa haiwan ialah?', 'Nabi Sulaiman', ['Nabi Musa', 'Nabi Ayub']),
  q('Nabi yang sangat sabar ketika sakit ialah?', 'Nabi Ayub', ['Nabi Sulaiman', 'Nabi Yusuf']),
  q('Nabi yang tongkatnya membelah laut ialah?', 'Nabi Musa', ['Nabi Nuh', 'Nabi Isa']),
  q('Nabi yang terkenal sangat kacak ialah?', 'Nabi Yusuf', ['Nabi Ayub', 'Nabi Nuh']),
  q('Bapa Nabi Yusuf ialah?', 'Nabi Yaakub', ['Nabi Ibrahim', 'Nabi Ishak']),
  q('Anak Nabi Daud yang juga nabi ialah?', 'Nabi Sulaiman', ['Nabi Harun', 'Nabi Musa']),
  q('Saudara Nabi Musa yang juga nabi ialah?', 'Nabi Harun', ['Nabi Daud', 'Nabi Yusuf']),
  q('Bapa Nabi Yahya ialah?', 'Nabi Zakaria', ['Nabi Isa', 'Nabi Musa']),
  q('Nabi yang besi menjadi lembut di tangannya ialah?', 'Nabi Daud', ['Nabi Sulaiman', 'Nabi Ibrahim']),
];

// ---------------------------------------------------------------- Tahun 6

const T6_HAJI = [
  q('Haji ialah Rukun Islam yang ke?', '5', ['3', '4']),
  q('Ibadah haji dilakukan pada bulan?', 'Zulhijjah', ['Ramadan', 'Syawal']),
  q('Haji wajib sekali seumur hidup bagi orang Islam yang?', 'Mampu', ['Tinggal di Makkah sahaja', 'Sudah tua sahaja']),
  q('Ibadah haji dan umrah dilakukan di?', 'Makkah', ['Madinah', 'Taif']),
  q('Berjalan mengelilingi Kaabah dipanggil?', 'Tawaf', ['Saie', 'Wukuf']),
  q('Berulang-alik antara Bukit Safa dan Marwah dipanggil?', 'Saie', ['Tawaf', 'Wukuf']),
  q('Tawaf ialah mengelilingi Kaabah sebanyak?', '7 kali', ['3 kali', '5 kali']),
  q('Wukuf dilakukan di padang?', 'Arafah', ['Mina', 'Muzdalifah']),
  q('Hari Raya Aidiladha disambut pada?', '10 Zulhijjah', ['1 Syawal', '1 Muharam']),
  q('Melontar jamrah dilakukan di?', 'Mina', ['Arafah', 'Madinah']),
  q('Pakaian putih tidak berjahit yang dipakai lelaki ketika haji dipanggil?', 'Ihram', ['Jubah', 'Serban']),
  q('Ibadah yang ada wukuf di Arafah ialah?', 'Haji', ['Umrah', 'Solat Jumaat']),
];

const T6_HIJRAH = [
  q('Nabi Muhammad SAW berhijrah dari Makkah ke?', 'Madinah', ['Taif', 'Habsyah']),
  q('Nama asal Madinah ialah?', 'Yathrib', ['Taif', 'Makkah']),
  q('Sahabat yang menemani Nabi ketika hijrah ialah?', 'Abu Bakar as-Siddiq', ['Umar al-Khattab', 'Uthman bin Affan']),
  q('Gua tempat Nabi dan Abu Bakar bersembunyi ketika hijrah?', 'Gua Thur', ["Gua Hira'", 'Gua Kahfi']),
  q('Siapakah yang tidur di tempat tidur Nabi pada malam hijrah?', 'Ali bin Abi Talib', ['Abu Bakar', 'Umar al-Khattab']),
  q('Masjid pertama yang dibina oleh Nabi ketika hijrah?', "Masjid Quba'", ['Masjid Nabawi', 'Masjidil Haram']),
  q('Masjid tempat makam Nabi Muhammad SAW ialah?', 'Masjid Nabawi', ["Masjid Quba'", 'Masjidil Haram']),
  ...matchUp([['Orang Islam Madinah yang membantu orang yang berhijrah dipanggil?', 'Ansar'],
    ['Orang Islam yang berhijrah dari Makkah ke Madinah dipanggil?', 'Muhajirin'],
    ['Kaum Nabi Muhammad SAW di Makkah ialah?', 'Quraisy']]),
  q('Nabi berhijrah pada tahun Masihi?', '622', ['570', '632']),
  q('Kalendar Islam dinamakan kalendar?', 'Hijrah', ['Masihi', 'Gajah']),
  q('Bulan pertama dalam kalendar Hijrah ialah?', 'Muharam', ['Ramadan', 'Syawal']),
];

const KHULAFA = ['Abu Bakar as-Siddiq', 'Umar al-Khattab', 'Uthman bin Affan', 'Ali bin Abi Talib'];
const T6_KHULAFA = [
  q('Khulafa ar-Rasyidin ada berapa orang?', '4', ['3', '5']),
  ...ordinal(KHULAFA, (n) => `Khalifah ar-Rasyidin yang ${n} ialah?`),
  ...matchUp([['Gelaran Saidina Abu Bakar ialah?', 'As-Siddiq'], ['Gelaran Saidina Umar ialah?', 'Al-Faruq'],
    ['Gelaran Saidina Uthman ialah?', 'Zun Nurain']]),
  q('Khalifah yang memulakan kalendar Hijrah ialah?', 'Umar al-Khattab', ['Abu Bakar as-Siddiq', 'Ali bin Abi Talib']),
  q('Khalifah yang menyusun Mushaf Uthmani ialah?', 'Uthman bin Affan', ['Umar al-Khattab', 'Ali bin Abi Talib']),
  q('Khalifah yang juga sepupu Nabi Muhammad SAW ialah?', 'Ali bin Abi Talib', ['Abu Bakar as-Siddiq', 'Umar al-Khattab']),
  q('Saidina Abu Bakar ialah bapa kepada isteri Nabi bernama?', 'Aisyah', ['Khadijah', 'Fatimah']),
  q('Ar-Rasyidin bermaksud?', 'Yang mendapat petunjuk', ['Yang kaya', 'Yang kuat']),
];

const T6_AKHLAK = goodBad(
  ['Jujur', 'Amanah', 'Sabar', 'Pemaaf', 'Rendah diri', 'Bersyukur', 'Pemurah', 'Menepati janji', 'Tolong-menolong'],
  ['Sombong', 'Dengki', 'Berbohong', 'Mengumpat', 'Kedekut', 'Pemarah', 'Mungkir janji', 'Malas'],
  'Yang manakah sifat terpuji (mahmudah)?', 'Yang manakah sifat keji (mazmumah)?');

const T6_SUNAT = [
  q('Solat Jumaat wajib ke atas?', 'Lelaki Islam yang baligh', ['Semua kanak-kanak', 'Perempuan sahaja']),
  q('Solat Jumaat menggantikan solat?', 'Zuhur', ['Asar', 'Subuh']),
  q('Ucapan khatib sebelum solat Jumaat dipanggil?', 'Khutbah', ['Tazkirah', 'Ceramah']),
  q('Solat Hari Raya Aidilfitri berapa rakaat?', '2', ['3', '4']),
  ...matchUp([['Solat sunat pada waktu pagi selepas matahari naik?', 'Solat Dhuha'],
    ['Solat sunat pada malam hari selepas bangun tidur?', 'Solat Tahajud'],
    ['Solat sunat ketika masuk masjid?', 'Solat Tahiyatul Masjid'],
    ['Solat sunat yang rakaatnya ganjil, selepas Isyak?', 'Solat Witir'],
    ['Solat sunat untuk memohon hujan?', "Solat Istisqa'"]]),
  q('Solat jenazah ada berapa takbir?', '4', ['3', '5']),
  q('Solat jenazah tidak ada?', 'Rukuk dan sujud', ['Niat', 'Takbir']),
  q('Solat bersama-sama dengan imam dipanggil solat?', 'Berjemaah', ['Bersendirian', 'Sunat']),
];

// Sticker pool: sports and hearts, one per level.
const STICKERS = ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
  '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛷', '⛸️', '🥌', '💚', '💙', '💜', '🧡', '💛', '🤍', '🤎', '🏅', '🎖️'];
let n = 0;
const lv = (id, year, ms, en, icon, items) => ({
  id: `islam-${id}`, ...(year && { year }), title: { en, ms }, icon,
  sticker: { id: `st-islam-${n + 1}`, e: STICKERS[n++] }, gen: gen(items),
});

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'islam',
  name: { en: 'Islamic Studies', ms: 'Asas Islam' },
  icon: '🕌',
  color: '#ffe082',
  lang: 'ms',
  placement: false,
  levels: [
    lv('ucapan', 0, 'Ucapan harian', 'Everyday phrases', '💬', UCAPAN),
    lv('kenali', 0, 'Kenali Islam', 'Meet Islam', '🕌', KENALI),
    lv('adab-asas', 0, 'Adab yang baik', 'Good manners', '😊', ADAB_ASAS),
    lv('t1-rukun-islam', 1, 'Rukun Islam', 'Pillars of Islam', '🕋', T1_ISLAM),
    lv('t1-rukun-iman', 1, 'Rukun Iman', 'Pillars of Faith', '⭐', T1_IMAN),
    lv('t1-pencipta', 1, 'Allah Maha Pencipta', 'Allah the Creator', '🌍', T1_PENCIPTA),
    lv('t1-waktu-solat', 1, 'Waktu solat', 'Prayer times', '🕰️', T1_WAKTU),
    lv('t1-adab-makan', 1, 'Adab makan', 'Table manners', '🍽️', T1_MAKAN),
    lv('t1-ibu-bapa', 1, 'Adab dengan ibu bapa', 'Respecting parents', '🏠', T1_IBUBAPA),
    lv('t2-najis', 2, 'Najis', 'Kinds of najis', '🧼', T2_NAJIS),
    lv('t2-fardu-wuduk', 2, 'Fardu wuduk', 'Wudu: the musts', '💧', T2_FARDU),
    lv('t2-sunat-wuduk', 2, 'Sunat wuduk', 'Wudu: the sunnahs', '🚿', T2_SUNAT),
    lv('t2-batal-wuduk', 2, 'Batal wuduk', 'What breaks wudu', '🚫', T2_BATAL),
    lv('t2-nabi', 2, 'Kelahiran Nabi Muhammad SAW', "The Prophet's birth and family", '📜', T2_NABI),
    lv('t2-tidur-tandas', 2, 'Adab tidur dan tandas', 'Bedtime and toilet manners', '🛏️', T2_TIDUR),
    lv('t3-rakaat', 3, 'Rakaat solat', 'Prayer rakaat', '🔢', T3_RAKAAT),
    lv('t3-rukun-solat', 3, 'Rukun solat', 'Parts of the prayer', '🧭', T3_RUKUN),
    lv('t3-batal-solat', 3, 'Batal solat', 'What breaks the prayer', '🚫', T3_BATAL),
    lv('t3-malaikat', 3, 'Malaikat', 'The angels', '☁️', T3_MALAIKAT),
    lv('t3-kitab', 3, 'Kitab', 'The holy books', '📚', T3_KITAB),
    lv('t3-adab-masjid', 3, 'Adab di masjid', 'Mosque manners', '🕌', T3_MASJID),
    lv('t4-asmaul-husna-1', 4, 'Asmaul Husna 1', 'Names of Allah 1', '✨', asmaul(AH1)),
    lv('t4-sifat', 4, 'Sifat Allah', 'Attributes of Allah', '🌟', T4_SIFAT),
    lv('t4-rasul', 4, 'Rasul', 'The messengers', '📜', T4_RASUL),
    lv('t4-puasa', 4, 'Puasa', 'Fasting', '🌙', T4_PUASA),
    lv('t4-guru-jiran', 4, 'Adab dengan guru dan jiran', 'Teachers and neighbours', '🏘️', T4_GURU),
    lv('t5-zakat', 5, 'Zakat', 'Zakat', '🪙', T5_ZAKAT),
    lv('t5-asmaul-husna-2', 5, 'Asmaul Husna 2', 'Names of Allah 2', '✨', asmaul(AH2)),
    lv('t5-wahyu', 5, 'Wahyu pertama', 'The first revelation', '⛰️', T5_WAHYU),
    lv('t5-quran', 5, 'Al-Quran', 'The Quran', '📖', T5_QURAN),
    lv('t5-kisah-nabi', 5, 'Kisah para nabi', 'Stories of the prophets', '📜', T5_KISAH),
    lv('t6-haji', 6, 'Haji dan umrah', 'Hajj and umrah', '🕋', T6_HAJI),
    lv('t6-hijrah', 6, 'Hijrah', 'The Hijrah', '🐪', T6_HIJRAH),
    lv('t6-khulafa', 6, 'Khulafa ar-Rasyidin', 'The four caliphs', '📜', T6_KHULAFA),
    lv('t6-akhlak', 6, 'Akhlak', 'Good character', '💗', T6_AKHLAK),
    lv('t6-solat-sunat', 6, 'Solat Jumaat dan sunat', 'Friday and sunnah prayers', '📅', T6_SUNAT),
  ],
};
