import { pick, shuffle, numberChoices } from './util.js';

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

// ---- KSSR SJKC 华文 Year 1–6 (appended; the levels above keep their ids) ----

// Tone-marked vowels, tones 1..4.
const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
const tone = (py) => {
  for (const m of Object.values(MARKS)) for (const ch of py) if (m.includes(ch)) return m.indexOf(ch) + 1;
  return 0;
};
const plain = (py) => [...py].map((ch) => Object.keys(MARKS).find((v) => MARKS[v].includes(ch)) ?? ch).join('');
// The same one-syllable pinyin with tone t.
const retone = (py, t) => [...py].map((ch) => {
  const v = Object.keys(MARKS).find((k) => MARKS[k].includes(ch));
  return v ? MARKS[v][t - 1] : ch;
}).join('');

// 识字 themes, in the shape of TIERS (read/listen/say/pinyin work on them).
const THEMES = {
  animals: [
    { w: '猫', py: 'māo', en: 'Cat', e: '🐱' }, { w: '狗', py: 'gǒu', en: 'Dog', e: '🐶' },
    { w: '鱼', py: 'yú', en: 'Fish', e: '🐟' }, { w: '鸟', py: 'niǎo', en: 'Bird', e: '🐦' },
    { w: '牛', py: 'niú', en: 'Cow', e: '🐮' }, { w: '马', py: 'mǎ', en: 'Horse', e: '🐴' },
    { w: '羊', py: 'yáng', en: 'Sheep', e: '🐑' }, { w: '鸡', py: 'jī', en: 'Chicken', e: '🐔' },
    { w: '兔', py: 'tù', en: 'Rabbit', e: '🐰' }, { w: '大象', py: 'dàxiàng', en: 'Elephant', e: '🐘' },
    { w: '猴子', py: 'hóuzi', en: 'Monkey', e: '🐵' }, { w: '老虎', py: 'lǎohǔ', en: 'Tiger', e: '🐯' },
  ],
  school: [
    { w: '书', py: 'shū', en: 'Book', e: '📖' }, { w: '铅笔', py: 'qiānbǐ', en: 'Pencil', e: '✏️' },
    { w: '书包', py: 'shūbāo', en: 'School bag', e: '🎒' }, { w: '椅子', py: 'yǐzi', en: 'Chair', e: '🪑' },
    { w: '门', py: 'mén', en: 'Door', e: '🚪' }, { w: '床', py: 'chuáng', en: 'Bed', e: '🛏️' },
    { w: '老师', py: 'lǎoshī', en: 'Teacher', e: '🧑‍🏫' }, { w: '学校', py: 'xuéxiào', en: 'School', e: '🏫' },
    { w: '电视', py: 'diànshì', en: 'TV', e: '📺' }, { w: '雨伞', py: 'yǔsǎn', en: 'Umbrella', e: '☂️' },
    { w: '鞋', py: 'xié', en: 'Shoe', e: '👟' }, { w: '钟', py: 'zhōng', en: 'Clock', e: '🕰️' },
  ],
  weather: [
    { w: '雨', py: 'yǔ', en: 'Rain', e: '🌧️' }, { w: '云', py: 'yún', en: 'Cloud', e: '☁️' },
    { w: '风', py: 'fēng', en: 'Wind', e: '🌬️' }, { w: '花', py: 'huā', en: 'Flower', e: '🌸' },
    { w: '草', py: 'cǎo', en: 'Grass', e: '🌿' }, { w: '树', py: 'shù', en: 'Tree', e: '🌳' },
    { w: '雪', py: 'xuě', en: 'Snow', e: '❄️' }, { w: '海', py: 'hǎi', en: 'Sea', e: '🌊' },
    { w: '太阳', py: 'tàiyáng', en: 'Sun', e: '☀️' }, { w: '月亮', py: 'yuèliang', en: 'Moon', e: '🌙' },
    { w: '彩虹', py: 'cǎihóng', en: 'Rainbow', e: '🌈' }, { w: '叶子', py: 'yèzi', en: 'Leaf', e: '🍃' },
  ],
};

// One-character words for the tone levels (dictionary tone of the character on its own); 一 changes tone in use.
const TONE = [...Object.values(TIERS), ...Object.values(THEMES)].flat().filter((x) => x.w.length === 1 && x.w !== '一' && tone(x.py));

