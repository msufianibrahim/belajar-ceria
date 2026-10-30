import { load, save, fromJson, requestPersist, todayKey } from './storage.js';
import { speak, chime } from './audio.js';
import { settleRound, MASTERY_DAYS } from './rewards.js';
import { mustRest as mustRestFor, addPlayTime, endRest } from './session.js';
import { topIndex, openUpTo } from './progress.js';
import { SUBJECTS } from './subjects/index.js';
import { makeRound, pick } from './subjects/util.js';
import { SHOP, REAL_WORLD, allStickers } from './catalog.js';
import { questionLang, VOICE, PRAISE, RETRY } from './lang.js';

const ROUND = 5;                // questions per round
const PLACEMENT_PER_LEVEL = 2;  // placement questions asked per level
// Screens where the play clock runs and the rest gate applies.
const KID_SCREENS = new Set(['home', 'subject', 'play', 'placement', 'results', 'stickers', 'shop']);

const app = document.getElementById('app');
let state = load();
let view = { name: 'home' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
const shopItem = (id) => SHOP.find((i) => i.id === id);
const persist = () => save(state);
const say = (text, lang = 'ms') => state.settings.voice && speak(text, VOICE[lang]);
const clock = (ms) => new Date(ms).toLocaleTimeString('ms-MY', { hour: 'numeric', minute: '2-digit' });

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
    say('Masa untuk rehat. Jumpa lagi nanti!');
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
  app.innerHTML = screens[view.name]();
  window.scrollTo(0, 0);
  if (view.name === 'gate') app.querySelector('input')?.focus();
}

// ---------------------------------------------------------------- shared bits

function avatar(face = '😊', size = '') {
  const color = shopItem(state.equipped.color)?.value ?? '#ffd54d';
  const hat = shopItem(state.equipped.hat)?.value;
  const pet = shopItem(state.equipped.pet)?.value;
  return `<div class="avatar ${size}" style="--body:${color}">
    ${hat ? `<span class="hat">${hat}</span>` : ''}
    <span class="face">${face}</span>
    ${pet ? `<span class="pet">${pet}</span>` : ''}
  </div>`;
}

const topBar = (title) => `<header class="top">
  <button class="icon-btn" data-act="back" aria-label="Kembali">⬅️</button>
  <h2>${title}</h2>
  <div class="coins">🪙 ${state.coins}</div>
</header>`;

const stars = (n, total) => '★'.repeat(n) + '☆'.repeat(Math.max(0, total - n));

// ---------------------------------------------------------------- screens

function homeScreen() {
  const name = state.childName ? `, ${esc(state.childName)}` : '';
  const tiles = SUBJECTS.map((s) => s.levels.length
    ? `<button class="tile" style="--c:${s.color}" data-act="subject" data-arg="${s.id}"><span class="tile-icon">${s.icon}</span>${s.name}</button>`
    : `<button class="tile locked" style="--c:${s.color}" disabled><span class="tile-icon">${s.icon}</span>${s.name}<small>Akan datang</small></button>`
  ).join('');
  return `<header class="top">
      <div class="coins">🪙 ${state.coins}</div>
      <button class="icon-btn parent-btn" data-act="gate" aria-label="Ibu bapa">⚙️</button>
    </header>
    <section class="hero">${avatar()}<h1>Assalamualaikum${name}!</h1></section>
    <section class="subjects">${tiles}</section>
    <nav class="bottom">
      <button class="big-btn" data-act="go" data-arg="stickers">📒 Pelekat <b>${state.stickers.length}</b></button>
      <button class="big-btn" data-act="go" data-arg="shop">🛍️ Kedai</button>
    </nav>`;
}

function subjectScreen() {
  const s = subjectById(view.subjectId);
  const top = topIndex(state, s);
  const items = s.levels.map((l, i) => {
    const r = state.levels[l.id];
    const locked = i > top;
    const badge = locked ? '🔒' : r?.mastered ? '👑' : i + 1;
    const zh = !locked && questionLang(state, l.id) === 'zh' ? '<span class="tag">华文</span>' : '';
    return `<li><button class="level ${locked ? 'locked' : ''} ${r?.mastered ? 'mastered' : ''}" ${locked ? 'disabled' : ''} data-act="play" data-arg="${i}">
      <span class="lvl-num">${badge}</span>
      <span class="lvl-title">${l.icon} ${l.title} ${zh}</span>
      <span class="stars">${stars(r?.best ?? 0, ROUND)}</span>
    </button></li>`;
  }).join('');
  return `${topBar(`${s.icon} ${s.name}`)}<ol class="path">${items}</ol>`;
}

