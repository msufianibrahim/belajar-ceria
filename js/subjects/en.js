import { pick, shuffle } from './util.js';

// Word tiers follow the JejakJaya order: letters -> CVC -> colours/numbers -> verbs -> family/body.
// g: words only get mixed with the same group (a colour is never offered beside a number).
const NOUNS = [
  { w: 'apple', e: '🍎' }, { w: 'ball', e: '⚽' }, { w: 'cat', e: '🐱' }, { w: 'dog', e: '🐶' },
  { w: 'egg', e: '🥚' }, { w: 'fish', e: '🐟' }, { w: 'goat', e: '🐐' }, { w: 'hat', e: '🎩' },
  { w: 'ice', e: '🧊' }, { w: 'jet', e: '✈️' }, { w: 'kite', e: '🪁' }, { w: 'lion', e: '🦁' },
  { w: 'moon', e: '🌙' }, { w: 'nose', e: '👃' }, { w: 'octopus', e: '🐙' }, { w: 'pig', e: '🐷' },
  { w: 'queen', e: '👸' }, { w: 'rabbit', e: '🐇' }, { w: 'sun', e: '☀️' }, { w: 'tiger', e: '🐯' },
  { w: 'umbrella', e: '☔' }, { w: 'van', e: '🚐' }, { w: 'watch', e: '⌚' }, { w: 'box', e: '📦' },
  { w: 'yo-yo', e: '🪀' }, { w: 'zebra', e: '🦓' },
];
// Source had wig (same picture as hair), net as a web and pot as a honey pot: swapped for clear pictures.
const CVC = [
  { w: 'bat', e: '🦇' }, { w: 'bed', e: '🛏️' }, { w: 'bin', e: '🗑️' }, { w: 'bus', e: '🚌' },
  { w: 'cup', e: '☕' }, { w: 'hen', e: '🐔' }, { w: 'map', e: '🗺️' }, { w: 'net', e: '🥅' },
  { w: 'pen', e: '🖊️' }, { w: 'pot', e: '🍲' }, { w: 'rat', e: '🐀' }, { w: 'six', e: '6️⃣' },
  { w: 'tap', e: '🚰' }, { w: 'ten', e: '🔟' }, { w: 'fox', e: '🦊' }, { w: 'zip', e: '🤐' },
];
const COLOURS = [
  { w: 'red', e: '🔴', g: 'c' }, { w: 'blue', e: '🔵', g: 'c' }, { w: 'green', e: '🟢', g: 'c' },
  { w: 'yellow', e: '🟡', g: 'c' }, { w: 'black', e: '⚫', g: 'c' }, { w: 'white', e: '⚪', g: 'c' },
  { w: 'orange', e: '🟠', g: 'c' },
  { w: 'one', e: '1️⃣', g: 'n' }, { w: 'two', e: '2️⃣', g: 'n' }, { w: 'three', e: '3️⃣', g: 'n' },
  { w: 'four', e: '4️⃣', g: 'n' }, { w: 'five', e: '5️⃣', g: 'n' },
];
const VERBS = [
  { w: 'run', e: '🏃' }, { w: 'jump', e: '🤸' }, { w: 'eat', e: '🍽️' }, { w: 'sleep', e: '😴' },
  { w: 'swim', e: '🏊' }, { w: 'read', e: '📖' }, { w: 'sing', e: '🎤' }, { w: 'draw', e: '🖍️' },
  { w: 'walk', e: '🚶' }, { w: 'sit', e: '🪑' }, { w: 'play', e: '🎮' }, { w: 'wash', e: '🧼' },
];
// Source said "mom"; Malaysian English says "mum".
const BODY = [
  { w: 'mum', e: '👩' }, { w: 'dad', e: '👨' }, { w: 'baby', e: '👶' }, { w: 'boy', e: '👦' },
  { w: 'girl', e: '👧' }, { w: 'eye', e: '👁️' }, { w: 'ear', e: '👂' }, { w: 'nose', e: '👃' },
  { w: 'hand', e: '✋' }, { w: 'foot', e: '🦶' }, { w: 'mouth', e: '👄' }, { w: 'hair', e: '💇' },
];

// 3 choices: the word plus 2 others. Later in the round the others look more alike (same first letter or length).
function choicesFor(items, it, pos) {
  const others = items.filter((x) => x !== it && x.g === it.g);
  const like = (x) => (x.w[0] === it.w[0] ? 2 : 0) + (x.w.length === it.w.length ? 1 : 0);
  const pool = pos >= 5 ? shuffle(others).sort((a, b) => like(b) - like(a)).slice(0, 4) : others;
  return shuffle([it, ...shuffle(pool).slice(0, 2)]).map((x) => ({ label: x.w, value: x.w }));
}

// Listening: `say` is what the speaker says (the prompt must not hold the answer); choices are the written words.
const listen = (items, pos) => {
  const it = pick(items);
  return {
    key: `l-${it.w}`, prompt: { en: 'Listen and pick.' }, say: it.w,
    choices: choicesFor(items, it, pos), answer: it.w,
  };
};

const look = (items, pos) => {
  const it = pick(items);
  return {
    key: `r-${it.w}`, prompt: { en: 'What is this?' },
    visual: `<div class="items"><span>${it.e}</span></div>`,
    choices: choicesFor(items, it, pos), answer: it.w,
  };
};

// Read aloud: a grown-up ticks it (no speech recognition).
const say = (items) => {
  const it = pick(items);
  return {
    key: `s-${it.w}`, prompt: { en: 'Read it aloud.' },
    visual: `<div class="items"><span>${it.e}</span></div>`,
    read: it.w, choices: [], answer: true,
  };
};

// Writing levels from the source are dropped (no handwriting for English); listening covers the spelling.
const tier = (slug, items, name, ms, icon, stickers) => [
  { id: `en-${slug}-listen`, title: { en: `${name}: listen`, ms: `${ms}: dengar` }, icon: '👂', sticker: stickers[0], gen: (pos) => listen(items, pos) },
  { id: `en-${slug}-look`, title: { en: `${name}: look`, ms: `${ms}: lihat` }, icon, sticker: stickers[1], gen: (pos) => look(items, pos) },
  { id: `en-${slug}-say`, title: { en: `${name}: say it`, ms: `${ms}: sebut` }, icon: '🗣️', sticker: stickers[2], gen: () => say(items) },
];

const st = (n, e) => ({ id: `st-en-${n}`, e });
const stickers = [
  st(1, '🚗'), st(2, '🚕'), st(3, '🚌'), st(4, '🚎'), st(5, '🚓'), st(6, '🚑'), st(7, '🚒'), st(8, '🚜'),
  st(9, '🚲'), st(10, '🛵'), st(11, '🏍️'), st(12, '🚂'), st(13, '🚁'), st(14, '🚀'), st(15, '⛵'),
];
const s3 = (i) => stickers.slice(i * 3, i * 3 + 3);

// ---- KSSR Year 1-6 levels (appended after the preschool ones) ----
// Pools are written so each distractor is clearly wrong in standard British English.
// mc: 3 choices = the answer + 2 of `wrongs` (shuffled).
const mc = (key, prompt, answer, wrongs, extra = {}) => ({
  key, prompt: { en: prompt }, answer, ...extra,
  choices: shuffle([answer, ...shuffle(wrongs).slice(0, 2)]).map((v) => ({ label: v, value: v })),
});
// items: [sentence with ____, answer, wrongs]
const blank = (items, extra = {}) => () => {
  const [text, answer, wrongs] = pick(items);
  return mc(text, 'Fill in the blank.', answer, wrongs, { text, ...extra });
};
const pic = (e) => `<div class="items"><span>${e}</span></div>`;
const person = (cp) => `\u{1F9D1}‍${cp}`; // gender-neutral job emoji

const STK = [
  '🛺', '🚐', '🛻', '🚚', '🚛', '🏎️', '🛴', '🛹', '🚤', '🛳️', '⛴️', '🚢', '✈️', '🛩️', '🛰️', '🚠', '🚡', '🚟',
  '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🏰', '🏯', '🗼', '🗽', '🏠', '🏡', '🏢',
  '🏫', '🏥', '🏦', '🏪', '🎡', '🎢',
];
let sn = 16; // st-en-1..15 are the preschool stickers
const lv = (slug, year, en, ms, icon, gen) => {
  const i = sn++;
  return { id: `en-${slug}`, year, title: { en, ms }, icon, sticker: st(i, STK[i - 16]), gen };
};