// 声母 / 韵母: [character, pinyin, part]. Finals skip y/w syllables and j/q/x + ü (written u).
const INITIALS = [
  ['八', 'bā', 'b'], ['怕', 'pà', 'p'], ['妈', 'mā', 'm'], ['飞', 'fēi', 'f'], ['大', 'dà', 'd'],
  ['他', 'tā', 't'], ['你', 'nǐ', 'n'], ['来', 'lái', 'l'], ['哥', 'gē', 'g'], ['口', 'kǒu', 'k'],
  ['花', 'huā', 'h'], ['鸡', 'jī', 'j'], ['七', 'qī', 'q'], ['西', 'xī', 'x'], ['桌', 'zhuō', 'zh'],
  ['吃', 'chī', 'ch'], ['书', 'shū', 'sh'], ['热', 'rè', 'r'], ['字', 'zì', 'z'], ['草', 'cǎo', 'c'],
  ['三', 'sān', 's'],
];
const FINALS = [
  ['他', 'tā', 'a'], ['波', 'bō', 'o'], ['喝', 'hē', 'e'], ['你', 'nǐ', 'i'], ['不', 'bù', 'u'],
  ['女', 'nǚ', 'ü'], ['来', 'lái', 'ai'], ['黑', 'hēi', 'ei'], ['好', 'hǎo', 'ao'], ['狗', 'gǒu', 'ou'],
  ['山', 'shān', 'an'], ['门', 'mén', 'en'], ['糖', 'táng', 'ang'], ['灯', 'dēng', 'eng'], ['红', 'hóng', 'ong'],
  ['家', 'jiā', 'ia'], ['花', 'huā', 'ua'], ['天', 'tiān', 'ian'], ['心', 'xīn', 'in'], ['星', 'xīng', 'ing'],
];

// 笔画数: only characters whose count is not in doubt.
const STROKES = [
  ['一', 1], ['二', 2], ['十', 2], ['人', 2], ['七', 2], ['八', 2], ['九', 2], ['三', 3], ['大', 3], ['小', 3],
  ['口', 3], ['山', 3], ['子', 3], ['女', 3], ['上', 3], ['下', 3], ['门', 3], ['马', 3], ['飞', 3],
  ['王', 4], ['木', 4], ['日', 4], ['月', 4], ['水', 4], ['火', 4], ['手', 4], ['中', 4], ['天', 4],
  ['五', 4], ['六', 4], ['心', 4], ['牛', 4], ['四', 5], ['白', 5], ['田', 5], ['目', 5], ['生', 5],
  ['本', 5], ['石', 5], ['耳', 6], ['米', 6], ['竹', 6], ['羊', 6], ['百', 6], ['自', 6],
];

// 部首: no character holds another radical of this list, so no distractor is "also in it".
const RADICALS = {
  女: '妈好姐她', 氵: '海洗江泳', 木: '林树桥校', 亻: '你他们住', 口: '吃叫吹吗',
  扌: '打拉抱找', 讠: '读让谢认', 艹: '苹芽节英', 日: '明晴时早', 纟: '红绿线纸', 钅: '铁针钱',
};

// 量词: [noun, measure word, measure words that would also be said]. 个 is never a distractor (it fits almost anything).
const MEASURE1 = { set: ['只', '条', '本', '张', '把', '辆', '头', '匹', '朵', '棵', '件', '双', '支'], items: [
  ['猫', '只'], ['鸟', '只'], ['鸡', '只'], ['兔子', '只'], ['鱼', '条', '只'], ['蛇', '条', '只'], ['河', '条'],
  ['裤子', '条', '件'], ['毛巾', '条'], ['书', '本'], ['纸', '张'], ['桌子', '张'], ['床', '张'],
  ['椅子', '把', '张'], ['雨伞', '把'], ['剪刀', '把'], ['汽车', '辆'], ['自行车', '辆'], ['牛', '头', '只'],
  ['大象', '头', '只'], ['马', '匹', '只'], ['花', '朵'], ['云', '朵'], ['树', '棵'], ['衣服', '件'],
  ['鞋', '双', '只'], ['铅笔', '支'],
] };
const MEASURE2 = { set: ['座', '所', '架', '艘', '盏', '面', '顶', '封', '首', '幅', '台', '块', '片', '粒', '颗'], items: [
  ['山', '座', '片'], ['桥', '座', '架'], ['学校', '所', '座'], ['飞机', '架', '台'], ['船', '艘'], ['灯', '盏', '台'],
  ['镜子', '面', '块片'], ['国旗', '面', '幅'], ['帽子', '顶'], ['信', '封'], ['歌', '首'], ['画', '幅'],
  ['电脑', '台'], ['蛋糕', '块', '片'], ['面包', '片', '块'], ['叶子', '片'], ['米', '粒', '颗'], ['星星', '颗', '粒片'],
] };