function questionScreen() {
  const q = currentQ();
  const dots = view.name === 'play'
    ? view.qs.map((_, k) => `<span class="${k < view.i ? 'done' : k === view.i ? 'now' : ''}"></span>`).join('')
    : '<span class="now"></span>';
  return `${topBar(view.name === 'placement' ? 'Jom main!' : '')}
    <div class="dots">${dots}</div>
    <div class="question">
      ${q.visual ? `<div class="visual">${q.visual}</div>` : ''}
      ${q.text ? `<div class="qtext">${q.text}</div>` : ''}
      <button class="speak" data-act="say">🔊 ${promptHtml(q.prompt, currentLang())}</button>
    </div>
    <div class="choices ${q.wide ? 'wide' : ''}">
      ${q.choices.map((c, k) => `<button class="choice" data-act="answer" data-arg="${k}">${c.label}</button>`).join('')}
    </div>`;
}

function resultTitle(res) {
  if (res.score === res.total) return 'Hebat! Semua betul!';
  if (res.passed) return 'Bagus!';
  return 'Kamu sudah cuba!';
}

function resultsScreen() {
  const { res, retries } = view;
  const lines = [];
  if (res.coins) lines.push(`🪙 +${res.coins} syiling`);
  if (res.sticker) lines.push(`${res.sticker.e} Pelekat baru!`);
  if (res.newBest) lines.push('⬆️ Markah terbaik baru!');
  if (res.justMastered) lines.push('👑 Kamu sudah mahir!');
  else if (res.masteryProgress) lines.push(`👑 Mahir: ${res.masteryProgress}/${MASTERY_DAYS} hari — main lagi hari lain!`);
  if (retries && res.passed) lines.push('🌱 Kamu terus mencuba — itu hebat!');
  if (!res.passed) lines.push('💪 Jom cuba sekali lagi — kamu boleh!');
  const emoji = res.score === res.total ? ' 🎉' : res.passed ? ' 👏' : '';
  return `<section class="results">
    ${avatar(res.passed ? '😄' : '🙂')}
    <h1>${resultTitle(res)}${emoji}</h1>
    <div class="stars big">${stars(res.score, res.total)}</div>
    <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    <div class="row">
      <button class="big-btn" data-act="play" data-arg="${view.levelIdx}">🔁 Main lagi</button>
      <button class="big-btn primary" data-act="subject" data-arg="${view.subjectId}">➡️ Seterusnya</button>
    </div>
  </section>`;
}

function stickersScreen() {
  const cells = allStickers().map((s) => state.stickers.includes(s.id)
    ? `<div class="sticker">${s.e}<small>${esc(s.label)}</small></div>`
    : '<div class="sticker empty">?</div>'
  ).join('');
  return `${topBar('📒 Buku Pelekat')}<section class="sticker-grid">${cells}</section>`;
}

function shopScreen() {
  const cats = [['color', 'Warna'], ['hat', 'Topi'], ['pet', 'Haiwan']];
  const rows = cats.map(([cat, label]) => `<h3>${label}</h3><div class="shop-row">${SHOP.filter((i) => i.cat === cat).map((i) => {
    const owned = state.owned.includes(i.id);
    const on = state.equipped[cat] === i.id;
    const face = cat === 'color'
      ? `<span class="swatch" style="background:${i.value}"></span>`
      : `<span class="item-e">${i.value}</span>`;
    return `<button class="shop-item ${on ? 'on' : ''}" data-act="shopItem" data-arg="${i.id}">${face}<small>${on ? '✓ Dipakai' : owned ? 'Pakai' : `🪙 ${i.price}`}</small></button>`;
  }).join('')}</div>`).join('');

  let sheet = '';
  const p = view.pending && shopItem(view.pending);
  if (p) {
    const short = p.price - state.coins;
    const icon = p.cat === 'color' ? `<span class="swatch inline" style="background:${p.value}"></span>` : p.value;
    sheet = `<div class="sheet">
      <div>${icon} ${esc(p.label)} — 🪙 ${p.price}</div>
      ${short > 0
        ? `<p>Kumpul lagi 🪙 ${short} dulu!</p><div class="row"><button class="big-btn" data-act="buyNo">OK</button></div>`
        : `<div class="row"><button class="big-btn" data-act="buyNo">Tidak</button><button class="big-btn primary" data-act="buyYes">Beli!</button></div>`}
    </div>`;
  }
  return `${topBar('🛍️ Kedai')}<section class="hero small">${avatar()}</section>${rows}${sheet}`;
}

