import { load, save, fromJson, requestPersist, todayKey } from './storage.js';
import { speak, chime } from './audio.js';
import { settleRound, ROUND, masteryMark, MASTERY_DAYS, MEDALS, MEDAL_ROUNDS, medalCount, PRACTICE_CHOICES, practicePlan, COINS } from './rewards.js';
import { mustRest as mustRestFor, addPlayTime, endRest } from './session.js';
import { topIndex, isOpen, openUpTo, pickReview, answerMode } from './progress.js';
import { SUBJECTS } from './subjects/index.js';
import { makeRound, pick } from './subjects/util.js';
import { SHOP, REAL_WORLD, allStickers } from './catalog.js';
import { avatarSvg } from './avatar.js';
import { questionLang, L, VOICE, PRAISE, RETRY } from './lang.js';

const PLACEMENT_PER_LEVEL = 2;  // placement questions asked per level
// Screens where the play clock runs and the rest gate applies.
const KID_SCREENS = new Set(['home', 'subject', 'play', 'placement', 'results', 'stickers', 'shop']);

const app = document.getElementById('app');
let state = load();
let view = { name: 'home' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
const shopItem = (id) => SHOP.find((i) => i.id === id);
const owns = (id) => shopItem(id)?.price === 0 || state.owned.includes(id); // free items are always his
const ALWAYS_WORN = ['color', 'pants'];
const persist = () => save(state);
// App language: tr('English', 'BM') picks one; N() picks from a { en, ms } pair in data.
const tr = (en, ms) => (state.settings.lang === 'ms' ? ms : en);
const N = (v) => esc(L(state, v));
const say = (text, lang = state.settings.lang) => state.settings.voice && speak(text, VOICE[lang]);
const clock = (ms) => new Date(ms).toLocaleTimeString(tr('en-MY', 'ms-MY'), { hour: 'numeric', minute: '2-digit' });

// ---------------------------------------------------------------- session limit

function mustRest() {
  const before = state.session.restUntil;
  const rest = mustRestFor(state.session, state.settings, Date.now());
  if (state.session.restUntil !== before) persist();
  return rest;
}

setInterval(() => {
  if (view.name === 'sleepy' && state.session.restUntil <= Date.now()) return go('home');
  if (document.hidden || !KID_SCREENS.has(view.name)) return;
  addPlayTime(state.session, 5000, Date.now());
  persist();
}, 5000);

// ---------------------------------------------------------------- navigation

function go(name, data = {}) {
  // 'results' is exempt so a round that runs over time still shows its rewards.
  if (KID_SCREENS.has(name) && name !== 'results' && mustRest()) {
    view = { name: 'sleepy' };
    render();
    say(tr('Time for a rest. See you later!', 'Masa untuk rehat. Jumpa lagi nanti!'));
    return false;
  }
  view = { name, ...data };
  render();
  return true;
}

function render() {
  const screens = {
    home: homeScreen, subject: subjectScreen, play: questionScreen, placement: questionScreen,
    results: resultsScreen, stickers: stickersScreen, shop: shopScreen,
    sleepy: sleepyScreen, gate: gateScreen, parent: parentScreen,
  };
  document.documentElement.lang = state.settings.lang;
  app.innerHTML = screens[view.name]();
  window.scrollTo(0, 0);
  if (view.name === 'gate') app.querySelector('input')?.focus();
}

// ---------------------------------------------------------------- shared bits

// What he's wearing, optionally with one item swapped in (for shop previews).
function look(tryOn) {
  const eq = { ...state.equipped, ...(tryOn ? { [tryOn.cat]: tryOn.id } : {}) };
  return {
    shirt: shopItem(eq.color)?.value ?? '#ffd54d',
    pants: shopItem(eq.pants)?.value ?? '#3f6fb5',
    hat: eq.hat,
    extra: eq.extra,
  };
}

function avatar(mood = 'smile', size = '') {
  const pet = shopItem(state.equipped.pet)?.value;
  return `<div class="avatar ${size}">
    ${avatarSvg(look(), mood)}
    ${pet ? `<span class="pet">${pet}</span>` : ''}
  </div>`;
}

const topBar = (title) => `<header class="top">
  <button class="icon-btn" data-act="back" aria-label="${tr('Back', 'Kembali')}">⬅️</button>
  <h2>${title}</h2>
  <div class="coins">🪙 ${state.coins}</div>
</header>`;

// Where a level lives: { subject, idx, level } or null.
function findLevel(id) {
  for (const subject of SUBJECTS) {
    const idx = subject.levels.findIndex((l) => l.id === id);
    if (idx >= 0) return { subject, idx, level: subject.levels[idx] };
  }
  return null;
}
const levelIcon = (subject, l) => (subject.voice === 'ar' ? `<span class="ar">${l.icon}</span>` : l.icon);

// Practice medals, best first, shown under the avatar.
function medalShelf() {
  const earned = SUBJECTS.flatMap((subject) => subject.levels
    .map((l) => ({ subject, l, n: medalCount(state.levels[l.id]?.rounds) }))
    .filter((m) => m.n > 0));
  if (!earned.length) return '';
  earned.sort((a, b) => b.n - a.n);
  return `<div class="shelf">${earned.map(({ subject, l, n }) =>
    `<span class="medal">${MEDALS[n - 1]} ${levelIcon(subject, l)} <small>${N(l.title)}</small></span>`).join('')}</div>`;
}

// Today's practice: the parent's topics; the one with fewer rounds today comes next.
function practiceToday() {
  const picks = (state.settings.practice ?? []).map(findLevel).filter(Boolean);
  if (!picks.length) return null;
  const day = state.practiceDay?.date === todayKey() ? state.practiceDay : { rounds: 0, paid: false };
  return { picks, next: picks[day.rounds % picks.length], rounds: Math.min(day.rounds, practicePlan(state).rounds), paid: day.paid };
}

function practiceCard() {
  const p = practiceToday();
  if (!p) return '';
  const plan = practicePlan(state);
  const dots = Array.from({ length: plan.rounds }, (_, k) => (k < p.rounds ? '●' : '○')).join('');
  const topics = p.picks.map(({ subject, level }) => `${levelIcon(subject, level)} ${N(level.title)}`).join(' · ');
  return `<button class="big-btn practice ${p.paid ? 'done' : ''}" data-act="practice">
    🎯 ${tr("Today's practice", 'Latihan hari ini')}: ${topics}
    <small>${p.paid ? tr('✓ Done today! Play more for medals', '✓ Siap hari ini! Main lagi untuk pingat') : `${dots} — ${tr(`${plan.rounds} rounds`, `${plan.rounds} pusingan`)} = 🪙 ${plan.coins}`}</small>
  </button>`;
}

// Always 5 stars, so a 10-question round shows 9/10 as ★★★★☆.
const stars = (n, total) => {
  const k = Math.floor((n * 5) / total);
  return '★'.repeat(k) + '☆'.repeat(5 - k);
};

// ---------------------------------------------------------------- screens

function homeScreen() {
  const name = state.childName ? `, ${esc(state.childName)}` : '';
  const tiles = SUBJECTS.map((s) => s.levels.length
    ? `<button class="tile" style="--c:${s.color}" data-act="subject" data-arg="${s.id}"><span class="tile-icon">${s.icon}</span>${N(s.name)}</button>`
    : `<button class="tile locked" style="--c:${s.color}" disabled><span class="tile-icon">${s.icon}</span>${N(s.name)}<small>${tr('Coming soon', 'Akan datang')}</small></button>`
  ).join('');
  return `<header class="top">
      <div class="coins">🪙 ${state.coins}</div>
      <button class="icon-btn parent-btn" data-act="gate" aria-label="${tr('Parents', 'Ibu bapa')}">⚙️</button>
    </header>
    <section class="hero">${avatar()}${medalShelf()}<h1>Assalamualaikum${name}!</h1></section>
    ${practiceCard()}
    <section class="subjects">${tiles}</section>
    ${pickReview(state, SUBJECTS, todayKey()) ? `<button class="big-btn review" data-act="review">🔁 ${tr('Review', 'Ulang kaji')} <small>— 👑 = 🪙 ${COINS.mastery}</small></button>` : ''}
    <nav class="bottom">
      <button class="big-btn" data-act="go" data-arg="stickers">📒 ${tr('Stickers', 'Pelekat')} <b>${state.stickers.length}</b></button>
      <button class="big-btn" data-act="go" data-arg="shop">🛍️ ${tr('Shop', 'Kedai')}</button>
    </nav>`;
}

function subjectScreen() {
  const s = subjectById(view.subjectId);
  const items = s.levels.map((l, i) => {
    const r = state.levels[l.id];
    const locked = !isOpen(state, s, i);
    const badge = locked ? '🔒' : r?.mastered ? '👑' : i + 1;
    const zh = !locked && questionLang(state, l.id, s.mandarin) === 'zh' ? '<span class="tag">华文</span>' : '';
    const toward = r?.cleared && !r.mastered ? `<span class="tag gold">👑 ${r.perfectDays.length}/${MASTERY_DAYS} → 🪙 ${COINS.mastery}</span>` : '';
    // What this level can still pay, so he knows where the coins are.
    const pays = locked || r?.mastered ? 0 : !r?.cleared ? COINS.firstClear : r.best < ROUND ? COINS.newBest : 0;
    const coinTag = pays ? `<span class="tag coin">🪙 ${pays}</span>` : '';
    return `<li><button class="level ${locked ? 'locked' : ''} ${r?.mastered ? 'mastered' : ''}" ${locked ? 'disabled' : ''} data-act="play" data-arg="${i}">
      <span class="lvl-num">${badge}</span>
      <span class="lvl-title">${s.voice === 'ar' ? `<span class="ar lvl-ar">${l.icon}</span>` : l.icon} ${N(l.title)} ${zh} ${coinTag} ${toward}</span>
      <span class="stars">${medalCount(r?.rounds) ? `<span class="lvl-medal">${MEDALS[medalCount(r.rounds) - 1]}</span>` : ''}${stars(r?.best ?? 0, ROUND)}</span>
    </button></li>`;
  }).join('');
  return `${topBar(`${s.icon} ${N(s.name)}`)}<ol class="path">${items}</ol>`;
}

function questionScreen() {
  const q = currentQ();
  const dots = view.name === 'play'
    ? view.qs.map((_, k) => `<span class="${k < view.i ? 'done' : k === view.i ? 'now' : ''}"></span>`).join('')
    : '<span class="now"></span>';
  return `${topBar(view.name === 'placement' ? tr("Let's play!", 'Jom main!') : '')}
    <div class="dots">${dots}</div>
    <div class="question">
      ${q.visual ? `<div class="visual">${q.visual}</div>` : ''}
      ${q.text ? `<div class="qtext">${q.text}</div>` : ''}
      <button class="speak ${q.sound ? 'listen' : ''}" data-act="say">🔊 ${promptHtml(q.prompt, currentLang())}</button>
    </div>
    ${view.mode === 'type' ? keypad() : `<div class="choices ${q.wide ? 'wide' : ''} ${q.stack ? 'stack' : ''}">
      ${q.choices.map((c, k) => `<button class="choice" data-act="answer" data-arg="${k}">${c.label}</button>`).join('')}
    </div>`}`;
}

const keypad = () => `<div class="typed">${view.typed || '?'}</div>
  <div class="keypad">
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" data-act="key" data-arg="${d}">${d}</button>`).join('')}
    <button class="key del" data-act="del" aria-label="${tr('Delete', 'Padam')}">⌫</button>
    <button class="key" data-act="key" data-arg="0">0</button>
    <button class="key ok" data-act="enter" aria-label="${tr('Enter', 'Hantar')}">✓</button>
  </div>`;

function resultTitle(res) {
  if (res.score === res.total) return tr('Amazing! All correct!', 'Hebat! Semua betul!');
  if (res.passed) return tr('Well done!', 'Bagus!');
  return tr('Good try!', 'Kamu sudah cuba!');
}

// The next step to 👑, in a box so he sees what replaying another day is worth.
function masteryGoal(res, levelId) {
  const r = state.levels[levelId];
  if (!r || r.mastered) return '';
  const crowns = Array.from({ length: MASTERY_DAYS }, (_, k) => `<span class="${k < r.perfectDays.length ? 'got' : ''}">👑</span>`).join('');
  const msg = res.masteryProgress
    ? tr(`${res.masteryProgress}/${MASTERY_DAYS} — get ${masteryMark(ROUND)}/${ROUND} again on another day!`, `${res.masteryProgress}/${MASTERY_DAYS} — dapat ${masteryMark(ROUND)}/${ROUND} lagi pada hari lain!`)
    : r.perfectDays.includes(todayKey())
      ? tr('Already counted today — come back tomorrow!', 'Sudah dikira hari ini — datang lagi esok!')
      : tr(`Get ${masteryMark(ROUND)}/${ROUND} to earn a crown!`, `Dapat ${masteryMark(ROUND)}/${ROUND} untuk dapat mahkota!`);
  return `<div class="goal"><div class="crowns">${crowns}</div>
    <b>${tr(`${MASTERY_DAYS} crowns = 🪙 ${COINS.mastery}`, `${MASTERY_DAYS} mahkota = 🪙 ${COINS.mastery}`)}</b><small>${msg}</small></div>`;
}

function resultsScreen() {
  const { res, retries } = view;
  const lines = [];
  if (res.coins) lines.push(`🪙 +${res.coins} ${tr('coins', 'syiling')}`);
  if (res.practice) lines.push(res.practice.paid
    ? tr(`🎯 Today's practice done! (+${res.practice.coins})`, `🎯 Latihan hari ini siap! (+${res.practice.coins})`)
    : res.practice.done < res.practice.of ? (res.practice.of - res.practice.done === 1
      ? tr(`🎯 Practice ${res.practice.done}/${res.practice.of} — one more!`, `🎯 Latihan ${res.practice.done}/${res.practice.of} — satu lagi!`)
      : tr(`🎯 Practice ${res.practice.done}/${res.practice.of} — keep going!`, `🎯 Latihan ${res.practice.done}/${res.practice.of} — teruskan!`)) : '');
  if (res.medal) lines.push(tr(`${res.medal} New medal!`, `${res.medal} Pingat baru!`));
  else {
    const next = MEDAL_ROUNDS.find((n) => n > (state.levels[view.levelId]?.rounds ?? 0));
    if (next) lines.push(tr(`🏅 ${state.levels[view.levelId].rounds}/${next} rounds to the next medal`, `🏅 ${state.levels[view.levelId].rounds}/${next} pusingan ke pingat seterusnya`));
  }
  if (res.sticker) lines.push(`${res.sticker.e} ${tr('New sticker!', 'Pelekat baru!')}`);
  if (res.newBest) lines.push(tr('⬆️ New best score!', '⬆️ Markah terbaik baru!'));
  if (res.needsTyping) lines.push(tr('⌨️ Next time, type the answer to earn 👑', '⌨️ Lain kali taip jawapan untuk dapat 👑'));
  if (res.justMastered) lines.push(tr('👑 You mastered it!', '👑 Kamu sudah mahir!'));
  if (retries && res.passed) lines.push(tr('🌱 You kept trying — that is great!', '🌱 Kamu terus mencuba — itu hebat!'));
  if (!res.passed) lines.push(tr("💪 Let's try once more — you can do it!", '💪 Jom cuba sekali lagi — kamu boleh!'));
  const emoji = res.score === res.total ? ' 🎉' : res.passed ? ' 👏' : '';
  return `<section class="results">
    ${avatar(res.passed ? 'happy' : 'smile')}
    <h1>${resultTitle(res)}${emoji}</h1>
    <div class="stars big">${stars(res.score, res.total)}</div>
    <ul>${lines.filter(Boolean).map((l) => `<li>${l}</li>`).join('')}</ul>
    ${masteryGoal(res, view.levelId)}
    <div class="row">
      <button class="big-btn" data-act="play" data-arg="${view.levelIdx}">🔁 ${tr('Play again', 'Main lagi')}</button>
      <button class="big-btn primary" data-act="subject" data-arg="${view.subjectId}">➡️ ${tr('Next', 'Seterusnya')}</button>
    </div>
  </section>`;
}