// 反义词 and 近义词 pairs; distractors come from other pairs, which never pair with the word.
const OPP1 = ['大小', '多少', '上下', '前后', '左右', '高矮', '长短', '快慢', '冷热', '黑白', '开关', '来去',
  '早晚', '哭笑', '新旧', '远近', '进出', '对错', '买卖', '轻重', '胖瘦', '真假'].map((p) => [...p]);
const OPP2 = [['安全', '危险'], ['简单', '复杂'], ['成功', '失败'], ['进步', '退步'], ['喜欢', '讨厌'],
  ['开始', '结束'], ['勤劳', '懒惰'], ['美丽', '丑陋'], ['光明', '黑暗'], ['粗心', '细心'], ['增加', '减少'],
  ['干净', '肮脏'], ['热闹', '冷清'], ['长久', '短暂']];
const SYN = [['美丽', '漂亮'], ['高兴', '快乐'], ['立刻', '马上'], ['喜欢', '喜爱'], ['安静', '宁静'],
  ['著名', '有名'], ['温暖', '暖和'], ['突然', '忽然'], ['宽阔', '宽广'], ['珍贵', '宝贵'], ['认真', '仔细'],
  ['发现', '发觉'], ['本领', '本事'], ['希望', '盼望'], ['礼物', '礼品']];

// 词语搭配: [text, answer, distractors] (distractors checked not to fit).
const VERB_NOUN = [
  ['（　）足球', '踢', '吃喝'], ['（　）牛奶', '喝', '穿踢'], ['（　）衣服', '穿', '喝写'], ['（　）字', '写', '喝穿'],
  ['（　）书', '看', '喝穿'], ['（　）饭', '吃', '穿踢'], ['（　）歌', '唱', '吃穿'], ['（　）风筝', '放', '喝吃'],
  ['（　）鞋子', '穿', '喝唱'], ['（　）牙', '刷', '唱喝'], ['（　）手', '洗', '唱喝'], ['（　）门', '开', '喝吃'],
  ['（　）帽子', '戴', '穿唱'], ['（　）眼镜', '戴', '喝踢'], ['（　）水', '喝', '穿唱'],
].map(([t, a, d]) => [t, a, [...d]]);
const ADJ_NOUN = [
  ['（　）的阳光', '温暖', ['整齐', '勇敢']], ['（　）的小河', '清澈', ['勇敢', '整齐']],
  ['（　）的消防员', '勇敢', ['清澈', '香甜']], ['（　）的队伍', '整齐', ['清澈', '香甜']],
  ['（　）的蛋糕', '香甜', ['勇敢', '整齐']], ['（　）的天空', '蔚蓝', ['勇敢', '香甜']],
  ['（　）的大海', '辽阔', ['香甜', '勇敢']], ['（　）的歌声', '动听', ['勇敢', '蔚蓝']],
  ['（　）的花朵', '美丽', ['勇敢', '辽阔']], ['（　）的教室', '干净', ['勇敢', '辽阔']],
  ['（　）的农夫', '勤劳', ['清澈', '蔚蓝']],
];

// 叠词 AABB from AB.
const AABB = ['高兴', '快乐', '干净', '整齐', '清楚', '漂亮', '开心', '平安', '认真', '安静', '明白', '舒服', '热闹'];

// 标点符号: [sentence with a blank, answer, distractors].
const PUNCT1 = [
  ...['你叫什么名字', '你今天上学吗', '这是谁的书包', '你家在哪里', '现在几点了', '你喜欢吃苹果吗'].map((t) => [t, '？']),
  ...['我今天去学校', '妈妈在厨房煮饭', '弟弟在睡觉', '我有一只小猫', '哥哥在看书', '今天是星期一'].map((t) => [t, '。']),
  ...['这朵花多么美丽啊', '今天的天气多么好啊', '小心', '生日快乐', '好漂亮的风筝啊'].map((t) => [t, '！']),
].map(([t, a]) => [`${t}（　）`, a, ['？', '。', '！'].filter((x) => x !== a)]);
const PUNCT2 = [
  ['我家有爸爸（　）妈妈和我。', '、'], ['桌上有铅笔（　）尺和橡皮擦。', '、'], ['花园里有红花（　）黄花和白花。', '、'],
  ['我喜欢苹果（　）香蕉和葡萄。', '、'], ['妈妈说（　）“快来吃饭。”', '：'], ['老师问（　）“谁会回答？”', '：'],
  ['弟弟大声喊（　）“我找到了！”', '：'], ['爸爸对我说（　）“早点睡觉。”', '：'],
].map(([t, a]) => [t, a, a === '、' ? ['：', '。'] : ['、', '。']]);