function sleepyScreen() {
  return `<section class="sleepy">
    ${avatar('😴', 'big')}
    <h1>Masa rehat!</h1>
    <p>Jom minum air, main di luar, atau baca buku dengan Ayah &amp; Ibu.</p>
    <p class="muted">Jumpa lagi pukul ${clock(state.session.restUntil)} 🌙</p>
    <button class="icon-btn corner" data-act="gate" aria-label="Ibu bapa">⚙️</button>
  </section>`;
}

function gateScreen() {
  return `${topBar('Untuk Ibu Bapa')}
    <form class="gate" id="gate-form">
      <p>Jawab untuk masuk:</p>
      <h1>${view.a} × ${view.b} = ?</h1>
      <input type="number" inputmode="numeric" autocomplete="off">
      <p><button class="btn" type="submit">Masuk</button></p>
    </form>`;
}

function parentScreen() {
  const s = state.session;
  const resting = s.restUntil > Date.now();
  const textSelect = (key, opts) => `<select data-setting="${key}" data-kind="text">${opts.map(([v, label]) =>
    `<option value="${v}" ${state.settings[key] === v ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  const select = (key, vals) => `<select data-setting="${key}">${vals.map((v) =>
    `<option value="${v}" ${state.settings[key] === v ? 'selected' : ''}>${v} minit</option>`).join('')}</select>`;
  const progress = SUBJECTS.filter((sub) => sub.levels.length).map((sub) => `
    <h4>${sub.icon} ${sub.name}</h4>
    <table>${sub.levels.map((l) => {
      const r = state.levels[l.id];
      const mastery = r?.mastered ? '👑 Mahir' : r ? `Mahir ${r.perfectDays.length}/${MASTERY_DAYS}` : '';
      return `<tr><td>${l.title}</td><td>${r ? `${r.best}/${ROUND}` : '–'}</td><td>${mastery}</td></tr>`;
    }).join('')}</table>`).join('');
  const tasks = REAL_WORLD.map((t) => {
    const has = state.stickers.includes(t.id);
    return `<div class="task"><span>${t.e} ${esc(t.label)}</span>
      <button class="btn" data-act="award" data-arg="${t.id}" ${has ? 'disabled' : ''}>${has ? '✓ Diberi' : 'Beri pelekat'}</button></div>`;
  }).join('');

  return `${topBar('⚙️ Ibu Bapa')}
    <section class="panel"><h3>Profil</h3>
      <label>Nama anak <input id="child-name" value="${esc(state.childName)}" maxlength="20"></label>
    </section>
    <section class="panel"><h3>Had masa</h3>
      <label>Masa main setiap sesi ${select('sessionMinutes', [10, 15, 20, 30, 45])}</label>
      <label>Masa rehat ${select('restMinutes', [30, 60, 120, 240])}</label>
      <p class="muted">Sesi ini: ${Math.round(s.usedMs / 60000)} minit${resting ? ` · Sedang rehat hingga ${clock(s.restUntil)}` : ''}</p>
      ${resting ? '<button class="btn" data-act="endRest">Tamatkan rehat sekarang</button>' : ''}
      <label>Suara arahan <input type="checkbox" data-setting="voice" ${state.settings.voice ? 'checked' : ''}></label>
    </section>
    <section class="panel"><h3>Bahasa Matematik</h3>
      <label>Bahasa soalan ${textSelect('mathLang', [['ms', 'BM'], ['en', 'English']])}</label>
      <label>华文 (Mandarin) ${textSelect('mandarin', [['off', 'Tutup'], ['mastered', 'Tahap 👑 sahaja'], ['all', 'Semua tahap']])}</label>
      <p class="muted">Tahap 👑 sahaja: soalan dalam 华文 + pinyin + sari kata English untuk tahap yang sudah mahir, supaya hanya bahasa yang baru.</p>
    </section>
    <section class="panel"><h3>Hadiah dunia sebenar</h3>
      <p class="muted">Beri pelekat bila anak buat aktiviti ini bersama anda.</p>${tasks}
    </section>
    <section class="panel"><h3>Kemajuan</h3>${progress}</section>
    <section class="panel"><h3>Data</h3>
      <p class="muted">Data disimpan dalam tablet ini sahaja. Simpan salinan sekali-sekala.</p>
      <button class="btn" data-act="exportData">⬇️ Simpan salinan</button>
      <label class="btn">⬆️ Pulihkan salinan<input id="import-file" type="file" accept="application/json,.json" hidden></label>
      <button class="btn danger" data-act="reset">Padam semua kemajuan</button>
    </section>`;
}

// ---------------------------------------------------------------- rounds

const currentQ = () => (view.name === 'play' ? view.qs[view.i] : view.q);
const currentLang = () => questionLang(state, subjectById(view.subjectId).levels[view.levelIdx].id);
const sayQuestion = () => say(currentQ().prompt[currentLang()], currentLang());

// Mandarin shows characters, pinyin, and an English subtitle.
function promptHtml(p, lang) {
  if (lang !== 'zh') return esc(p[lang]);
  return `<span class="zh">${esc(p.zh)}</span><span class="py">${esc(p.py)}</span><span class="sub">${esc(p.en)}</span>`;
}

function startRound(subjectId, levelIdx) {
  const level = subjectById(subjectId).levels[levelIdx];
  const ok = go('play', { subjectId, levelIdx, qs: makeRound(level.gen, ROUND), i: 0, score: 0, retries: 0, missed: false, busy: false });
  if (ok) sayQuestion();
}

// Placement feels like a normal game: no right/wrong feedback, it just climbs
// levels while the child answers both questions correctly.
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
      if (v.correct === PLACEMENT_PER_LEVEL && v.levelIdx < s.levels.length - 1) {
        v.levelIdx++;
        v.step = 0;
        v.correct = 0;
      } else {
        state.placed[s.id] = true;
        openUpTo(state, s, v.levelIdx);
        persist();
        if (go('subject', { subjectId: s.id })) say('Hebat! Jom mula belajar!');
        return;
      }
    }
    v.q = s.levels[v.levelIdx].gen();
    v.busy = false;
    render();
    sayQuestion();
  }, 600);
}