function stickersScreen() {
  const cells = allStickers().map((s) => state.stickers.includes(s.id)
    ? `<div class="sticker">${s.e}<small>${N(s.label)}</small></div>`
    : '<div class="sticker empty">?</div>'
  ).join('');
  return `${topBar(tr('📒 Sticker Book', '📒 Buku Pelekat'))}<section class="sticker-grid">${cells}</section>`;
}

function shopScreen() {
  const cats = [['color', tr('Shirts', 'Baju')], ['pants', tr('Trousers', 'Seluar')], ['hat', tr('Hats', 'Topi')],
    ['extra', tr('Extras', 'Aksesori')], ['pet', tr('Pets', 'Haiwan')]];
  const rows = cats.map(([cat, label]) => `<h3>${label}</h3><div class="shop-row">${SHOP.filter((i) => i.cat === cat).map((i) => {
    const owned = owns(i.id);
    const on = state.equipped[cat] === i.id;
    const face = cat === 'pet'
      ? `<span class="item-e">${i.value}</span>`
      : `<span class="mini-kid">${avatarSvg(look(i))}</span>`;
    return `<button class="shop-item ${on ? 'on' : ''}" data-act="shopItem" data-arg="${i.id}">${face}<small>${on ? tr('✓ Wearing', '✓ Dipakai') : owned ? tr('Wear', 'Pakai') : `🪙 ${i.price}`}</small></button>`;
  }).join('')}</div>`).join('');

  let sheet = '';
  const p = view.pending && shopItem(view.pending);
  if (p) {
    const short = p.price - state.coins;
    const icon = p.cat === 'pet' ? p.value : `<span class="mini-kid inline">${avatarSvg(look(p))}</span>`;
    sheet = `<div class="sheet">
      <div>${icon} ${N(p.label)} — 🪙 ${p.price}</div>
      ${short > 0
        ? `<p>${tr(`Collect 🪙 ${short} more first!`, `Kumpul lagi 🪙 ${short} dulu!`)}</p><div class="row"><button class="big-btn" data-act="buyNo">OK</button></div>`
        : `<div class="row"><button class="big-btn" data-act="buyNo">${tr('No', 'Tidak')}</button><button class="big-btn primary" data-act="buyYes">${tr('Buy!', 'Beli!')}</button></div>`}
    </div>`;
  }
  return `${topBar(`🛍️ ${tr('Shop', 'Kedai')}`)}<section class="hero small">${avatar()}${medalShelf()}</section>${rows}${sheet}`;
}