// 关联词 pairs and sentences that use each pair once.
const LINK1 = [
  [['因为', '所以'], ['因为下雨了，所以我们没去公园。', '因为弟弟生病了，所以他没去上学。', '因为他很用功，所以考试考得很好。', '因为天气很热，所以我想喝水。']],
  [['虽然', '但是'], ['虽然下雨了，但是我们还是去上学。', '虽然这道题很难，但是他还是做对了。', '虽然哥哥很累，但是他还在帮妈妈。', '虽然天气很冷，但是爷爷还是去跑步。']],
  [['如果', '就'], ['如果明天下雨，我们就不去公园。', '如果你有空，就来我家玩。', '如果你累了，就休息一下。']],
];
// Year 5 adds pairs; only the first word is blanked (如果/只有 would clash on the second).
const LINK2 = [...LINK1,
  [['不但', '而且'], ['她不但会唱歌，而且会跳舞。', '这个苹果不但大，而且很甜。']],
  [['一边', '一边'], ['弟弟一边吃饭，一边看电视。', '妈妈一边唱歌，一边做饭。']],
  [['只有', '才'], ['只有努力学习，才能取得好成绩。', '只有多读书，才能学到更多知识。']],
];

// 把/被: [doer, thing, what happened]. Swapping doer and thing is always wrong.
const BA = [['猫', '鱼', '吃掉了'], ['弟弟', '杯子', '打破了'], ['妈妈', '衣服', '洗干净了'], ['哥哥', '房间', '打扫干净了'],
  ['风', '风筝', '吹走了'], ['小明', '作业', '做完了'], ['姐姐', '蛋糕', '吃完了'], ['爸爸', '车', '洗干净了'],
  ['老师', '书', '放在桌上了'], ['雨', '衣服', '淋湿了'], ['小狗', '鞋子', '咬破了']];

// 成语 with a plain meaning; meanings in one list never fit another idiom of that list.
const IDIOMS = [['五颜六色', '颜色很多。'], ['一模一样', '样子完全相同。'], ['人山人海', '人非常多。'],
  ['七上八下', '心里很不安。'], ['半途而废', '事情做到一半就放弃。'], ['三心二意', '做事不专心。'],
  ['东张西望', '这里看看，那里看看。'], ['自言自语', '自己跟自己说话。'], ['争先恐后', '大家争着向前，怕落在后面。'],
  ['一举两得', '做一件事，得到两种好处。'], ['专心致志', '做事非常专心。'], ['九牛一毛', '很多很多里面的一点点。']];
const FABLES = [['守株待兔', '不想努力，只想等着好运来。'], ['画蛇添足', '做了多余的事，反而不好。'],
  ['亡羊补牢', '出了问题以后，赶快想办法补救。'], ['井底之蛙', '见识很少的人。'], ['对牛弹琴', '对不懂的人讲道理，白费力气。'],
  ['狐假虎威', '借着别人的势力来吓唬人。'], ['掩耳盗铃', '自己骗自己。'], ['刻舟求剑', '做事死板，不懂得变通。'],
  ['拔苗助长', '太急着求成功，反而把事情弄坏。'], ['自相矛盾', '自己说的话前后不一致。']];

// 修辞: 比喻 / 拟人 / 反问.
const RHETORIC = { 比喻: ['弯弯的月亮像一只小船。', '她的脸红得像苹果。', '天上的白云像棉花糖。', '星星像一颗颗宝石。'],
  拟人: ['小草向我点头。', '花儿在风中跳舞。', '太阳公公笑眯眯地看着我们。', '星星对我眨眼睛。'],
  反问: ['难道你不知道这件事吗？', '这么简单的题，你怎么会不懂呢？', '我们怎么能浪费食物呢？', '难道我们不应该爱护环境吗？'] };

