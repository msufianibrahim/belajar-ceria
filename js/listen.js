// Browser speech recognition for the reading companion (Chrome/Edge on Android, Safari on iPad).
// Needs internet: the audio goes to Google or Apple. Built for adult voices.

const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const canListen = !!SR;

// Recognition language per book language.
export const LISTEN_LANG = { ms: 'ms-MY', en: 'en-GB', zh: 'cmn-Hans-CN' };

// Starts listening. onHeard(phrases, interim): phrases = every finished phrase so far, each a
// list of guesses (strings); interim = the phrase still being heard. Returns stop().
export function listen(lang, { onHeard, onError }) {
  const phrases = [];
  let on = true;
  let rec;
  const begin = () => {
    rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 5; // a child's word is often in the 2nd-5th guess
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) phrases.push([...r].map((a) => a.transcript));
        else interim += r[0].transcript;
      }
      onHeard(phrases, interim);
    };
    rec.onerror = (e) => {
      // Lasting problems stop listening; 'no-speech' and dropouts just carry on.
      if (['not-allowed', 'service-not-allowed', 'language-not-supported', 'audio-capture'].includes(e.error)) on = false;
      onError(e.error, on);
    };
    // Android ends a session after a pause even in continuous mode: carry on while listening.
    rec.onend = () => { if (on) { try { begin(); } catch { on = false; } } };
    rec.start();
  };
  begin();
  return () => { on = false; rec?.stop(); };
}