function sleepyScreen() {
  return `<section class="sleepy">
    ${avatar('sleepy', 'big')}
    <h1>${tr('Rest time!', 'Masa rehat!')}</h1>
    <p>${tr('Drink some water, play outside, or read a book with Mum &amp; Dad.', 'Jom minum air, main di luar, atau baca buku dengan Ayah &amp; Ibu.')}</p>
    <p class="muted">${tr('See you again at', 'Jumpa lagi pukul')} ${clock(state.session.restUntil)} 🌙</p>
    <button class="icon-btn corner" data-act="gate" aria-label="${tr('Parents', 'Ibu bapa')}">⚙️</button>
  </section>`;
}

function gateScreen() {
  return `${topBar(tr('For Parents', 'Untuk Ibu Bapa'))}
    <form class="gate" id="gate-form">
      <p>${tr('Answer to enter:', 'Jawab untuk masuk:')}</p>
      <h1>${view.a} × ${view.b} = ?</h1>
      <input type="number" inputmode="numeric" autocomplete="off">
      <p><button class="btn" type="submit">${tr('Enter', 'Masuk')}</button></p>
    </form>`;
}

function parentScreen() {
  const s = state.session;
  const resting = s.restUntil > Date.now();
  const textSelect = (key, opts) => `<select data-setting="${key}" data-kind="text">${opts.map(([v, label]) =>
    `<option value="${v}" ${state.settings[key] === v ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  const select = (key, vals) => `<select data-setting="${key}">${vals.map((v) =>
    `<option value="${v}" ${state.settings[key] === v ? 'selected' : ''}>${v} ${tr('min', 'minit')}</option>`).join('')}</select>`;
  const progress = SUBJECTS.filter((sub) => sub.levels.length).map((sub) => `
    <h4>${sub.icon} ${N(sub.name)}</h4>
    <label>${tr('Open levels up to', 'Buka tahap hingga')} <select data-unlock="${sub.id}">${sub.levels.map((l, i) =>
      `<option value="${i}" ${i === topIndex(state, sub) ? 'selected' : ''}>${i + 1}. ${N(l.title)}</option>`).join('')}</select></label>
    <table>${sub.levels.map((l) => {
      const r = state.levels[l.id];
      const mastery = r?.mastered ? tr('👑 Mastered', '👑 Mahir') : r ? `${tr('Mastery', 'Mahir')} ${r.perfectDays.length}/${MASTERY_DAYS}` : '';
      return `<tr><td>${N(l.title)}</td><td>${r ? `${r.best}/${ROUND}` : '–'}</td><td>${mastery}</td></tr>`;
    }).join('')}</table>`).join('');
  const tasks = REAL_WORLD.map((t) => {
    const has = state.stickers.includes(t.id);
    return `<div class="task"><span>${t.e} ${N(t.label)}</span>
      <button class="btn" data-act="award" data-arg="${t.id}" ${has ? 'disabled' : ''}>${has ? tr('✓ Given', '✓ Diberi') : tr('Give sticker', 'Beri pelekat')}</button></div>`;
  }).join('');

  return `${topBar(`⚙️ ${tr('Parents', 'Ibu Bapa')}`)}
    <section class="panel"><h3>${tr('Language / Bahasa', 'Bahasa / Language')}</h3>
      <label>${tr('App and questions', 'Aplikasi dan soalan')} ${textSelect('lang', [['en', 'English'], ['ms', 'Bahasa Melayu']])}</label>
    </section>
    <section class="panel"><h3>${tr('Profile', 'Profil')}</h3>
      <label>${tr("Child's name", 'Nama anak')} <input id="child-name" value="${esc(state.childName)}" maxlength="20"></label>
    </section>
    <section class="panel"><h3>${tr('Time limit', 'Had masa')}</h3>
      <label>${tr('Play time per session', 'Masa main setiap sesi')} ${select('sessionMinutes', [10, 15, 20, 30, 45])}</label>
      <label>${tr('Rest time', 'Masa rehat')} ${select('restMinutes', [30, 60, 120, 240])}</label>
      <p class="muted">${tr('This session', 'Sesi ini')}: ${Math.round(s.usedMs / 60000)} ${tr('min', 'minit')}${resting ? ` · ${tr('Resting until', 'Sedang rehat hingga')} ${clock(s.restUntil)}` : ''}</p>
      ${resting ? `<button class="btn" data-act="endRest">${tr('End rest now', 'Tamatkan rehat sekarang')}</button>` : ''}
      <label>${tr('Voice', 'Suara arahan')} <input type="checkbox" data-setting="voice" ${state.settings.voice ? 'checked' : ''}></label>
    </section>
    <section class="panel"><h3>${tr('Maths in Mandarin', 'Matematik dalam 华文')}</h3>
      <label>华文 (Mandarin) ${textSelect('mandarin', [['off', tr('Off', 'Tutup')], ['mastered', tr('👑 levels only', 'Tahap 👑 sahaja')], ['all', tr('All levels', 'Semua tahap')]])}</label>
      <p class="muted">${tr('👑 levels only: mastered levels ask in 华文 + pinyin + English subtitle, so only the language is new.', 'Tahap 👑 sahaja: soalan dalam 华文 + pinyin + sari kata English untuk tahap yang sudah mahir, supaya hanya bahasa yang baru.')}</p>
    </section>
    <section class="panel"><h3>${tr('Daily practice', 'Latihan harian')}</h3>
      <p class="muted">${tr('Topics to drill. Coins once a day for finishing, whatever the score.', 'Topik untuk diulang. Syiling sekali sehari bila siap, walau apa pun markahnya.')}</p>
      <label>${tr('Length', 'Panjang')} <select data-practice-rounds>${PRACTICE_CHOICES.map((n) =>
        `<option value="${n}" ${practicePlan(state).rounds === n ? 'selected' : ''}>${tr(`${n} rounds (${n * ROUND} questions) = 🪙 ${n * COINS.practice}`, `${n} pusingan (${n * ROUND} soalan) = 🪙 ${n * COINS.practice}`)}</option>`).join('')}</select></label>
      ${[0, 1].map((k) => `<label>${tr('Topic', 'Topik')} ${k + 1} <select data-practice="${k}">
        <option value="">—</option>
        ${SUBJECTS.filter((sub) => sub.levels.length).map((sub) => `<optgroup label="${esc(L(state, sub.name))}">${sub.levels.map((l) =>
          `<option value="${l.id}" ${state.settings.practice?.[k] === l.id ? 'selected' : ''}>${N(l.title)}</option>`).join('')}</optgroup>`).join('')}
      </select></label>`).join('')}
    </section>
    <section class="panel"><h3>${tr('Real-world rewards', 'Hadiah dunia sebenar')}</h3>
      <p class="muted">${tr('Give a sticker when your child does these with you.', 'Beri pelekat bila anak buat aktiviti ini bersama anda.')}</p>${tasks}
    </section>
    <section class="panel"><h3>${tr('Progress', 'Kemajuan')}</h3>${progress}</section>
    <section class="panel"><h3>Data</h3>
      <p class="muted">${tr('Data is saved on this tablet only. Save a backup now and then.', 'Data disimpan dalam tablet ini sahaja. Simpan salinan sekali-sekala.')}</p>
      <button class="btn" data-act="exportData">⬇️ ${tr('Save backup', 'Simpan salinan')}</button>
      <label class="btn">⬆️ ${tr('Restore backup', 'Pulihkan salinan')}<input id="import-file" type="file" accept="application/json,.json" hidden></label>
      <button class="btn danger" data-act="reset">${tr('Delete all progress', 'Padam semua kemajuan')}</button>
    </section>`;
}

// ---------------------------------------------------------------- rounds

const currentQ = () => (view.name === 'play' ? view.qs[view.i] : view.q);
const currentLang = () => {
  const s = subjectById(view.subjectId);
  return questionLang(state, s.levels[view.levelIdx].id, s.mandarin);
};
// The prompt, then (Iqra) the sound itself, slower, in the subject's voice.
function sayQuestion() {
  const q = currentQ();
  say(q.prompt[currentLang()], currentLang());
  if (q.sound && state.settings.voice) speak(q.sound, VOICE[subjectById(view.subjectId).voice], { queue: true, rate: 0.7 });
}

// Mandarin shows characters, pinyin, and an English subtitle.
function promptHtml(p, lang) {
  if (lang !== 'zh') return esc(p[lang]);
  return `<span class="zh">${esc(p.zh)}</span><span class="py">${esc(p.py)}</span><span class="sub">${esc(p.en)}</span>`;
}

function startRound(subjectId, levelIdx) {
  const level = subjectById(subjectId).levels[levelIdx];
  const ok = go('play', {
    subjectId, levelIdx, qs: makeRound(level.gen, ROUND), i: 0, score: 0, retries: 0, missed: false, busy: false,
    mode: answerMode(state, level), typed: '',
  });
  if (ok) sayQuestion();
}

// Placement feels like a normal game: no right/wrong feedback, it just climbs the
// main (probed) levels while the child answers both questions correctly.
function startPlacement(subjectId) {
  const first = subjectById(subjectId).levels[0];
  const ok = go('placement', { subjectId, levelIdx: 0, step: 0, correct: 0, q: first.gen(), busy: false });
  if (ok) sayQuestion();
}

function placementAnswer(right, el) {
  const v = view;
  v.busy = true;
  el.classList.add('picked');
  chime('tap');
  setTimeout(() => {
    if (view !== v) return;
    const s = subjectById(v.subjectId);
    v.correct += right ? 1 : 0;
    v.step++;
    if (v.step >= PLACEMENT_PER_LEVEL) {
      const next = s.levels.findIndex((l, j) => j > v.levelIdx && l.probe !== false);
      if (v.correct === PLACEMENT_PER_LEVEL && next !== -1) {
        v.levelIdx = next;
        v.step = 0;
        v.correct = 0;
      } else {
        state.placed[s.id] = true;
        openUpTo(state, s, v.levelIdx);
        persist();
        if (go('subject', { subjectId: s.id })) say(tr("Great! Let's start learning!", 'Hebat! Jom mula belajar!'));
        return;
      }
    }
    v.q = s.levels[v.levelIdx].gen();
    v.busy = false;
    render();
    sayQuestion();
  }, 600);
}

function markWrong() {
  view.missed = true;
  view.retries++;
  chime('wrong');
  say(RETRY[currentLang()], currentLang());
}

function markRight(el) {
  const v = view;
  v.busy = true;
  el.classList.add('right');
  chime('right');
  say(pick(PRAISE[currentLang()]), currentLang());
  if (!v.missed) v.score++; // only first-try answers count toward the score
  setTimeout(() => {
    if (view !== v) return;
    v.i++;
    v.missed = false;
    v.busy = false;
    v.typed = '';
    if (v.i < v.qs.length) { render(); sayQuestion(); } else finishRound();
  }, 1000);
}

function answer(k, el) {
  if (view.busy) return;
  const q = currentQ();
  const right = q.choices[k].value === q.answer;
  if (view.name === 'placement') return placementAnswer(right, el);
  if (!right) {
    el.classList.add('wrong');
    el.disabled = true;
    return markWrong();
  }
  markRight(el);
}

// Number pad: up to 2 digits, then ✓.
function typeKey(d) {
  if (view.busy || view.typed.length >= 2) return;
  view.typed += d;
  app.querySelector('.typed').textContent = view.typed;
}

function typeDelete() {
  if (view.busy) return;
  view.typed = view.typed.slice(0, -1);
  app.querySelector('.typed').textContent = view.typed || '?';
}

function typeEnter() {
  if (view.busy || !view.typed) return;
  const box = app.querySelector('.typed');
  if (Number(view.typed) === currentQ().answer) return markRight(box);
  view.typed = '';
  box.textContent = '?';
  box.classList.remove('wrong');
  void box.offsetWidth; // restart the shake animation
  box.classList.add('wrong');
  markWrong();
}

function finishRound() {
  const s = subjectById(view.subjectId);
  const level = s.levels[view.levelIdx];
  const res = settleRound(state, level, view.score, view.qs.length, todayKey(), { typed: view.mode === 'type' });
  if (res.passed) openUpTo(state, s, view.levelIdx + 1);
  persist();
  go('results', { subjectId: s.id, levelIdx: view.levelIdx, levelId: level.id, res, retries: view.retries });
  say(resultTitle(res));
}

// ---------------------------------------------------------------- shop

function shopTap(id) {
  const it = shopItem(id);
  if (owns(id)) {
    // Tapping a worn hat/extra/pet takes it off; a shirt and trousers are always worn.
    const wearing = state.equipped[it.cat] === id;
    state.equipped[it.cat] = wearing && !ALWAYS_WORN.includes(it.cat) ? null : id;
    persist();
    render();
    return;
  }
  view.pending = id;
  render();
  say(`${L(state, it.label)}. ${it.price} ${tr('coins', 'syiling')}.`);
}

function buy() {
  const it = shopItem(view.pending);
  view.pending = null;
  if (it && state.coins >= it.price && !owns(it.id)) {
    state.coins -= it.price;
    state.owned.push(it.id);
    state.equipped[it.cat] = it.id;
    persist();
    chime('right');
    say('Yeay!');
  }
  render();
}

// ---------------------------------------------------------------- parent tools

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `belajar-ceria-${todayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importFile(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!confirm(tr('Replace all current data with this backup?', 'Ganti semua data sekarang dengan salinan ini?'))) return;
    state = fromJson(data);
    persist();
    alert(tr('Data restored.', 'Data dipulihkan.'));
    render();
  } catch {
    alert(tr('Invalid file.', 'Fail tidak sah.'));
  }
}

// ---------------------------------------------------------------- events

const ACTIONS = {
  go: (name) => go(name),
  back: () => {
    if (['play', 'results'].includes(view.name)) go('subject', { subjectId: view.subjectId });
    else go('home');
  },
  subject: (id) => {
    const s = subjectById(id);
    if (!state.placed[id] && s.placement === false) {
      state.placed[id] = true;
      openUpTo(state, s, Math.max(0, s.levels.findIndex((l) => l.id === s.startAt)));
      persist();
    }
    return state.placed[id] ? go('subject', { subjectId: id }) : startPlacement(id);
  },
  play: (i) => startRound(view.subjectId, Number(i)),
  practice: () => {
    const p = practiceToday();
    if (p) startRound(p.next.subject.id, p.next.idx);
  },
  review: () => {
    const r = pickReview(state, SUBJECTS, todayKey());
    if (r) startRound(r.subjectId, r.levelIdx);
  },
  answer: (k, el) => answer(Number(k), el),
  key: (d) => typeKey(d),
  del: () => typeDelete(),
  enter: () => typeEnter(),
  say: () => sayQuestion(),
  shopItem: (id) => shopTap(id),
  buyYes: () => buy(),
  buyNo: () => { view.pending = null; render(); },
  gate: () => go('gate', { a: 6 + Math.floor(Math.random() * 4), b: 6 + Math.floor(Math.random() * 4) }),
  award: (id) => {
    if (!state.stickers.includes(id)) state.stickers.push(id);
    persist();
    render();
  },
  endRest: () => {
    endRest(state.session);
    persist();
    render();
  },
  exportData,
  reset: () => {
    if (!confirm(tr('Delete ALL progress, coins and stickers? This cannot be undone.', 'Padam SEMUA kemajuan, syiling dan pelekat? Ini tidak boleh dibatalkan.'))) return;
    state = fromJson({});
    persist();
    go('home');
  },
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  ACTIONS[el.dataset.act]?.(el.dataset.arg, el);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (Number(input.value) === view.a * view.b) go('parent');
  else { input.value = ''; input.placeholder = tr('Try again', 'Cuba lagi'); }
});

app.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.type === 'checkbox' ? t.checked : t.dataset.kind === 'text' ? t.value : Number(t.value);
    persist();
    if (t.dataset.setting === 'lang') render();
  } else if (t.dataset.practiceRounds !== undefined) {
    state.settings.practiceRounds = Number(t.value);
    persist();
    render();
  } else if (t.dataset.practice) {
    const picks = [...(state.settings.practice ?? [])];
    picks[Number(t.dataset.practice)] = t.value;
    state.settings.practice = [...new Set(picks.filter(Boolean))];
    persist();
    render();
  } else if (t.dataset.unlock) {
    // Parent override: open levels he already knows (never locks levels again).
    const sub = subjectById(t.dataset.unlock);
    openUpTo(state, sub, Number(t.value));
    state.placed[sub.id] = true;
    persist();
    render();
  } else if (t.id === 'child-name') {
    state.childName = t.value.trim().slice(0, 20);
    persist();
  } else if (t.id === 'import-file') {
    importFile(t.files[0]);
    t.value = '';
  }
});

// ---------------------------------------------------------------- boot

requestPersist();
go('home');

// Hook for the Playwright tests (only with ?test in the URL): exposes the correct answer.
if (new URLSearchParams(location.search).has('test')) {
  window.__test = {
    correctIndex: () => currentQ().choices.findIndex((c) => c.value === currentQ().answer),
    answer: () => currentQ().answer,
  };
}

// Offline support. Skipped on localhost so edits show up immediately while developing.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && window.isSecureContext && !isLocal) {
  // When a new version takes over, reload once so he sees it without closing the app.
  const hadOld = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadOld) location.reload(); });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update(); });
  });
}