// 阅读理解: passage, then [question, answer, two wrong answers].
const READING = {
  3: [
    ['星期天，小明和爸爸去公园。公园里有很多花，还有一个大池塘。小明在池塘边喂鱼，他很开心。',
      [['小明和谁去公园？', '爸爸', ['妈妈', '哥哥']], ['小明在池塘边做什么？', '喂鱼', ['钓鱼', '游泳']]]],
    ['妹妹今年六岁。她喜欢画画，最喜欢画小猫。她的画挂在客厅的墙上。',
      [['妹妹今年几岁？', '六岁', ['五岁', '七岁']], ['她最喜欢画什么？', '小猫', ['小狗', '小鸟']],
        ['她的画挂在哪里？', '客厅的墙上', ['房间的墙上', '厨房的墙上']]]],
    ['小华每天早上六点起床。他先刷牙洗脸，然后吃早餐，七点坐校车去学校。',
      [['小华几点起床？', '六点', ['七点', '八点']], ['他怎样去学校？', '坐校车', ['走路', '骑自行车']],
        ['吃早餐以前，他做什么？', '刷牙洗脸', ['坐校车', '做功课']]]],
  ],
  4: [
    ['早上，天下起了大雨。哥哥带了雨伞去上学，弟弟忘了带。放学的时候，哥哥和弟弟一起打着伞回家。',
      [['谁忘了带雨伞？', '弟弟', ['哥哥', '妈妈']], ['放学的时候，他们怎样回家？', '一起打着伞回家', ['坐爸爸的车回家', '跑步回家']]]],
    ['马来西亚的天气很热，一年到头都有太阳，也常常下雨。很多人喜欢吃榴梿。',
      [['马来西亚的天气怎么样？', '很热', ['很冷', '常常下雪']], ['很多人喜欢吃什么水果？', '榴梿', ['苹果', '葡萄']]]],
    ['春节到了，家家户户都很热闹。奶奶给我们红包，我们向奶奶说：“新年快乐！”',
      [['奶奶给我们什么？', '红包', ['年糕', '灯笼']], ['我们向奶奶说什么？', '新年快乐', ['生日快乐', '早上好']]]],
  ],
  5: [
    ['小鸟在树上做了一个窝，窝里有三颗蛋。几天以后，三只小鸟出生了。鸟妈妈每天去找虫子给它们吃。',
      [['窝里有几颗蛋？', '三颗', ['两颗', '四颗']], ['鸟妈妈每天找什么给小鸟吃？', '虫子', ['米', '水果']]]],
    ['学校举办运动会。阿明参加了赛跑，他跑得很快，得了第一名。同学们都为他拍手。',
      [['阿明参加了什么比赛？', '赛跑', ['游泳', '跳远']], ['阿明得了第几名？', '第一名', ['第二名', '第三名']]]],
    ['阿里是我的好朋友。他是马来族，我是华族。我们常常一起踢足球。阿里教我说马来语，我教他说华语。',
      [['阿里教我说什么语言？', '马来语', ['华语', '英语']], ['我们常常一起做什么？', '踢足球', ['打篮球', '游泳']]]],
  ],
  6: [
    ['从前，有一只乌鸦口渴了，到处找水喝。它看见一个瓶子，瓶子里有水，可是水太少了，它喝不着。乌鸦看见旁边有许多小石子，就想出了一个办法。它把小石子一颗一颗地放进瓶子里，瓶子里的水慢慢升高了，乌鸦终于喝着水了。',
      [['乌鸦为什么喝不着水？', '瓶子里的水太少了', ['瓶子太大了', '瓶子是空的']],
        ['乌鸦用什么办法喝到水？', '把小石子放进瓶子里', ['把瓶子推倒', '飞去河边喝水']],
        ['这个故事告诉我们什么？', '遇到困难要动脑筋想办法', ['不要随便喝水', '要多交朋友']]]],
    ['每年的六月五日是世界环境日。为了保护地球，我们可以做很多事：节约用水，随手关灯，少用塑料袋，还要把垃圾分类回收。只要人人都出一份力，地球就会变得更美丽。',
      [['世界环境日是哪一天？', '六月五日', ['五月六日', '六月一日']],
        ['下面哪一种做法不能保护地球？', '多用塑料袋', ['节约用水', '随手关灯']]]],
    ['兔子和乌龟比赛跑步。兔子跑得很快，一下子就跑到了前面。它觉得乌龟太慢了，就在大树下睡起觉来。乌龟一步一步地向前爬，从不停下来。兔子醒来时，乌龟已经到达终点了。',
      [['兔子为什么输了比赛？', '它在半路睡觉', ['它跑得太慢', '它迷路了']],
        ['这个故事告诉我们什么？', '做事不能骄傲，要坚持到底', ['跑步要跑得快', '要多睡觉']]]],
  ],
};

