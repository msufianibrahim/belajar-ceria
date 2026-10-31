import { SUBJECTS } from './subjects/index.js';

// Avatar shop. Prices are tuned so one subject can't buy everything:
// Math alone pays roughly 510 coins in total; the shop costs 815.
// cat 'color' is the shirt colour (id kept from older saves). Drawings: avatar.js.
export const SHOP = [
  { id: 'c-yellow', cat: 'color', label: { en: 'Yellow', ms: 'Kuning' }, value: '#ffd54d', price: 0 },
  { id: 'c-blue', cat: 'color', label: { en: 'Blue', ms: 'Biru' }, value: '#7cc6fe', price: 15 },
  { id: 'c-green', cat: 'color', label: { en: 'Green', ms: 'Hijau' }, value: '#8ee08a', price: 15 },
  { id: 'c-pink', cat: 'color', label: { en: 'Pink', ms: 'Merah jambu' }, value: '#ffadd2', price: 15 },
  { id: 'c-purple', cat: 'color', label: { en: 'Purple', ms: 'Ungu' }, value: '#c7a6ff', price: 20 },
  { id: 'c-orange', cat: 'color', label: { en: 'Orange', ms: 'Oren' }, value: '#ffb38a', price: 20 },
  { id: 'c-teal', cat: 'color', label: { en: 'Teal', ms: 'Hijau laut' }, value: '#80deea', price: 25 },
  { id: 'tr-blue', cat: 'pants', label: { en: 'Blue trousers', ms: 'Seluar biru' }, value: '#3f6fb5', price: 0 },
  { id: 'tr-black', cat: 'pants', label: { en: 'Black trousers', ms: 'Seluar hitam' }, value: '#37393f', price: 10 },
  { id: 'tr-brown', cat: 'pants', label: { en: 'Brown trousers', ms: 'Seluar coklat' }, value: '#8d6e63', price: 15 },
  { id: 'tr-green', cat: 'pants', label: { en: 'Green trousers', ms: 'Seluar hijau' }, value: '#558b2f', price: 15 },
  { id: 'tr-red', cat: 'pants', label: { en: 'Red trousers', ms: 'Seluar merah' }, value: '#c0392b', price: 20 },
  { id: 'h-songkok', cat: 'hat', label: { en: 'Songkok', ms: 'Songkok' }, price: 20 },
  { id: 'h-cap', cat: 'hat', label: { en: 'Cap', ms: 'Topi' }, price: 15 },
  { id: 'h-bow', cat: 'hat', label: { en: 'Bow', ms: 'Reben' }, price: 20 },
  { id: 'h-grad', cat: 'hat', label: { en: 'Graduation cap', ms: 'Topi graduasi' }, price: 30 },
  { id: 'h-crown', cat: 'hat', label: { en: 'Crown', ms: 'Mahkota' }, price: 40 },
  { id: 'h-top', cat: 'hat', label: { en: 'Top hat', ms: 'Topi tinggi' }, price: 35 },
  { id: 'x-glasses', cat: 'extra', label: { en: 'Glasses', ms: 'Cermin mata' }, price: 20 },
  { id: 'x-bowtie', cat: 'extra', label: { en: 'Bow tie', ms: 'Tali leher kupu-kupu' }, price: 25 },
  { id: 'x-shades', cat: 'extra', label: { en: 'Sunglasses', ms: 'Cermin mata hitam' }, price: 30 },
  { id: 'x-medal', cat: 'extra', label: { en: 'Medal', ms: 'Pingat' }, price: 35 },
  { id: 'x-cape', cat: 'extra', label: { en: 'Superhero cape', ms: 'Jubah wira' }, price: 45 },
  { id: 'p-turtle', cat: 'pet', label: { en: 'Turtle', ms: 'Penyu' }, value: '🐢', price: 25 },
  { id: 'p-cat', cat: 'pet', label: { en: 'Cat', ms: 'Kucing' }, value: '🐱', price: 30 },
  { id: 'p-rabbit', cat: 'pet', label: { en: 'Rabbit', ms: 'Arnab' }, value: '🐰', price: 30 },
  { id: 'p-bird', cat: 'pet', label: { en: 'Parrot', ms: 'Burung' }, value: '🦜', price: 35 },
  { id: 'p-fish', cat: 'pet', label: { en: 'Fish', ms: 'Ikan' }, value: '🐠', price: 30 },
  { id: 'p-duck', cat: 'pet', label: { en: 'Duck', ms: 'Itik' }, value: '🦆', price: 40 },
  { id: 'p-penguin', cat: 'pet', label: { en: 'Penguin', ms: 'Penguin' }, value: '🐧', price: 40 },
  { id: 'p-dino', cat: 'pet', label: { en: 'Dinosaur', ms: 'Dinosaur' }, value: '🦕', price: 50 },
  { id: 'p-unicorn', cat: 'pet', label: { en: 'Unicorn', ms: 'Unikorn' }, value: '🦄', price: 50 },
];

// Stickers a parent awards from the parent screen for off-screen activities.
export const REAL_WORLD = [
  { id: 'rw-count', e: '🍉', label: { en: 'Count fruit in the kitchen with Mum/Dad', ms: 'Kira buah-buahan di dapur bersama Ayah/Ibu' } },
  { id: 'rw-tidy', e: '🧸', label: { en: 'Tidy up own toys', ms: 'Kemas mainan sendiri' } },
  { id: 'rw-book', e: '📚', label: { en: 'Read a storybook together', ms: 'Baca buku cerita bersama' } },
  { id: 'rw-round', e: '🔵', label: { en: 'Find 3 round things at home', ms: 'Cari 3 benda bulat di rumah' } },
];

export const allStickers = () => [
  ...SUBJECTS.flatMap((s) => s.levels.map((l) => ({ id: l.sticker.id, e: l.sticker.e, label: l.title }))),
  ...REAL_WORLD,
];
