// Reads the words off a photo of a book page, on the tablet (Tesseract.js, WebAssembly).
// The library and language data download from a CDN the first time (needs internet);
// the photo itself never leaves the tablet.

const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const OCR_LANG = { ms: 'msa', en: 'eng', zh: 'chi_sim' };

let loading = null;
const loadTesseract = () => (loading ??= new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = TESSERACT;
  s.onload = () => ok(window.Tesseract);
  s.onerror = () => { loading = null; fail(new Error('offline')); };
  document.head.append(s);
}));

// Phone photos are huge; ~2000 px is plenty for print and much faster.
async function shrink(file, max = 2000) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// onProgress(0..1) while reading.
export async function readPhoto(file, lang, onProgress = () => {}) {
  const T = await loadTesseract();
  const worker = await T.createWorker(OCR_LANG[lang], 1, {
    logger: (m) => m.status === 'recognizing text' && onProgress(m.progress),
  });
  try {
    const { data } = await worker.recognize(await shrink(file));
    return cleanText(data.text, lang);
  } finally {
    await worker.terminate();
  }
}

// OCR text -> page text: rejoin words split over lines ("ber-\nwarna"), one space between words;
// Mandarin has no spaces between characters.
export function cleanText(text, lang) {
  const t = text.replace(/(\p{L})-\s*\n\s*(\p{L})/gu, '$1$2').replace(/[|_~^]/g, ' ');
  // Keep a space only between two Latin letters/digits (e.g. "ABC book").
  if (lang === 'zh') return t.replace(/\s+/g, (sp, i, s) => (/[A-Za-z0-9]/.test(s[i - 1] ?? '') && /[A-Za-z0-9]/.test(s[i + sp.length] ?? '') ? ' ' : '')).trim();
  return t.replace(/\s+/g, ' ').trim();
}