// Pinyin of the new prompts is checked in tests (toned, dictionary tones).
const P = {
  initial: { zh: '请听，选出声母。', py: 'Qǐng tīng, xuǎn chū shēngmǔ.', en: 'Listen and pick the initial sound.' },
  final: { zh: '请听，选出韵母。', py: 'Qǐng tīng, xuǎn chū yùnmǔ.', en: 'Listen and pick the final sound.' },
  tone: { zh: '请听，这是第几声？', py: 'Qǐng tīng, zhè shì dì jǐ shēng?', en: 'Listen: which tone is it?' },
  pinyin: { zh: '选出正确的拼音。', py: 'Xuǎn chū zhèngquè de pīnyīn.', en: 'Pick the right pinyin.' },
  strokes: { zh: '这个字有几画？', py: 'Zhège zì yǒu jǐ huà?', en: 'How many strokes?' },
  radical: { zh: '这个字的部首是什么？', py: 'Zhège zì de bùshǒu shì shénme?', en: 'Which radical does it have?' },
  measure: { zh: '选出正确的量词。', py: 'Xuǎn chū zhèngquè de liàngcí.', en: 'Pick the right measure word.' },
  opposite: { zh: '选出反义词。', py: 'Xuǎn chū fǎnyìcí.', en: 'Pick the opposite.' },
  synonym: { zh: '选出近义词。', py: 'Xuǎn chū jìnyìcí.', en: 'Pick the word that means the same.' },
  word: { zh: '选出正确的词语。', py: 'Xuǎn chū zhèngquè de cíyǔ.', en: 'Pick the word that fits.' },
  aabb: { zh: '选出正确的叠词。', py: 'Xuǎn chū zhèngquè de diécí.', en: 'Pick the right doubled word.' },
  punct: { zh: '选出正确的标点符号。', py: 'Xuǎn chū zhèngquè de biāodiǎn fúhào.', en: 'Pick the right punctuation mark.' },
  link: { zh: '选出正确的关联词。', py: 'Xuǎn chū zhèngquè de guānliáncí.', en: 'Pick the right linking word.' },
  char: { zh: '选出正确的字。', py: 'Xuǎn chū zhèngquè de zì.', en: 'Pick the right character.' },
  same: { zh: '选出意思相同的句子。', py: 'Xuǎn chū yìsi xiāngtóng de jùzi.', en: 'Pick the sentence that means the same.' },
  meaning: { zh: '这个成语是什么意思？', py: 'Zhège chéngyǔ shì shénme yìsi?', en: 'What does this idiom mean?' },
  idiom: { zh: '选出正确的成语。', py: 'Xuǎn chū zhèngquè de chéngyǔ.', en: 'Pick the right idiom.' },
  rhetoric: { zh: '这个句子用了什么修辞？', py: 'Zhège jùzi yòngle shénme xiūcí?', en: 'Which figure of speech is this?' },
  read: { zh: '读一读，回答问题。', py: 'Dú yi dú, huídá wèntí.', en: 'Read, then answer.' },
};

// The answer plus two of the distractors, as text choices.
const ask = (key, prompt, text, answer, wrong, extra = {}) => ({
  key, prompt, text, answer, ...extra,
  choices: shuffle([answer, ...shuffle(wrong.filter((x) => x !== answer)).slice(0, 2)]).map((v) => ({ label: v, value: v })),
});
const others = (list, x) => list.filter((y) => y !== x);

