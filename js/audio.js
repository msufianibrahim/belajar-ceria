// Spoken prompts via the tablet's built-in text-to-speech, plus tiny synthesized chimes.
// A 5-year-old can't read instructions yet, so every question is spoken.

let voices = [];
const hasTts = typeof speechSynthesis !== 'undefined';
if (hasTts) {
  const refresh = () => { voices = speechSynthesis.getVoices(); };
  refresh();
  speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

function pickVoice(lang) {
  const norm = (l) => l.replace('_', '-').toLowerCase();
  const base = lang.split('-')[0];
  // Mandarin only: never fall back to a Cantonese (zh-HK) voice.
  if (base === 'zh') {
    return voices.find((v) => norm(v.lang) === 'zh-cn') || voices.find((v) => /^(zh-(tw|sg)|cmn)/.test(norm(v.lang)));
  }
  return (
    voices.find((v) => norm(v.lang) === lang.toLowerCase()) ||
    voices.find((v) => norm(v.lang).startsWith(base)) ||
    // Indonesian voices read Malay reasonably well if no Malay voice is installed.
    (base === 'ms' ? voices.find((v) => norm(v.lang).startsWith('id')) : undefined)
  );
}

// queue: speak after whatever is playing (e.g. an Arabic sound after the prompt).
export function speak(text, lang = 'ms-MY', { queue = false, rate = 0.9 } = {}) {
  if (!hasTts) return;
  if (!queue) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.lang = v?.lang ?? lang;
  u.rate = rate;
  u.pitch = lang.startsWith('ar') ? 1 : 1.1;
  speechSynthesis.speak(u);
}

let ctx;
export function chime(kind) {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = { right: [660, 880], wrong: [300], tap: [520] }[kind] ?? [520];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch {
    // Sound is a nice-to-have; never break the game over it.
  }
}
