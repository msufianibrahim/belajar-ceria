import math from './math.js';
import iqra from './iqra.js';

// A subject with no levels shows on the home screen as "coming soon".
// To add one: create js/subjects/<id>.js shaped like math.js, import it here,
// and add the file to the FILES list in sw.js.
export const SUBJECTS = [
  math,
  { id: 'bm', name: 'Bahasa Melayu', icon: '📖', color: '#7cc6fe', levels: [] },
  { id: 'en', name: 'English', icon: '🔤', color: '#a5d6a7', levels: [] },
  { id: 'zh', name: '华文', icon: '🏮', color: '#ff9e9e', levels: [] },
  iqra,
  { id: 'jawi', name: 'Jawi', icon: '✍️', color: '#d1b3ff', levels: [] },
  { id: 'islam', name: { en: 'Islamic Studies', ms: 'Asas Islam' }, icon: '🕌', color: '#ffe082', levels: [] },
];