// ----- Year 1 -----
// Only digraph pairs where one choice makes a real word (so no thicken/chicken, sherry/cherry clashes).
const DIGRAPH = [
  ['shell', '__ell', 'sh', '🐚'], ['cheese', '__eese', 'ch', '🧀'], ['chair', '__air', 'ch', '🪑'],
  ['shark', '__ark', 'sh', '🦈'], ['shirt', '__irt', 'sh', '👕'], ['fish', 'fi__', 'sh', '🐟'],
  ['three', '__ree', 'th', '3️⃣'], ['thumb', '__umb', 'th', '👍'], ['thread', '__read', 'th', '🧵'],
  ['shower', '__ower', 'sh', '🚿'], ['sandwich', 'sandwi__', 'ch', '🥪'], ['teeth', 'tee__', 'th', '🦷'],
  ['peach', 'pea__', 'ch', '🍑'], ['beach', 'bea__', 'ch', '🏖️'],
];
const MAGIC_E = ['cap', 'tap', 'mad', 'kit', 'bit', 'hop', 'not', 'cub', 'tub', 'pin', 'rob', 'can', 'hat', 'fin', 'rod'];
// [letter, how it is said, example, words with that long vowel]
const LONG_V = [
  ['a', 'ay', 'day', ['cake', 'rain', 'tape', 'name', 'gate']],
  ['e', 'ee', 'me', ['tree', 'bee', 'sea', 'leaf', 'feet']],
  ['i', 'eye', 'ice', ['kite', 'bike', 'five', 'nine', 'line']],
  ['o', 'oh', 'go', ['boat', 'home', 'nose', 'rose', 'bone']],
  ['u', 'you', 'use', ['cube', 'tube', 'cute', 'mule', 'huge']],
];
const SHORT_V = ['cat', 'bed', 'pig', 'dog', 'sun', 'hat', 'pen', 'bus', 'pot', 'cup', 'map', 'net'];
// Listening prompt must not hold a sight word (the existing listen test checks), so it stays generic.
const SIGHT = ['the', 'and', 'was', 'you', 'they', 'said', 'have', 'come', 'here', 'little', 'look', 'with', 'that', 'what', 'where', 'there', 'some'];
const FAMILY = [
  ["Your mother's mother is your ____.", 'grandmother', ['grandfather', 'aunt']],
  ["Your father's father is your ____.", 'grandfather', ['grandmother', 'uncle']],
  ["Your father's mother is your ____.", 'grandmother', ['grandfather', 'aunt']],
  ["Your mother's father is your ____.", 'grandfather', ['grandmother', 'uncle']],
  ["Your mother's brother is your ____.", 'uncle', ['aunt', 'cousin']],
  ["Your father's brother is your ____.", 'uncle', ['aunt', 'cousin']],
  ["Your mother's sister is your ____.", 'aunt', ['uncle', 'cousin']],
  ["Your father's sister is your ____.", 'aunt', ['uncle', 'cousin']],
  ["Your uncle's son is your ____.", 'cousin', ['brother', 'grandfather']],
  ["Your aunt's daughter is your ____.", 'cousin', ['sister', 'grandmother']],
  ["Your parents' other daughter is your ____.", 'sister', ['cousin', 'aunt']],
  ["Your parents' other son is your ____.", 'brother', ['cousin', 'uncle']],
  ['Your mother and father are your ____.', 'parents', ['cousins', 'grandparents']],
  ['Your brothers and sisters are your ____.', 'siblings', ['parents', 'cousins']],
];
const SCHOOL = [
  { w: 'pencil', e: '✏️' }, { w: 'pen', e: '🖊️' }, { w: 'book', e: '📖' }, { w: 'bag', e: '🎒' },
  { w: 'ruler', e: '📏' }, { w: 'scissors', e: '✂️' }, { w: 'teacher', e: person('\u{1F3EB}') },
  { w: 'school', e: '🏫' }, { w: 'computer', e: '💻' }, { w: 'chair', e: '🪑' }, { w: 'bell', e: '🔔' },
  { w: 'globe', e: '🌍' }, { w: 'clock', e: '⏰' },
];
const FOOD = [
  { w: 'rice', e: '🍚' }, { w: 'bread', e: '🍞' }, { w: 'egg', e: '🥚' }, { w: 'milk', e: '🥛' },
  { w: 'apple', e: '🍎' }, { w: 'banana', e: '🍌' }, { w: 'cake', e: '🎂' }, { w: 'noodles', e: '🍜' },
  { w: 'orange', e: '🍊' }, { w: 'cheese', e: '🧀' }, { w: 'carrot', e: '🥕' }, { w: 'tomato', e: '🍅' },
  { w: 'grapes', e: '🍇' }, { w: 'watermelon', e: '🍉' }, { w: 'chicken', e: '🍗' },
];

// ----- Year 2 -----
const ANIMALS = [
  { w: 'dog', e: '🐶' }, { w: 'cat', e: '🐱' }, { w: 'bird', e: '🐦' }, { w: 'fish', e: '🐟' },
  { w: 'cow', e: '🐄' }, { w: 'horse', e: '🐴' }, { w: 'duck', e: '🦆' }, { w: 'monkey', e: '🐒' },
  { w: 'elephant', e: '🐘' }, { w: 'frog', e: '🐸' }, { w: 'snake', e: '🐍' }, { w: 'sheep', e: '🐑' },
  { w: 'bear', e: '🐻' }, { w: 'turtle', e: '🐢' }, { w: 'butterfly', e: '🦋' },
];
// Left out: hot/cold faces and umbrella (a picture of the sun could also be "hot").
const SKY = [
  { w: 'sunny', e: '☀️' }, { w: 'rainy', e: '🌧️' }, { w: 'cloudy', e: '☁️' }, { w: 'windy', e: '🌬️' },
  { w: 'rainbow', e: '🌈' }, { w: 'lightning', e: '⚡' }, { w: 'foggy', e: '🌫️' }, { w: 'tornado', e: '🌪️' },
  { w: 'snowman', e: '⛄' }, { w: 'snowflake', e: '❄️' }, { w: 'moon', e: '🌙' }, { w: 'star', e: '⭐' },
];
// No "nurse": the doctor picture would match both.
const JOBS = [
  { w: 'doctor', e: person('⚕️') }, { w: 'police officer', e: '👮' }, { w: 'firefighter', e: person('\u{1F692}') },
  { w: 'farmer', e: person('\u{1F33E}') }, { w: 'cook', e: person('\u{1F373}') }, { w: 'pilot', e: person('✈️') },
  { w: 'astronaut', e: person('\u{1F680}') }, { w: 'artist', e: person('\u{1F3A8}') }, { w: 'singer', e: person('\u{1F3A4}') },
  { w: 'scientist', e: person('\u{1F52C}') }, { w: 'mechanic', e: person('\u{1F527}') }, { w: 'teacher', e: person('\u{1F3EB}') },
  { w: 'builder', e: '👷' },
];
const PLACES = [
  { w: 'school', e: '🏫' }, { w: 'hospital', e: '🏥' }, { w: 'bank', e: '🏦' }, { w: 'shop', e: '🏪' },
  { w: 'house', e: '🏠' }, { w: 'mosque', e: '🕌' }, { w: 'temple', e: '🛕' }, { w: 'church', e: '⛪' },
  { w: 'beach', e: '🏖️' }, { w: 'park', e: '🏞️' }, { w: 'station', e: '🚉' }, { w: 'hotel', e: '🏨' },
  { w: 'factory', e: '🏭' }, { w: 'castle', e: '🏰' },
];
const AN_WORDS = ['apple', 'egg', 'ant', 'orange', 'umbrella', 'elephant', 'ice cream', 'owl', 'octopus', 'uncle', 'eraser', 'envelope'];
const A_WORDS = ['ball', 'cat', 'dog', 'pen', 'book', 'bus', 'kite', 'hat', 'fish', 'zebra', 'tiger', 'pig', 'ruler', 'bag'];
const PL_S = ['cat', 'dog', 'book', 'pen', 'ball', 'cup', 'bag', 'egg', 'kite', 'hat', 'chair', 'table', 'apple', 'pencil'];
const PL_ES = ['box', 'dish', 'watch', 'brush', 'glass', 'class', 'fox', 'dress', 'peach', 'bench'];
const DEM_NOUNS = [['pen', 'pens'], ['bag', 'bags'], ['book', 'books'], ['ball', 'balls'], ['cat', 'cats'], ['kite', 'kites'], ['cup', 'cups'], ['hat', 'hats']];