function heard(rows, prompt, k) {
  const [w, , a] = pick(rows);
  const q = ask(`${k}-${w}`, prompt, undefined, a, others([...new Set(rows.map((r) => r[2]))], a));
  delete q.text;
  return { ...q, say: w };
}
const TONE_LABEL = ['', 'ˉ 第一声', 'ˊ 第二声', 'ˇ 第三声', 'ˋ 第四声'];
function toneHear() {
  const item = pick(TONE);
  const t = tone(item.py);
  const opts = shuffle([t, ...shuffle([1, 2, 3, 4].filter((x) => x !== t)).slice(0, 2)]);
  return { key: `t-${item.w}`, prompt: P.tone, say: item.w, choices: opts.map((v) => ({ label: TONE_LABEL[v], value: v })), answer: t };
}
function tonePick() {
  const item = pick(TONE);
  const t = tone(item.py);
  return ask(`tp-${item.w}`, P.pinyin, item.w, item.py, [1, 2, 3, 4].filter((x) => x !== t).map((x) => retone(item.py, x)));
}
function strokes() {
  const [w, n] = pick(STROKES);
  return { key: `bh-${w}`, prompt: P.strokes, text: w, choices: numberChoices(n, 1, 7), answer: n };
}
function radical() {
  const r = pick(Object.keys(RADICALS));
  const w = pick([...RADICALS[r]]);
  return ask(`bs-${w}`, P.radical, w, r, others(Object.keys(RADICALS), r));
}
const measure = ({ set, items }) => () => {
  const [n, a, also = ''] = pick(items);
  return ask(`lc-${n}`, P.measure, `一（　）${n}`, a, set.filter((x) => x !== a && !also.includes(x)));
};
const pairs = (list, prompt, k) => () => {
  const pair = pick(list);
  const i = pick([0, 1]);
  return ask(`${k}-${pair[i]}`, prompt, pair[i], pair[1 - i], others(list, pair).flat());
};
const fill = (rows, prompt, k, extra) => () => {
  const [t, a, d] = pick(rows);
  return ask(`${k}-${t}`, prompt, t, a, d, extra);
};
function aabb() {
  const [a, b] = pick(AABB);
  return ask(`dc-${a}${b}`, P.aabb, a + b, a + a + b + b, [a + b + b, a + a + b]);
}
// Blank one word of the pair; choices are that word of each pair.
const link = (groups, firstOnly) => () => {
  const [pair, list] = pick(groups);
  const s = pick(list);
  const i = firstOnly ? 0 : pick([0, 1]);
  const at = i ? s.indexOf(pair[1], s.indexOf(pair[0]) + pair[0].length) : s.indexOf(pair[0]);
  const t = s.slice(0, at) + '（　）' + s.slice(at + pair[i].length);
  return ask(`gl-${i}-${s}`, P.link, t, pair[i], groups.map(([p]) => p[i]));
};
function baBei() {
  const [d, t, v] = pick(BA);
  const ba = pick([true, false]);
  const s = ba ? `${d}（　）${t}${v}。` : `${t}（　）${d}${v}。`;
  return ask(`bb-${s}`, P.char, s, ba ? '把' : '被', ['把', '被', '在']);
}
function baBeiSwap() {
  const [d, t, v] = pick(BA);
  const ba = `${d}把${t}${v}。`;
  const bei = `${t}被${d}${v}。`;
  const wrong = [`${t}把${d}${v}。`, `${d}被${t}${v}。`];
  return pick([true, false])
    ? ask(`bs1-${ba}`, P.same, ba, bei, wrong, { stack: true })
    : ask(`bs2-${bei}`, P.same, bei, ba, wrong, { stack: true });
}
const idiomMeaning = (list) => () => {
  const [w, m] = pick(list);
  return ask(`cy-${w}`, P.meaning, w, m, others(list.map((x) => x[1]), m), { stack: true });
};
const idiomPick = (list) => () => {
  const [w, m] = pick(list);
  return ask(`cyp-${w}`, P.idiom, m, w, others(list.map((x) => x[0]), w));
};
function idiomFill() {
  const [w] = pick(IDIOMS);
  const i = Math.floor(Math.random() * 4);
  // No number characters: 三心两意 / 一举三得 are said too.
  const wrong = [...new Set(IDIOMS.map((x) => x[0][i]))].filter((ch) => !w.includes(ch) && !'一二三四五六七八九十两'.includes(ch));
  return ask(`cyf-${w}-${i}`, P.char, w.slice(0, i) + '（　）' + w.slice(i + 1), w[i], wrong);
}
function rhetoric() {
  const kind = pick(Object.keys(RHETORIC));
  const s = pick(RHETORIC[kind]);
  return ask(`xc-${s}`, P.rhetoric, s, kind, others(Object.keys(RHETORIC), kind));
}
const reading = (year) => () => {
  const [p, qs] = pick(READING[year]);
  const [q, a, d] = pick(qs);
  return ask(`yd-${q}`, P.read, `${p}<br><br><b>${q}</b>`, a, d, { stack: true });
};

