import { SUBJECTS } from './subjects/index.js';

// Avatar shop. Prices are tuned so one subject can't buy everything:
// Math alone pays roughly 300 coins in total; the shop costs 380.
export const SHOP = [
  { id: 'c-yellow', cat: 'color', label: 'Kuning', value: '#ffd54d', price: 0 },
  { id: 'c-blue', cat: 'color', label: 'Biru', value: '#7cc6fe', price: 15 },
  { id: 'c-green', cat: 'color', label: 'Hijau', value: '#8ee08a', price: 15 },
  { id: 'c-pink', cat: 'color', label: 'Merah jambu', value: '#ffadd2', price: 15 },
  { id: 'c-purple', cat: 'color', label: 'Ungu', value: '#c7a6ff', price: 20 },
  { id: 'c-orange', cat: 'color', label: 'Oren', value: '#ffb38a', price: 20 },
  { id: 'h-cap', cat: 'hat', label: 'Topi', value: '🧢', price: 15 },
  { id: 'h-bow', cat: 'hat', label: 'Reben', value: '🎀', price: 20 },
  { id: 'h-grad', cat: 'hat', label: 'Topi graduasi', value: '🎓', price: 30 },
  { id: 'h-crown', cat: 'hat', label: 'Mahkota', value: '👑', price: 40 },
  { id: 'p-turtle', cat: 'pet', label: 'Penyu', value: '🐢', price: 25 },
  { id: 'p-cat', cat: 'pet', label: 'Kucing', value: '🐱', price: 30 },
  { id: 'p-rabbit', cat: 'pet', label: 'Arnab', value: '🐰', price: 30 },
  { id: 'p-bird', cat: 'pet', label: 'Burung', value: '🦜', price: 35 },
  { id: 'p-fish', cat: 'pet', label: 'Ikan', value: '🐠', price: 30 },
  { id: 'p-duck', cat: 'pet', label: 'Itik', value: '🦆', price: 40 },
];

// Stickers a parent awards from the parent screen for off-screen activities.
export const REAL_WORLD = [
  { id: 'rw-count', e: '🍉', label: 'Kira buah-buahan di dapur bersama Ayah/Ibu' },
  { id: 'rw-tidy', e: '🧸', label: 'Kemas mainan sendiri' },
  { id: 'rw-book', e: '📚', label: 'Baca buku cerita bersama' },
  { id: 'rw-round', e: '🔵', label: 'Cari 3 benda bulat di rumah' },
];

export const allStickers = () => [
  ...SUBJECTS.flatMap((s) => s.levels.map((l) => ({ id: l.sticker.id, e: l.sticker.e, label: l.title }))),
  ...REAL_WORLD,
];