function answer(k, el) {
  if (view.busy) return;
  const q = currentQ();
  const right = q.choices[k].value === q.answer;
  if (view.name === 'placement') return placementAnswer(right, el);

  if (!right) {
    view.missed = true;
    view.retries++;
    el.classList.add('wrong');
    el.disabled = true;
    chime('wrong');
    say(RETRY[currentLang()], currentLang());
    return;
  }

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
    if (v.i < v.qs.length) { render(); sayQuestion(); } else finishRound();
  }, 1000);
}

function finishRound() {
  const s = subjectById(view.subjectId);
  const level = s.levels[view.levelIdx];
  const res = settleRound(state, level, view.score, view.qs.length, todayKey());
  if (res.passed) openUpTo(state, s, view.levelIdx + 1);
  persist();
  go('results', { subjectId: s.id, levelIdx: view.levelIdx, res, retries: view.retries });
  say(resultTitle(res));
}

// ---------------------------------------------------------------- shop

function shopTap(id) {
  const it = shopItem(id);
  if (state.owned.includes(id)) {
    // Tapping a worn hat/pet takes it off; a colour is always worn.
    const wearing = state.equipped[it.cat] === id;
    state.equipped[it.cat] = wearing && it.cat !== 'color' ? null : id;
    persist();
    render();
    return;
  }
  view.pending = id;
  render();
  say(`${it.label}. ${it.price} syiling.`);
}

function buy() {
  const it = shopItem(view.pending);
  view.pending = null;
  if (it && state.coins >= it.price && !state.owned.includes(it.id)) {
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
    if (!confirm('Ganti semua data sekarang dengan salinan ini?')) return;
    state = fromJson(data);
    persist();
    alert('Data dipulihkan.');
    render();
  } catch {
    alert('Fail tidak sah.');
  }
}

// ---------------------------------------------------------------- events

const ACTIONS = {
  go: (name) => go(name),
  back: () => {
    if (['play', 'results'].includes(view.name)) go('subject', { subjectId: view.subjectId });
    else go('home');
  },
  subject: (id) => (state.placed[id] ? go('subject', { subjectId: id }) : startPlacement(id)),
  play: (i) => startRound(view.subjectId, Number(i)),
  answer: (k, el) => answer(Number(k), el),
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
    if (!confirm('Padam SEMUA kemajuan, syiling dan pelekat? Ini tidak boleh dibatalkan.')) return;
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
  else { input.value = ''; input.placeholder = 'Cuba lagi'; }
});

app.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.type === 'checkbox' ? t.checked : t.dataset.kind === 'text' ? t.value : Number(t.value);
    persist();
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
  };
}

// Offline support. Skipped on localhost so edits show up immediately while developing.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && window.isSecureContext && !isLocal) {
  navigator.serviceWorker.register('sw.js');
}
