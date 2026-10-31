// Full-body avatar drawn as SVG. Shop items are layers: shirt colour, trousers,
// hat and an extra (glasses, bow tie, cape...). Pets stand beside him (emoji).

const SKIN = '#f3c594';
const SKIN_DARK = '#e0a873';
const HAIR = '#3b2a20';

const HATS = {
  'h-cap': `<path d="M56 46a44 38 0 0 1 88 0z" fill="#e53935"/><path d="M98 44h58q6 4-2 9H98z" fill="#c62828"/><circle cx="100" cy="10" r="4" fill="#c62828"/>`,
  'h-songkok': `<path d="M60 48V18q40-10 80 0v30q-40-8-80 0z" fill="#262626"/><path d="M60 18q40-10 80 0" fill="none" stroke="#444" stroke-width="3"/>`,
  'h-bow': `<path d="M118 22l-22-14v28zM118 22l22-14v28z" fill="#ff6fa8"/><circle cx="118" cy="22" r="6" fill="#e04889"/>`,
  'h-grad': `<rect x="72" y="26" width="56" height="20" rx="4" fill="#222"/><path d="M100 6l60 18-60 18-60-18z" fill="#333"/><path d="M146 22v26" stroke="#ffc107" stroke-width="3"/><circle cx="146" cy="50" r="4" fill="#ffc107"/>`,
  'h-crown': `<path d="M62 46l-4-36 22 18 20-26 20 26 22-18-4 36z" fill="#ffca28" stroke="#f9a825" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="34" r="5" fill="#e53935"/><circle cx="78" cy="38" r="4" fill="#1e88e5"/><circle cx="122" cy="38" r="4" fill="#43a047"/>`,
  'h-top': `<rect x="70" y="-18" width="60" height="58" rx="5" fill="#212121"/><rect x="70" y="24" width="60" height="9" fill="#c62828"/><rect x="52" y="36" width="96" height="10" rx="5" fill="#212121"/>`,
};

// Drawn under the body (cape) or over it (everything else).
const EXTRAS_BACK = {
  'x-cape': `<path d="M66 116L40 250q60 18 120 0L134 116z" fill="#d32f2f"/>`,
};
const EXTRAS_FRONT = {
  'x-glasses': `<g fill="#ffffff55" stroke="#333" stroke-width="3.5"><circle cx="83" cy="68" r="12"/><circle cx="117" cy="68" r="12"/></g><path d="M95 67h10" stroke="#333" stroke-width="3.5"/>`,
  'x-shades': `<g fill="#222"><rect x="69" y="59" width="27" height="18" rx="7"/><rect x="104" y="59" width="27" height="18" rx="7"/></g><path d="M95 64h10" stroke="#222" stroke-width="4"/>`,
  'x-bowtie': `<path d="M100 118l-16-9v18zM100 118l16-9v18z" fill="#c62828"/><circle cx="100" cy="118" r="4.5" fill="#8e1b1b"/>`,
  'x-cape': `<path d="M76 114l-10 6M124 114l10 6" stroke="#b71c1c" stroke-width="6" stroke-linecap="round"/>`,
  'x-medal': `<path d="M88 112l12 30 12-30" fill="none" stroke="#1e88e5" stroke-width="6"/><circle cx="100" cy="148" r="10" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>`,
};

function face(mood) {
  if (mood === 'sleepy') {
    return `<path d="M76 70q7 6 14 0M110 70q7 6 14 0" fill="none" stroke="#3b2a20" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="100" cy="90" rx="6" ry="4" fill="#9c4a3a"/>
      <text x="138" y="30" font-size="22" font-weight="700" fill="#7a8fb8">z</text><text x="152" y="14" font-size="16" font-weight="700" fill="#7a8fb8">z</text>`;
  }
  const mouth = mood === 'happy'
    ? '<path d="M84 84q16 18 32 0z" fill="#9c4a3a"/><path d="M89 86q11 4 22 0" fill="none" stroke="#fff" stroke-width="3"/>'
    : '<path d="M86 86q14 12 28 0" fill="none" stroke="#9c4a3a" stroke-width="4" stroke-linecap="round"/>';
  return `<ellipse cx="83" cy="68" rx="5" ry="6.5" fill="#3b2a20"/><ellipse cx="117" cy="68" rx="5" ry="6.5" fill="#3b2a20"/>
    <circle cx="85" cy="66" r="1.8" fill="#fff"/><circle cx="119" cy="66" r="1.8" fill="#fff"/>
    <circle cx="72" cy="82" r="6" fill="#ff8a80" opacity=".45"/><circle cx="128" cy="82" r="6" fill="#ff8a80" opacity=".45"/>${mouth}`;
}

const layer = (set, id) => (set[id] ? `<g data-item="${id}">${set[id]}</g>` : '');

// look: { shirt: '#hex', pants: '#hex', hat: id|null, extra: id|null }; mood: 'smile' | 'happy' | 'sleepy'
export function avatarSvg(look, mood = 'smile') {
  const { shirt, pants, hat, extra } = look;
  return `<svg viewBox="0 -30 200 300" class="kid" aria-hidden="true">
    ${layer(EXTRAS_BACK, extra)}
    <rect x="72" y="178" width="26" height="64" rx="9" fill="${pants}"/>
    <rect x="102" y="178" width="26" height="64" rx="9" fill="${pants}"/>
    <rect x="70" y="170" width="60" height="26" rx="8" fill="${pants}"/>
    <ellipse cx="83" cy="246" rx="19" ry="9" fill="#5d4037"/><ellipse cx="117" cy="246" rx="19" ry="9" fill="#5d4037"/>
    <g transform="rotate(14 56 120)"><rect x="45" y="116" width="22" height="56" rx="11" fill="${shirt}"/></g>
    <g transform="rotate(-14 144 120)"><rect x="133" y="116" width="22" height="56" rx="11" fill="${shirt}"/></g>
    <circle cx="43" cy="174" r="10" fill="${SKIN}"/><circle cx="157" cy="174" r="10" fill="${SKIN}"/>
    <rect x="62" y="110" width="76" height="76" rx="22" fill="${shirt}"/>
    <path d="M62 170h76v4q0 12-12 12H74q-12 0-12-12z" fill="#0000000d"/>
    <rect x="90" y="98" width="20" height="16" fill="${SKIN_DARK}"/>
    <path d="M88 110l12 10 12-10" fill="none" stroke="#ffffff99" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="56" cy="70" r="9" fill="${SKIN_DARK}"/><circle cx="144" cy="70" r="9" fill="${SKIN_DARK}"/>
    <circle cx="100" cy="64" r="44" fill="${SKIN}"/>
    <path d="M56 62q0-42 44-42t44 42q-8-18-26-20q-12 8-34 6q-20 2-28 14z" fill="${HAIR}"/>
    ${face(mood)}
    ${layer(EXTRAS_FRONT, extra)}
    ${layer(HATS, hat)}
  </svg>`;
}