// ----- Year 3 -----
const BE_SUBJ = [
  ['I', 'am'], ['He', 'is'], ['She', 'is'], ['It', 'is'], ['You', 'are'], ['We', 'are'], ['They', 'are'],
  ['The cat', 'is'], ['The boys', 'are'], ['My sister', 'is'], ['The books', 'are'], ['Ali', 'is'], ['Mei Ling and Ravi', 'are'],
];
const BE_REST = ['happy.', 'at school.', 'in the park.', 'very tall.'];
const PRONOUN = [
  ['Ali is my friend. ____ likes football.', 'He', ['She', 'It']],
  ['Mei Ling is in Year 3. ____ reads many books.', 'She', ['He', 'They']],
  ['The sun is bright. ____ is very hot.', 'It', ['He', 'We']],
  ['My parents are at home. ____ are cooking dinner.', 'They', ['He', 'She']],
  ['Ravi and I are friends. ____ play together.', 'We', ['He', 'They']],
  ['Cikgu Aminah is kind. ____ teaches us English.', 'She', ['He', 'They']],
  ['Where is the book? ____ is on the table.', 'It', ['He', 'She']],
  ['Sam, ____ are my best friend.', 'You', ['He', 'It']],
  ['The boys are tired. ____ go to bed early.', 'They', ['He', 'It']],
  ['My brother is tall. ____ plays basketball.', 'He', ['She', 'It']],
  ['Mum and I are baking. ____ like cakes.', 'We', ['She', 'It']],
  ['Dad is a driver. ____ drives a lorry.', 'He', ['She', 'They']],
  ['The flowers are red. ____ smell nice.', 'They', ['He', 'She']],
  ['Zara has a new bag. ____ is blue.', 'It', ['He', 'She']],
  ['My name is Raj. ____ am nine years old.', 'I', ['He', 'She']],
];
// subject -> [possessive, verb, things it can own]; each question says the owner is the same person.
const POSS = [
  ['I', 'my', 'have', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['You', 'your', 'have', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['He', 'his', 'has', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['She', 'her', 'has', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['We', 'our', 'have', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['They', 'their', 'have', ['kite', 'bag', 'pen', 'book', 'ball', 'hat']],
  ['The cat', 'its', 'has', ['ball', 'toy', 'bowl', 'bed']],
];
const COLOUR_HEX = { red: '#e53935', blue: '#1e88e5', green: '#43a047' };
// Little picture: a ball and a table / box; only the ball's position changes.
const scene = (thing, cx, cy, hex) => {
  const wood = '#8d6e63';
  const body = thing === 'table'
    ? `<rect x="20" y="40" width="70" height="8" fill="${wood}"/><rect x="24" y="48" width="6" height="40" fill="${wood}"/><rect x="80" y="48" width="6" height="40" fill="${wood}"/>`
    : thing === 'box'
      ? `<rect x="35" y="50" width="50" height="38" fill="none" stroke="${wood}" stroke-width="4"/>`
      : `<rect x="8" y="58" width="30" height="30" fill="none" stroke="${wood}" stroke-width="4"/><rect x="92" y="58" width="30" height="30" fill="none" stroke="${wood}" stroke-width="4"/>`;
  return `<svg viewBox="0 0 130 100" width="190" role="img" aria-label="a ball and a ${thing}"><line x1="0" y1="89" x2="130" y2="89" stroke="#999"/>${body}<circle cx="${cx}" cy="${cy}" r="9" fill="${hex}"/></svg>`;
};
// [thing, ball x, ball y, answer, wrongs]
const SCENES = [
  ['table', 55, 31, 'on', ['in', 'under', 'next to']], ['table', 55, 79, 'under', ['in', 'on', 'next to']],
  ['table', 112, 79, 'next to', ['in', 'on', 'under']], ['box', 60, 70, 'in', ['on', 'under', 'next to']],
  ['box', 60, 39, 'on', ['in', 'under', 'next to']], ['box', 108, 79, 'next to', ['in', 'on', 'under']],
  ['two boxes', 65, 79, 'between', ['in', 'on', 'under']],
];
const PREP_PLACE = [
  ...SCENES.flatMap(([thing, x, y, answer, wrongs]) => Object.entries(COLOUR_HEX).map(([c, hex]) => ({
    key: `pp-${thing}-${answer}-${c}`, text: `The ${c} ball is ____ the ${thing === 'two boxes' ? 'two boxes' : thing}.`,
    visual: `<div class="items">${scene(thing === 'two boxes' ? 'boxes' : thing, x, y, hex)}</div>`, answer, wrongs,
  }))),
  { key: 'pp-queue1', text: 'Ali is standing in front of Ben. So Ben is standing ____ Ali.', answer: 'behind', wrongs: ['in front of', 'between'] },
  { key: 'pp-queue2', text: 'Ali stands behind Ben. So Ben stands ____ Ali.', answer: 'in front of', wrongs: ['behind', 'between'] },
  { key: 'pp-shops', text: 'There is a shop on each side of our school. Our school is ____ the two shops.', answer: 'between', wrongs: ['on', 'under'] },
  { key: 'pp-kitchen', text: 'Mum is in the kitchen. She is ____ the house.', answer: 'in', wrongs: ['on', 'between'] },
];
const PL_Y = ['baby', 'city', 'fly', 'story', 'puppy', 'party', 'berry', 'lady', 'country', 'family'];
const PL_F = [
  ['leaf', 'leaves'], ['knife', 'knives'], ['wolf', 'wolves'], ['shelf', 'shelves'], ['wife', 'wives'],
  ['loaf', 'loaves'], ['calf', 'calves'], ['half', 'halves'], ['thief', 'thieves'], ['life', 'lives'],
];
// [singular, plural, wrong plurals]
const PL_IRR = [
  ['man', 'men', ['mans', 'mens']], ['woman', 'women', ['womans', 'womens']], ['child', 'children', ['childs', 'childes']],
  ['foot', 'feet', ['foots', 'feets']], ['tooth', 'teeth', ['tooths', 'teeths']], ['mouse', 'mice', ['mouses', 'mices']],
  ['goose', 'geese', ['gooses', 'geeses']], ['sheep', 'sheep', ['sheeps', 'sheepes']], ['deer', 'deer', ['deers', 'deeres']],
  ['ox', 'oxen', ['oxs', 'oxes']], ['snowman', 'snowmen', ['snowmans', 'snowmens']], ['postman', 'postmen', ['postmans', 'postmens']],
];
// [word, opposite, words that are NOT its opposite]
const OPPOSITES = [
  ['big', 'small', ['hot', 'fast', 'wet']], ['hot', 'cold', ['big', 'slow', 'tall']], ['up', 'down', ['in', 'fast', 'big']],
  ['fast', 'slow', ['cold', 'tall', 'wet']], ['happy', 'sad', ['hot', 'tall', 'fast']], ['tall', 'short', ['sad', 'cold', 'dry']],
  ['open', 'close', ['up', 'hot', 'wet']], ['day', 'night', ['hot', 'big', 'up']], ['full', 'empty', ['wet', 'tall', 'fast']],
  ['clean', 'dirty', ['sad', 'slow', 'tall']], ['wet', 'dry', ['happy', 'tall', 'slow']], ['early', 'late', ['hot', 'big', 'sad']],
  ['strong', 'weak', ['cold', 'wet', 'full']], ['hard', 'soft', ['hot', 'tall', 'up']], ['heavy', 'light', ['sad', 'wet', 'clean']],
  ['young', 'old', ['hot', 'big', 'wet']], ['good', 'bad', ['tall', 'wet', 'fast']], ['thick', 'thin', ['hot', 'sad', 'fast']],
  ['buy', 'sell', ['sad', 'tall', 'hot']], ['wide', 'narrow', ['hot', 'sad', 'dry']], ['rich', 'poor', ['tall', 'wet', 'slow']],
  ['near', 'far', ['hot', 'sad', 'soft']], ['loud', 'quiet', ['hot', 'tall', 'wet']],
];

// Reading passages: [passage, [question, answer, wrongs]...]. Answers come from the text; wrongs are not in it.
const reading = (passages) => () => {
  const pi = Math.floor(Math.random() * passages.length);
  const [text, qs] = passages[pi];
  const qi = Math.floor(Math.random() * qs.length);
  const [question, answer, wrongs] = qs[qi];
  return mc(`rd-${pi}-${qi}`, question, answer, wrongs, { text, stack: true });
};
const READ1 = [
  ['Sam has a red ball. He plays with it in the park every day.', [
    ['Who has a red ball?', 'Sam', ['Mum', 'The dog']],
    ['What colour is the ball?', 'Red', ['Blue', 'Green']],
    ['Where does Sam play?', 'In the park', ['At school', 'In the kitchen']],
  ]],
  ['Mei Ling has a cat. The cat is white and its name is Snowy. Snowy likes to drink milk.', [
    ["What is the cat's name?", 'Snowy', ['Fluffy', 'Tom']],
    ['What does Snowy like to drink?', 'Milk', ['Juice', 'Soup']],
    ['What colour is Snowy?', 'White', ['Black', 'Brown']],
  ]],
  ['It is Monday. Ravi walks to school with his sister. They see a big yellow bus.', [
    ['Which day is it?', 'Monday', ['Friday', 'Sunday']],
    ['How does Ravi go to school?', 'He walks', ['By car', 'By boat']],
    ['Who walks with Ravi?', 'His sister', ['His mother', 'His friend']],
    ['What do they see?', 'A big yellow bus', ['A red car', 'A small boat']],
  ]],
  ['Aina is eight years old. She likes to draw. Today she draws a house, a tree and the sun.', [
    ['How old is Aina?', 'Eight', ['Six', 'Nine']],
    ['What does Aina like to do?', 'Draw', ['Swim', 'Sing']],
    ['What does Aina draw today?', 'A house, a tree and the sun', ['A cat, a ball and a kite', 'A boat, a fish and the moon']],
  ]],
  ['We have a small garden. Dad plants flowers. Mum waters the plants every morning. I help to pick the flowers.', [
    ['Who plants the flowers?', 'Dad', ['Mum', 'My brother']],
    ['When does Mum water the plants?', 'Every morning', ['Every night', 'Every afternoon']],
    ['What does the writer do?', 'Picks the flowers', ['Plants the flowers', 'Waters the plants']],
  ]],
  ['The sun is hot today. Ben puts on his hat. He drinks cold water and sits under a big tree.', [
    ['What does Ben put on?', 'His hat', ['His coat', 'His shoes']],
    ['Where does Ben sit?', 'Under a big tree', ['In a shop', 'On a bus']],
    ['What does Ben drink?', 'Cold water', ['Hot tea', 'Milk']],
  ]],
];

// ----- Year 4 -----
// [base, 3rd person, -ing, what follows]
const PS_VERBS = [
  ['eat', 'eats', 'eating', 'rice'], ['drink', 'drinks', 'drinking', 'milk'], ['read', 'reads', 'reading', 'a book'],
  ['play', 'plays', 'playing', 'football'], ['watch', 'watches', 'watching', 'cartoons'], ['wash', 'washes', 'washing', 'the dishes'],
  ['go', 'goes', 'going', 'to school'], ['study', 'studies', 'studying', 'English'], ['fly', 'flies', 'flying', 'a kite'],
  ['like', 'likes', 'liking', 'fruit'], ['help', 'helps', 'helping', 'Mum'], ['brush', 'brushes', 'brushing', 'the floor'],
];
const PS_ONE = ['He', 'She', 'Ali', 'Mei Ling', 'My mother'];
const PS_MANY = ['I', 'You', 'We', 'They', 'The children'];
// [base, -ing, 3rd person, what follows]
const PC_VERBS = [
  ['play', 'playing', 'plays', 'football'], ['eat', 'eating', 'eats', 'rice'], ['drink', 'drinking', 'drinks', 'water'],
  ['read', 'reading', 'reads', 'a book'], ['run', 'running', 'runs', 'in the park'], ['swim', 'swimming', 'swims', 'in the pool'],
  ['sing', 'singing', 'sings', 'a song'], ['draw', 'drawing', 'draws', 'a picture'], ['write', 'writing', 'writes', 'a letter'],
  ['cook', 'cooking', 'cooks', 'dinner'], ['dance', 'dancing', 'dances', 'on the stage'], ['jump', 'jumping', 'jumps', 'on the bed'],
];
const PC_SUBJ = [['I', 'am'], ['He', 'is'], ['She', 'is'], ['Ali', 'is'], ['Mum', 'is'], ['We', 'are'], ['They', 'are'], ['The boys', 'are']];
// [base, past, kind of spelling change, what follows]
const PAST_REG = [
  ['walk', 'walked', 'ed', 'to school'], ['jump', 'jumped', 'ed', 'over the puddle'], ['help', 'helped', 'ed', 'Mum'],
  ['clean', 'cleaned', 'ed', 'the room'], ['cook', 'cooked', 'ed', 'dinner'], ['play', 'played', 'ed', 'football'],
  ['wash', 'washed', 'ed', 'the car'], ['visit', 'visited', 'ed', 'Grandma'], ['like', 'liked', 'd', 'the story'],
  ['dance', 'danced', 'd', 'on the stage'], ['bake', 'baked', 'd', 'a cake'], ['smile', 'smiled', 'd', 'at me'],
  ['close', 'closed', 'd', 'the door'], ['study', 'studied', 'ied', 'hard'], ['carry', 'carried', 'ied', 'the bag'],
  ['try', 'tried', 'ied', 'the new game'], ['hurry', 'hurried', 'ied', 'to school'], ['stop', 'stopped', 'dbl', 'at the red light'],
  ['clap', 'clapped', 'dbl', 'loudly'], ['plan', 'planned', 'dbl', 'a picnic'], ['hop', 'hopped', 'dbl', 'like a rabbit'],
  ['skip', 'skipped', 'dbl', 'in the field'], ['hug', 'hugged', 'dbl', 'Grandma'],
];
// Wrong forms: the common mistakes for each spelling change, plus the present form.
const PAST_WRONG = (b, kind) => ({
  ed: [`${b}d`, b], d: [`${b}ed`, b], ied: [`${b}ed`, b], dbl: [`${b}ed`, b],
}[kind]);
// [base, past, wrong "-ed" form, what follows]
const PAST_IRR = [
  ['go', 'went', 'goed', 'to the market'], ['eat', 'ate', 'eated', 'fried rice'], ['see', 'saw', 'seen', 'a rainbow'],
  ['come', 'came', 'comed', 'to my house'], ['take', 'took', 'taked', 'a photo'], ['give', 'gave', 'gived', 'me a pencil'],
  ['write', 'wrote', 'writed', 'a letter'], ['drink', 'drank', 'drinked', 'some water'], ['sit', 'sat', 'sitted', 'on the sofa'],
  ['make', 'made', 'maked', 'a cake'], ['buy', 'bought', 'buyed', 'a new bag'], ['sleep', 'slept', 'sleeped', 'early'],
  ['swim', 'swam', 'swimed', 'in the pool'], ['bring', 'brought', 'bringed', 'a drink'], ['find', 'found', 'finded', 'a coin'],
  ['tell', 'told', 'telled', 'a funny story'], ['ride', 'rode', 'rided', 'a bicycle'], ['fall', 'fell', 'falled', 'off the bed'],
  ['draw', 'drew', 'drawed', 'a picture'], ['fly', 'flew', 'flyed', 'a kite'], ['know', 'knew', 'knowed', 'the answer'],
  ['run', 'ran', 'runned', 'to the shop'], ['have', 'had', 'haved', 'a good day'], ['get', 'got', 'getted', 'a prize'],
];
const PAST_SUBJ = ['Ali', 'Mei Ling', 'Ravi', 'Aina', 'we', 'they'];
// "What" is never offered where "Which/What" could also fit; every wrong word is clearly wrong for the answer given.
const QWORDS = [
  ['____ is your birthday? It is in May.', 'When', ['Where', 'Who']],
  ['____ do you live? I live in Penang.', 'Where', ['Who', 'When']],
  ['____ is that boy? He is my cousin.', 'Who', ['Where', 'When']],
  ['____ are you crying? Because I lost my toy.', 'Why', ['Who', 'Where']],
  ['____ pencils do you have? I have five.', 'How many', ['How much', 'How old']],
  ['____ is this book? It is RM10.', 'How much', ['How many', 'How old']],
  ['____ old is your brother? He is ten years old.', 'How', ['What', 'Who']],
  ['____ is your favourite food? I like nasi lemak.', 'What', ['Where', 'When']],
  ['____ do you go to school? By bus.', 'How', ['Who', 'Where']],
  ['____ does the film start? At seven o\'clock.', 'When', ['Who', 'Where']],
  ['____ pen is this? It is Ali\'s.', 'Whose', ['Who', 'What']],
  ['____ is she going? To the library.', 'Where', ['Who', 'Why']],
  ['____ is the tallest in your class? Raj.', 'Who', ['Where', 'When']],
  ['____ did you eat for lunch? I ate fried rice.', 'What', ['Where', 'Who']],
];
// [sentence start, time, rest, preposition]: at = clock times and fixed points; on = days and dates; in = months, years, parts of the day.
const TIME_PREP = [
  ['School starts', '7.30', '.', 'at'], ['We eat lunch', 'noon', '.', 'at'], ['I see the stars', 'night', '.', 'at'],
  ['The shop closes', 'midnight', '.', 'at'], ['We visit Grandma', 'the weekend', '.', 'at'], ['I wake up', '6 o\'clock', '.', 'at'],
  ['We have PE', 'Wednesday', '.', 'on'], ['My party is', 'Saturday', '.', 'on'], ['Merdeka Day is', '31 August', '.', 'on'],
  ['We rest', 'Sunday', '.', 'on'], ['I got a gift', 'my birthday', '.', 'on'], ['We play outside', 'Friday morning', '.', 'on'],
  ['Ali was born', '2018', '.', 'in'], ['It rains a lot', 'December', '.', 'in'], ['We go to the beach', 'the school holidays', '.', 'in'],
  ['I do my homework', 'the afternoon', '.', 'in'], ['The birds sing', 'the morning', '.', 'in'], ['We watch TV', 'the evening', '.', 'in'],
  ['My uncle visits us', 'June', '.', 'in'], ['It is very hot', 'the dry season', '.', 'in'],
];
const READ2 = [
  ["Rina wakes up at six o'clock. She brushes her teeth. Then she has breakfast. After that she goes to school with her father. She reaches school at seven.", [
    ['What time does Rina wake up?', "Six o'clock", ["Seven o'clock", "Five o'clock"]],
    ['Who goes to school with Rina?', 'Her father', ['Her mother', 'Her brother']],
    ['What does Rina do after brushing her teeth?', 'Has breakfast', ['Goes to school', 'Reads a book']],
    ['When does Rina reach school?', 'At seven', ['At six', 'At eight']],
  ]],
  ['Last Saturday, our family went to the beach. We built a sandcastle and collected shells. My little brother was afraid of the waves, so he played on the sand. We went home when the sun set.', [
    ['When did the family go to the beach?', 'Last Saturday', ['Last Sunday', 'Last Friday']],
    ['What did they collect?', 'Shells', ['Stones', 'Fish']],
    ['Why did the little brother play on the sand?', 'He was afraid of the waves', ['He was tired', 'He was hungry']],
    ['When did they go home?', 'When the sun set', ['When it rained', 'At lunch time']],
  ]],
  ['Hana has a pet rabbit called Cotton. Cotton eats carrots and lettuce. Every afternoon Hana cleans the cage and gives Cotton fresh water. Cotton hops happily around the garden.', [
    ["What is the rabbit's name?", 'Cotton', ['Carrot', 'Lettuce']],
    ['What does Cotton eat?', 'Carrots and lettuce', ['Fish and rice', 'Bread and jam']],
    ['When does Hana clean the cage?', 'Every afternoon', ['Every morning', 'Every evening']],
    ['Where does Cotton hop around?', 'The garden', ['The kitchen', 'The classroom']],
  ]],
  ['Mr Lim is a baker. He gets up early to make bread. At eight o\'clock he opens his shop. Many people come to buy his warm bread.', [
    ["What is Mr Lim's job?", 'He is a baker', ['He is a doctor', 'He is a teacher']],
    ['Why does he get up early?', 'To make bread', ['To go to school', 'To clean the park']],
    ['What time does he open his shop?', "Eight o'clock", ["Six o'clock", "Ten o'clock"]],
    ['What do people buy?', 'Warm bread', ['Cold drinks', 'New shoes']],
  ]],
  ['The class went on a trip to the zoo. They saw elephants, monkeys and a tall giraffe. The elephants were drinking water. After lunch, the pupils drew pictures of their favourite animals.', [
    ['Where did the class go?', 'The zoo', ['The farm', 'The museum']],
    ['Which animal was tall?', 'The giraffe', ['The monkey', 'The elephant']],
    ['What were the elephants doing?', 'Drinking water', ['Sleeping', 'Swimming']],
    ['What did the pupils do after lunch?', 'Drew pictures', ['Went home', 'Fed the monkeys']],
  ]],
  ['It rained heavily last night. This morning the road was wet and there were big puddles. Farid wore his boots and carried an umbrella to school.', [
    ['When did it rain heavily?', 'Last night', ['This morning', 'Yesterday afternoon']],
    ['What did Farid wear?', 'His boots', ['His slippers', 'A hat']],
    ['What did Farid carry?', 'An umbrella', ['A kite', 'A basket']],
    ['What was on the road?', 'Big puddles', ['Snow', 'Sand']],
  ]],
];

// ----- Year 5 -----
// [adjective, comparative, superlative, comparative sentence, superlative sentence, wrong made-up form]
const ADJ = [
  ['tall', 'taller', 'tallest', 'A giraffe is ____ than a goat.', 'Raj is the ____ boy in our class.', 'more tall'],
  ['big', 'bigger', 'biggest', 'An elephant is ____ than a cat.', 'The blue whale is the ____ animal in the world.', 'biger'],
  ['small', 'smaller', 'smallest', 'An ant is ____ than a bird.', 'This is the ____ box of the three.', 'more small'],
  ['fast', 'faster', 'fastest', 'A car is ____ than a bicycle.', 'Amin is the ____ runner in our school.', 'more fast'],
  ['hot', 'hotter', 'hottest', 'Tea is ____ than ice water.', 'Today is the ____ day this week.', 'hoter'],
  ['cold', 'colder', 'coldest', 'Ice cream is ____ than tea.', 'This is the ____ drink in the fridge.', 'more cold'],
  ['happy', 'happier', 'happiest', 'Aina is ____ today than yesterday.', 'It was the ____ day of my life.', 'happyer'],
  ['heavy', 'heavier', 'heaviest', 'A lorry is ____ than a car.', 'Of a cat, a dog and an elephant, the elephant is the ____.', 'heavyer'],
  ['easy', 'easier', 'easiest', 'This test is ____ than the last test.', 'This is the ____ question in the test.', 'more easy'],
  ['long', 'longer', 'longest', 'A river is ____ than a stream.', 'Of the three ropes, the red one is the ____.', 'more long'],
  ['young', 'younger', 'youngest', 'Ali is ____ than his sister.', 'Sara is the ____ child in her family.', 'more young'],
  ['thin', 'thinner', 'thinnest', 'A pencil is ____ than a pole.', 'This is the ____ book on the shelf.', 'thiner'],
  ['good', 'better', 'best', 'This book is ____ than that one.', 'She is the ____ singer in our school.', 'gooder'],
  ['bad', 'worse', 'worst', 'The weather is ____ today than yesterday.', 'That was the ____ day ever.', 'badder'],
  ['beautiful', 'more beautiful', 'most beautiful', 'The rose is ____ than the weed.', 'This is the ____ flower in the garden.', 'beautifuler'],
  ['expensive', 'more expensive', 'most expensive', 'A car is ____ than a bicycle.', 'This is the ____ bag in the shop.', 'expensiver'],
  ['interesting', 'more interesting', 'most interesting', 'This story is ____ than that one.', 'It is the ____ book I have ever read.', 'interestinger'],
  ['difficult', 'more difficult', 'most difficult', 'Algebra is ____ than counting.', 'That was the ____ question in the test.', 'difficulter'],
];
// Each wrong conjunction gives a clearly wrong meaning.
const CONJ = [
  ['It was raining, ____ we stayed at home.', 'so', ['because', 'or']],
  ['I was hungry ____ I ate two bananas.', 'so', ['because', 'or']],
  ['He was late ____ the bus was slow.', 'because', ['or', 'so']],
  ['Do you want rice ____ noodles?', 'or', ['because', 'so']],
  ['Ali likes football ____ Ben likes swimming.', 'and', ['because', 'or']],
  ['I like apples, ____ I do not like grapes.', 'but', ['so', 'because']],
  ['She is happy ____ she won the race.', 'because', ['but', 'or']],
  ['The soup was hot, ____ I waited before I ate.', 'so', ['or', 'because']],
  ['I wanted to go out, ____ it was raining.', 'but', ['so', 'or']],
  ['We bought bread ____ milk at the shop.', 'and', ['but', 'because']],
  ['You can have tea ____ juice.', 'or', ['because', 'but']],
  ['He studied hard, ____ he passed the test.', 'so', ['but', 'or']],
  ['She cannot swim ____ she is afraid of water.', 'because', ['or', 'but']],
  ['I wore my coat ____ it was cold.', 'because', ['but', 'or']],
  ['The sun was hot ____ we went to swim.', 'so', ['or', 'because']],
  ['The bag is small, ____ it is heavy.', 'but', ['so', 'because']],
];
const MODALS = [
  ['Birds ____ fly.', 'can', ['must', 'should']],
  ['You ____ stop at a red light.', 'must', ['cannot', "mustn't"]],
  ['You ____ run in the corridor.', "mustn't", ['must', 'should']],
  ['You ____ eat vegetables to stay healthy.', 'should', ["mustn't", 'cannot']],
  ['A fish ____ walk on land.', 'cannot', ['can', 'must']],
  ['Ali is ill. He ____ see a doctor.', 'should', ['cannot', "mustn't"]],
  ['I ____ ride a bicycle. Watch me!', 'can', ["mustn't", 'cannot']],
  ['We ____ throw rubbish on the floor.', "mustn't", ['should', 'can']],
  ['You ____ brush your teeth twice a day.', 'should', ['cannot', "mustn't"]],
  ['A baby ____ walk when it is born.', 'cannot', ['can', 'should']],
  ['Children ____ play with fire.', "mustn't", ['can', 'should']],
  ['We ____ be kind to animals.', 'should', ['cannot', "mustn't"]],
  ['Bees ____ make honey.', 'can', ["mustn't", 'should']],
  ['You ____ wear a seat belt in a car.', 'must', ['cannot', "mustn't"]],
  ['Fish ____ live out of water.', 'cannot', ['can', 'should']],
];
const FUTURE = [
  ['Tomorrow, I ____ my grandmother.', 'will visit', ['visited', 'visiting']],
  ['Next week, we ____ a picnic.', 'will have', ['had', 'having']],
  ['Look at those dark clouds! It ____.', 'is going to rain', ['rained', 'will raining']],
  ['Ali ____ nine years old next month.', 'will be', ['was', 'is being']],
  ['I ____ my homework tonight.', 'will do', ['did', 'doing']],
  ['They ____ a new house next year.', 'are going to buy', ['bought', 'buying']],
  ['She ____ the bus at 7 o\'clock tomorrow.', 'will take', ['took', 'taking']],
  ['Next Sunday, Dad ____ us to the zoo.', 'is going to take', ['took', 'taked']],
  ['In the future, robots ____ us.', 'will help', ['helped', 'helping']],
  ['It is Friday. Tomorrow ____ Saturday.', 'will be', ['was', 'were']],
  ['I have bought flour and eggs. I ____ a cake.', 'am going to bake', ['baked', 'baking']],
  ['Next year, Mei Ling ____ to Year 6.', 'will go', ['went', 'going']],
  ['We ____ the museum next Tuesday.', 'are going to visit', ['visited', 'visiting']],
  ["Don't worry. I ____ you.", 'will help', ['helped', 'helping']],
];
// [word, two clearly wrong spellings]
const SPELL = [
  ['because', ['becuase', 'becos']], ['friend', ['freind', 'frend']], ['school', ['scool', 'skool']], ['again', ['agen', 'agian']],
  ['people', ['peaple', 'pepole']], ['together', ['togther', 'togethar']], ['beautiful', ['beutiful', 'beautifull']],
  ['different', ['diffrent', 'diferent']], ['tomorrow', ['tomorow', 'tommorow']], ['Wednesday', ['Wensday', 'Wedensday']],
  ['library', ['libary', 'librery']], ['sentence', ['sentance', 'sentense']], ['island', ['iland', 'islend']],
  ['would', ['wuld', 'woud']], ['thought', ['thort', 'thougt']], ['enough', ['enuf', 'enogh']],
  ['answer', ['anser', 'answar']], ['weather', ['weathar', 'wheather']], ['bought', ['bort', 'bougt']], ['busy', ['bizzy', 'busey']],
];
const READ3 = [
  ['Cikgu Salmah told the class to bring old newspapers for a recycling project. On Monday, Ahmad brought a big bundle. Wei Jie forgot his, so Ahmad shared some of his newspapers with him. By Friday, the class had collected more than one hundred sheets.', [
    ['What did the class collect?', 'Old newspapers', ['Plastic bottles', 'Used cans']],
    ['Why did Ahmad share his newspapers?', 'Wei Jie forgot his', ['Wei Jie asked for money', 'The teacher was angry']],
    ['When had the class collected over one hundred sheets?', 'By Friday', ['On Monday', 'Next week']],
    ['What is the project about?', 'Recycling', ['Cooking', 'Gardening']],
  ]],
  ['Deep in the forest lived a tiny frog named Pip. Pip was very shy and hid under a leaf when other animals came near. One rainy day, a baby bird fell from its nest. Pip jumped out bravely and called for the mother bird. After that, Pip was not afraid any more.', [
    ['Why did Pip hide under a leaf?', 'He was shy', ['He was sleepy', 'He was playing a game']],
    ['What happened on the rainy day?', 'A baby bird fell from its nest', ['Pip lost his way', 'A tree fell down']],
    ['How did Pip help?', 'He called for the mother bird', ['He built a nest', 'He gave the bird some food']],
    ['Which word describes Pip at the end?', 'Brave', ['Lazy', 'Angry']],
  ]],
  ['Water is important for all living things. Plants need water to grow. Animals drink water to stay healthy. People use water to drink, cook and wash. We must not waste water. We should close the tap when we brush our teeth.', [
    ['What is the passage mostly about?', 'Why water is important', ['How to brush teeth', 'Different kinds of animals']],
    ['Why do plants need water?', 'To grow', ['To sing', 'To sleep']],
    ['What should we do when we brush our teeth?', 'Close the tap', ['Open the tap', 'Drink a lot of juice']],
  ]],
  ['On Sunday, Kavitha helped her grandmother make kuih. First, they mixed the flour and coconut milk. Next, they poured the mixture into small moulds. Finally, they steamed the kuih for twenty minutes. The whole house smelled sweet.', [
    ['What did they make?', 'Kuih', ['Bread', 'Rice']],
    ['What did they do after mixing?', 'Poured it into moulds', ['Steamed it', 'Ate it']],
    ['How long did they steam the kuih?', 'Twenty minutes', ['Ten minutes', 'Two hours']],
    ['How did the house smell?', 'Sweet', ['Spicy', 'Sour']],
  ]],
  ['Hasan was nervous about the school concert. He was going to sing in front of everyone. His hands were cold and his heart beat fast. His teacher smiled and said, "Take a deep breath." Hasan sang loudly and everyone clapped.', [
    ['How did Hasan feel before the concert?', 'Nervous', ['Bored', 'Sleepy']],
    ['What did the teacher tell him?', 'Take a deep breath', ['Sing louder', 'Sit down']],
    ['What did everyone do at the end?', 'Clapped', ['Went home', 'Fell asleep']],
  ]],
  ['Bats sleep during the day and fly at night. They hang upside down in dark caves. Bats make sounds to find food in the dark. Many bats eat insects, so they help farmers.', [
    ['When do bats fly?', 'At night', ['In the morning', 'At noon']],
    ['Where do bats sleep?', 'In dark caves', ['In nests', 'In water']],
    ['How do bats find food in the dark?', 'They make sounds', ['They use a torch', 'They follow the moon']],
    ['Why do bats help farmers?', 'They eat insects', ['They plant seeds', 'They carry water']],
  ]],
];

// ----- Year 6 -----
const ADVERBS = [
  ['The tortoise walks ____.', 'slowly', ['slow', 'slowness']], ['Please speak ____ in the library.', 'quietly', ['quiet', 'quietness']],
  ['He runs ____.', 'quickly', ['quick', 'quickness']], ['She sang ____ at the concert.', 'beautifully', ['beautiful', 'beauty']],
  ['The baby slept ____.', 'peacefully', ['peaceful', 'peace']], ['Drive ____ near the school.', 'carefully', ['careful', 'care']],
  ['He writes ____.', 'neatly', ['neat', 'neatness']], ['They waited ____ for the bus.', 'patiently', ['patient', 'patience']],
  ['The boy answered ____.', 'politely', ['polite', 'politeness']], ['She smiled ____.', 'happily', ['happy', 'happiness']],
  ['He shouted ____.', 'loudly', ['loud', 'loudness']], ['She solved the puzzle ____.', 'easily', ['easy', 'ease']],
  ['She plays the piano ____.', 'well', ['good', 'goodly']], ['The car goes ____.', 'fast', ['fastly', 'fastness']],
  ['He works ____.', 'hard', ['hardly', 'hardness']],
];
// [sentence without its end mark, mark]; wrong marks are chosen so none of them could also be right.
const ENDMARK = [
  ['What is your name', '?'], ['Wow, that is amazing', '!'], ['The cat is sleeping', '.'], ['Where do you live', '?'],
  ['Look out', '!'], ['I like rice', '.'], ['How old are you', '?'], ['Happy birthday', '!'], ['Please sit down', '.'],
  ['Hooray, we won', '!'], ['Is it raining', '?'], ['My mother is a teacher', '.'], ['Can you swim', '?'],
  ['We went to the zoo', '.'], ['Who is that boy', '?'], ['What a beautiful day', '!'], ['Ali plays football every day', '.'],
  ['Do you like durian', '?'], ['The sky is blue', '.'],
];
const ENDMARK_WRONG = { '.': ['?', ','], '?': ['.', ','], '!': ['?', ','] };
// [correct, wrong, wrong]
const CAPITALS = [
  ['Ali and Mei Ling live in Penang.', 'ali and mei ling live in penang.', 'Ali and mei ling live in Penang.'],
  ['We go to school on Monday.', 'we go to school on monday.', 'We go to school on monday.'],
  ['My birthday is in March.', 'my birthday is in march.', 'My birthday is in march.'],
  ['Kuala Lumpur is the capital of Malaysia.', 'kuala lumpur is the capital of malaysia.', 'Kuala lumpur is the capital of malaysia.'],
  ['I am eight years old.', 'i am eight years old.', 'I am Eight Years Old.'],
  ['Mr Tan teaches English.', 'mr tan teaches english.', 'Mr Tan teaches english.'],
  ['On Sunday, we went to Melaka.', 'On sunday, we went to Melaka.', 'on Sunday, we went to melaka.'],
  ['The Petronas Twin Towers are in Kuala Lumpur.', 'The petronas twin towers are in kuala lumpur.', 'the Petronas Twin Towers are in Kuala Lumpur.'],
  ['Sarah speaks Malay and Chinese.', 'sarah speaks malay and chinese.', 'Sarah speaks malay and Chinese.'],
  ['We celebrate Merdeka Day on 31 August.', 'we celebrate Merdeka Day on 31 August.', 'We celebrate merdeka day on 31 august.'],
  ['Is Ahmad from Johor?', 'is ahmad from johor?', 'Is ahmad from Johor?'],
  ['Hasan and I went to the library on Friday.', 'hasan and i went to the library on friday.', 'Hasan and i went to the library on Friday.'],
];
const APOSTROPHE = [
  ["This is Ali's bag.", 'This is Alis bag.', "This is Alis' bag."],
  ["I don't like spiders.", 'I dont like spiders.', "I do'nt like spiders."],
  ["She isn't at home.", "She is'nt at home.", 'She isnt at home.'],
  ["The girl's hat is red.", 'The girls hat is red.', "The girl hat's is red."],
  ["It's raining today.", 'Its raining today.', "It'is raining today."],
  ["We can't go out.", 'We cant go out.', "We ca'nt go out."],
  ['The dog wagged its tail.', "The dog wagged it's tail.", "The dog wagged its' tail."],
  ["My mother's car is new.", 'My mothers car is new.', "My mothers' car is new."],
  ["They're playing football.", 'Their playing football.', 'There playing football.'],
  ["I'm ten years old.", 'Im ten years old.', "I'am ten years old."],
  ["Let's go to the park.", 'Lets go to the park.', "Lets' go to the park."],
  ["The teacher's desk is tidy.", 'The teachers desk is tidy.', "The teacher desk's is tidy."],
  ["Ravi's sister is nine.", 'Ravis sister is nine.', "Ravi sister's is nine."],
];
// [British, American, wrong]
const BRIT = [
  ['colour', 'color', 'colur'], ['favourite', 'favorite', 'favourit'], ['neighbour', 'neighbor', 'nieghbour'],
  ['centre', 'center', 'centar'], ['theatre', 'theater', 'theatar'], ['behaviour', 'behavior', 'behaviur'],
  ['harbour', 'harbor', 'harbur'], ['flavour', 'flavor', 'flavur'], ['honour', 'honor', 'honnour'],
  ['humour', 'humor', 'humur'], ['litre', 'liter', 'lietre'], ['grey', 'gray', 'grei'],
  ['travelled', 'traveled', 'travelld'], ['jewellery', 'jewelry', 'jewelery'],
];
// The time word decides the tense; wrongs use another tense, never a form that could also fit.
const MIXED = [
  ['Yesterday, I ____ to the market.', 'went', ['go', 'will go']],
  ['Right now, she ____ a letter.', 'is writing', ['wrote', 'will write']],
  ['Next week, we ____ to Penang.', 'will go', ['went', 'goes']],
  ['Last night, it ____ heavily.', 'rained', ['rains', 'will rain']],
  ['Look! The bird ____ in the sky.', 'is flying', ['flew', 'will fly']],
  ['Tomorrow, Mum ____ a cake.', 'will bake', ['baked', 'baking']],
  ['Last year, we ____ Japan.', 'visited', ['visit', 'will visit']],
  ['At the moment, the children ____ in the hall.', 'are singing', ['sang', 'will sing']],
  ['Three days ago, Raju ____ his bicycle.', 'fixed', ['fixes', 'will fix']],
  ['Listen! The baby ____.', 'is crying', ['cried', 'will cry']],
  ['Next month, I ____ ten years old.', 'will be', ['was', 'were']],
  ['Last Sunday, we ____ our grandparents.', 'met', ['meet', 'will meet']],
  ['Yesterday, the teacher ____ us a story.', 'told', ['tells', 'will tell']],
  ['Right now, Ali ____ his homework.', 'is doing', ['did', 'will do']],
];
const READ4 = [
  ['Last year, our school started a vegetable garden. At first, the soil was hard and dry, and nothing grew. The pupils added compost and watered the beds every day. After two months, there were green chillies, long beans and tomatoes. The canteen now uses these vegetables to cook lunch.', [
    ['What was wrong with the soil at first?', 'It was hard and dry', ['It was too wet', 'It was full of insects']],
    ['What did the pupils do to help the plants?', 'Added compost and watered the beds', ['Bought vegetables', 'Cut the grass']],
    ['How long did it take for vegetables to grow?', 'Two months', ['Two weeks', 'Two years']],
    ['Who uses the vegetables now?', 'The canteen', ['The library', 'The bank']],
  ]],
  ['Amir saved his pocket money for six months to buy a bicycle. Just before he went to the shop, he saw an old man crying near the road. The old man had lost his wallet. Amir gave the man some money so he could take a bus home. Although he now had to wait longer for his bicycle, Amir felt happy.', [
    ['Why was Amir saving money?', 'To buy a bicycle', ['To buy a bus ticket', 'To buy a wallet']],
    ["What was the old man's problem?", 'He had lost his wallet', ['He was hungry', 'He was sleepy']],
    ['What did Amir do?', 'Gave him money for the bus', ['Rode him home', 'Took him to school']],
    ['Why did Amir feel happy?', 'He had helped someone', ['He bought the bicycle', 'He found the wallet']],
    ['What kind of boy is Amir?', 'Kind', ['Selfish', 'Lazy']],
  ]],
  ['Coral reefs are home to thousands of sea animals. Corals look like plants, but they are really tiny animals. Warm, clean water helps corals to grow. Pollution and rubbish can harm them. If the corals die, many fish lose their homes.', [
    ['What are corals?', 'Tiny animals', ['Plants', 'Rocks']],
    ['What helps corals to grow?', 'Warm, clean water', ['Cold, dirty water', 'Mud']],
    ['What can harm corals?', 'Pollution and rubbish', ['Warm water', 'Small fish']],
    ['What happens if the corals die?', 'Many fish lose their homes', ['More fish come', 'The water turns to ice']],
  ]],
  ['The villagers were delighted when the new bridge opened. The old bridge was fragile and shook whenever someone crossed it. Now children can walk to school safely, and farmers can carry their fruit to the market quickly.', [
    ['What does "delighted" mean?', 'Very happy', ['Very angry', 'Very tired']],
    ['What does "fragile" mean?', 'Easily broken', ['Very strong', 'Very long']],
    ['Who can use the new bridge?', 'Children and farmers', ['Only the teachers', 'Only the fishermen']],
    ['Why were the villagers happy?', 'The new bridge is safe', ['The old bridge was new', 'The river was gone']],
  ]],
  ['Kak Sofia trains the school badminton team every Tuesday and Thursday. She tells the players to warm up first so they do not hurt their muscles. After practice, they drink water and rest. Because of her training, the team won the district tournament in March.', [
    ['How often does Kak Sofia train the team?', 'Twice a week', ['Every day', 'Once a month']],
    ['Why must the players warm up?', 'So they do not hurt their muscles', ['To win faster', 'To get tired']],
    ['When did the team win the tournament?', 'In March', ['In June', 'In January']],
    ['What did the team win?', 'The district tournament', ['A singing contest', 'A cooking prize']],
  ]],
  ["Mei Yi's grandfather lives in a village near a river. During the school holidays, Mei Yi stays with him. In the morning they feed the chickens. In the afternoon grandfather tells stories about when he was a boy. Mei Yi does not like to leave when the holidays end.", [
    ['Where does Mei Yi stay in the school holidays?', 'With her grandfather', ['At the beach', 'In a hotel']],
    ['What do they do in the morning?', 'Feed the chickens', ['Fish in the river', 'Read stories']],
    ['What does grandfather do in the afternoon?', 'Tells stories', ['Cooks lunch', 'Sleeps all day']],
    ['How does Mei Yi feel when the holidays end?', 'Sad to leave', ['Happy to leave', 'Bored']],
  ]],
];

const KSSR = [
  // Year 1
  lv('digraphs', 1, 'Sounds: sh, ch, th', 'Bunyi: sh, ch, th', '🐚', () => {
    const [w, t, d, e] = pick(DIGRAPH);
    return mc(`dg-${w}`, 'Which letters fill the blank?', d, ['sh', 'ch', 'th'].filter((x) => x !== d), { text: t, visual: pic(e) });
  }),
  lv('magic-e', 1, 'Magic e', 'E ajaib', '✨', () => {
    const w = pick(MAGIC_E);
    return mc(`me-${w}`, 'Add magic e. What is the new word?', `${w}e`, [w, `e${w}`], { text: `${w} + e` });
  }),
  lv('long-vowels', 1, 'Long vowel sounds', 'Bunyi vokal panjang', '🔊', () => {
    const [v, said, ex, words] = pick(LONG_V);
    const w = pick(words);
    return mc(`lv-${w}`, `Which word has the long "${v}" sound, as in "${ex}"?`, w, shuffle(SHORT_V).slice(0, 2),
      { say: `Which word has the long ${said} sound, as in ${ex}?` });
  }),
  lv('sight-listen', 1, 'Sight words: listen', 'Perkataan lihat: dengar', '👂', () => {
    const w = pick(SIGHT);
    return mc(`sw-${w}`, 'Listen carefully.', w, SIGHT.filter((x) => x !== w), { say: w });
  }),
  lv('family', 1, 'My family', 'Keluarga saya', '👪', blank(FAMILY)),
  lv('school-words', 1, 'School things', 'Benda di sekolah', '🎒', (pos) => look(SCHOOL, pos)),
  lv('food-words', 1, 'Food', 'Makanan', '🍚', (pos) => look(FOOD, pos)),
  // Year 2
  lv('animals', 2, 'Animals', 'Haiwan', '🐘', (pos) => look(ANIMALS, pos)),
  lv('sky-weather', 2, 'Sky & weather', 'Langit & cuaca', '🌦️', (pos) => look(SKY, pos)),
  lv('jobs', 2, 'Jobs', 'Pekerjaan', '👷', (pos) => look(JOBS, pos)),
  lv('places', 2, 'Places', 'Tempat', '🏫', (pos) => look(PLACES, pos)),
  lv('a-an', 2, 'a or an', 'a atau an', '🅰️', () => {
    const an = Math.random() < 0.5;
    const w = pick(an ? AN_WORDS : A_WORDS);
    const lead = pick(['I see ____ ', 'This is ____ ', 'She has ____ ']);
    return mc(`an-${w}`, 'Fill in the blank.', an ? 'an' : 'a', [an ? 'a' : 'an', 'two'], { text: `${lead}${w}.` });
  }),
  lv('plurals-s', 2, 'Plurals: -s and -es', 'Jamak: -s dan -es', '📚', () => {
    const es = Math.random() < 0.4;
    const w = pick(es ? PL_ES : PL_S);
    // wrongs are nonsense forms; "buss" is a real word so bus is not used
    return mc(`pl-${w}`, 'Which word means more than one?', es ? `${w}es` : `${w}s`,
      es ? [`${w}s`, `${w}ies`, `${w}en`] : [`${w}es`, `${w}en`, `${w}ss`], { text: w });
  }),
  lv('this-that', 2, 'this, that, these, those', 'this, that, these, those', '👉', () => {
    const near = Math.random() < 0.5;
    const many = Math.random() < 0.5;
    const [s, p] = pick(DEM_NOUNS);
    const answer = near ? (many ? 'these' : 'this') : (many ? 'those' : 'that');
    const where = near ? 'Near me' : 'Far from me';
    return mc(`dm-${near}-${many}-${s}`, 'Fill in the blank.', answer, ['this', 'that', 'these', 'those'].filter((x) => x !== answer),
      { text: many ? `${where}: ____ are ${p}.` : `${where}: ____ is a ${s}.` });
  }),
  // Year 3
  lv('am-is-are', 3, 'am, is, are', 'am, is, are', '🙋', () => {
    const [s, be] = pick(BE_SUBJ);
    const rest = pick(BE_REST);
    return mc(`be-${s}-${rest}`, 'Fill in the blank.', be, ['am', 'is', 'are'].filter((x) => x !== be), { text: `${s} ____ ${rest}` });
  }),
  lv('pronouns', 3, 'Pronouns', 'Kata ganti nama', '🧑', blank(PRONOUN)),
  lv('possessives', 3, 'my, your, his, her', 'my, your, his, her', '🧸', () => {
    const [s, ans, verb, things] = pick(POSS);
    const t = pick(things);
    const pool = ['my', 'your', 'his', 'her', 'our', 'their'].filter((x) => x !== ans);
    // a cat is never "he/she" here, so his/her are not offered as wrongs for its
    return mc(`po-${s}-${t}`, 'It belongs to the same person. Fill in the blank.', ans,
      ans === 'its' ? ['my', 'your', 'our', 'their'] : pool, { text: `${s} ${verb} a ${t}. It is ____ ${t}.` });
  }),
  lv('prep-place', 3, 'in, on, under, next to', 'in, on, under, next to', '📍', () => {
    const it = pick(PREP_PLACE);
    return mc(it.key, 'Fill in the blank.', it.answer, it.wrongs, { text: it.text, ...(it.visual && { visual: it.visual }) });
  }),
  lv('plurals-tricky', 3, 'Tricky plurals', 'Jamak yang sukar', '🦷', () => {
    const r = Math.random();
    if (r < 0.34) {
      const w = pick(PL_Y);
      return mc(`pt-${w}`, 'Which word means more than one?', `${w.slice(0, -1)}ies`, [`${w}s`, `${w}es`, `${w}ies`], { text: w });
    }
    if (r < 0.67) {
      const [w, p] = pick(PL_F);
      return mc(`pt-${w}`, 'Which word means more than one?', p, [`${w}s`, `${w}es`, `${w.slice(0, -1)}ies`], { text: w });
    }
    const [w, p, wr] = pick(PL_IRR);
    return mc(`pt-${w}`, 'Which word means more than one?', p, wr, { text: w });
  }),
  lv('opposites', 3, 'Opposites', 'Lawan kata', '↔️', () => {
    const [w, o, wr] = pick(OPPOSITES);
    return mc(`op-${w}`, 'Pick the opposite.', o, wr, { text: w });
  }),
  lv('reading-1', 3, 'Reading: short stories', 'Membaca: cerita pendek', '📖', reading(READ1)),
  // Year 4
  lv('present-simple', 4, 'Present simple (he/she -s)', 'Present simple (he/she -s)', '📅', () => {
    const [b, third, ing, obj] = pick(PS_VERBS);
    const one = Math.random() < 0.5;
    const s = pick(one ? PS_ONE : PS_MANY);
    return mc(`ps-${s}-${b}`, 'Fill in the blank.', one ? third : b, [one ? b : third, ing], { text: `${s} ____ ${obj} every day.` });
  }),
  lv('present-continuous', 4, 'Present continuous', 'Present continuous', '⏳', () => {
    const [b, ing, third, obj] = pick(PC_VERBS);
    const [s, be] = pick(PC_SUBJ);
    const badBe = pick(['am', 'is', 'are'].filter((x) => x !== be));
    const simple = ['I', 'We', 'They', 'The boys'].includes(s) ? b : third;
    return mc(`pc-${s}-${b}`, 'Fill in the blank.', `${be} ${ing}`, [`${badBe} ${ing}`, simple], { text: `Look! ${s} ____ ${obj}.` });
  }),
  lv('past-regular', 4, 'Past simple: -ed', 'Past simple: -ed', '⏪', () => {
    const [b, p, kind, obj] = pick(PAST_REG);
    return mc(`pr-${b}`, 'Fill in the blank.', p, PAST_WRONG(b, kind), { text: `Yesterday, ${pick(PAST_SUBJ)} ____ ${obj}.` });
  }),
  lv('past-irregular', 4, 'Past simple: irregular', 'Past simple: tak sama', '⏮️', () => {
    const [b, p, bad, obj] = pick(PAST_IRR);
    return mc(`pi-${b}`, 'Fill in the blank.', p, [bad, b], { text: `Yesterday, ${pick(PAST_SUBJ)} ____ ${obj}.` });
  }),
  lv('question-words', 4, 'Who, what, where, when, why, how', 'Siapa, apa, mana, bila, kenapa, bagaimana', '❓', blank(QWORDS)),
  lv('prep-time', 4, 'in, on, at (time)', 'in, on, at (masa)', '🕐', () => {
    const [a, t, z, prep] = pick(TIME_PREP);
    return mc(`pt-${t}`, 'Fill in the blank.', prep, ['in', 'on', 'at'].filter((x) => x !== prep), { text: `${a} ____ ${t}${z}` });
  }),
  lv('reading-2', 4, 'Reading: my day', 'Membaca: hari saya', '📘', reading(READ2)),
  // Year 5
  lv('comparatives', 5, 'Comparing: -er, more', 'Perbandingan: -er, more', '⚖️', () => {
    const [a, c, s, ct, , bad] = pick(ADJ);
    return mc(`cp-${a}`, 'Fill in the blank.', c, [s, bad], { text: `${ct} (${a})` });
  }),
  lv('superlatives', 5, 'The most: -est, most', 'Paling: -est, most', '🏆', () => {
    const [a, c, s, , st2, bad] = pick(ADJ);
    return mc(`sp-${a}`, 'Fill in the blank.', s, [c, bad], { text: `${st2} (${a})` });
  }),
  lv('conjunctions', 5, 'and, but, because, so, or', 'and, but, because, so, or', '🔗', blank(CONJ)),
  lv('modals', 5, 'can, must, should', 'can, must, should', '🚦', blank(MODALS)),
  lv('future', 5, 'Future: will, going to', 'Masa depan: will, going to', '🔮', blank(FUTURE)),
  lv('spelling-listen', 5, 'Spelling: listen', 'Ejaan: dengar', '✍️', () => {
    const [w, wr] = pick(SPELL);
    return mc(`sl-${w}`, 'Listen. Which spelling is correct?', w, wr, { say: w });
  }),
  lv('reading-3', 5, 'Reading: understanding', 'Membaca: memahami', '🧐', reading(READ3)),
  // Year 6
  lv('adverbs', 6, 'Adverbs', 'Kata keterangan', '🐢', blank(ADVERBS)),
  lv('end-marks', 6, '. ? !', '. ? !', '❗', () => {
    const [s, m] = pick(ENDMARK);
    return mc(`em-${s}`, 'Which mark ends the sentence?', m, ENDMARK_WRONG[m], { text: s });
  }),
  lv('capitals', 6, 'Capital letters', 'Huruf besar', '🔠', () => {
    const [ok, w1, w2] = pick(CAPITALS);
    return mc(`cl-${ok}`, 'Which sentence is written correctly?', ok, [w1, w2], { stack: true });
  }),
  lv('apostrophes', 6, 'Apostrophes', 'Apostrof', '✏️', () => {
    const [ok, w1, w2] = pick(APOSTROPHE);
    return mc(`ap-${ok}`, 'Which sentence is written correctly?', ok, [w1, w2], { stack: true });
  }),
  lv('british-spelling', 6, 'British spelling', 'Ejaan British', '🇬🇧', () => {
    const [b, us, bad] = pick(BRIT);
    return mc(`bs-${b}`, 'Which spelling is British English?', b, [us, bad]);
  }),
  lv('mixed-tenses', 6, 'Which tense?', 'Tense yang mana?', '🕰️', blank(MIXED)),
  lv('reading-4', 6, 'Reading: harder stories', 'Membaca: cerita lebih sukar', '📚', reading(READ4)),
];

// Level ids are stored in saved progress: don't rename them once in use.
export default {
  id: 'en',
  name: 'English',
  icon: '🔤',
  color: '#a5d6a7',
  lang: 'en',
  placement: false,     // starts at level 1 (parent can change it); read-aloud levels need a grown-up anyway
  levels: [
    ...tier('nouns', NOUNS, 'Letter words', 'Perkataan huruf', '🍎', s3(0)),
    ...tier('cvc', CVC, 'Short words', 'Perkataan pendek', '🐱', s3(1)),
    ...tier('colours', COLOURS, 'Colours & numbers', 'Warna & nombor', '🎨', s3(2)),
    ...tier('verbs', VERBS, 'Action words', 'Perkataan perbuatan', '🏃', s3(3)),
    ...tier('body', BODY, 'Family & body', 'Keluarga & badan', '👪', s3(4)),
    ...KSSR,
  ],
};
