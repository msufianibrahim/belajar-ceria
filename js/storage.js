// All progress lives in localStorage on the tablet. No server, no account.
import { migrate } from './progress.js';

const KEY = 'belajar-ceria-v1';

const defaults = () => ({
  childName: '',
  coins: 0,
  stickers: [],                 // sticker ids collected
  owned: ['c-yellow'],          // shop item ids
  equipped: { color: 'c-yellow', pants: 'tr-blue', hat: null, extra: null, pet: null },
  levels: {},                   // levelId -> { best, cleared, perfectDays[], mastered }
  frontier: {},                 // subjectId -> furthest open level id (see progress.js)
  placed: {},                   // subjectId -> true once placement is done
  // lang: app + question language ('en' | 'ms'); mandarin: 'off' | 'mastered' | 'all' (see lang.js)
  // practice: level ids the parent picked for daily practice (see rewards.js)
  settings: { sessionMinutes: 20, restMinutes: 60, voice: true, lang: 'en', mandarin: 'mastered', practice: [], practiceRounds: 2, practiceAuto: true, practiceFirst: true, columnInput: 'write' },
  practiceDay: { date: '', rounds: 0, paid: false },
  paused: {},                   // levelId -> a round stopped halfway (see app.js saveRound)
  session: { usedMs: 0, lastActive: 0, restUntil: 0 },
});

// Deep-merge saved data over defaults so new fields added later get sane values.
function merge(base, saved) {
  for (const [k, v] of Object.entries(saved ?? {})) {
    const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    base[k] = isObj(base[k]) && isObj(v) ? merge(base[k], v) : v;
  }
  return base;
}

// Also upgrades older saves and backup files to the current format.
export const fromJson = (data) => migrate(merge(defaults(), data));

export function load() {
  try {
    return fromJson(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    return defaults();
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// Ask the browser not to evict our data when storage is low.
export function requestPersist() {
  navigator.storage?.persist?.().catch(() => {});
}

// Local date as YYYY-MM-DD.
export const todayKey = () => new Date().toLocaleDateString('en-CA');
