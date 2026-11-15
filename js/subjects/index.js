import math from './math.js';
import iqra from './iqra.js';
import bm from './bm.js';
import en from './en.js';
import zh from './zh.js';
import jawi from './jawi.js';

// A subject with no levels shows on the home screen as "coming soon".
// To add one: create js/subjects/<id>.js shaped like math.js, import it here,
// and add the file to the FILES list in sw.js.
export const SUBJECTS = [
  math,
  bm,
  en,
  zh,
  iqra,
  jawi,
  { id: 'islam', name: { en: 'Islamic Studies', ms: 'Asas Islam' }, icon: '🕌', color: '#ffe082', levels: [] },
];
