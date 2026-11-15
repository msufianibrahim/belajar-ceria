import { pick, shuffle } from './util.js';

// 华文, in the order of the Mandarin readiness tiers: numbers, nature, family, colours, body.
// Pinyin has tone marks (dictionary tones, not sandhi).
const TIERS = {
  numbers: [
    { w: '一', py: 'yī', en: '1', e: '1️⃣' }, { w: '二', py: 'èr', en: '2', e: '2️⃣' },
    { w: '三', py: 'sān', en: '3', e: '3️⃣' }, { w: '四', py: 'sì', en: '4', e: '4️⃣' },
    { w: '五', py: 'wǔ', en: '5', e: '5️⃣' }, { w: '六', py: 'liù', en: '6', e: '6️⃣' },
    { w: '七', py: 'qī', en: '7', e: '7️⃣' }, { w: '八', py: 'bā', en: '8', e: '8️⃣' },
    { w: '九', py: 'jiǔ', en: '9', e: '9️⃣' }, { w: '十', py: 'shí', en: '10', e: '🔟' },
  ],
  nature: [
    { w: '日', py: 'rì', en: 'Sun', e: '☀️' }, { w: '月', py: 'yuè', en: 'Moon', e: '🌙' },
    { w: '水', py: 'shuǐ', en: 'Water', e: '💧' }, { w: '火', py: 'huǒ', en: 'Fire', e: '🔥' },
    { w: '山', py: 'shān', en: 'Mountain', e: '⛰️' }, { w: '土', py: 'tǔ', en: 'Earth', e: '🌍' },
    { w: '木', py: 'mù', en: 'Wood', e: '🪵' }, { w: '天', py: 'tiān', en: 'Sky', e: '☁️' },
  ],
  family: [
    { w: '爸爸', py: 'bàba', en: 'Dad', e: '👨' }, { w: '妈妈', py: 'māma', en: 'Mum', e: '👩' },
    { w: '哥哥', py: 'gēge', en: 'Big brother', e: '👦' }, { w: '姐姐', py: 'jiějie', en: 'Big sister', e: '👧' },
    { w: '弟弟', py: 'dìdi', en: 'Little brother', e: '👶' }, { w: '妹妹', py: 'mèimei', en: 'Little sister', e: '🍼' },
    { w: '爷爷', py: 'yéye', en: 'Grandpa', e: '👴' }, { w: '奶奶', py: 'nǎinai', en: 'Grandma', e: '👵' },
  ],
  colours: [
    { w: '红色', py: 'hóngsè', en: 'Red', e: '🍎' }, { w: '黄色', py: 'huángsè', en: 'Yellow', e: '🍌' },
    { w: '蓝色', py: 'lánsè', en: 'Blue', e: '🔵' }, { w: '绿色', py: 'lǜsè', en: 'Green', e: '🍃' },
    { w: '白色', py: 'báisè', en: 'White', e: '⚪' }, { w: '黑色', py: 'hēisè', en: 'Black', e: '⬛' },
  ],
  body: [
    { w: '头', py: 'tóu', en: 'Head', e: '👤' }, { w: '手', py: 'shǒu', en: 'Hand', e: '✋' },
    { w: '足', py: 'zú', en: 'Foot', e: '🦶' }, { w: '大', py: 'dà', en: 'Big', e: '🐘' },
    { w: '小', py: 'xiǎo', en: 'Small', e: '🐭' }, { w: '口', py: 'kǒu', en: 'Mouth', e: '👄' },
    { w: '眼', py: 'yǎn', en: 'Eye', e: '👁️' }, { w: '耳', py: 'ěr', en: 'Ear', e: '👂' },
  ],
};

// The item plus two other items from its tier, shuffled.
const three = (pool) => {
  const item = pick(pool);
  return { item, opts: shuffle([item, ...shuffle(pool.filter((x) => x !== item)).slice(0, 2)]) };
};

// Generic prompt: the 🔊 button speaks `say`, so the prompt must not hold the answer.
const LISTEN = { zh: '请听，然后选。', py: 'Qǐng tīng, ránhòu xuǎn.', en: 'Listen and pick.' };

// Hear the word (🔊 says the prompt), pick its picture.
function listen(pool) {
  const { item, opts } = three(pool);
  return {
    key: `l-${item.w}`,
    prompt: LISTEN,
    say: item.w,
    choices: opts.map((o) => ({ label: o.e, value: o.w })),
    answer: item.w,
  };
}

// See the picture (with its English gloss, as some emoji are ambiguous), pick the character.
function read(pool) {
  const { item, opts } = three(pool);
  return {
    key: `r-${item.w}`,
    prompt: { zh: '这是什么？', py: 'Zhè shì shénme?', en: 'What is this?' },
    visual: `<div style="font-size:4rem">${item.e}</div><div>${item.en}</div>`,
    choices: opts.map((o) => ({ label: o.w, value: o.w })),
    answer: item.w,
  };
}

// Read the word aloud; a grown-up taps ✓ or ✗ (no speech recognition for Mandarin).
function say(pool) {
  const item = pick(pool);
  return {
    key: `s-${item.w}`,
    prompt: { zh: '请读一读。', py: 'Qǐng dú yi dú.', en: 'Read it aloud.' },
    text: `${item.w}<br><small>${item.py} ${item.e}</small>`,
    read: item.w,
    choices: [],
    answer: true,
  };
}

// Hear the word, pick its pinyin (the source asked him to type it).
function pinyin(pool) {
  const { item, opts } = three(pool);
  return {
    key: `p-${item.w}`,
    prompt: LISTEN,
    say: item.w,
    choices: opts.map((o) => ({ label: o.py, value: o.py })),
    answer: item.py,
  };
}

// Four levels per tier: listen, read, say, pinyin. Level ids are stored in saved progress.
const TITLES = {
  numbers: ['Numbers', 'Nombor', '🔢'], nature: ['Nature', 'Alam', '🌳'], family: ['Family', 'Keluarga', '👪'],
  colours: ['Colours', 'Warna', '🎨'], body: ['Body & size', 'Badan & saiz', '🖐️'],
};
const SKILLS = [
  ['listen', 'Listen', 'Dengar', listen], ['read', 'Read', 'Baca', read],
  ['say', 'Say', 'Sebut', say], ['pinyin', 'Pinyin', 'Pinyin', pinyin],
];
const STICKERS = [
  '🌱', '🌿', '🍀', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '💐',
  '🌵', '🌴', '🌳', '🍁', '🍄', '🌈', '⛅', '🌧️', '❄️', '⛈️',
];

const levels = [];
for (const [tier, [en, ms, icon]] of Object.entries(TITLES)) {
  for (const [skill, sen, sms, make] of SKILLS) {
    const n = levels.length;
    levels.push({
      id: `zh-${tier}-${skill}`,
      title: { en: `${en}: ${sen}`, ms: `${ms}: ${sms}` },
      icon,
      sticker: { id: `st-zh-${n + 1}`, e: STICKERS[n] },
      gen: () => make(TIERS[tier]),
    });
  }
}

export default { id: 'zh', name: '华文', icon: '🏮', color: '#ff9e9e', lang: 'zh', placement: false, levels };