// [id suffix, year, en, ms, icon, gen], in KSSR teaching order.
const KSSR = [
  ['y1-initials', 1, 'Pinyin: initials', 'Pinyin: huruf awal', '🔤', () => heard(INITIALS, P.initial, 'sm')],
  ['y1-finals', 1, 'Pinyin: finals', 'Pinyin: huruf akhir', '🔤', () => heard(FINALS, P.final, 'ym')],
  ['y1-tones', 1, 'Four tones', 'Empat nada', '🎵', toneHear],
  ['y1-tone-pinyin', 1, 'Pinyin with tones', 'Pinyin bernada', '🎵', tonePick],
  ['y1-animals', 1, 'Animals', 'Haiwan', '🐾', () => read(THEMES.animals)],
  ['y1-school', 1, 'School & home', 'Sekolah & rumah', '🏫', () => listen(THEMES.school)],
  ['y1-strokes', 1, 'Stroke count', 'Bilangan strok', '✍️', strokes],
  ['y2-weather', 2, 'Nature & weather', 'Alam & cuaca', '🌦️', () => read(THEMES.weather)],
  ['y2-radicals', 2, 'Radicals', 'Radikal', '🧱', radical],
  ['y2-measure', 2, 'Measure words', 'Penjodoh bilangan', '🔢', measure(MEASURE1)],
  ['y2-opposites', 2, 'Opposites', 'Antonim', '↔️', pairs(OPP1, P.opposite, 'fy')],
  ['y2-verbs', 2, 'Word pairs: verbs', 'Padanan kata kerja', '🧩', fill(VERB_NOUN, P.word, 'dp')],
  ['y2-aabb', 2, 'Doubled words', 'Kata ganda', '👯', aabb],
  ['y2-punctuation', 2, 'Punctuation: end marks', 'Tanda baca: akhir ayat', '❓', fill(PUNCT1, P.punct, 'bd')],
  ['y3-measure', 3, 'More measure words', 'Lagi penjodoh bilangan', '🔢', measure(MEASURE2)],
  ['y3-synonyms', 3, 'Synonyms', 'Sinonim', '🤝', pairs(SYN, P.synonym, 'jy')],
  ['y3-linking', 3, 'Linking words', 'Kata hubung', '🔗', link(LINK1, false)],
  ['y3-ba-bei', 3, '把 and 被', '把 dan 被', '🔁', baBei],
  ['y3-reading', 3, 'Reading', 'Pemahaman', '📖', reading(3)],
  ['y4-opposites', 4, 'More opposites', 'Lagi antonim', '↔️', pairs(OPP2, P.opposite, 'fy2')],
  ['y4-idioms', 4, 'Idioms: meaning', 'Simpulan bahasa: maksud', '💬', idiomMeaning(IDIOMS)],
  ['y4-ba-bei-swap', 4, '把 ⇄ 被 sentences', 'Ayat 把 ⇄ 被', '🔁', baBeiSwap],
  ['y4-punctuation', 4, 'Punctuation: 、 and ：', 'Tanda baca: 、 dan ：', '❗', fill(PUNCT2, P.punct, 'bd2')],
  ['y4-reading', 4, 'Reading', 'Pemahaman', '📖', reading(4)],
  ['y5-idiom-pick', 5, 'Idioms: pick one', 'Simpulan bahasa: pilih', '💬', idiomPick(IDIOMS)],
  ['y5-idiom-fill', 5, 'Idioms: fill in', 'Simpulan bahasa: isi', '💬', idiomFill],
  ['y5-linking', 5, 'More linking words', 'Lagi kata hubung', '🔗', link(LINK2, true)],
  ['y5-adjectives', 5, 'Word pairs: describing', 'Padanan kata sifat', '🧩', fill(ADJ_NOUN, P.word, 'dp2')],
  ['y5-reading', 5, 'Reading', 'Pemahaman', '📖', reading(5)],
  ['y6-fables', 6, 'Fable idioms: meaning', 'Simpulan bahasa dongeng: maksud', '🦊', idiomMeaning(FABLES)],
  ['y6-fable-pick', 6, 'Fable idioms: pick one', 'Simpulan bahasa dongeng: pilih', '🦊', idiomPick(FABLES)],
  ['y6-rhetoric', 6, 'Figures of speech', 'Gaya bahasa', '🎭', rhetoric],
  ['y6-reading', 6, 'Reading: stories', 'Pemahaman: cerita', '📖', reading(6)],
];
const KSSR_STICKERS = ['🌞', '🌝', '🌛', '⭐', '🌟', '✨', '☄️', '🌊', '💧', '🔥', '⚡', '☀️', '🌤️', '🌦️', '🌩️', '🌨️',
  '☃️', '⛄', '🌬️', '🌪️', '🌫️', '🌀', '🌾', '🪴', '🪵', '🪨', '🌲', '🍂', '🍃', '🪷', '🪻', '🥀', '🏵️'];
for (const [id, year, en, ms, icon, gen] of KSSR) {
  const n = levels.length;
  levels.push({ id: `zh-${id}`, year, title: { en, ms }, icon, sticker: { id: `st-zh-${n + 1}`, e: KSSR_STICKERS[n - 20] }, gen });
}

export { MARKS, tone, plain, THEMES, TONE, INITIALS, FINALS, STROKES, RADICALS, MEASURE1, MEASURE2, OPP1, OPP2, SYN,
  LINK2, BA, IDIOMS, FABLES, READING, P };
export default { id: 'zh', name: '华文', icon: '🏮', color: '#ff9e9e', lang: 'zh', placement: false, levels };
